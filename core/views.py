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
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import Usuario
from . import reconhecimento_logic

def index(request):
    return render(request, 'core/index.html')

def dashboard(request):
    return render(request, 'core/dashboard/dashboard.html')

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
        nome = data.get('nome')
        image_data = data['image_data']

        if not matricula or not image_data or not nome:
            return JsonResponse({'error': 'Matrícula, Nome ou Imagem faltando.'}, status=400)

        format, imgstr = image_data.split(';base64,') 
        ext = format.split('/')[-1]
        image_bytes = base64.b64decode(imgstr)
        
        fotos_dir = os.path.join(settings.BASE_DIR, 'fotos')
        os.makedirs(fotos_dir, exist_ok=True) 
        
        filename = f'{matricula}.jpg' 
        filepath = os.path.join(fotos_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        usuario, created = Usuario.objects.update_or_create(
            matricula=matricula,
            defaults={
                'nome': nome,            # <--- Salvando o nome no banco
                'caminho_foto': filename # Salvando referência do arquivo
            }
        )

        acao = "criado" if created else "atualizado"
        return JsonResponse({'message': f'Usuário {acao} com sucesso!', 'file': filename})
    
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
        identificador = result.get('nome')
        if identificador and identificador != "Desconhecido":
            try:
                usuario = Usuario.objects.get(matricula=identificador)
                usuario.ultimo_reconhecimento = timezone.now()
                usuario.save()
                result['nome'] = usuario.nome 
            except Usuario.DoesNotExist:
                pass 
        return JsonResponse(result)
    except Exception as e:
        print(f"Erro no reconhecimento: {e}")
        return JsonResponse({'nome': None, 'distancia': None, 'error': str(e)}, status=500)
    
@require_http_methods(['GET']) 
def lista_usuarios(request):
    try:
        usuarios = Usuario.objects.all().order_by('-data_registro')
        lista = []
        for u in usuarios:
            if u.data_registro:
                data_reg_br = u.data_registro - timedelta(hours=3)
                data_reg_str = data_reg_br.strftime('%d/%m/%Y')
            else:
                data_reg_str = '-'
            if u.ultimo_reconhecimento:
                ult_rec_br = u.ultimo_reconhecimento - timedelta(hours=3)
                ult_rec_str = ult_rec_br.strftime('%d/%m/%Y %H:%M')
            else:
                ult_rec_str = '-'
            lista.append({
                'nome': u.nome,
                'matricula': u.matricula,
                'data_registro': data_reg_str,
                'ultimo_reconhecimento': ult_rec_str
            })
        return JsonResponse(lista, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@require_http_methods(["GET"])
def buscar_usuario_api(request):
    matricula = request.GET.get('matricula')
    if not matricula:
        return JsonResponse({'error': 'Matrícula não fornecida.'}, status=400)
    try:
        usuario = Usuario.objects.get(matricula=matricula)
        data_formatada = "-"
        if usuario.data_registro:
            data_reg_br = usuario.data_registro - timedelta(hours=3)
            data_formatada = data_reg_br.strftime('%d/%m/%Y às %H:%M')
        else:
            data_formatada = '-'
        data = {
            'matricula': usuario.matricula,
            'nome': usuario.nome,
            'data_registro_formatada': data_formatada
        }
        return JsonResponse(data)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': f'Usuário com matrícula "{matricula}" não encontrado.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Deletar Usuário
@csrf_exempt 
@require_http_methods(["DELETE", "POST"]) 
def deletar_usuario_api(request):
    try:
        data = json.loads(request.body)
        matricula = data.get('matricula')
        if not matricula:
            return JsonResponse({'error': 'Matrícula inválida para deleção.'}, status=400)
        usuario = get_object_or_404(Usuario, matricula=matricula)
        if usuario.caminho_foto and os.path.exists(usuario.caminho_foto):
            os.remove(usuario.caminho_foto)
        usuario.delete()
        return JsonResponse({'message': 'Usuário deletado com sucesso.', 'status': 'ok'})
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuário já foi deletado ou não existe.'}, status=404)
    except Exception as e:
        print(f"Erro ao deletar: {e}")
        return JsonResponse({'error': 'Erro interno ao tentar deletar.'}, status=500)
    
# Atualizar usuário
@csrf_exempt
@require_http_methods(["POST"])
def atualizar_usuario_api(request):
    try:
        data = json.loads(request.body)
        matricula = data.get('matricula')
        novo_nome = data.get('novo_nome')
        if not matricula or not novo_nome:
            return JsonResponse({'error': 'Dados incompletos.'}, status=400)
        usuario = get_object_or_404(Usuario, matricula=matricula)
        usuario.nome = novo_nome
        usuario.save()

        return JsonResponse({'message': 'Atualizado com sucesso!', 'status': 'ok'})
    except Exception as e:
        print(f"Erro ao atualizar: {e}")
        return JsonResponse({'error': 'Erro interno ao atualizar.'}, status=500)
    