# Script responsável pelo treinamento da IA que faz o reconhecimento facial.
# Aqui ensinamos para a IA quem é quem, por meio das imagens salvas na pasta fotos

# ********************************************************************************************************
# Import das bibliotecas e módulos
import os
import cv2
from PIL import Image
from numpy import asarray, expand_dims
from keras_facenet import FaceNet
import pickle
import logging

# ********************************************************************************************************
# Função principal que encapsula todo o processo, permitindo a modularização de uma forma mais simples
def exec_treinamento(modo="cadastro", registrar_ponto=False):

    # Desabilitando o uso de GPUs (tirar mensagem chata quando roda o sistema)
    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

    # Definida a pasta principal onde se localiza o projeto
    pastaMain = os.path.dirname(os.path.abspath(__file__))

    # Definindo o haarcascade para a localização dos rostos na imagem
    rostoFoto = cv2.CascadeClassifier(os.path.join(pastaMain, 'haarcascade_frontalface_default.xml'))
    if rostoFoto.empty():
        logging.error("Erro ao carregar o Haarcascade. Verifique o caminho do arquivo.")
        return

    # Criando as instâncias (objeto específico criado a partir de uma classe) para capturar os embeddings
    # (representações numéricas de objetos, como rostos) e um objeto banco para armazenar as assinaturas
    IAFaceNet = FaceNet()
    assinaturasArmazenadas = {}

    # Definindo onde está a pasta onde estão as fotos dos funcionários cadastrados
    pastaFotos = os.path.join(pastaMain, 'fotos')

# ********************************************************************************************************
    # Loop para percorrer todos os rostos da pasta de fotos
    for filename in os.listdir(pastaFotos):
        filepath = os.path.join(pastaFotos, filename)
        
        # Verifica se o caminho é um arquivo e não um diretório
        if os.path.isfile(filepath):
            img = cv2.imread(filepath) # Carrega a imagem com opencv gerando uma matriz de pixels

            # Se não conseguir carregar a imagem avisa o erro e pula para a próxima
            if img is None:
                logging.warning(f"Imagem '{filename}' não pôde ser carregada.")
                continue

            # Informativo
            logging.info(f"Imagem '{filename}' carregada com sucesso.")

            # Detecta os rostos da imagem
            faces = rostoFoto.detectMultiScale(img, 1.1, 4)

# ********************************************************************************************************
            # Verifica se há algum rosto na imagem, se não pula para o próximo
            if len(faces) > 0:
                x1, y1, width, height = faces[0]
                x2, y2 = x1 + width, y1 + height # Calcula os limites do rosto
                face = img[y1:y2, x1:x2] # Recorda a região que contém o rosto na imagem
                face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face = Image.fromarray(face)
                face = face.resize((160, 160))
                face_array = asarray(face)
                face_array = expand_dims(face_array, axis=0)
                signature = IAFaceNet.embeddings(face_array)
                assinaturasArmazenadas[os.path.splitext(filename)[0]] = signature
            else:
                logging.warning(f"Nenhum rosto detectado na imagem '{filename}'.")
        else:
            logging.warning(f"'{filename}' não é um arquivo válido.")

# ********************************************************************************************************
    pastaDataPKL = os.path.join(pastaMain, "data.pkl")
    with open(pastaDataPKL, "wb") as myfile:
        pickle.dump(assinaturasArmazenadas, myfile)

    # Informativo
    logging.info(f"Processamento concluído e banco de dados salvo em '{pastaDataPKL}'.")

    # Verifica o modo antes de retornar
    if modo == "ponto":
        print("Treinamento concluído no modo ponto.")
    else:
        print("Treinamento concluído no modo cadastro, sem reconhecimento de ponto.")
# ********************************************************************************************************

exec_treinamento()