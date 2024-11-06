# Script principal que gerencia todas as operações de cadastro no banco de dados

# ********************************************************************************************************
# Import das bibliotecas e módulos
import os
import base64
import logging
import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from pymongo import MongoClient
from flask_cors import CORS
from threading import Thread
from treinamento import exec_treinamento
from converterImagem import salvar_fotos_funcionarios
from cadastrarUsuario import cadastrar_usuario

# ********************************************************************************************************
# Desabilitando o uso de GPUs (tirar mensagem chata quando roda o sistema)
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Configuração do Flask, CORS, e SocketIO (API's)
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # Habilita SocketIO com suporte a CORS

# Configuração da conexão com MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['pontoCB']
collection = db['funcionarios']

# Diretório de saída para imagens temporárias
imagensTemporarias = os.path.join(os.path.dirname(__file__), 'temp')
os.makedirs(imagensTemporarias, exist_ok=True)

# ********************************************************************************************************
# Decodifica uma string de imagem em base64 e a salva em disco
def converterSalvar(base64_string, filename, target_size=(640, 480)):
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    stringImagem = base64.b64decode(base64_string)
    npArray = np.frombuffer(stringImagem, np.uint8)
    img = cv2.imdecode(npArray, cv2.IMREAD_COLOR)
    imagemRedimencionada = cv2.resize(img, target_size)
    cv2.imwrite(filename, imagemRedimencionada)
    logging.info(f"Imagem salva e redimensionada para {target_size} em {filename}")

# ********************************************************************************************************
# Variável de controle para o treinamento
treinamento_em_andamento = False

def exec_treinamento_async():
    global treinamento_em_andamento
    if not treinamento_em_andamento:  # Verifica se o treinamento já está em andamento
        treinamento_em_andamento = True  # Marca o treinamento como iniciado
        salvar_fotos_funcionarios()
        exec_treinamento(modo="cadastro", registrar_ponto=False)
        treinamento_em_andamento = False  # Marca o treinamento como concluído
        logging.info("Treinamento concluído")
        # Envia uma mensagem via WebSocket para o front-end
        socketio.emit('status', {'mensagem': 'Cadastro concluído'})
    else:
        logging.info("Tentativa de treinamento ignorada, já está em andamento.")

# ********************************(DEFININDO ROTAS DE API)************************************************

# ********************************************************************************************************
# Rota de cadastro de funcionários
@app.route('/cadastroFunc', methods=['POST'])
def cadastro():
    try:
        data = request.get_json()
        foto_base64 = data.get("imagem")
        matricula = data.get("matricula")
        nome = data.get("nome")

        # Converte campos recebidos pela API em números para gravar no banco
        try:
            id_funcionario = int(data.get("id"))
            cpf = int(data.get("cpf"))
            filial = int(data.get("filial"))
        except (ValueError, TypeError) as e:
            logging.error("Erro ao converter id, cpf ou filial para numérico.")
            return jsonify({"status": "erro", "mensagem": "ID, CPF e filial devem ser numéricos."}), 400

        # Verifica se todos os dados obrigatórios foram fornecidos
        if not (foto_base64 and matricula and nome):
            logging.error("Dados obrigatórios não fornecidos.")
            return jsonify({"status": "erro", "mensagem": "Imagem, matrícula, id, nome, cpf e filial são obrigatórios"}), 400

        # Salvar a imagem recebida
        filename = os.path.join(imagensTemporarias, "foto_cadastro.jpg")
        converterSalvar(foto_base64, filename)

        # Atualizar ou inserir o funcionário com novos dados
        result = collection.update_one(
            {"matricula": matricula},
            {"$set": {
                "id": id_funcionario,
                "nome": nome,
                "cpf": cpf,
                "filial": filial,
                "foto": foto_base64,
                "sync": False
            }},
            upsert=True
        )

        # Respostas de acordo com o que foi feito
        if result.upserted_id:
            logging.info(f"Novo funcionário criado com a matrícula: {matricula}")
        elif result.modified_count > 0:
            logging.info(f"Funcionário atualizado com a matrícula: {matricula}")
        else:
            logging.warning(f"Nenhuma atualização feita para a matrícula: {matricula}")

        # **Treinamento direto na rota (não usando thread)**
        logging.info("Iniciando o treinamento...")
        exec_treinamento_async()  # Função de treinamento, pode ser bloqueante
        
        return jsonify({"status": "sucesso", "mensagem": "Funcionário cadastrado com sucesso!"}), 200

    except Exception as e:
        logging.error(f"Erro ao cadastrar funcionário: {e}")
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

# ********************************************************************************************************
@app.route('/cadastrarUsuario', methods=['POST'])
def route_cadastrar_usuario():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Chama a função de cadastro de usuário
    return cadastrar_usuario(username, password)

# ********************************************************************************************************
# Define a porta da API
if __name__ == "__main__":
    socketio.run(app, port=5000)  # Usa socketio.run ao invés de app.run