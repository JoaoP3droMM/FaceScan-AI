import os
import json
import base64
import subprocess
import numpy as np
import cv2
import sys
import pickle
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

from . import reconhecimento_logic

def index(request):
    return render(request, 'core/index.html')

@csrf_exempt
@require_http_methods(['POST'])
def run_treinamento(request):
    try:
        script_path = os.path.join(settings.BASE_DIR, 'core', 'treinamento.py')
        
        result = subprocess.run(
            [sys.executable, script_path], 
            capture_output=True,
            text=True,
            timeout=300,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            try:
                with open(reconhecimento_logic.DATA_PATH, 'rb') as myfile:
                    reconhecimento_logic.database = pickle.load(myfile)
                print('Banco de dados recarregado após treinamento.')
            except Exception as e:
                print(f'Erro ao recarregar DB: {e}')

            return JsonResponse({'status': 'ok', 'output': result.stdout})
        else:
            return JsonResponse({'status': 'error', 'error': result.stderr}, status=500)

    except Exception as e:
        return JsonResponse({'status': 'error', 'error': str(e)}, status=500)
    
@csrf_exempt
@require_http_methods(['POST'])
def salvar_foto(request):
    try:
        data = json.loads(request.body)
        matricula = data['matricula']
        image_data = data['image_data']

        if not matricula:
            return JsonResponse({'error': 'Matrícula não fornecida.'}, status=400)

        format, imgstr = image_data.split(';base64,') 
        ext = format.split('/')[-1]
        image_bytes = base64.b64decode(imgstr)
        
        fotos_dir = os.path.join(settings.BASE_DIR, 'fotos')
        os.makedirs(fotos_dir, exist_ok=True) 
        
        filename = f'{matricula}.jpg' 
        filepath = os.path.join(fotos_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        return JsonResponse({'message': f'Foto salva com sucesso como {filename}'})
    
    except Exception as e:
        return JsonResponse({'error': f'Erro ao salvar imagem: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(['POST'])
def reconhecer_foto(request):
    try:
        data = json.loads(request.body)
        image_data = data['image_data']
        imgstr = image_data.split(';base64,')[1]
        image_bytes = base64.b64decode(imgstr)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR) 
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        result = reconhecimento_logic.recognize_face(img_rgb)

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'nome': None, 'distancia': None, 'error': str(e)}, status=500)