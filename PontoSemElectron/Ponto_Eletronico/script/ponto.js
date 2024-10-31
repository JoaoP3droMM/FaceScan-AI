// Importando os módulos globais e internos
import {
    voltarPagina,
    popUpNotification,
    hideNotification,
    telaDeLoadOn,
    telaDeLoadOff,
    showAlert,
    showErrorAlert,
} from './globalFunction.js';
import {
    iniciarReconhecimentoAutomatico,
    buscarFuncionarioPorMatricula,
    telaDeResposta,
    enviarPontoParaBanco,
    mostrarConfiguracoes,
    capturarImagemPonto,
    erroDeFacial,
    erroNoCadastrado,
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

    // Verifica se a API de reconhecimento facial está disponível
    if (window.electronAPI && typeof window.electronAPI.onRecognitionComplete === 'function') {
        // Lida com o evento de reconhecimento facial completo
        window.electronAPI.onRecognitionComplete((result) => {
            if (result && result.nome && result.distancia) {
                const matricula = result.nome; // Usa o 'nome' retornado como a matrícula

                console.log("Resultado do reconhecimento facial:", result);

                popUpNotification('Face reconhecida com sucesso!'); // Notificação de sucesso
                buscarFuncionarioPorMatricula(matricula) // Chama a função para buscar os dados do funcionário
                    .then(funcionario => {
                        const horaDaBatida = new Date().toISOString(); // Captura a hora atual
                        enviarPontoParaBanco(funcionario, horaDaBatida); // Envia os dados para o banco
                    })
                    .catch(error => {
                        showErrorAlert("Erro ao buscar dados do funcionário: " + error);
                    });
            } else {
                erroDeFacial(); // Chama a função para exibir erro
            }
        });
    }
})