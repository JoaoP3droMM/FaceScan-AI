import { voltarPagina, popUpNotification, telaDeLoadOn, telaDeLoadOff } from './globalFunction.js';
import { toggleButton, enviarDados, iniciarCaptura, capturarImagem, enforceNumericInput, fetchFuncionarioInfo, verificaLogin } from './functions.js';

// Voltar à página inicial
document.addEventListener('DOMContentLoaded', () => {
    const btnSair = $('#sair');
    if (btnSair) {
        btnSair.on('click', voltarPagina);
    }

    // Iniciar captura ao clicar no botão
    $('#start-capture').on('click', function(event) {
        event.preventDefault();
        const matricula = $('#matricula').val().trim();
        if (matricula) {
            iniciarCaptura();
        } else {
            popUpNotification('Por favor, insira a matrícula para continuar.');
        }
    });
    
    // Capturar imagem ao clicar no botão
    $('#photo-button').on('click', function() {
        capturarImagem();
    });

    // Impede entrada não numérica em Matrícula e CPF
    const matriculaInput = document.getElementById('matricula');
    const cpfInput = document.getElementById('cpf');

    matriculaInput.addEventListener('keypress', enforceNumericInput);
    cpfInput.addEventListener('keypress', enforceNumericInput);
    
    // Enviar dados do funcionário ao clicar no botão
    $('#registration-form').on('submit', function(event) {
        event.preventDefault();
        enviarDados();
    });

    // Verifica as informações do funcionário
    $('#matricula').on('change', fetchFuncionarioInfo);
});