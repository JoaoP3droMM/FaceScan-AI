import os
import cv2
import pickle
import numpy as np
from PIL import Image
from numpy import asarray, expand_dims
from keras_facenet import FaceNet
from django.conf import settings

try:
    BASE_DIR = settings.BASE_DIR
    HAAR_PATH = os.path.join(BASE_DIR, 'core', 'haarcascade_frontalface_default.xml')
    DATA_PATH = os.path.join(BASE_DIR, 'data.pkl')

    HaarCascade = cv2.CascadeClassifier(HAAR_PATH)
    MyFaceNet = FaceNet()

    with open(DATA_PATH, 'rb') as myfile:
        database = pickle.load(myfile)
    print('Modelos e banco de dados carregados com sucesso.')

except Exception as e:
    print(f'Erro crítico ao carregar modelos: {e}')
    HaarCascade, MyFaceNet, database = None, None, None

def recognize_face(image_array_rgb):
    if HaarCascade is None or MyFaceNet is None or database is None:
        return {'nome': None, 'distancia': None, 'error': 'Modelos não carregados'}

    best_match = 'Desconhecido'
    best_dist = float('inf')
    threshold = 0.9
    gray_img = cv2.cvtColor(image_array_rgb, cv2.COLOR_RGB2GRAY)
    faces = HaarCascade.detectMultiScale(gray_img, 1.1, 4)

    if len(faces) == 0:
        return {'nome': None, 'distancia': None, 'error': 'Nenhum rosto detectado'}

    x1, y1, width, height = faces[0]
    x2, y2 = x1 + width, y1 + height
    
    face_rgb = image_array_rgb[y1:y2, x1:x2]
    face_pil = Image.fromarray(face_rgb)
    face_pil = face_pil.resize((160, 160))
    face_array = asarray(face_pil)
    face_array = expand_dims(face_array, axis=0)
    signature = MyFaceNet.embeddings(face_array)

    for key, value in database.items():
        dist = np.linalg.norm(value - signature)
        if dist < best_dist and dist < threshold:
            best_dist = dist
            best_match = key

    if best_match != 'Desconhecido':
        return {
            'nome': best_match,
            'distancia': float(best_dist)
        }
    else:
        return {
            'nome': 'Desconhecido',
            'distancia': float(best_dist)
        }