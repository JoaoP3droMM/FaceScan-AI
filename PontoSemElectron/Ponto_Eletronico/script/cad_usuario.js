// Código responsável pelo cadastro de usuários do sistema

/* ********************************************************************************** */
// Import das funções

// Funções Globais
import { voltarPagina } from './globalFunction.js'
import { cadastrarUsuario, enviarDados } from './functions.js'


/* ********************************************************************************** */
// Adiciona o evendo ao clicar no botão cadastrar
$('#registration-form').on('submit', function(event) {
    event.preventDefault(); // Impede o envio do formulário
    enviarDados(); // Chama a função que envia os dados
});

// Voltando para página inicial ao clicar em sair
document.addEventListener('DOMContentLoaded', () => {
    const btnSair = $('#sair')
    if (btnSair) {
        btnSair.on('click', voltarPagina)
    }
})