# Script central do ponto, gerência a batida de ponto, reconhecimento facial e envio para o portal.

# ********************************************************************************************************
# Import dos módulos e bibliotecas
import os
import base64
import logging
import cv2
import numpy as np
import requests
from datetime import datetime
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
collection = db.pontos_batidos

# Diretório de saída para imagens
pastaTemp = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(pastaTemp, exist_ok=True)


# ********************************************************************************************************
# Função que redimenciona a imagem do ponto
def resize_with_aspect_ratio(image, target_size=(640, 480)):
    original_height, original_width = image.shape[:2]
    target_width, target_height = target_size

    # Calcula as proporções para manter o aspecto da imagem original
    scale_width = target_width / original_width
    scale_height = target_height / original_height
    scale = min(scale_width, scale_height)  # Escolhe a menor escala para manter tudo visível

    # Calcula o novo tamanho
    new_width = int(original_width * scale)
    new_height = int(original_height * scale)
    resized_image = cv2.resize(image, (new_width, new_height))

    # Cria uma imagem em branco (com fundo preto) e centraliza a imagem redimensionada
    final_image = np.zeros((target_height, target_width, 3), dtype=np.uint8)
    y_offset = (target_height - new_height) // 2
    x_offset = (target_width - new_width) // 2
    final_image[y_offset:y_offset + new_height, x_offset:x_offset + new_width] = resized_image

    return final_image


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
    img_resized = resize_with_aspect_ratio(img, target_size)

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
        filename = os.path.join(pastaTemp, "foto_recebida.jpg")
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


# ********************************************************************************************************
# Definindo a porta que irá rodar o servidor
if __name__ == "__main__":
    app.run(port=5001)