// Código responsável pelo cadastro de usuários do sistema

/* ********************************************************************************** */
// Import das funções

// Funções Globais
import { voltarPagina, popUpNotification, hideNotification, telaDeLoadOn, telaDeLoadOff, showAlert, showErrorAlert } from './globalFunction.js'
import { cadastrarUsuario } from './functions.js'


/* ********************************************************************************** */
// Adiciona o evendo ao clicar no botão cadastrar
$('#registration-form').on('submit', cadastrarUsuario)

// Voltando para página inicial ao clicar em sair
document.addEventListener('DOMContentLoaded', () => {
    const btnSair = $('#sair')
    if (btnSair) {
        btnSair.on('click', voltarPagina)
    }
})