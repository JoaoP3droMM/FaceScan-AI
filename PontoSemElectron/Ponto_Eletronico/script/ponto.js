// Importando os módulos globais e internos
import {
    iniciarReconhecimentoAutomatico,
    mostrarConfiguracoes,
    capturarImagemPonto,
} from './functions.js';

$(document).ready(() => {
    // Adiciona evento para o botão de "Bater Ponto"
    $('.btnPonto').on('click', iniciarReconhecimentoAutomatico);

    // Impede que a página seja atualizada ao submeter o formulário
    $('form').on('submit', (event) => {
        event.preventDefault(); // Evita a atualização da página
    });

    // Adiciona funcionalidade ao botão de configurações
    $('#btnConfig').on('click', mostrarConfiguracoes);

    $('#photo-button').on('click', function() {
        capturarImagemPonto(); // Chama a função para capturar a imagem
    });
})