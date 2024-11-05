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

// Rota POST para cadastrar usuário
app.post('/cadastrarUsuario', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username e senha são obrigatórios" });
  }

  try {
      // Verifica se o usuário já existe
      const usuarioExistente = await UserModel.findOne({ username });

      if (usuarioExistente) {
          return res.status(400).json({ success: false, message: "O usuário já existe" });
      }

      // Aqui você pode usar bcrypt para hash da senha antes de salvar
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const novoUsuario = new UserModel({
          username,
          password: hashedPassword,
      });

      await novoUsuario.save();
      res.status(201).json({ success: true, message: "Usuário cadastrado com sucesso" });
  } catch (err) {
      console.error("Erro ao cadastrar usuário:", err.message);
      res.status(500).json({ success: false, message: "Erro ao cadastrar usuário", error: err.message });
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