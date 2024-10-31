import os
import cv2

# Diretório com as imagens originais
pasta_fotos = r"./fotos"

# Dimensões de redimensionamento
nova_largura, nova_altura = 160, 160

# Verificando se o diretório existe
if not os.path.exists(pasta_fotos):
    print(f"Erro: A pasta '{pasta_fotos}' não foi encontrada.")
    exit()

# Processando cada imagem na pasta
for nome_arquivo in os.listdir(pasta_fotos):
    caminho_imagem = os.path.join(pasta_fotos, nome_arquivo)
    
    # Verifica se o arquivo é uma imagem
    if os.path.isfile(caminho_imagem) and nome_arquivo.lower().endswith(('.png', '.jpg', '.jpeg')):
        # Carregar a imagem
        imagem = cv2.imread(caminho_imagem)
        
        # Redimensionar a imagem
        imagem_redimensionada = cv2.resize(imagem, (nova_largura, nova_altura))
        
        # Sobrescrever a imagem original com a redimensionada
        cv2.imwrite(caminho_imagem, imagem_redimensionada)
        print(f"Imagem redimensionada e salva: {nome_arquivo}")

print("Processamento concluído.")