const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("../db");
const { FuncionarioModel, PontosBatidosModel, UserModel } = require("../models");

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Ajuste para receber imagens grandes em base64
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

// Rota POST para cadastrar ponto batido
app.post('/cadastrarPonto', async (req, res) => {
  try {
    const { idfuncionario, nome, matricula, sync = false } = req.body;

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
    console.error("Erro ao cadastrar ponto:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Erro ao cadastrar ponto", error: err.message });
  }
});

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
});

// Rota POST para cadastrar usuário
app.post('/cadastrarUsuario', async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    const novoUsuario = new UserModel({
      userName: userName,
      password: password // Considere hash para a senha em produção
    });

    await novoUsuario.save();
    res.status(201).json({ success: true, message: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    res.status(500).json({ success: false, message: "Erro ao cadastrar usuário" });
  }
});

// Nova Rota POST para cadastrar foto em base64
app.post('/cadastrarFoto', async (req, res) => {
  try {
    const { idfuncionario, nome, matricula, fotoBase64 } = req.body;

    if (!idfuncionario || !nome || !matricula || !fotoBase64) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    const funcionario = await FuncionarioModel.findOneAndUpdate(
      { matricula: String(matricula) },
      { $set: { foto: fotoBase64 } },  // campo 'foto' para armazenar a imagem base64
      { new: true, upsert: true } // Cria um novo registro caso o funcionário não exista
    );

    res.status(201).json({ success: true, message: "Foto cadastrada com sucesso", funcionario });
  } catch (err) {
    console.error("Erro ao cadastrar foto:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Erro ao cadastrar foto", error: err.message });
  }
});

// Processar dados e atualizar status de sincronização
async function processarDados() {
  try {
    const response = await axios.get('http://localhost:3000/info');
    const dados = response.data;

    for (const item of dados) {
      const id = item.idfuncionario;
      const timeunix = item.timeunix;

      try {
        await axios.put(`http://localhost:3333/cartao/${id}`, {
          datetime: timeunix
        });

        console.log(`PUT realizado com sucesso para o id ${id}`);

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

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});