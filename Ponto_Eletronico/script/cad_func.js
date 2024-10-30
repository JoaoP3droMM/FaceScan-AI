// Tela de cadastro de funcionários (Se Deus quiser não vou mais mexer aqui!!! Ó GLORIA)

/****************************************************************************** */
// Funções Globais
import { voltarPagina, popUpNotification, hideNotification, telaDeLoadOn, telaDeLoadOff, showAlert, showErrorAlert } from './globalFunction.js'

// Funções do cadastro de funcionários
import { enableButton, disbleButton, enviarDados, executarScriptPython, enforceNumericInput, fetchFuncionarioInfo, buttonCadastro, verificaLogin} from './functions.js'

/* ******************************************************************************** */
// Voltando para página inicial ao clicar em sair
document.addEventListener('DOMContentLoaded', () => {
    const btnSair = $('#sair')
    if (btnSair) {
        btnSair.on('click', voltarPagina)
    }
})

/* ******************************************************************************** */

// Fluxo de cadastro completo acionado pelo botão “Cadastrar”
$('#start-capture').on('click', function(event) {
    event.preventDefault()

    const matricula = $('#matricula').val().trim()
    if (matricula) {
        executarScriptPython()
        enviarDados()
    } else {
        popUpNotification('A matrícula é obrigatória para o cadastro!')
    }
})

/* ******************************************************************************** */

// Adicione eventListeners para impor a entrada numérica
$('#matricula').on('keypress', enforceNumericInput)


/* ******************************************************************************** */
// Chama a verificação de login
$('#login-form').on('submit', verificaLogin)

/* ******************************************************************************** */

// Adiciona o evento para buscar as informações dos usuários
let campoExecutado = false

$('#matricula').on('keydown', function(event) {
    if (!campoExecutado && event.key === 'Enter') {
        event.preventDefault()
        campoExecutado = true
        fetchFuncionarioInfo()
    }
})

$('#matricula').on('blur', function() {
    if (!campoExecutado) {
        campoExecutado = true
        fetchFuncionarioInfo()
    }
})

$('#matricula').on('focus', function() {
    campoExecutado = false
})