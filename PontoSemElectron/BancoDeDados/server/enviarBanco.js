const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("../db");
const { FuncionarioModel, PontosBatidosModel, UserModel } = require("../models");
const fetch = require('node-fetch'); // Para fazer requisições ao servidor Python

const app = express();
const port = 3002;

// Configuração do CORS
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3002']
}));

// Aumenta o limite de payload para processar imagens base64 grandes
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

connectDB();

// Rota POST para cadastrar funcionário
app.post('/cadastrarFuncionario', async (req, res) => {
  const { id, nome, matricula, cpf, filial, fotoBase64, sync = false } = req.body;

  if (!id || !nome || !matricula || !cpf) {
    return res.status(400).json({ success: false, message: "Dados incompletos" });
  }

  try {
    const novoFuncionario = new FuncionarioModel({
      id,
      nome,
      matricula: String(matricula),
      cpf,
      filial,
      foto: fotoBase64,
      sync
    });

    await novoFuncionario.save();
    res.status(201).json({ success: true, message: "Funcionário cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar funcionário:", err.message);
    res.status(500).json({ success: false, message: "Erro ao cadastrar funcionário", error: err.message });
  }
});

// Rota POST para cadastrar foto em base64
app.post('/cadastrarFoto', async (req, res) => {
  const { idfuncionario, nome, matricula, fotoBase64 } = req.body;

  if (!idfuncionario || !nome || !matricula || !fotoBase64) {
    return res.status(400).json({ success: false, message: "Dados incompletos" });
  }

  try {
    const funcionario = await FuncionarioModel.findOneAndUpdate(
      { matricula: String(matricula) },
      { $set: { foto: fotoBase64 } },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, message: "Foto cadastrada com sucesso", funcionario });
  } catch (err) {
    console.error("Erro ao cadastrar foto:", err.message);
    res.status(500).json({ success: false, message: "Erro ao cadastrar foto", error: err.message });
  }
});

// Rota POST para enviar foto em base64 para o servidor Python
app.post('/enviarFotoParaPython', async (req, res) => {
  const { fotoBase64 } = req.body;

  if (!fotoBase64) {
    return res.status(400).json({ success: false, message: "Imagem em base64 é obrigatória" });
  }

  try {
    // Envia a imagem para a API do Python
    const response = await fetch('http://localhost:5000/cadastro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imagem: fotoBase64 })
    });

    if (!response.ok) {
      throw new Error('Erro na resposta do servidor Python');
    }

    const data = await response.json();
    res.status(200).json({ success: true, message: data.mensagem });
  } catch (err) {
    console.error("Erro ao enviar foto para o servidor Python:", err.message);
    res.status(500).json({ success: false, message: "Erro ao enviar foto", error: err.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});