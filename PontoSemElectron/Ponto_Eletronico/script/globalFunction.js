// Funções Globais, que são chamadas e usadas várias vezes ao longo do código

// ****************************************************************************************************
// Função que volta para a página de login
export function voltarPagina() {
    window.location.href = 'ponto.html'
    console.log('voltando')
}

// ****************************************************************************************************
// Alerta de sucesso utilizando SweetAlert2
export function showAlert(mensagem) {
    Swal.fire({
        title: 'Sucesso!',
        text: mensagem,
        icon: 'success',
        confirmButtonText: 'OK'
    })
}

// ****************************************************************************************************
// Alerta de erro utilizando SweetAlert2
export function showErrorAlert(mensagem) {
    Swal.fire({
        title: 'Erro!',
        text: mensagem,
        icon: 'error',
        confirmButtonText: 'OK'
    })
}

// ****************************************************************************************************
// Alerta falso
export function popUpNotification(message) {
    const notificationElement = document.getElementById('notification')
    const textElement = document.getElementById('notificacao-default')

    if (!notificationElement || !textElement) {
        console.error("Elemento 'notification' ou 'notificacao-default' não encontrado no DOM.")
        return // Sai da função se os elementos não existirem
    }

    textElement.textContent = message
    notificationElement.classList.remove('hidden') // Mostra a notificação

    // Adiciona lógica para esconder a notificação após um tempo
    setTimeout(() => {
        notificationElement.classList.add('hidden') // Esconde a notificação
    }, 3000) // Esconde após 3 segundos
}

// ****************************************************************************************************
// Função para mostrar o alerta falso
export function hideNotification() {
    const notificationElement = $('#notification')
    console.log(notificationElement) // Verifique se é null ou undefined
    if (notificationElement) {
        notificationElement.remove()
    } else {
        console.error('Elemento de notificação não encontrado')
    }
}

// ****************************************************************************************************
// // Função global da tela de carregamento para uso através da classe hidden
// export function telaDeLoadOn() {
//     const load = $('#telacarregamento')
//     const container = $('#containerid') // Use o ID correto do seu container de formulário

//     if (load.length) {
//         load.removeClass("hidden") // Remove a classe "hidden" da tela de carregamento
//     } else {
//         console.error("Elemento 'telacarregamento' não encontrado.")
//     }

//     if (container.length) {
//         container.addClass("hidden") // Adiciona a classe "hidden" para ocultar o formulário
//     } else {
//         console.error("Elemento 'container' não encontrado.")
//     }
// }

// export function telaDeLoadOff() {
//     const load = $('#telacarregamento')
//     const container = $('#containerid')

//     if (load.length) {
//         load.addClass("hidden") // Oculta a tela de carregamento
//     } else {
//         console.error("Elemento 'telacarregamento' não encontrado.")
//     }

//     if (container.length) {
//         container.removeClass("hidden") // Mostra o formulário
//     } else {
//         console.error("Elemento 'container' não encontrado.")
//     }

//     // Limpar os campos de input
//     $('#matricula').val('') 
//     $('#cpf').val('')       
//     $('#nomeCompleto').val('') 
//     $('#filial').val('')    
//     $('#idfunc').val('') 
// }