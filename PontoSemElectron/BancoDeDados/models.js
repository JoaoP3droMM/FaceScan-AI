const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Certifique-se de que 'unique' está definido
  password: { type: String, required: true } // Lembre-se de aplicar hashing na senha antes de salvar
});

const funcionarioSchema = new mongoose.Schema({
  id: Number,
  nome: String,
  matricula: String,
  cpf: Number,
  filial: Number,
  foto: String,
  sync: {type: Boolean, default: false}
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

const UserModel = mongoose.model('User', userSchema);
const FuncionarioModel = mongoose.model("funcionarios", funcionarioSchema)
const PontosBatidosModel = mongoose.model("pontos_batidos", pontosBatidosSchema)

module.exports = {
  UserModel,
  FuncionarioModel,
  PontosBatidosModel,
}

console.log('MODELS.JS RODANDO...')