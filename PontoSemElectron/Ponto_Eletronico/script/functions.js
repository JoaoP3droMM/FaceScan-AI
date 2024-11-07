// Importando as funções globais e variaveis
import { 
    voltarPagina, 
    popUpNotification, 
    hideNotification, 
    mostrarAlerta, 
    showErrorAlert
} from './globalFunction.js'

import {
    usuario, 
    senha, 
    novoUsuario, 
    novaSenha, 
    matriculaInput,
    idInput,
    cpfInput,
    nomeInput,
    filialInput,
    btnSairCF,
    btnCadastrar, 
    btnFoto, 
    formularioCadFunc,
    camera,
    videoCamera,
    canvas,
    cameraPonto,
    elementosCamera,
    canvasPonto
} from './variables.js'

let isTraining = false;

// CORS(app, origins="http://localhost:5000", supports_credentials=True)

// **************************************(((PONTO)))*************************************************************************

let videoStream

// Lida com a ativação da câmera e a configuração do vídeo para o reconhecimento facial
export function iniciarReconhecimentoAutomatico() {

    // Verifica se o treinamento está em execuição
    if (isTraining) {
        console.log("O sistema está em treinamento. Ponto não será registrado.")
        return
    }

    // Alerta indicativo
    mostrarAlerta('success', 'Iniciando reconhecimento facial...', '', true)

    // Definimos o tipo de requisição que estamos pedindo ao navegador
    const tipoDeDado = { video: { facingMode: 'user' } }

    // Pede ao navegador o acesso a câmera
    navigator.mediaDevices.getUserMedia(tipoDeDado)
        .then((stream) => {
            videoStream = stream
            video.srcObject = stream

            // Abre a câmera e a mostra na tela
            video.play()
            elementosCamera.removeClass('hidden')
        })

        // Caso não consiga acessar a câmera
        .catch((error) => {
            console.error("Erro ao acessar a câmera:", error)
            mostrarAlerta('error', 'Não foi possível acessar a câmera!', 'Verifique as permissões.', true)
        })
}

// Essa função captura um quadro da câmera, transforma-o em base64
export function capturarImagemPonto(event) {
    event.preventDefault()
    const context = canvas.getContext('2d')

    // Define o tamanho da imagem que foi tirada
    canvasPonto.width = 320
    canvasPonto.height = 240
    
    // Desenha um quadrado da câmera com escada 640x480 e o converte para jpeg com 70% de qualidade
    context.drawImage(video, 0, 0, 640, 480)
    const base64Image = canvas.toDataURL('image/jpeg', 0.7)

    // Chama a função que envia os dados para o backend passando a string de foto como parâmetro
    enviarImagemParaReconhecimento(base64Image)
}

// Envia a imagem tirada para o back
export function enviarImagemParaReconhecimento(base64Image) {

    // Verifica se o treinamento está sendo executado
    if (isTraining) {
        console.log("Em treinamento, a imagem não será usada para bater o ponto.");
        return;
    }

    // Faz o envio para o backend por uma API para realizar o reconhecimento
    $.ajax({
        url: 'http://localhost:5001/ponto',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ imagem: base64Image }),
        success: (response) => {
            console.log("Resposta do reconhecimento:", response);
            
            // Verifica se a resposta contém os dados necessários (nome e CPF)
            if (response && response.status === "sucesso") {
                // Supondo que a resposta tenha um objeto 'funcionario' com 'nome' e 'cpf'
                const { nome, cpf } = response.funcionario || {};
                // Chama a função para exibir a resposta com os dados recebidos
                telaDeResposta(nome, cpf);
            } else {
                // Caso a resposta não seja bem-sucedida, exibe uma mensagem de erro
                mostrarErro('Erro ao registrar ponto', 'Falha no reconhecimento facial ou dados insuficientes.');
            }
        },
        error: (xhr, status, error) => {
            console.error("Erro ao enviar imagem:", error);
            mostrarErro("Erro na comunicação com o servidor", "Não foi possível registrar a batida de ponto.");
        }
    });
}

// Tela de resposta do ponto eletrônico (Precisa arrumar)
export function telaDeResposta(nome, cpf) {
    $('#profile').removeClass("hidden");
    $('#container').addClass("hidden");

    document.getElementById("nomeFuncionario").innerText = nome || "Nome não encontrado";
    document.getElementById("cpfFuncionario").innerText = cpf || "CPF não encontrado";

    setTimeout(() => {
        $('#profile').addClass("hidden");
        $('#container').removeClass("hidden");
    }, 2500);
}

// Função auxiliar para exibir uma mensagem de erro
function mostrarErro(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message
    });
}

// Função que mostra o dropdown com os links para as áreas de cadastro e configurações
export function mostrarConfiguracoes() {

    // Pega a div de configurações no geral
    const configuracoes = document.querySelector('.configuracoes');
    
    // Se configurações existir ele adiciona aclasse show
    if (configuracoes) {
        configuracoes.classList.toggle('show'); // Alterna a classe 'show' para mostrar/ocultar o menu
    } else {
        console.error("Elemento com a classe 'configuracoes' não encontrado.");
    }
}


// **************************************(((CADASTRO DE FUNCIONARIOS)))*************************************************************************

// Função que habilita ou desabilita o botão cadastrar de acordo com o enable
function toggleButton(enable = true) {
    btnCadastrar.prop('disabled', !enable)
}

// Função que abre a câmera e exibe o que ela está vendo
export async function abrirCamera() {

    // Acessa os recursos do navegador, mais precisamente a câmera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            camera.srcObject = stream;
            camera.play()

            // Torna a imagem da câmera visível para o usuário
            videoCamera.removeClass('hidden').show()
        })
        .catch(err => {
            console.error('Erro ao acessar a câmera:', err)
            mostrarAlerta('error', 'Erro ao acessar a câmera', '', true)
        })
}

// Função que captura a imagem da câmera e converte em base64
export async function tirarFotoFunc() {
    // Obtém o context (função do canvas que permite desenhar e manipular imagens)
    const context = canvas.getContext('2d')

    // Define largura e altura com base nas dimensões da câmera
    canvas.width = camera.videoWidth
    canvas.height = camera.videoHeight

    /* Desenha a imagem atual da câmera no canvas (ao invés de tirar a foto, desenhamos uma cópia
       do que tem na tela) */
       context.drawImage(camera, 0, 0, canvas.width, canvas.height)

    // Converte nosso desenho a uma imagem jpeg
    const imagemCapturada = canvas.toDataURL('image/jpeg')

    /* Aqui pegamos o frame atual do vídeo e criamos um objeto com este valor
       Esta propriedade cria uma variável que armazena a referência do stream de vídeo atual */
    const stream = camera.srcObject

    /* Este método retorna uma lista de todos os frames que estão ativos no vídeo, e paramos em
       algum frame aleatório (tirando a foto) */
    stream.getTracks().forEach(track => track.stop())

    // Encerra o processo e esconde o vídeo
    camera.srcObject = null
    videoCamera.addClass('hidden')

    // Chama a função que envia a foto para a API de cadastro no ponto, passando a imagem capturada
    // como parâmetro
    enviarFotoCadastro(imagemCapturada)
}

// Função que envia os dados cadastrais para o backend
export async function enviarFotoCadastro(imagemBase64) {

    // Declarando variáveis com os valores dos inputs
    let valorID = Number(idInput.val().trim());
    let valorMTR = matriculaInput.val().trim();
    let valorCPF = Number(cpfInput.val().trim());
    let valorFIL = Number(filialInput.val().trim());
    let valorNOM = nomeInput.val().trim();

    console.log(valorID, valorNOM, valorMTR, valorCPF, valorFIL, imagemBase64);
    
    // Enviando os dados para o backend realizar o cadastro do funcionário
    fetch('http://localhost:5000/cadastroFunc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imagem: imagemBase64,
            id: valorID,
            nome: valorNOM,
            matricula: valorMTR,
            cpf: valorCPF,
            filial: valorFIL
        })
    })
    .then(response => response.json())
    .then(data => {
        // Verifica a resposta do servidor
        if (data.status === 'sucesso') {
            Swal.fire({
                icon: 'success',
                title: 'Cadastro iniciado com sucesso!',
                text: 'Aguarde a conclusão do treinamento para começar a bater ponto com reconhecimento facial.',
                timer: 5000,
                showConfirmButton: false // Não mostra botão de confirmação
            });

            // Monitorar a resposta do WebSocket para exibir a conclusão do treinamento
            socket.on('status', (mensagem) => {
                if (mensagem.mensagem === 'Cadastro concluído') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Treinamento Concluído!',
                        text: 'Agora você pode bater o ponto usando reconhecimento facial!',
                        timer: 5000, // Tempo para fechar automaticamente
                        showConfirmButton: false // Não mostra botão de confirmação
                    });
                }
            });
        } else {
            mostrarAlerta('error', 'Erro ao cadastrar funcionário', data.mensagem || '', true);
            throw new Error(data.mensagem || 'Erro ao cadastrar funcionário');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('error', 'Erro ao cadastrar funcionário', '', true);
    });
}

// Impede entrada não numérica em Matrícula e CPF (chamada no cad_func.js)
export async function forceNumero(event) {
    if (!/[0-9]/.test(event.key)) {
        event.preventDefault()
    }
}

// Busca informações de funcionários (nome, cpf, id, filial) em uma API externa
export async function fetchFuncionarioInfo() {

    // Verifica se o campo matrícula foi preenchido
    const matricula = matriculaInput.val().trim()
    if (!matricula) return

    // Aqui tentamos fazer a requisição para a API do Protheus buscando os dados do funcionário pela matrícula
    try {
        const respostaAPI = await fetch(`https://casabrasileiraprod.coachingtech.com.br/funcionarios/matricula/${matricula}`);
        const funcionario = await respostaAPI.json();

        // Verificamos se o funcionário existe e contém informações
        if (funcionario && Object.keys(funcionario).length > 0) {
            nomeInput.val(funcionario.nome || '')
            filialInput.val(funcionario.codfil || '')       // Preenche com os dados dos funcionários.
            cpfInput.val(funcionario.cpf || '')             // Se não houver dados, ele deixa o campo
            matriculaInput.val(funcionario.matricula || '') // vazio.
            idInput.val(funcionario.id || '')               

            mostrarAlerta('success', 'Funcionário encontrado!', '', true)
            toggleButton(true); // Ativa o botão de cadastro após encontrar o funcionário
        } else {
            mostrarAlerta('error', 'Funcionário não encontrado', '', true);
        }

        // Caso haja algum erro no envio dos dados para a API de busca
    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        mostrarAlerta('error', 'Erro ao buscar informações!', 'Consulte o suporte técnico', true)
    }
}


// **************************************(((CADASTRO USUARIO)))*************************************************************************

// Cadastra os usuários do sistema no banco de dados
export function cadastarUsu() {
    // Captura os campos de cadastro de usuário
    const username = novoUsuario.length ? novoUsuario.val().trim() : '';
    const password = novaSenha.length ? novaSenha.val().trim() : '';

    // Verifica se os imputs estão preenchidos
    if (!username || !password) {
        mostrarAlerta('error', 'Erro', 'Por favor, preencha todos os campos.');
        return;
    }

    // Verifica se o conteúdo da senha tem mais de 4 caracteres
    if (password.length < 4) {
        mostrarAlerta('info', 'Erro', 'A senha deve ter pelo menos 4 caracteres.', true);
        return;
    }

    // Estrutura do corpo JSON para o envio dos dados para a API de cadastro
    const dadosUsuario = { username, password };

    // Função para limpar os campos de entrada
    const limparCampos = () => {
        novoUsuario.val('');
        novaSenha.val('');
    };

    // Função principal para cadastro
    const realizarCadastro = async () => {
        try {
            const response = await fetch('http://localhost:5000/cadastrarUsuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosUsuario)
            });

            const data = await response.json(); // Transformar a resposta em JSON

            // Verifica se o envio dos dados foi feito
            if (data.success) {
                // Limpa os campos após o sucesso
                limparCampos();

                // Emite a mensagem de sucesso
                mostrarAlerta('success', 'Sucesso', 'Usuário cadastrado com sucesso!', true);

            // Se o envio dos dados deu errado... 
            } else {
                // Verifica se o usuário já existe
                if (data.message === "O usuário já existe") {
                    mostrarAlerta('warning', 'Atenção!', 'Nome de usuário já cadastrado.', true);
                // Caso o usuário não exista e ele não consiga cadastrar no banco (por algum outro motivo) 
                } else {
                    throw new Error(data.message || 'Erro ao cadastrar usuário');
                }
            }
        } catch (error) {
            // Caso haja algum erro de conexão
            console.error('Erro:', error);
            mostrarAlerta('error', 'Erro de conexão', 'Ocorreu um erro ao conectar ao servidor.', true);
        }
    };

    // Chama a função que envia o cadastro para o banco
    realizarCadastro();
}


// **************************************(((TELAS DE LOGIN)))*************************************************************************

// Verificando login e redirecionando para a página correta
export async function verificaLogin(event, telaRedirecionada) {
    if (event && event.preventDefault) {
        event.preventDefault()  // Evita o comportamento padrão
    }

    // Lógica de validação e login
    let usuarioValue = usuario.val()
    let senhaValue = senha.val()

    if (!usuarioValue || !senhaValue) {
        popUpNotification('Preencha todos os campos!')
        return
    }

    if (usuarioValue === 'mestre' && senhaValue === '102030'){
        window.location.href = telaRedirecionada
    }else {
        console.log('Preparando para enviar dados do funcionário...')
        try {
            console.log(`Enviando dados do funcionário.\n Usuario: ${usuarioValue}\n Senha: ${senhaValue}  `)
            const response = await fetch('http://localhost:5000/verificarLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: usuarioValue, password: senhaValue }),
                credentials: 'include',  // Garante que as credenciais sejam enviadas
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
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    customClass: {
                        popup: 'colored-toast'
                    }
                })
                usuario.val('')
                senha.val('')
            }
        } catch (error) {
            console.error('Erro:', error)
            Swal.fire({
                icon: 'error',
                title: 'Erro de conexão',
                text: 'Não foi possível realizar o login.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    popup: 'colored-toast'
                }
            })
        }
    }
}