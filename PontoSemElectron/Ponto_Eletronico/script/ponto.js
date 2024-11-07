// Script principal que gerencia as funções da página de ponto e controla as interações com o usuaŕio

// Importando os módulos globais e internos
import {
    iniciarReconhecimentoAutomatico,
    mostrarConfiguracoes,
    capturarImagemPonto
} from './functions.js';

$(document).ready(() => {
    // Botão para iniciar o reconhecimento e ativar a câmera
    $('#btnIniciarCamera').on('click', (event) => {
        event.preventDefault()
        iniciarReconhecimentoAutomatico()
    })

    // Botão para capturar a imagem (agora o evento é passado para a função)
    $('#btnCapturarImagem').on('click', (event) => {
        event.preventDefault()
        capturarImagemPonto(event)
    })

    // Adiciona funcionalidade ao botão de configurações
    $('#btnConfig').on('click', mostrarConfiguracoes);

})