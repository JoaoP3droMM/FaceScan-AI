// Tela de cadastro de funcionários
import { voltarPagina, popUpNotification, telaDeLoadOn, telaDeLoadOff } from './globalFunctions.js';
import { enableButton, disbleButton, enviarDados, executarScriptPython, enforceNumericInput, fetchFuncionarioInfo, verificaLogin } from './functions.js';

// Voltar à página inicial
document.addEventListener('DOMContentLoaded', () => {
    const btnSair = $('#sair');
    if (btnSair) {
        btnSair.on('click', voltarPagina);
    }
});

// Fluxo de cadastro completo acionado pelo botão "Cadastrar"
$('#start-capture').on('click', function(event) {
    event.preventDefault();
    const matricula = $('#matricula').val().trim();
    if (matricula) {
        executarScriptPython();
        enviarDados();
    } else {
        popUpNotification('A matrícula é obrigatória para o cadastro!');
    }
});

// Adicionar eventListeners para entrada numérica
$('#matricula').on('keypress', enforceNumericInput);

// Verificação de login
$('#login-form').on('submit', verificaLogin);

// Buscar informações do funcionário ao preencher o campo matrícula
let campoExecutado = false;
$('#matricula').on('keydown', function(event) {
    if (!campoExecutado && event.key === 'Enter') {
        event.preventDefault();
        campoExecutado = true;
        fetchFuncionarioInfo();
    }
});
$('#matricula').on('blur', function() {
    if (!campoExecutado) {
        campoExecutado = true;
        fetchFuncionarioInfo();
    }
});
$('#matricula').on('focus', function() {
    campoExecutado = false;
});