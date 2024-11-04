import os
import cv2
from PIL import Image
from numpy import asarray, expand_dims
from keras_facenet import FaceNet
import pickle
import logging

def exec_treinamento(): 
    # Configuração do logging
    logging.basicConfig(level=logging.INFO)

    # Obtendo o diretório atual do script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Carregando o Haarcascade
    HaarCascade = cv2.CascadeClassifier(os.path.join(script_dir, 'haarcascade_frontalface_default.xml'))
    if HaarCascade.empty():
        logging.error("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
        return

    # Inicializando o modelo FaceNet
    MyFaceNet = FaceNet()
    database = {}

    # Diretório das imagens
    folder = os.path.join(script_dir, 'fotos')

    # Processa cada arquivo no diretório
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        
        if os.path.isfile(filepath):
            img = cv2.imread(filepath)
            if img is None:
                logging.warning(f"Imagem '{filename}' não pôde ser carregada.")
                continue

            logging.info(f"Imagem '{filename}' carregada com sucesso.")

            # Detectando rostos na imagem
            faces = HaarCascade.detectMultiScale(img, 1.1, 4)

            if len(faces) > 0:
                x1, y1, width, height = faces[0]
                x2, y2 = x1 + width, y1 + height
                face = img[y1:y2, x1:x2]
                face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face = Image.fromarray(face)
                face = face.resize((160, 160))
                face_array = asarray(face)
                face_array = expand_dims(face_array, axis=0)
                signature = MyFaceNet.embeddings(face_array)

                # Adicionando a assinatura ao banco de dados
                database[os.path.splitext(filename)[0]] = signature
            else:
                logging.warning(f"Nenhum rosto detectado na imagem '{filename}'.")
        else:
            logging.warning(f"'{filename}' não é um arquivo válido.")

    # Salvando o banco de dados em 'data.pkl'
    data_path = os.path.join(script_dir, "data.pkl")
    with open(data_path, "wb") as myfile:
        pickle.dump(database, myfile)

    logging.info(f"Processamento concluído e banco de dados salvo em '{data_path}'.")

exec_treinamento()