import cv2

# Tente diferentes índices se houver mais de uma câmera
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Erro ao abrir a câmera.")
else:
    print("Câmera aberta com sucesso.")
    ret, frame = cap.read()  # Tenta capturar um quadro
    if ret:
        cv2.imshow("Frame", frame)  # Mostra o quadro capturado
        cv2.waitKey(0)  # Espera até que uma tecla seja pressionada
    else:
        print("Erro ao capturar um quadro.")

cap.release()  # Libera a câmera
cv2.destroyAllWindows()  # Fecha todas as janelas