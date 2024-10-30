// Importando os módulos globais e internos
import { voltarPagina, popUpNotification, hideNotification, telaDeLoadOn, telaDeLoadOff, showAlert, showErrorAlert } from './globalFunction.js'
import { iniciarReconhecimentoAutomatico, buscarFuncionarioPorMatricula, telaDeResposta, enviarPontoParaBanco, mostrarConfiguracoes, erroDeFacial, erroNoCadastrado } from './functions.js'
  
$(document).ready(() => {
    iniciarReconhecimentoAutomatico() // Inicia o reconhecimento facial automaticamente

    // Impede que a página seja atualizada ao submeter o formulário
    $('form').on('submit', (event) => {
      event.preventDefault()
    })

    // Adiciona funcionalidade ao botão de configurações
    $('#btnConfig').on('click', mostrarConfiguracoes)

    // Lida com o evento de reconhecimento facial completo
    window.electronAPI.onRecognitionComplete((result) => {
        if (result && result.nome && result.distancia) {
            const matricula = result.nome // Usa o 'nome' retornado como a matrícula
    
            console.log("Resultado do reconhecimento facial:", result)
    
            popUpNotification('Face reconhecida com sucesso!')

            buscarFuncionarioPorMatricula(matricula)
                .then((response) => {
                    // Aqui você pode lidar com os dados do funcionário encontrado
                    if (response.success && response.funcionario) {
                        const funcionario = response.funcionario
                        const nome = funcionario.nome
                        const cpf = funcionario.cpf
                        const matricula = funcionario.matricula
                        // Chame a função de resposta com os dados do funcionário
                        console.log('Dados pegos do funcionário: ' + nome, cpf, matricula)

                        const horaDaBatida = new Date().toISOString()


                        console.log('Enviando ponto para o banco...')
                        enviarPontoParaBanco(funcionario, horaDaBatida)
                        console.log('Ponto enviado para o banco!!')
                    } else {
                        console.log('Funcionário não encontrado')
                    }
                })
                .catch((error) => {
                    console.error("Erro ao buscar funcionário:", error)
                })
        }
    })    
})