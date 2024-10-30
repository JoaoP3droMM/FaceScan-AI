import os
import base64
from pymongo import MongoClient
from flask import Flask, jsonify
from treinamento import exec_treinamento

# Configurações do Flask
app = Flask(__name__)

# Configurações de conexão com o MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']
collection = db['funcionarios']

# Diretório para salvar as imagens
output_dir = 'fotos'
os.makedirs(output_dir, exist_ok=True)

# Função para remover o prefixo e decodificar a imagem
def decode_and_save_image(base64_string, filename):
    # Remove o prefixo "data:image/ong;base64," se estiver presente
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    # Converte a imagem de base64 para binário e salva como JPG
    image_data = base64.b64decode(base64_string)
    with open(filename, 'wb') as f:
        f.write(image_data)

# Endpoint da API para executar a conversão
@app.route('/executar-conversao', methods=['POST'])
def executar_conversao():
    try:
        # Itera sobre os documentos para salvar as imagens
        for funcionario in collection.find():
            nome = funcionario.get("matricula")
            foto_base64 = funcionario.get("foto")
            if foto_base64:
                try:
                    # Define o caminho completo do arquivo de saída
                    filename = os.path.join(output_dir, f"{nome}.jpg")
                    decode_and_save_image(foto_base64, filename)
                    print(f"Imagem salva para o funcionário {nome}")
                except Exception as e:
                    print(f"Erro ao salvar a imagem para o funcionário {nome}: {e}")
        exec_treinamento()
        print('Deu bom no treinamento')    
        return jsonify({"status": "sucesso", "mensagem": "Conversão realizada com sucesso!"})
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)})

if __name__ == "__main__":
    app.run(port=5000)