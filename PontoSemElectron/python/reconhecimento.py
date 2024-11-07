# Script responsável por realizar o reconhecimento facial de fato, o coração de todo o sistema

# ********************************************************************************************************
# Importando módulos e bibliotecas
import os
import tensorflow as tf
from tensorflow.python.util import deprecation
import cv2
import numpy as np
from numpy import expand_dims
from keras_facenet import FaceNet
import pickle
import logging


# ********************************************************************************************************
# Função principal de reconhecimento (encapsula todo o processo para facilitar a modularização)
def reconhecimentoFacial(): 
    print('Iniciando no modo ponto...')
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  
    tf.get_logger().setLevel(logging.ERROR)
    deprecation._PRINT_DEPRECATION_WARNINGS = False

    # Configurando o diretório e carregando o modelo de IA
    script_dir = os.path.dirname(os.path.abspath(__file__))
    MyFaceNet = FaceNet()
    data_path = os.path.join(script_dir, "data.pkl")
    try:
        with open(data_path, "rb") as myfile:
            database = pickle.load(myfile)
            print(f"Banco de dados carregado com sucesso. Chaves encontradas: {list(database.keys())}")
    except FileNotFoundError:
        print(f"Erro: O arquivo '{data_path}' não foi encontrado. Verifique se o treinamento foi realizado corretamente.")
        return {"status": "erro", "mensagem": "Arquivo de dados não encontrado."}

    # Distância máxima entre o rosto da pasta temp com o rosto cadastrado para considerar reconhecido
    threshold = 1.2


# ********************************************************************************************************
    # Lê a imagem temporária com openCV (seguindo o sistema de divisão de matrizes)
    def process_image(image_path):
        image = cv2.imread(image_path)
        if image is None:
            print(f"Erro ao carregar a imagem: {image_path}")
            return None
        image = cv2.resize(image, (160, 160))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = expand_dims(image, axis=0)
        return MyFaceNet.embeddings(image)


# ********************************************************************************************************
    # Função que realiza o reconhecimento em si
    def reconhecer_face():
        # Caminho da imagem temporária
        temp_image_path = os.path.join(script_dir, 'temp', 'foto_recebida.jpg')

        # Processa a imagem e verifica erros
        assinatura = process_image(temp_image_path)
        if assinatura is None:
            return {"status": "erro", "mensagem": "Imagem recebida não pôde ser processada."}

        # Cria as variáveis de comparação
        best_match = "Desconhecido"
        best_dist = float('inf')

        # Compara com o modelo treinado no data.pkl
        for key, value in database.items():
            dist = np.linalg.norm(value - assinatura)
            if dist < best_dist and dist < threshold:
                best_dist = dist
                best_match = key

        # Construindo o resultado final, apenas se houver um match
        if best_match != "Desconhecido":
            result = {
                "nome": best_match,
                "distancia": float(best_dist)
            }
        else:
            result = {
                "nome": None,
                "distancia": None
            }

        print("Resultado do reconhecimento facial:", result)
        return result

    return reconhecer_face()


# ********************************************************************************************************
if __name__ == "__main__":
    resultado = reconhecimentoFacial()
    print("Resultado do reconhecimento facial:", resultado)