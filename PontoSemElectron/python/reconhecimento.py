# ********************************************************************************** #
# Import das bibliotecas
import os
import tensorflow as tf
from tensorflow.python.util import deprecation
import cv2
import numpy as np
from numpy import expand_dims
from keras_facenet import FaceNet
import pickle
import json
import sys
import io
import logging

# Supressão de mensagens do TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  
tf.get_logger().setLevel(logging.ERROR)

# Força o encoding UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ********************************************************************************** #
# Obtendo o diretório atual do script
script_dir = os.path.dirname(os.path.abspath(__file__))

# ********************************************************************************** #
# Carregando o modelo FaceNet
MyFaceNet = FaceNet()

# ********************************************************************************** #
# Carregando IA do banco de dados.pkl
data_path = os.path.join(script_dir, "data.pkl")
try:
    with open(data_path, "rb") as myfile:
        database = pickle.load(myfile)
        for key in database:
            print(f'Chave no banco de dados: {key}')
except FileNotFoundError:
    print(f"Erro: O arquivo '{data_path}' não foi encontrado. Verifique se o treinamento foi realizado corretamente.")
    exit()

# ********************************************************************************** #
# Variáveis para correspondência
best_match = "Desconhecido"
best_dist = float('inf')
threshold = 1.5  # Limiar para correspondência válida

# Função para processar a imagem e obter a assinatura
def process_image(image_path):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Erro ao carregar a imagem: {image_path}")
        return None
    image = cv2.resize(image, (160, 160))  # Redimensiona para 160x160, exigido pelo FaceNet
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = expand_dims(image, axis=0)
    return MyFaceNet.embeddings(image)

# ********************************************************************************** #
# Carregando as duas imagens temporárias
temp_image_paths = [
    os.path.join(script_dir, 'temporarios', 'imagem_temporaria.jpg')
]

# Processando as imagens e obtendo as assinaturas
for temp_image_path in temp_image_paths:
    assinatura = process_image(temp_image_path)
    if assinatura is None:
        continue

    # Comparando com o banco de dados
    for key, value in database.items():
        dist = np.linalg.norm(value - assinatura)
        if dist < best_dist and dist < threshold:
            best_dist = dist
            best_match = key

# ********************************************************************************** #
# Mostrando o melhor resultado
if best_match != "Desconhecido":
    print(f'Pessoa identificada: {best_match} com distância {best_dist}')
else:
    print('Nenhum rosto correspondente foi encontrado.')

# Construindo o dicionário de resultado para enviar ao Electron
result = {
    "nome": best_match if best_match != "Desconhecido" else None,
    "distancia": float(best_dist) if best_match != "Desconhecido" else None
}

# Função auxiliar para converter todo np.float32 em float
def convert_np(obj):
    if isinstance(obj, np.float32):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()  # Converte arrays numpy para listas
    return obj

result = {key: convert_np(value) for key, value in result.items()}

# Envia o resultado como JSON para o Electron
print(json.dumps(result))