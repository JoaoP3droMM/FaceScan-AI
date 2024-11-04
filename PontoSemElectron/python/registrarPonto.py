import datetime
import time
import requests
from pymongo import MongoClient

def registrar_ponto(codigo_funcionario):
    # Conectar ao banco de dados MongoDB
    client = MongoClient('mongodb://localhost:27017')
    db = client['pontoCB']
    collection = db['pontos_batidos']
    
    # Obter a data e hora atual e formatar como string
    agora = datetime.datetime.now()
    timestamp_formatado = agora.strftime("%H:%M - %d/%m/%Y")  # Formato HH:MM - DD/MM/AAAA
    time_unix = int(time.mktime(agora.timetuple()))
    
    # Estrutura de dados do ponto batido
    ponto_batido = {
        "codigo_funcionario": codigo_funcionario,
        "timestamp": timestamp_formatado,  # Data e hora como string formatada
        "timenuix": time_unix,             # Data e hora em formato Unix
        "sync": False                      # Campo de sincronização inicializado como False
    }
    
    # Inserir o ponto no banco de dados
    try:
        collection.insert_one(ponto_batido)
        print(f"Ponto registrado com sucesso para o funcionário {codigo_funcionario}")
    except Exception as e:
        print(f"Erro ao registrar ponto: {e}")
    finally:
        client.close()

def sincronizar_pontos():
    # Conectar ao banco de dados MongoDB
    client = MongoClient('mongodb://localhost:27017')
    db = client['pontoCB']
    collection = db['pontos_batidos']
    
    # URL da API para sincronizar os pontos
    api_url = "http://192.168.0.29:7000/abobrinha123"
    
    # Buscar registros de ponto com sync = False
    pontos_nao_sincronizados = list(collection.find({"sync": False}))

    for ponto in pontos_nao_sincronizados:
        # Preparar os dados a serem enviados para a API
        dados = {
            "codigo_funcionario": ponto["codigo_funcionario"],
            "timenuix": ponto["timenuix"]
        }

        # Tentar enviar para a API
        try:
            response = requests.post(api_url, json=dados)
            
            if response.status_code == 200:
                # Atualizar o campo sync para True no MongoDB
                collection.update_one(
                    {"_id": ponto["_id"]},
                    {"$set": {"sync": True}}
                )
                print(f"Ponto sincronizado com sucesso para o funcionário {ponto['codigo_funcionario']}")
            else:
                print(f"Erro ao sincronizar ponto para o funcionário {ponto['codigo_funcionario']}: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Erro ao enviar ponto para a API: {e}")
    
    # Fechar a conexão com o banco de dados
    client.close()