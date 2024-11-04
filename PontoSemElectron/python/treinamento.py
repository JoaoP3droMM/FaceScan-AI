import os
import cv2
from PIL import Image
from numpy import asarray, expand_dims
from keras_facenet import FaceNet
import pickle
import logging

def exec_treinamento(modo="cadastro", registrar_ponto=False):
    logging.basicConfig(level=logging.INFO)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    HaarCascade = cv2.CascadeClassifier(os.path.join(script_dir, 'haarcascade_frontalface_default.xml'))
    if HaarCascade.empty():
        logging.error("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
        return

    MyFaceNet = FaceNet()
    database = {}

    folder = os.path.join(script_dir, 'fotos')

    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        
        if os.path.isfile(filepath):
            img = cv2.imread(filepath)
            if img is None:
                logging.warning(f"Imagem '{filename}' não pôde ser carregada.")
                continue

            logging.info(f"Imagem '{filename}' carregada com sucesso.")

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
                database[os.path.splitext(filename)[0]] = signature
            else:
                logging.warning(f"Nenhum rosto detectado na imagem '{filename}'.")
        else:
            logging.warning(f"'{filename}' não é um arquivo válido.")

    data_path = os.path.join(script_dir, "data.pkl")
    with open(data_path, "wb") as myfile:
        pickle.dump(database, myfile)

    logging.info(f"Processamento concluído e banco de dados salvo em '{data_path}'.")

    # Verifica o modo antes de retornar
    if modo == "ponto":
        print("Treinamento concluído no modo ponto.")
    else:
        print("Treinamento concluído no modo cadastro, sem reconhecimento de ponto.")


exec_treinamento()