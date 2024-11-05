// Lógica que controla o formulário de login

/* ********************************************************************************** */
// Import das funções
import { pagina_ponto, verificaLogin } from './functions.js'


/* ********************************************************************************** */
// Manipulação de eventos
$(document).ready(function() {
    let telaRedirecionada = '../html/cad_func.html' // Aqui é para tornar mais fácil, eu
                                                    // copiei e colei este código no login
                                                    // de usuarios e só troco o valor dessa
                                                    // variavel. Stonks 🤑🤑🤑🤑🤑🤑🤑

    $('#login-form').on('submit', function(e) {
        e.preventDefault()
        verificaLogin(e, telaRedirecionada) // Redireciona para a url armazenada na variavel
    })

    $('#pagina-ponto').on('click', pagina_ponto) // Quando o usuário clica em voltar, ele 
                                                 // retorna ao ponto
})