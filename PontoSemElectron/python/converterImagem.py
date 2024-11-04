from pymongo import MongoClient
from PIL import Image
import base64
import io
import os

def salvar_fotos_funcionarios():
    # Conectar ao banco de dados MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client.pontoCB
    collection = db.funcionarios

    # Pasta para salvar as fotos
    output_folder = "fotos"
    os.makedirs(output_folder, exist_ok=True)

    # Função para converter string base64 em JPG e salvar
    def save_base64_as_jpg(base64_str, file_path):
        # Remover o prefixo "data:image/png;base64,"
        base64_str = base64_str.split(",")[1]
        
        # Decodificar a string base64
        image_data = base64.b64decode(base64_str)
        
        # Abrir a imagem com o PIL e redimensionar
        image = Image.open(io.BytesIO(image_data))
        image = image.convert("RGB")  # Converter para RGB se necessário
        image = image.resize((640, 480))  # Redimensionar para 640x480
        
        # Salvar a imagem como JPG
        image.save(file_path, format="JPEG")

    # Buscar documentos onde sync é False e processar a imagem
    for funcionario in collection.find({"sync": False}):
        foto_base64 = funcionario.get("foto")
        if foto_base64:
            # Criar o caminho do arquivo de saída usando a matrícula do funcionário
            output_path = os.path.join(output_folder, f"{funcionario['matricula']}.jpg")
            
            # Converter e salvar a imagem
            save_base64_as_jpg(foto_base64, output_path)
            print(f"Imagem salva em: {output_path}")

            # Atualizar o campo "sync" para True após salvar a imagem
            collection.update_one({"_id": funcionario["_id"]}, {"$set": {"sync": True}})
            print(f"Campo 'sync' atualizado para True para o funcionário {funcionario['_id']}")

    print("Processo concluído!")
    client.close()