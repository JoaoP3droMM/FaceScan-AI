# Script responsável por pegar a foto em base64 do mongoDB e convertela para jpg salvando-a na pasta fotos

# ********************************************************************************************************
# Import das bibliotecas e módulos
from pymongo import MongoClient
from PIL import Image
import base64
import io
import os

# ********************************************************************************************************
# Função principal que encapsula todo o processo, permitindo a modularização de uma forma mais simples
def salvar_fotos_funcionarios():
    # Conectar ao banco de dados MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client.pontoCB
    collection = db.funcionarios

    # Pasta para salvar as fotos
    pastaFotos = "fotos"
    os.makedirs(pastaFotos, exist_ok=True) # Se a pasta fotos não existir ele a cria

# ********************************************************************************************************
    # Função para converter string base64 em JPG e salvar
    def save_base64_as_jpg(base64_str, file_path):

        # Remover o prefixo "data:image/png;base64,"
        base64_str = base64_str.split(",")[1]
        
        # Decodificar a string base64
        image_data = base64.b64decode(base64_str)
        
        # Abrir a imagem com o PIL e redimensionar
        imagem = Image.open(io.BytesIO(image_data))
        imagem = imagem.convert("RGB")  # Converter para RGB se necessário
        imagem = imagem.resize((640, 480))  # Redimensionar para 640x480
        
        # Salvar a imagem como JPG
        imagem.save(file_path, format="JPEG")

# ********************************************************************************************************
    # Buscar documentos onde sync é False e processar a imagem
    for funcionario in collection.find({"sync": False}):
        fotoString = funcionario.get("foto")

        # Se ele acha o sync false e existe uma string 64 no campo foto:
        if fotoString:

            # Criar o caminho do arquivo de saída usando a matrícula do funcionário
            pastaFotos = os.path.join(pastaFotos, f"{funcionario['matricula']}.jpg")
            
            # Converter e salvar a imagem
            save_base64_as_jpg(fotoString, pastaFotos)
            print(f"Imagem salva em: {pastaFotos}")

            # Atualizar o campo "sync" para True após salvar a imagem
            collection.update_one({"nome": funcionario["nome"]}, {"$set": {"sync": True}})
            print(f"Campo 'sync' atualizado para True para o funcionário(a) {funcionario['nome']}")

# ********************************************************************************************************
    # Indica o fim da conversão
    print("Processo concluído!")
    client.close()