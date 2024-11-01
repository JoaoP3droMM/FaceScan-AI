import os
import base64
import logging
import sys
from pymongo import MongoClient
from flask import Flask, jsonify, request
from treinamento import exec_treinamento
from reconhecimento import reconhecimentoFacial
from flask_cors import CORS

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

def decode_and_save_image(base64_string, filename):
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    with open(filename, 'wb') as f:
        f.write(image_data)

@app.route('/executar-conversao', methods=['POST'])
def executar_conversao():
    try:
        for funcionario in collection.find():
            nome = funcionario.get("matricula")
            foto_base64 = funcionario.get("foto")
            if foto_base64:
                try:
                    filename = os.path.join(output_dir, f"{nome}.jpg")
                    decode_and_save_image(foto_base64, filename)
                    print(f"Imagem salva para o funcionário {nome}")
                except Exception as e:
                    print(f"Erro ao salvar a imagem para o funcionário {nome}: {e}")
        exec_treinamento()
        return jsonify({"status": "sucesso", "mensagem": "Conversão realizada com sucesso!"})
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)})

@app.route('/receber-foto', methods=['POST'])
def receber_foto():
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")

        if not foto_base64:
            return jsonify({"status": "erro", "mensagem": "Imagem em base64 é obrigatória"}), 400

        filename = os.path.join(output_dir, "foto_recebida.jpg")
        decode_and_save_image(foto_base64, filename)
        resultado = reconhecimentoFacial()
        print("Resultado do reconhecimento facial:", resultado)

        return jsonify(json.loads(resultado)), 200
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)