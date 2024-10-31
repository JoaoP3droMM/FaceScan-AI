import base64
import os
import cv2
import numpy as np
import sys

def decode_base64_to_jpg(base64_string, output_path="temp"):
    # Criar a pasta 'temp' se não existir
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    try:
        # Decodificar a imagem base64
        image_data = base64.b64decode(base64_string.split(",")[1])
        np_img = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        # Salvar a imagem em formato JPG
        file_path = os.path.join(output_path, "imagem_temporaria.jpg")
        cv2.imwrite(file_path, img)
        print(f"Imagem salva com sucesso em {file_path}")
    
    except (IndexError, ValueError) as e:
        print(f"Erro ao decodificar a imagem: {e}")

# Verificar se o argumento base64 foi passado
if len(sys.argv) != 2:
    print("Uso: python3 converterBase64.py 'data:image/png;base64,...'")
    sys.exit(1)

# Receber a string base64 da linha de comando
base64_string = sys.argv[1]
decode_base64_to_jpg(base64_string)