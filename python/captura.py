# Código de captura de faces

# ********************************************************************************** #
# Import das bibliotecas
import cv2
import os
import sys
import json

# ********************************************************************************** #
# Obtendo o diretório atual do script
script_dir = os.path.dirname(os.path.abspath(__file__))

# ********************************************************************************** #
def start_capture(matricula):
    if not matricula:
        return {'error': 'Matrícula não fornecida'}

    # Verifica se a pasta de destino existe
    pasta = os.path.join(script_dir, 'fotos')
    if not os.path.exists(pasta):
        return {'error': f'A pasta {pasta} não existe'}

    # Acessa a câmera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return {'error': 'Erro ao acessar a câmera'}

    print("Pressione 'Espaço' para capturar a foto ou 'Esc' para sair.")

    while True:
        # Captura o frame da câmera
        ret, frame = cap.read()
        if not ret:
            cap.release()
            return {'error': 'Erro ao capturar a imagem'}
        
        # Inverte o frame horizontalmente (pode ajustar para outros eixos se necessário)
        flipped_frame = cv2.flip(frame, 1)

        # Mostra o feed da câmera em uma janela
        cv2.imshow("Pressione 'Espaco' para capturar", flipped_frame)

        # Espera por uma tecla espaço ser pressionada
        key = cv2.waitKey(1) & 0xFF

        # Se a tecla 'Espaço' for pressionada, salva a foto e fecha a câmera
        if key == ord(' '):
            filename = os.path.join(pasta, f'{matricula}.png')
            cv2.imwrite(filename, flipped_frame)
            cap.release()
            cv2.destroyAllWindows()
            return {'message': f'Imagem capturada com sucesso e salva como {filename}'}

        # Se a tecla 'Esc' for pressionada, sai do loop sem tirar a foto
        elif key == 27:  # Código ASCII para 'Esc'
            cap.release()
            cv2.destroyAllWindows()
            return {'error': 'Captura de imagem cancelada pelo usuário'}
        
# ********************************************************************************** #
# Verifica se a matrícula foi fornecida, se não for, não executa
if __name__ == '__main__':
    if len(sys.argv) > 1:
        matricula = sys.argv[1]
        result = start_capture(matricula)
    else:
        result = {'error': 'Matrícula não fornecida nos argumentos'}

    # Imprime o resultado como JSON para ser capturado pelo Node.js
    print(json.dumps(result))

# ********************************************************************************** #