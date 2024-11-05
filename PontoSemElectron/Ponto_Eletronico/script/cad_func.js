/* Tela que tira a foto do funcionário, e a cadastra no banco de dados, treinando a IA e permitindo
     o reconhecimento facial de forma adequada */

// ****************************************************************************************************
// Import das funções
import { voltarPagina } from './globalFunction.js';
import { enviarFotoCadastro, abrirCamera, tirarFotoFunc, enforceNumericInput, 
        fetchFuncionarioInfo } from './functions.js';
import { matriculaInput, btnSairCF, btnCadastrar, btnFoto, formularioCadFunc } from './variables.js'

// ****************************************************************************************************
// Voltando para página inicial ao clicar em sair
btnSairCF.on('click', voltarPagina)

// ****************************************************************************************************
// Iniciar captura ao clicar no 'cadastrar'
btnCadastrar.on('click', function(event) {
    event.preventDefault() // Impede que a página atualize sozinha ao enviar o formulário
    abrirCamera() // Chama a função que abre a câmera
})

// ****************************************************************************************************
// Capturar imagem ao clicar no botão branco
btnFoto.on('click', function(event) {
    event.preventDefault()
    tirarFotoFunc() // Chama a função que captura a imagem da câmera
})

// ****************************************************************************************************
// Impede entrada não numérica no input de Matrícula (digitar letras e caracteres especiais)
matriculaInput.on('keypress', enforceNumericInput)
    
// ****************************************************************************************************
// Enviar dados do funcionário ao clicar no botão
formularioCadFunc.on('submit', function(event) {
    event.preventDefault() // Impede a atualização da página ao enviar o formulário
    enviarFotoCadastro() // Chama a função que envia os dados do funcionário e a foto em base64
})

// ****************************************************************************************************
// Se o usuário mudar a matrícula ele busca as novas informações correspondentes ao funcionário
matriculaInput.on('change', fetchFuncionarioInfo)