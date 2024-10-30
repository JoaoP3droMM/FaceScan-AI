const express = require("express")
const cors = require("cors")
const connectDB = require("../db")
const { FuncionarioModel, UserModel } = require("../models")

const app = express()
const port = 3000

// Middleware
app.use(cors())
app.use(express.json())

connectDB()

// Rota GET para buscar todos os usuários
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await UserModel.find({})
    res.json(usuarios)
  } catch (err) {
    res.status(500).send({ success: false, message: "Erro ao consultar a coleção usuarios" })
  }
})

// Rota POST para verificar login
app.post("/verificarLogin", async (req, res) => {
  const { username, password } = req.body
  try {
    const usuario = await UserModel.findOne({ userName: username, password })
    if (usuario) {
      res.json({ success: true, autenticado: true })
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" })
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao verificar as credenciais" })
  }
})

// Rota para buscar funcionário por matrícula
app.get("/buscarFuncionario/:matricula", async (req, res) => {
  const { matricula } = req.params
  try {
    const funcionario = await FuncionarioModel.findOne({ matricula: String(matricula) })
    if (!funcionario) {
      return res.status(404).json({ success: false, message: "Funcionário não encontrado" })
    }
    res.json({ success: true, funcionario })
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao buscar o funcionário" })
  }
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})