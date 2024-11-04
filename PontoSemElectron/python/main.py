import os
import base64
import logging
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from flask import Flask, jsonify, request
from treinamento import exec_treinamento
from reconhecimento import reconhecimentoFacial
from registrarPonto import registrar_ponto
from registrarPonto import sincronizar_pontos
from converterImagem import salvar_fotos_funcionarios
from flask_cors import CORS
import cv2
import numpy as np
import json
import requests

logging.basicConfig(
    filename='server_log.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def global_exception_handler(exctype, value, traceback):
    logging.critical("Exceção não tratada", exc_info=(exctype, value, traceback))

sys.excepthook = global_exception_handler

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']
collection = db['funcionarios']

output_dir = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(output_dir, exist_ok=True)

def decode_and_save_image(base64_string, filename, target_size=(640, 480)):
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    image_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_resized = cv2.resize(img, target_size)
    cv2.imwrite(filename, img_resized)
    logging.info(f"Imagem salva e redimensionada para {target_size} em {filename}")

@app.route('/receber-foto-cadastro', methods=['POST'])
def receber_foto_cadastro():
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")
        matricula = data.get("matricula")

        if not foto_base64 or not matricula:
            logging.error("Imagem em base64 ou matrícula não fornecida.")
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 e matrícula são obrigatórias"}), 400

        # Salvar a imagem recebida
        filename = os.path.join(output_dir, "foto_cadastro.jpg")
        decode_and_save_image(foto_base64, filename)

        # Atualizar apenas a foto do funcionário existente
        result = collection.update_one(
            {"matricula": matricula},
            {"$set": {"foto": foto_base64, "sync": False}}
        )

        if result.modified_count == 0:
            logging.warning(f"Nenhum funcionário encontrado com a matrícula: {matricula}")

        # Salvar fotos no sistema de arquivos
        print('Iniciando a conversão de base64 para jpg...')
        salvar_fotos_funcionarios()

        # Chame o treinamento sem registrar ponto
        print('Iniciando treinamento com a nova foto registrada...')
        exec_treinamento(modo="cadastro", registrar_ponto=False)
        print('Treinamento finalizado!!!')

        return jsonify({"status": "sucesso", "mensagem": "Foto recebida e atualizada com sucesso!"}), 200

    except Exception as e:
        logging.error(f"Erro ao receber foto para cadastro: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500



@app.route('/ponto', methods=['POST'])
def ponto():
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")
        matricula = data.get("matricula")

        if not foto_base64 or not matricula:
            logging.error("Imagem em base64 ou matrícula não fornecida.")
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 e matrícula são obrigatórias"}), 400

        filename = os.path.join(output_dir, "foto_ponto.jpg")
        decode_and_save_image(foto_base64, filename)

        # Chamada para reconhecimentoFacial no modo "ponto"
        resultado = reconhecimentoFacial(modo="ponto")

        # Verifica se o resultado é um dicionário conforme o esperado
        if isinstance(resultado, dict):
            nome_reconhecido = resultado.get('nome')
            distancia = resultado.get('distancia')
        else:
            logging.error("O resultado do reconhecimento facial não é um dicionário.")
            return jsonify({"status": "erro", "mensagem": "Erro no reconhecimento facial"}), 500

        if not nome_reconhecido:
            logging.warning("Nenhum rosto reconhecido.")
            return jsonify({"status": "erro", "mensagem": "Rosto não reconhecido."}), 404

        # Timestamp atual
        agora = datetime.now()

        # Timestamp limite de 5 minutos atrás
        limite_tempo = agora - timedelta(minutes=5)

        # Verifica se há batida recente para evitar duplicidade
        batida_recente = db['pontos'].find_one({
            "codigo_funcionario": matricula,
            "timestamp": {"$gte": limite_tempo}
        })

        if batida_recente:
            logging.warning(f"Batida duplicada detectada para a matrícula: {matricula}.")
            return jsonify({"status": "erro", "mensagem": "Batida de ponto já registrada."}), 409

        # Registrar ponto no banco
        registrar_ponto(nome_reconhecido)
        logging.info(f'Batida de ponto registrada para a matrícula: {nome_reconhecido}.')

        # Sincronizar pontos (chamada de função que sincroniza com o sistema)
        sincronizar_pontos()
        logging.info('Sincronização de pontos concluída.')

        # Buscar informações do funcionário
        buscar_funcionario_url = f"http://localhost:3000/buscarFuncionario/{nome_reconhecido}"
        response = requests.get(buscar_funcionario_url)

        if response.status_code == 200:
            funcionario_info = response.json()
            logging.info(f"Funcionário encontrado: {funcionario_info}")
            return jsonify(funcionario_info), 200
        else:
            logging.error(f"Erro ao buscar funcionário: {response.json()}")
            return jsonify({"status": "erro", "mensagem": response.json().get("message", "Erro ao buscar funcionário.")}), 500

    except Exception as e:
        logging.error(f"Erro ao receber foto para batida de ponto: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)