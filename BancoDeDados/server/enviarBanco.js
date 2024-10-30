const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const connectDB = require("../db")
const { FuncionarioModel, PontosBatidosModel, UserModel } = require("../models")

const app = express()
const port = 3002

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

connectDB()

// Rota POST para cadastrar ponto batido
app.post('/cadastrarPonto', async (req, res) => {
  try {
    const { idfuncionario, nome, matricula, sync = false } = req.body

    if (!idfuncionario || !nome || !matricula) {
      return res.status(400).json({ success: false, message: "Dados incompletos" })
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
    })

    await novoPonto.save();
    res.status(201).json({ success: true, message: "Ponto cadastrado com sucesso" })
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err.message, err.stack); // Log completo
    res.status(500).json({ success: false, message: "Erro ao cadastrar usuário", error: err.message })
  }
})

// Rota POST para cadastrar funcionário
app.post('/cadastrarFuncionario', async (req, res) => {
  try {
    const { id, nome, matricula, cpf, filial } = req.body

    if (!id || !nome || !matricula || !cpf) {
      return res.status(400).json({ success: false, message: "Dados incompletos" })
    }

    const novoFuncionario = new FuncionarioModel({
      id,
      nome,
      matricula: String(matricula),
      cpf,
      filial
    })

    await novoFuncionario.save();
    res.status(201).json({ success: true, message: "Funcionário cadastrado com sucesso" })
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao cadastrar funcionário" })
  }
})

// Rota POST para cadastrar usuário
app.post('/cadastrarUsuario', async (req, res) => {
  try {
    const { userName, password } = req.body

    if (!userName || !password) {
      return res.status(400).json({ success: false, message: "Dados incompletos" })
    }

    const novoUsuario = new UserModel({
      userName: userName,
      password: password // Considere hash para a senha em produção
    })

    await novoUsuario.save()
    res.status(201).json({ success: true, message: "Usuário cadastrado com sucesso" })
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err); // Log de erro
    res.status(500).json({ success: false, message: "Erro ao cadastrar usuário" })
  }
})

async function processarDados() {
  try {
      // 1. Obtenha os dados do endpoint
      const response = await axios.get('http://localhost:3000/info') //recebe o id/timeunix
      const dados = response.data
  
      // 2. Itere sobre os dados e faça a requisição PUT
      for (const item of dados) {
       const id = item.idfuncionario
       const timeunix = item.timeunix
  
       // Realiza a requisição PUT
       try {
          await axios.put(`http://localhost:3333/cartao/${id}`, { //localiza pelo id e manda apenas o timeunix
           datetime: timeunix
          })
  
          console.log(`PUT realizado com sucesso para o id ${id}`)
  
          // 3. Atualize a coleção pontoBatido
          await PontoBatido.updateOne(
           { idfuncionario: id },
           { $set: { sync: true } }
          )
          console.log(`Campo sync atualizado para o id ${id}`)
  
       } catch (putError) {
          console.error(`Erro ao fazer PUT para o id ${id}:`, putError)
       }
      }
  } catch (error) {
      console.error('Erro ao obter dados do endpoint:', error)
  }
}

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})