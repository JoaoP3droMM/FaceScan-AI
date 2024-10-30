// Script da página de login do cadastro de usuários

/* ********************************************************************************** */
// Import das funções
import { voltarPagina, popUpNotification, hideNotification, telaDeLoadOn, telaDeLoadOff, showAlert, showErrorAlert } from './globalFunction.js'
import { usuario, senha, pagina_ponto, verificaLogin } from './functions.js'


/* ********************************************************************************** */
// Quando a página estiver carregada
$(document).ready(function() {
    let telaRedirecionada = '../html/cad_usuario.html'

    $('#login-form').on('submit', function(e) {
        e.preventDefault()
        verificaLogin(e, telaRedirecionada) // Passando a tela redirecionada
    })

    $('#pagina-ponto').on('click', pagina_ponto)
})

/* ********************************************************************************** */
// Adiciona a função de login a página
document.addEventListener('DOMContentLoaded', () => {
    const form = $('#login-form')
    form.on('submit', (e) => {
        e.preventDefault()
        verificaLogin()
    })
})

/* ********************************************************************************** */
// Adicionando função de bater ponto ao botão sair
$('#pagina-ponto').on('click', pagina_ponto)

/* ******************************************************************************** */
// Chama a verificação de login
$('#login-form').on('submit', function(e) {
    e.preventDefault()
    verificaLogin(e)
})