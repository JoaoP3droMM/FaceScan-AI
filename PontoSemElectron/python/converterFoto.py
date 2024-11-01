import os
import base64
import logging
import sys
from pymongo import MongoClient
from flask import Flask, jsonify, request
from treinamento import exec_treinamento
from reconhecimento import reconhecimentoFacial
from flask_cors import CORS
import cv2
import numpy as np
import json
import requests  # Certifique-se de importar requests se for usar

logging.basicConfig(
    filename='server_log.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def global_exception_handler(exctype, value, traceback):
    logging.critical("Exceção não tratada", exc_info=(exctype, value, traceback))

sys.excepthook = global_exception_handler

# Evitando logs de erro
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

app = Flask(__name__)
CORS(app, resources={r"/receber-foto": {"origins": "http://127.0.0.1:5500"}})

client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']
collection = db['funcionarios']

output_dir = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(output_dir, exist_ok=True)

def decode_and_save_image(base64_string, filename, target_size=(640, 480)):
    # Remover o cabeçalho do base64, se houver
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    # Decodificar a imagem em base64
    image_data = base64.b64decode(base64_string)
    
    # Converter a imagem para o formato que o OpenCV possa ler
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Redimensionar para a resolução desejada
    img_resized = cv2.resize(img, target_size)
    
    # Salvar a imagem redimensionada
    cv2.imwrite(filename, img_resized)
    logging.info(f"Imagem salva e redimensionada para {target_size} em {filename}")

@app.route('/receber-foto', methods=['POST'])
def receber_foto():
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")

        if not foto_base64:
            logging.error("Imagem em base64 não fornecida.")
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 é obrigatória"}), 400

        filename = os.path.join(output_dir, "foto_recebida.jpg")
        decode_and_save_image(foto_base64, filename)
        
        resultado = reconhecimentoFacial()
        logging.info(f"Resultado do reconhecimento facial: {resultado}")

        # Extrair a matrícula do resultado do reconhecimento facial
        resultado_dict = json.loads(resultado)
        nome_reconhecido = resultado_dict.get("nome")  # Obtemos o nome da matrícula reconhecida
        distancia = resultado_dict.get("distancia")

        print(f'O nome identificado foi {nome_reconhecido} com distância {distancia}')
        if not nome_reconhecido:
            logging.error("Matrícula não encontrada no resultado do reconhecimento.")
            return jsonify({"status": "erro", "mensagem": "Matrícula não reconhecida."}), 404

        logging.info(f"Matrícula reconhecida: {nome_reconhecido}")

        # Enviar a matrícula para a API Express
        buscar_funcionario_url = f"http://localhost:3000/buscarFuncionario/{nome_reconhecido}"
        response = requests.get(buscar_funcionario_url)

        if response.status_code == 200:
            funcionario_info = response.json()  # Obtemos os dados do funcionário
            logging.info(f"Funcionário encontrado: {funcionario_info}")
            return jsonify(funcionario_info), 200  # Retornar os dados do funcionário
        else:
            logging.error(f"Erro ao buscar funcionário: {response.json()}")
            return jsonify({"status": "erro", "mensagem": response.json().get("message", "Erro ao buscar funcionário.")}), 500

    except Exception as e:
        logging.error(f"Erro ao receber foto: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

@app.route('/reconhecimento', methods=['POST'])
def reconhecimento():
    try:
        data = request.get_json()
        matricula = data.get("matricula")

        if not matricula:
            logging.error("Matrícula não fornecida para reconhecimento.")
            return jsonify({"status": "erro", "mensagem": "Matrícula é obrigatória"}), 400

        # Aqui você pode adicionar a lógica para buscar o funcionário
        funcionario = collection.find_one({"matricula": matricula})

        if funcionario:
            logging.info(f"Funcionário encontrado: {funcionario}")
            return jsonify({
                "status": "sucesso",
                "funcionario": {
                    "nome": funcionario.get("nome"),
                    "matricula": funcionario.get("matricula"),
                    "id": str(funcionario.get("_id"))
                }
            }), 200
        else:
            logging.warning(f"Funcionário com matrícula {matricula} não encontrado.")
            return jsonify({"status": "erro", "mensagem": "Funcionário não encontrado"}), 404
    except Exception as e:
        logging.error(f"Erro ao processar reconhecimento: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)