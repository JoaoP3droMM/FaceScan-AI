import os
import tensorflow as tf
import cv2
import numpy as np
from numpy import expand_dims
from keras_facenet import FaceNet
import pickle
import time
import json
import base64
import sys
import logging

# Supressão de mensagens do TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
tf.get_logger().setLevel(logging.ERROR)

# Função para decodificar a imagem base64
def decode_base64_and_convert_to_image(base64_string):
    try:
        image_data = base64.b64decode(base64_string.split(",")[1])
        np_img = np.frombuffer(image_data, np.uint8)
        return cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    except (IndexError, ValueError) as e:
        print("Erro ao decodificar a imagem:", str(e))
        sys.exit(1)

# Verifica se o argumento com a imagem foi passado
if len(sys.argv) != 2:
    print("Erro: Imagem em base64 não fornecida.")
    sys.exit(1)

# Decodifica a imagem base64 para formato OpenCV
base64_image_string = sys.argv[1]
try:
    gbr1 = decode_base64_and_convert_to_image(base64_image_string)
except Exception as e:
    print(f"Erro ao decodificar a imagem: {e}")
    sys.exit(1)

# Obtém o diretório atual e carrega Haarcascade e FaceNet
script_dir = os.path.dirname(os.path.abspath(__file__))
HaarCascade = cv2.CascadeClassifier(os.path.join(script_dir, 'haarcascade_frontalface_default.xml'))

if HaarCascade.empty():
    print("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
    sys.exit(1)

MyFaceNet = FaceNet()

# Carregando o banco de dados de embeddings
data_path = os.path.join(script_dir, "data.pkl")
try:
    with open(data_path, "rb") as myfile:
        database = pickle.load(myfile)
except FileNotFoundError:
    print(f"Erro: O arquivo '{data_path}' não foi encontrado. Verifique se o treinamento foi realizado corretamente.")
    sys.exit(1)

# Definindo parâmetros de foco e de reconhecimento
focus_center = (325, 205)
focus_axes = (105, 150)
focus_angle = 0
best_match = "Desconhecido"
best_dist = float('inf')
threshold = 0.9
face_detected_time = 0
face_detected_start_time = None
required_face_time = 2  # segundos

# Função para verificação de ponto na elipse
def is_point_in_ellipse(center, axes, angle, point):
    x, y = point
    h, k = center
    cos_a = np.cos(np.radians(angle))
    sin_a = np.sin(np.radians(angle))
    term1 = ((cos_a * (x - h) + sin_a * (y - k))**2) / (axes[0]**2)
    term2 = ((sin_a * (x - h) - cos_a * (y - k))**2) / (axes[1]**2)
    return (term1 + term2) <= 1

# Detecta e processa a face
face = HaarCascade.detectMultiScale(gbr1, 1.1, 4)
for (x1, y1, width, height) in face:
    x2, y2 = x1 + width, y1 + height
    face_center = (int((x1 + x2) / 2), int((y1 + y2) / 2))

    if is_point_in_ellipse(focus_center, focus_axes, focus_angle, face_center):
        if face_detected_start_time is None:
            face_detected_start_time = time.time()
        face_detected_time = time.time() - face_detected_start_time

        if face_detected_time >= required_face_time:
            face_crop = gbr1[y1:y2, x1:x2]
            face_crop = cv2.resize(face_crop, (160, 160))
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            face_rgb = expand_dims(face_rgb, axis=0)

            assinatura = MyFaceNet.embeddings(face_rgb)

            for key, value in database.items():
                dist = np.linalg.norm(value - assinatura)
                if dist < best_dist and dist < threshold:
                    best_dist = dist
                    best_match = key

            if best_match != "Desconhecido":
                result = {
                    "nome": best_match,
                    "distancia": float(best_dist)
                }
                print(json.dumps(result))
                sys.exit(0)
    else:
        face_detected_time = 0
        face_detected_start_time = None

if best_match == "Desconhecido":
    print("Nenhum rosto correspondente foi encontrado.")