import os
import base64
import logging
import sys
import cv2
import numpy as np
from flask import Flask, jsonify, request
from pymongo import MongoClient
from flask_cors import CORS
from treinamento import exec_treinamento
from converterImagem import salvar_fotos_funcionarios

# Configuração de logging
logging.basicConfig(
    filename='cadastro_log.log',
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
collection = db['funcionarios']

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

@app.route('/cadastro', methods=['POST'])
def cadastro():
    """Rota para cadastro de nova imagem e treinamento."""
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

        # Atualizar a foto do funcionário existente
        result = collection.update_one(
            {"matricula": matricula},
            {"$set": {"foto": foto_base64, "sync": False}}
        )

        if result.modified_count == 0:
            logging.warning(f"Nenhum funcionário encontrado com a matrícula: {matricula}")

        # Salvar fotos no sistema de arquivos
        salvar_fotos_funcionarios()

        # Executar treinamento em modo cadastro
        exec_treinamento(modo="cadastro", registrar_ponto=False)
        
        return jsonify({"status": "sucesso", "mensagem": "Foto recebida e atualizada com sucesso!"}), 200

    except Exception as e:
        logging.error(f"Erro ao receber foto para cadastro: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)