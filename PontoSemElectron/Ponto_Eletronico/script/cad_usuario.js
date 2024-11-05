// Código responsável pelo cadastro de usuários no sistema

// ****************************************************************************************************
// Import das funções
import { voltarPagina } from './globalFunction.js' // Lida com a função de sair
import { cadastarUsu } from './functions.js' // Função central que executa o cadastro de fato


// ****************************************************************************************************
// Adiciona o evendo ao clicar no botão cadastrar
$('#cadastro-usuarios').on('submit', function(event) {
    event.preventDefault(); // Impede que a página atualize sozinha ao terminal o cadastro
    cadastarUsu() // Chama a função que envia os dados
})

// Voltando para página inicial ao clicar em sair
$('#sair').on('click', voltarPagina)