const mongoose = require("mongoose")    

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/pontoCB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("Conectado ao MongoDB")
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB", err)
    process.exit(1)
  }
}

console.log('DB.JS RODANDO....')

module.exports = connectDB