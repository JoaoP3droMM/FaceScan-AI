// Importando as funções globais e variaveis
import { voltarPagina, popUpNotification, hideNotification, telaDeLoadOn, telaDeLoadOff, showAlert, showErrorAlert } from './globalFunction.js'
import { containerid, retorno, barra, icone } from './variables.js'

// **************************************(((CADASTRO DE FUNCIONARIOS)))*************************************************************************


// função que habilita botão ao encontrar funcionário
export const buttonCadastro = $('#start-capture')
export function enableButton() {
    $('#start-capture').prop('disabled', false)
}
export function disbleButton() {
    $('#start-capture').prop('disabled', true)
}

// Função que envia os dados cadastrais para o MongoDB
export function enviarDados(callback) {
    const nome = $('#nomeCompleto').val().trim()
    const matricula = $('#matricula').val().trim()
    const cpf = $('#cpf').val().trim()
    const id = $('#idfunc').val().trim()
    const filial = $('#filial').val().trim()
    
    console.log('ID do Funcionario enviado:', id)
    
    if (nome && matricula && cpf) {
        const dadosFuncionario = {
            id: id,             
            nome: nome,        
            matricula: matricula,
            cpf: cpf,
            filial: filial
        }

        console.log('Enviando dados do funcionário:', dadosFuncionario)

        fetch('http://localhost:3002/cadastrarFuncionario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosFuncionario) // Enviando o objeto com as chaves corretas
        })
        .then(response => {
            console.log('Resposta da API:', response)
            return response.json()
        })
        .then(data => {
            if (data.success) {
                popUpNotification('Funcionário cadastrado com sucesso')
                if (callback) callback() // Chama o callback para executar o script Python
            } else {
                popUpNotification('Erro ao cadastrar funcionário.')
            }
        })
        .catch(error => {
            console.error('Error:', error)
            popUpNotification('Erro ao registrar funcionário')
        })
    } else {
        popUpNotification('Por favor, preencha todos os campos!')
    }
}

// Função que roda o script Python
export function executarScriptPython() {
    const matricula = $('#matricula').val().trim() // Captura o valor do campo matrícula
    if (matricula) {
        console.log('Executando captura e treinamento...')
        window.electronAPI.startCaptureAndTraining(matricula)
        telaDeLoadOn() // Inicia tela de carregamento
        $('#containerid').addClass('hidden') // Usa jQuery para adicionar a classe 'hidden'

        // Timer para ocultar a tela de carregamento após 25 segundos
        setTimeout(() => {
            telaDeLoadOff() // Oculta a tela de carregamento após o término do script Python
        }, 25000)
    } else {
        console.error('Matrícula não fornecida.')
        setTimeout(() => {
            telaDeLoadOff() // Oculta a tela de carregamento se a matrícula não for fornecida
        }, 25000)
    }
}

// Função para garantir apenas entrada numérica para campos Matrícula e CPF
export function enforceNumericInput(event) {
    const key = event.key
    if (!/[0-9]/.test(key)) {
        event.preventDefault()
    }
}

// Função para buscar informações de funcionários na API
export async function fetchFuncionarioInfo() {
    const matricula = $('#matricula').val().trim()
    const cpf = $('#cpf').val().trim()
    const queryParam = matricula

    if (!queryParam) return

    try {
        const response = await fetch(`https://casabrasileiraprod.coachingtech.com.br/funcionarios/matricula/${matricula}`)
        const funcionario = await response.json()
        
        if (funcionario && Object.keys(funcionario).length > 0) {
            $('#nomeCompleto').val(funcionario.nome || '')
            $('#filial').val(funcionario.codfil || '')
            $('#cpf').val(funcionario.cpf || '')
            $('#matricula').val(funcionario.matricula || '')
            $('#idfunc').val(funcionario.id || '')

            popUpNotification('Funcionário encontrado')
            
            enableButton()
        } else {
            popUpNotification('Funcionário não encontrado')
        }
    } catch (error) {
        console.error('Erro ao buscar informações do usuário: ', error)
        popUpNotification('Erro ao buscar informações do usuário')
    }
}





// **************************************(((PONTO)))*************************************************************************


// Função para iniciar o reconhecimento facial automaticamente ao carregar a página
export function iniciarReconhecimentoAutomatico() {
    window.electronAPI.startRecognition()
    popUpNotification('Iniciando reconhecimento facial...')
    telaDeLoadOn()
    
    const container = $('#container').get(0)
    if (container) {
        container.classList.add('hidden')
    } else {
        console.error("Elemento com id 'container' não encontrado.")
    }
}

// Função para buscar funcionário pela matricula
export function buscarFuncionarioPorMatricula(matricula) {
    console.log("Iniciando busca do funcionário com a matrícula:", matricula) // Log da matrícula buscada
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `http://localhost:3000/buscarFuncionario/${matricula}`, 
            type: 'GET',
            success: function(response) {
                console.log("Requisição bem-sucedida. Funcionário encontrado:", response) // Log da resposta da API
                resolve(response) // Retorna os dados do funcionário
            },
            error: function(xhr, status, error) {
                console.error("Erro ao buscar funcionário. Status:", status, "Erro:", error) // Log do erro
                reject(error)
            }
        })
    })
}

// Função para mostrar a tela de resposta com os dados do funcionário
export function telaDeResposta(nome, cpf) {
    // Usando métodos jQuery para manipular classes
    retorno.removeClass("hidden")
    containerid.addClass("hidden")
    barra.addClass("changebar-ativo")
    
    // Atribuindo o nome e CPF aos elementos HTML da tela de retorno
    document.getElementById("nomeFuncionario").innerText = nome || "Nome não encontrado"
    document.getElementById("cpfFuncionario").innerText = cpf || "CPF não encontrado"

    setTimeout(function() {
        barra.removeClass("changebar-ativo")
        retorno.addClass("hidden")
        containerid.removeClass("hidden")
        location.reload()
    }, 2500)
}

// Função para enviar o ponto ao banco de dados
export function enviarPontoParaBanco(funcionario, horaDaBatida) {
    const data = {
        idfuncionario: funcionario.id,
        nome: funcionario.nome,
        matricula: funcionario.matricula,
        sync: false, // Valor padrão de sincronização
        timeunix: Math.floor(Date.now() / 1000), // Timestamp UNIX
        date: horaDaBatida.split('T')[0], // Data atual
        time: horaDaBatida.split('T')[1].split('.')[0], // Hora atual
    }

    console.log("Enviando ponto para o banco:", data) // Log dos dados que serão enviados

    $.ajax({
        url: 'http://localhost:3002/cadastrarPonto',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: (response) => {
            console.log("Resposta da API ao cadastrar ponto:", response) // Log da resposta da API
            if (response.success) {
                telaDeLoadOff() // Oculta a tela de carregamento
                setTimeout(() => {
                    telaDeResposta(funcionario.nome, funcionario.cpf) // Chama a tela de resposta após um pequeno atraso
                }, 100) // Pequeno atraso para garantir que a tela de carregamento esteja oculta
                popUpNotification(response.message) // Notificação de sucesso
            } else {
                showErrorAlert(response.message) // Notificação de erro
            }
        },
        error: (xhr, status, error) => {
            console.error("Erro ao cadastrar ponto:", error) // Log de erro
            showErrorAlert("Erro ao cadastrar ponto. Tente novamente mais tarde.")
        }
    })
}

// Função para mostrar/ocultar configurações e fechar a câmera
export function mostrarConfiguracoes() {
    document.querySelector('.configuracoes').classList.toggle('show')

    // Fechar a câmera ao mostrar/ocultar as configurações
    window.electronAPI.stopRecognition() 
    console.log('Câmera fechada ao acessar configurações.')
}

// Mensagem caso os rostos estejam errados
export function erroDeFacial() { $('#containerid')

    retorno.classList.remove("hidden")
    containerid.classList.add("hidden")
    barra.classList.add("changebar-ativo2")
    
    let employeeId = "Facial não reconhecida"
    icone.classList.add('fa-regular')
    icone.classList.add('fa-3x')
    icone.classList.add('fa-face-sad-tear')

    document.getElementById("errorType").innerText = employeeId

    setTimeout(function() {
        barra.classList.remove("changebar-ativo")
        retorno.classList.add("hidden")
        containerid.classList.remove("hidden")
        // location.reload()
    }, 2500)
}

// Mensagem caso os rostos não estejam cadastrados
export function erroNoCadastrado() {

    retorno.classList.remove("hidden")
    containerid.classList.add("hidden")
    barra.classList.add("changebar-ativo2")
    
    let employeeId = "Usuário não cadastrado"
    icone.classList.add('fa-solid')
    icone.classList.add('fa-3x')
    icone.classList.add('fa-xmark')

    document.getElementById("errorType").innerText = employeeId

    setTimeout(function() {
        barra.classList.remove("changebar-ativo")
        retorno.classList.add("hidden")
        containerid.classList.remove("hidden")
        // location.reload()
    }, 2500)
}




// **************************************(((TELAS DE LOGIN)))*************************************************************************


// Verifica o tipo de usuário que está logando no sistema e o redireciona para a devida página
export let usuario = $('#username')
export let senha = $('#password')

// Função para redirecionar para a página de ponto
export function pagina_ponto() {
    window.location.href = 'ponto.html'
}

// Verificando login e redirecionando para a página correta
export async function verificaLogin(event, telaRedirecionada) {
    if (event && event.preventDefault) {
        event.preventDefault()  // Evita o comportamento padrão
    }

    // Lógica de validação e login
    const userNameInput = $('#username')
    const passwordInput = $('#password')
    let userName = userNameInput.val()
    let password = passwordInput.val()

    if (!userName || !password) {
        popUpNotification('Preencha todos os campos!')
        return
    }

    if (userName === 'mestre' && password === '102030'){
        window.location.href = telaRedirecionada
    }else {
        console.log('Preparando para enviar dados do funcionário...')
        try {
            console.log('Enviando dados do funcionário...')
            const response = await fetch('http://localhost:3000/verificarLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: userName, password }),
            })
            
            // Log a resposta antes de verificar se está OK
            console.log('Resposta da API:', response)
            
            if (!response.ok) {
                throw new Error('Erro na requisição')
            }
            
            const data = await response.json()
            console.log('Dados retornados:', data)
            
            if (data.autenticado) {
                console.log('Deu bom')
                window.location.href = telaRedirecionada
            } else {
                console.log('Falha no login:', data.message)
                Swal.fire({
                    icon: 'error',
                    title: 'Usuário ou senha inválidos',
                    text: 'Não foi possível realizar o login.',
                    confirmButtonText: 'OK'
                })
                userNameInput.val('')
                passwordInput.val('')
            }
        } catch (error) {
            console.error('Erro:', error)
            Swal.fire({
                icon: 'error',
                title: 'Erro de conexão',
                text: 'Não foi possível realizar o login.',
                confirmButtonText: 'OK'
            })
        }
    }
}



// **************************************(((CADASTRO USUARIO)))*************************************************************************


// Com o evento, a função cadastrarUsuario é chamada
export function cadastrarUsuario(event) {
    event.preventDefault()

    const userNameInput = $('#username')
    const passwordInput = $('#password')
    let userName = userNameInput.val()
    let password = passwordInput.val()

    // Verificação da senha com pelo menos 4 caracteres
    if (userName && password) {
        if (password.length < 4) {
            showErrorAlert('A senha deve ter pelo menos 4 caracteres.')
            return
        }

        fetch('http://localhost:3002/cadastrarUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userName, password }),
        })
        .then(response => response.text()) 
        .then(data => {
            // Limpa os inputs
            userNameInput.val('')
            passwordInput.val('')
            Swal.fire({
                icon: 'success',
                title: 'Usuário cadastrado com sucesso!',
                text: 'Agora você pode logar com este usuário 👍',
                confirmButtonText: 'OK'
            })
        })
        .catch(error => {
            console.error('Erro:', error)
            // Limpa os inputs
            userNameInput.val('')
            userNameInput.val('')
            Swal.fire({
                icon: 'error',
                title: 'Erro de conexão',
                text: 'Não foi possível cadastrar o usuário.',
                confirmButtonText: 'OK'
            })
        })
    } else {
        showErrorAlert('Preencha todos os dados!')
    }
}