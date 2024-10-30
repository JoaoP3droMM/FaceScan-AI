import subprocess
import sys
import os
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception as e:
        return False

def run_as_admin():
    if is_admin():
        # Execute o código normalmente
        check_and_install_libraries()
        print("Todas as bibliotecas foram instaladas com sucesso.")
    else:
        # Solicita permissões de administrador
        script = sys.argv[0]
        params = ' '.join([f'"{arg}"' for arg in sys.argv[1:]])
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}" {params}', None, 1)

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def check_and_install_libraries():
    required_libraries = [
        'opencv-python',
        'opencv-contrib-python',
        'scipy',
        'Pillow',
        'numpy',
        'keras_facenet',
        'tensorflow',
    ]
    for library in required_libraries:
        try:
            __import__(library)
            print(f'{library} já está instalada.')
        except ImportError:
            print(f'{library} não encontrada. Instalando...')
            install(library)
            print(f'{library} instalada com sucesso.')

def show_success_message():
    ctypes.windll.user32.MessageBoxW(0, "Todas as bibliotecas foram instaladas com sucesso!", "Instalação Concluída", 0x40 | 0x1)

if __name__ == "__main__":
    run_as_admin()
