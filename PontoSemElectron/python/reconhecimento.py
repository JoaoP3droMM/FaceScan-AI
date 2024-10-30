# ********************************************************************************** #
# Import das bibliotecas
import os
import tensorflow as tf
from tensorflow.python.util import deprecation
import cv2
import numpy as np
from PIL import Image
from numpy import expand_dims
from keras_facenet import FaceNet
import pickle
import time
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
# Variável de controle para interromper o reconhecimento
stop_recognition = False

# Função para interromper o reconhecimento
def stop_recognition_function():
    global stop_recognition
    stop_recognition = True

# ********************************************************************************** #
# Obtendo o diretório atual do script
script_dir = os.path.dirname(os.path.abspath(__file__))

# ********************************************************************************** #
# Carregando o Haarcascade e o FaceNet (Modelo de IA e código que reconhece o rosto na câmera)
HaarCascade = cv2.CascadeClassifier(os.path.join(script_dir, 'haarcascade_frontalface_default.xml'))
if HaarCascade.empty():
    print("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
    exit()

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
# Configuração da câmera
# cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  ->> WINDOWS
cap = cv2.VideoCapture(0) # ->> LINUX
if not cap.isOpened():
    print("Erro ao abrir a câmera.")
    exit()

# ********************************************************************************** #
# Definindo a área de foco (centro da elipse e tamanhos)
focus_center = (325, 205)  # Centro da elipse (ajuste conforme necessário)
focus_axes = (105, 150)    # Eixos da elipse (largura, altura)
focus_angle = 0            # Ângulo da elipse
focus_start_angle = 0      # Início do arco da elipse
focus_end_angle = 360      # Fim do arco da elipse

# ********************************************************************************** #
best_match = "Desconhecido"
best_dist = float('inf')
threshold = 0.9  # Limiar para correspondência válida
face_detected_time = 0
face_detected_start_time = None
required_face_time = 2  # Tempo necessário em segundos

# ********************************************************************************** #
# Função para verificar se o ponto está dentro da elipse
def is_point_in_ellipse(center, axes, angle, point):
    ellipse_poly = cv2.ellipse2Poly(center, axes, angle, 0, 360, 1)
    return cv2.pointPolygonTest(ellipse_poly, point, False) >= 0

# Loop infinito até que o programa seja fechado manualmente ou um rosto seja reconhecido
while True:
    if stop_recognition:  # Verifica se o reconhecimento deve ser interrompido
        print("Reconhecimento facial interrompido pelo usuário.")
        break

    ret, gbr1 = cap.read()
    if not ret:
        print("Erro ao capturar imagem da câmera.")
        break

    # Inverte a imagem horizontalmente
    gbr1 = cv2.flip(gbr1, 1)

    # Desenha a silhueta do rosto (elipse) na imagem
    cv2.ellipse(gbr1, focus_center, focus_axes, focus_angle, focus_start_angle, focus_end_angle, (0, 255, 255), 2)

    face = HaarCascade.detectMultiScale(gbr1, 1.1, 4)

    for (x1, y1, width, height) in face:
        x2, y2 = x1 + width, y1 + height

        # Verifica se o rosto está dentro da elipse de foco
        face_center = (int((x1 + x2) / 2), int((y1 + y2) / 2))  # Centro do rosto detectado

        if is_point_in_ellipse(focus_center, focus_axes, focus_angle, face_center):
            if face_detected_start_time is None:
                face_detected_start_time = time.time()

            face_detected_time = time.time() - face_detected_start_time

            if face_detected_time >= required_face_time:
                face = gbr1[y1:y2, x1:x2]
                face = cv2.resize(face, (160, 160))
                face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face = expand_dims(face, axis=0)

                assinatura = MyFaceNet.embeddings(face)

                for key, value in database.items():
                    dist = np.linalg.norm(value - assinatura)
                    if dist < best_dist and dist < threshold:
                        best_dist = dist
                        best_match = key

                cv2.ellipse(gbr1, focus_center, focus_axes, focus_angle, focus_start_angle, focus_end_angle, (0, 255, 0), 2)

                if best_match != "Desconhecido":
                    # Fecha a câmera e encerra o programa após reconhecimento bem-sucedido
                    cap.release()
                    cv2.destroyAllWindows()
                    # Mostra o melhor resultado
                    print(f'Pessoa identificada: {best_match} com distância {best_dist}')
                    
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
                    exit()  # Encerra o programa após o reconhecimento

        else:
            face_detected_time = 0
            face_detected_start_time = None

    cv2.imshow('res', gbr1)

    if cv2.waitKey(5) & 0xFF == 27:
        break

# ********************************************************************************** #
# Fechando a câmera caso o programa seja encerrado sem reconhecimento
cap.release()
cv2.destroyAllWindows()

# ********************************************************************************** #
# Mostrando o melhor resultado
if best_match != "Desconhecido":
    print(f'Pessoa identificada: {best_match} com distância {best_dist}')
else:
    print('Nenhum rosto correspondente foi encontrado.')

# ********************************************************************************** #
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