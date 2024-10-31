from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import subprocess

app = Flask(__name__)
CORS(app)  # Habilita o CORS para todas as rotas

# Função para decodificar a imagem base64 e salvar em um arquivo temporário
def save_base64_image(base64_string, output_path):
    if base64_string.startswith('data:image/png;base64,'):
        base64_string = base64_string.replace('data:image/png;base64,', '')
    
    with open(output_path, "wb") as image_file:
        image_file.write(base64.b64decode(base64_string))

@app.route('/recognize', methods=['POST'])


def corrigir_padding(base64_string):
    missing_padding = len(base64_string) % 4
    if missing_padding != 0:
        base64_string += '=' * (4 - missing_padding)
    return base64_string



def recognize_face():
    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    base64_image = data['image']
    
    # Salvar a imagem base64 em um arquivo temporário
    temp_image_path = os.path.join(os.getcwd(), 'temp_image.png')
    save_base64_image(base64_image, temp_image_path)

    # Chamar o script de reconhecimento facial
    result = subprocess.run(['python3', 'reconhecimento.py', temp_image_path], capture_output=True, text=True)

    if result.returncode != 0:
        return jsonify({'error': 'Recognition failed', 'message': result.stderr}), 500
    
    # Retornar a saída do reconhecimento
    return jsonify({'result': result.stdout}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)