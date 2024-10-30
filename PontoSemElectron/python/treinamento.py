import os
import cv2
from PIL import Image
from numpy import asarray, expand_dims
from keras_facenet import FaceNet
import pickle
import io
import sys

def exec_treinamento(): 
    # ********************************************************************************** #
    # Reconfigurando stdout e stderr para suportar UTF-8 (Sistema não chorar com nome de usuário com acento)
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    # ********************************************************************************** #
    # Obtendo o diretório atual do script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Carregando o Haarcascade e o FaceNet (Modelo de IA e código que reconhece o rosto na câmera)
    HaarCascade = cv2.CascadeClassifier(os.path.join(script_dir, 'haarcascade_frontalface_default.xml'))
    if HaarCascade.empty():
        print("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
        exit()

    # ********************************************************************************** #
    MyFaceNet = FaceNet()

    # ********************************************************************************** #
    # Diretório das imagens
    folder = os.path.join(script_dir, 'fotos')
    database = {}

    # ********************************************************************************** #
    # Processa cada arquivo no diretório
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        
        if os.path.isfile(filepath):
            img = cv2.imread(filepath)
            if img is None:
                print(f"Erro: Imagem '{filename}' não pôde ser carregada. Verifique o caminho e a integridade do arquivo.")
                continue
            print(f"Imagem '{filename}' carregada com sucesso.")

            # Detectando rostos na imagem
            wajah = HaarCascade.detectMultiScale(img, 1.1, 4)

            if len(wajah) > 0:
                x1, y1, width, height = wajah[0]
            else:
                print(f"Erro: Nenhum rosto detectado na imagem '{filename}'.")
                continue

            x2, y2 = x1 + width, y1 + height
            face = img[y1:y2, x1:x2]

            # Redimensionando e processando a face
            face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
            face = Image.fromarray(face)
            face = face.resize((160, 160))
            face_array = asarray(face)

            # Gerando a assinatura da face
            face_array = expand_dims(face_array, axis=0)
            signature = MyFaceNet.embeddings(face_array)

            # Adicionando a assinatura ao banco de dados
            database[os.path.splitext(filename)[0]] = signature

        else:
            print(f"Erro: '{filename}' não é um arquivo válido.")

    # ********************************************************************************** #
    # Salvando o banco de dados em 'data.pkl'
    data_path = os.path.join(script_dir, "data.pkl")
    with open(data_path, "wb") as myfile:
        pickle.dump(database, myfile)
    print(f"Processamento concluído e banco de dados salvo em '{data_path}'.")

    # ********************************************************************************** #
    print("Processamento concluído e banco de dados salvo em 'data.pkl'.")


exec_treinamento()
