import os
import tensorflow as tf
from tensorflow.python.util import deprecation
import cv2
import numpy as np
from numpy import expand_dims
from keras_facenet import FaceNet
import pickle
import json
import logging

def reconhecimentoFacial(): 
    # Supressão de mensagens do TensorFlow
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  
    tf.get_logger().setLevel(logging.ERROR)
    deprecation._PRINT_DEPRECATION_WARNINGS = False

    # Obtendo o diretório atual do script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Carregando o modelo FaceNet
    MyFaceNet = FaceNet()

    # Carregando o banco de dados do arquivo data.pkl
    data_path = os.path.join(script_dir, "data.pkl")
    try:
        with open(data_path, "rb") as myfile:
            database = pickle.load(myfile)
            print(f"Banco de dados carregado com sucesso. Chaves encontradas: {list(database.keys())}")
    except FileNotFoundError:
        print(f"Erro: O arquivo '{data_path}' não foi encontrado. Verifique se o treinamento foi realizado corretamente.")
        return json.dumps({"status": "erro", "mensagem": "Arquivo de dados não encontrado."})

    # Limiar para correspondência válida
    threshold = 1.2

    def process_image(image_path):
        image = cv2.imread(image_path)
        if image is None:
            print(f"Erro ao carregar a imagem: {image_path}")
            return None
        image = cv2.resize(image, (160, 160))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = expand_dims(image, axis=0)
        return MyFaceNet.embeddings(image)

    def reconhecer_face():
        temp_image_path = os.path.join(script_dir, 'temp', 'foto_recebida.jpg')
        assinatura = process_image(temp_image_path)
        if assinatura is None:
            return json.dumps({"status": "erro", "mensagem": "Imagem recebida não pôde ser processada."})

        best_match = "Desconhecido"
        best_dist = float('inf')

        for key, value in database.items():
            dist = np.linalg.norm(value - assinatura)
            if dist < best_dist and dist < threshold:
                best_dist = dist
                best_match = key

        result = {
            "nome": best_match if best_match != "Desconhecido" else None,
            "distancia": float(best_dist) if best_match != "Desconhecido" else None
        }

        print("Resultado do reconhecimento facial:", result)
        return json.dumps(result)

    return reconhecer_face()

if __name__ == "__main__":
    resultado = reconhecimentoFacial()
    print("Resultado do reconhecimento facial:", resultado)