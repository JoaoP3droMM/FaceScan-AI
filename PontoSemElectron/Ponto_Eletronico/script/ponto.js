// Importando os módulos globais e internos
import {
    iniciarReconhecimentoAutomatico,
    mostrarConfiguracoes,
    capturarImagemPonto,
} from './functions.js';

$(document).ready(() => {
    // Botão para iniciar o reconhecimento e ativar a câmera
    $('#btnIniciarCamera').on('click', iniciarReconhecimentoAutomatico);

    // Botão para capturar a imagem (agora o evento é passado para a função)
    $('#btnCapturarImagem').on('click', (event) => {
        event.preventDefault(); // Evita qualquer atualização da página
        capturarImagemPonto(event); // Passa o evento para a função
    });

    // Adiciona funcionalidade ao botão de configurações
    $('#btnConfig').on('click', mostrarConfiguracoes);
});