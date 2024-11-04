import os
import base64
import logging
import sys
import cv2
import numpy as np
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from pymongo import MongoClient
from flask_cors import CORS
from reconhecimento import reconhecimentoFacial
from registrarPonto import registrar_ponto, sincronizar_pontos

# Configuração de logging
logging.basicConfig(
    filename='ponto_log.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def global_exception_handler(exctype, value, traceback):
    logging.critical("Exceção não tratada", exc_info=(exctype, value, traceback))

sys.excepthook = global_exception_handler

# Desabilitando o uso de GPUs
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Configuração do Flask e CORS
app = Flask(__name__)
CORS(app)

# Configuração da conexão com MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']

# Diretório de saída para imagens
output_dir = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(output_dir, exist_ok=True)

def decode_and_save_image(base64_string, filename, target_size=(640, 480)):
    """Decodifica uma imagem em base64 e salva no disco."""
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    image_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_resized = cv2.resize(img, target_size)
    cv2.imwrite(filename, img_resized)
    logging.info(f"Imagem salva e redimensionada para {target_size} em {filename}")

@app.route('/ponto', methods=['POST'])
def ponto():
    """Rota para registrar ponto com reconhecimento facial."""
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")
        matricula = data.get("matricula")

        if not foto_base64 or not matricula:
            logging.error("Imagem em base64 ou matrícula não fornecida.")
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 e matrícula são obrigatórias"}), 400

        # Salvar a imagem recebida
        filename = os.path.join(output_dir, "foto_ponto.jpg")
        decode_and_save_image(foto_base64, filename)

        # Chamada para reconhecimento facial
        resultado = reconhecimentoFacial(modo="ponto")

        if isinstance(resultado, dict):
            nome_reconhecido = resultado.get('nome')
            distancia = resultado.get('distancia')
        else:
            logging.error("O resultado do reconhecimento facial não é um dicionário.")
            return jsonify({"status": "erro", "mensagem": "Erro no reconhecimento facial"}), 500

        if not nome_reconhecido:
            logging.warning("Nenhum rosto reconhecido.")
            return jsonify({"status": "erro", "mensagem": "Rosto não reconhecido."}), 404

        # Verificar batida de ponto recente para evitar duplicidade
        agora = datetime.now()
        limite_tempo = agora - timedelta(minutes=5)
        batida_recente = db['pontos'].find_one({
            "codigo_funcionario": matricula,
            "timestamp": {"$gte": limite_tempo}
        })

        if batida_recente:
            logging.warning(f"Batida duplicada detectada para a matrícula: {matricula}.")
            return jsonify({"status": "erro", "mensagem": "Batida de ponto já registrada."}), 409

        # Registrar ponto e sincronizar
        registrar_ponto(nome_reconhecido)
        sincronizar_pontos()

        # Buscar informações do funcionário
        buscar_funcionario_url = f"http://localhost:3000/buscarFuncionario/{nome_reconhecido}"
        response = requests.get(buscar_funcionario_url)

        if response.status_code == 200:
            funcionario_info = response.json()
            return jsonify(funcionario_info), 200
        else:
            logging.error(f"Erro ao buscar funcionário: {response.json()}")
            return jsonify({"status": "erro", "mensagem": response.json().get("message", "Erro ao buscar funcionário.")}), 500

    except Exception as e:
        logging.error(f"Erro ao receber foto para batida de ponto: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)