# Script central do ponto, gerência a batida de ponto, reconhecimento facial e envio para o portal.

# ********************************************************************************************************
# Import dos módulos e bibliotecas
import os
import base64
import logging
import cv2
import numpy as np
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, abort
from pymongo import MongoClient
from flask_cors import CORS
from reconhecimento import reconhecimentoFacial
from registrarPonto import registrar_ponto, sincronizar_pontos


# ********************************************************************************************************
# Desabilitando o uso de GPUs para evitar logs indesejados no terminal
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Configuração do Flask e CORS permitindo a conexão com servidores de fontes diferentes
app = Flask(__name__)
CORS(app)

# Configuração da conexão com MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']

# Diretório de saída para imagens
pastaTemp = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(pastaTemp, exist_ok=True)


# ********************************************************************************************************
# Função que decodifica a imagem em base64 e a converte para uma imagem manipulável para o opencv na 
# escala 640x480
def decode_and_save_image(base64_string, filename, target_size=(640, 480)):

    # Aqui verificamos o cabeçalho da string, geralmente vem com data:image, e o removemos
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    # Decodificando a imagem em base64
    image_data = base64.b64decode(base64_string)

    # Convertendo de bites (resposta da linha a cima) para Array Numpy
    nparr = np.frombuffer(image_data, np.uint8)

    # Transformando os dados decodificados em uma estrutura que o opencv consegue interpretar
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Redimensionando a imagem para 640x480
    img_resized = cv2.resize(img, target_size)

    # Salvando a imagem na pasta temporária
    cv2.imwrite(filename, img_resized)
    logging.info(f"Imagem salva e redimensionada para {target_size} em {filename}")


# ********************************************************************************************************
# Função para buscar informações do funcionário
@app.route('/buscarFuncionario/<nome>', methods=['GET'])
def buscar_funcionario(nome_reconhecido):

    # Acha o funcionário pelo nome
    funcionario = db['funcionarios'].find_one({"matricula": nome_reconhecido})
    
    # Se o funcionário foi encontrado extrai o id e a matrícula
    if funcionario:
        funcionario_data = {
            "id": funcionario.get("id"),
            "matricula": funcionario.get("matricula")
        }
        return jsonify(funcionario_data), 200
    else:
        abort(404, description="Funcionário não encontrado.")


# ********************************************************************************************************
# Criando a rota de registro do ponto com reconhecimento facial
@app.route('/ponto', methods=['POST'])
def ponto():
    try:
        # Pega a imagem fornecida no body do envio da API
        data = request.get_json()
        foto_base64 = data.get("imagem")

        # Verifica se a imagem foi fornecida
        if not foto_base64:
            logging.error("Imagem em base64 não fornecida.")
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 é obrigatória"}), 400

        # Salvar a imagem recebida
        filename = os.path.join(pastaTemp, "foto_ponto.jpg")
        decode_and_save_image(foto_base64, filename)

        # Chamada para reconhecimento facial no modo de ponto
        resultado = reconhecimentoFacial()

        # Verifica a resposta do reconhecimento, redirecionando para a resposta apropriada
        if isinstance(resultado, dict):
            nome_reconhecido = resultado.get('nome')
            distancia = resultado.get('distancia')
        else:
            logging.error("O resultado do reconhecimento facial não é um dicionário.")
            return jsonify({"status": "erro", "mensagem": "Erro no reconhecimento facial"}), 500

        if not nome_reconhecido:
            logging.warning("Nenhum rosto reconhecido.")
            return jsonify({"status": "erro", "mensagem": "Rosto não reconhecido."}), 404

        # Busca as informações do funcionário diretamente no banco
        funcionario = db['funcionarios'].find_one({"matricula": nome_reconhecido})
        if not funcionario:
            return jsonify({"status": "erro", "mensagem": "Funcionário não encontrado."}), 404
        
        funcionario_info = {
            'id': funcionario.get('id'),
            'matricula': funcionario.get('matricula'),
            'nome': funcionario.get('nome')
        }

        # Verifica se já houve uma batida de ponto no mesmo momento para o mesmo funcionário
        agora = datetime.now()
        limite_tempo = agora - timedelta(minutes=5)
        batida_recente = db['pontos'].find_one({
            "codigo_funcionario": nome_reconhecido,
            "timestamp": {"$gte": limite_tempo}
        })

        if batida_recente:
            logging.warning(f"Batida duplicada detectada para a matrícula: {nome_reconhecido}.")
            return jsonify({"status": "erro", "mensagem": "Batida de ponto já registrada."}), 409

        # Registrar ponto e sincroniza, alterando o campo sync do banco para true
        registrar_ponto(funcionario_info)
        sincronizar_pontos()

        return jsonify(funcionario_info), 200

    except Exception as e:
        logging.error(f"Erro ao receber foto para batida de ponto: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)