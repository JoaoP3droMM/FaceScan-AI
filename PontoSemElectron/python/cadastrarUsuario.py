import logging
from pymongo import MongoClient

# Conexão com o banco de dados MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['pontoCB']
users_collection = db['users']

def cadastrar_usuario(username, password):
    """Função para cadastrar um novo usuário no MongoDB."""
    try:
        # Verifica se o usuário já existe
        if users_collection.find_one({"username": username}):
            logging.error("Usuário já existe.")
            return {"success": False, "message": "O usuário já existe"}, 400


        # Cria um novo usuário
        new_user = {
            "username": username,
            "password": password
        }

        # Insere o novo usuário na coleção
        users_collection.insert_one(new_user)

        logging.info(f"Usuário cadastrado com sucesso: {username}")
        return {"success": True, "message": "Usuário cadastrado com sucesso!"}, 201

    except Exception as e:
        logging.error(f"Erro ao cadastrar usuário: {e}")
        return {"success": False, "message": str(e)}, 500