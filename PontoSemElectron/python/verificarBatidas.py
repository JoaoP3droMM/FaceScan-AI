from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)

# Conexão com o MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client.pontoCB
collection = db.pontos

@app.route('/api/verificarPonto', methods=['POST'])
def verificar_ponto():
    # Recebe o horário do corpo da requisição
    dados = request.get_json()
    hora_atual = dados['hora']

    # Converte o horário para o formato adequado para consulta
    hora_formatada = datetime.fromisoformat(hora_atual)

    # Busca no banco de dados por batidas de ponto no mesmo horário
    ponto = collection.find_one({'hora': hora_formatada})

    if ponto:
        # Caso encontre, retorna o nome do funcionário
        return jsonify({
            'pontoRegistrado': True,
            'nome': ponto['nome']
        })
    else:
        return jsonify({
            'pontoRegistrado': False
        })

if __name__ == '__main__':
    app.run(debug=True)