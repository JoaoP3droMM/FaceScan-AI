const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
})

const funcionarioSchema = new mongoose.Schema({
  id: Number,
  nome: String,
  matricula: String,
  cpf: Number,
  filial: Number,
})

const pontosBatidosSchema = new mongoose.Schema({
  idfuncionario: Number,
  nome: String,
  matricula: String,
  sync: Boolean,
  timeunix: Number,
  date: String,
  time: String,
})

const UserModel = mongoose.model("usuarios", userSchema)
const FuncionarioModel = mongoose.model("funcionarios", funcionarioSchema)
const PontosBatidosModel = mongoose.model("pontos_batidos", pontosBatidosSchema)

module.exports = {
  UserModel,
  FuncionarioModel,
  PontosBatidosModel,
}

console.log('MODELS.JS RODANDO...')