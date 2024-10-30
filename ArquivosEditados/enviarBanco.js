const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("../db");
const { FuncionarioModel, PontosBatidosModel, UserModel } = require("../models")
const axios = require('axios')

const app = express();
const port = 3002;

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

connectDB()

// Função para buscar os registros onde sync = false
async function buscarFuncionariosNaoSincronizados() {
  try {
    // Buscando no banco de dados por documentos onde sync é false
    const resultados = await PontosBatidosModel.find({ sync: false }, 'idfuncionario timeunix')
    console.log(resultados)
    return resultados;
  } catch (err) {
    console.error('Erro ao buscar funcionários não sincronizados:', err);
    throw err;
  }
}

async function processarDados() {
  try {
      // 1. Obtenha os dados da função
      const dados = await buscarFuncionariosNaoSincronizados()
  
      // Verificar se 'dados' é um array
      if (!Array.isArray(dados)) {
        throw new Error('Dados não são um array.');
      }

      // 2. Itere sobre os dados e faça a requisição PUT
      for (const item of dados) {
       const id = item.idfuncionario
       const timeunix = item.timeunix
  
       // Realiza a requisição PUT
       try {
          await axios.put(`http://192.168.0.62:3333/cartao/${id}`, { //localiza pelo id e manda apenas o timeunix
           datetime: timeunix
          })
  
          console.log(`PUT realizado com sucesso para o id ${id}`);
  
          // 3. Atualize a coleção pontoBatido
          await PontosBatidosModel.updateOne(
           { idfuncionario: id },
           { $set: { sync: true } }
          );
          console.log(`Campo sync atualizado para o id ${id}`);
  
       } catch (putError) {
          console.error(`Erro ao fazer PUT para o id ${id}:`, putError);
       }
      }
  } catch (error) {
      console.error('Erro ao obter dados do endpoint:', error);
  }
}

// Agendar a execução da função processarDados a cada 5 minutos (300.000 milissegundos)
setInterval(() => {
  console.log('Verificando registros não sincronizados...');
  processarDados();
}, 300000) // 5 minutos em milissegundos

// Rota POST para cadastrar ponto batido
app.post('/cadastrarPonto', async (req, res) => {
  try {
    const { idfuncionario, nome, matricula, sync = false } = req.body

    if (!idfuncionario || !nome || !matricula) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    const now = new Date();
    const novoPonto = new PontosBatidosModel({
      idfuncionario,
      nome,
      matricula: String(matricula),
      sync,
      timeunix: Math.floor(now.getTime() / 1000),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    });

    await novoPonto.save();
    res.status(201).json({ success: true, message: "Ponto cadastrado com sucesso" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao cadastrar ponto" });
  }
})

// Rota para buscar funcionários não sincronizados
app.get('/buscarNaoSincronizados', async (req, res) => {
  try {
    const naoSincronizados = await buscarFuncionariosNaoSincronizados();
    res.status(200).json({ success: true, data: naoSincronizados });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar registros não sincronizados" });
  }
})

// Rota POST para cadastrar funcionário
app.post('/cadastrarFuncionario', async (req, res) => {
  try {
    const { id, nome, matricula, cpf, filial } = req.body;

    if (!id || !nome || !matricula || !cpf) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    const novoFuncionario = new FuncionarioModel({
      id,
      nome,
      matricula: String(matricula),
      cpf,
      filial
    });

    await novoFuncionario.save();
    res.status(201).json({ success: true, message: "Funcionário cadastrado com sucesso" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao cadastrar funcionário" });
  }
})

// Rota POST para cadastrar usuário
app.post('/cadastrarUsuario', async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    // Lógica para salvar o novo usuário
    const novoUsuario = new UserModel({
      userName,
      password,
    });

    await novoUsuario.save();
    res.status(201).json({ success: true, message: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err); // Adicione essa linha para ver o erro no terminal
    res.status(500).json({ success: false, message: "Erro ao cadastrar usuário" });
  }
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
})