// Importando as funções globais e variaveis
import { voltarPagina, popUpNotification, hideNotification, showAlert, showErrorAlert } from './globalFunction.js'
import { usuario, senha, novoUsuario, novaSenha } from './variables.js'

let isTraining = false;




// **************************************(((CADASTRO DE FUNCIONARIOS)))*************************************************************************

// Funções do cadastro de funcionários
export const buttonCadastro = $('#start-capture');

export function toggleButton(enable = true) {
    $('#start-capture').prop('disabled', !enable);
}

// Função que inicia a captura de imagem da câmera
export function iniciarCaptura() {
    const video = $('#video')[0];
    const videoContainer = $('#video-container');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();

            videoContainer.removeClass('hidden').show();
        })
        .catch(err => {
            console.error('Erro ao acessar a câmera:', err);
            popUpNotification('Erro ao acessar a câmera.');
        });
}

// Função que captura a imagem da câmera e oculta o vídeo
export function capturarImagem() {
    const video = $('#video')[0];
    const canvas = $('#canvas')[0];
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagemCapturada = canvas.toDataURL('image/png');

    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    $('#video-container').addClass('hidden');

    enviarFotoCadastro(imagemCapturada);
}

// Função que envia os dados cadastrais para o MongoDB
export function enviarFotoCadastro(imagemBase64) {
    const id = $('#idfunc').val().trim();
    const nome = $('#nomeCompleto').val().trim();
    const matricula = $('#matricula').val().trim();
    const cpf = $('#cpf').val().trim();
    const filial = $('#filial').val().trim();

    if (!imagemBase64 || !id || !nome || !matricula || !cpf || !filial) {
        Swal.fire({
            icon: 'warning',
            text: 'Por favor, preencha todos os campos obrigatórios!',
            confirmButtonText: 'OK'
        });
        return;
    }

    fetch('http://localhost:5000/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagem: imagemBase64, id, nome, matricula, cpf, filial })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'sucesso') {
            $('#video-container').hide();
            Swal.fire({
                icon: 'success',
                title: 'Cadastro realizado com sucesso!',
                text: 'Agora você pode bater o ponto usando reconhecimento facial!',
                timer: 10000, // Tempo para fechar automaticamente
                showConfirmButton: false // Não mostra botão de confirmação
            });
        } else {
            $('#video-container').hide();
            throw new Error(data.mensagem || 'Erro ao cadastrar funcionário');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            text: 'Erro ao cadastrar funcionário.',
            confirmButtonText: 'OK'
        });
    });
}

// Impede entrada não numérica em Matrícula e CPF
export function enforceNumericInput(event) {
    if (!/[0-9]/.test(event.key)) {
        event.preventDefault();
    }
}

// Busca informações de funcionários na API
export async function fetchFuncionarioInfo() {
    const matricula = $('#matricula').val().trim();
    if (!matricula) return;

    try {
        const response = await fetch(`https://casabrasileiraprod.coachingtech.com.br/funcionarios/matricula/${matricula}`);
        const funcionario = await response.json();

        if (funcionario && Object.keys(funcionario).length > 0) {
            $('#nomeCompleto').val(funcionario.nome || '');
            $('#filial').val(funcionario.codfil || '');
            $('#cpf').val(funcionario.cpf || '');
            $('#matricula').val(funcionario.matricula || '');
            $('#idfunc').val(funcionario.id || '');

            popUpNotification('Funcionário encontrado');
            toggleButton(true); // Ativa o botão após encontrar o funcionário
        } else {
            popUpNotification('Funcionário não encontrado');
            toggleButton(false); // Desativa o botão se não encontrar o funcionário
        }
    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        Swal.fire({
            icon: 'error',
            text: 'Erro ao buscar informações do usuário',
            confirmButtonText: 'OK'
        });
    }
}





















// **************************************(((PONTO)))*************************************************************************

let videoStream;

export function iniciarReconhecimentoAutomatico() {
    if (isTraining) {
        console.log("O sistema está em treinamento. Ponto não será registrado.");
        return;
    }

    popUpNotification('Iniciando reconhecimento facial...');
    $('#container').addClass('hidden');

    const video = document.getElementById('video');
    const constraints = { video: { facingMode: 'user' } };

    if (videoStream) {
        console.log("Câmera já ativada.");
        return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            videoStream = stream;
            video.srcObject = stream;
            video.play();
            $('#video-container').removeClass('hidden');
        })
        .catch((error) => {
            console.error("Erro ao acessar a câmera:", error);
            showErrorAlert("Não foi possível acessar a câmera. Verifique as permissões.");
        });
}

export function capturarImagemPonto(event) {
    event.preventDefault();
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 320;
    canvas.height = 240;

    context.drawImage(video, 0, 0, 640, 480);
    const base64Image = canvas.toDataURL('image/jpeg', 0.7);

    const matricula = "123456"; // Ajustar para obter a matrícula correta
    enviarImagemParaReconhecimento(base64Image, matricula);
}

export function enviarImagemParaReconhecimento(base64Image, matricula) {
    if (isTraining) {
        console.log("Em treinamento, a imagem não será usada para bater o ponto.");
        return;
    }

    console.log("Iniciando envio da imagem para reconhecimento...");
    $('.btnPonto').prop('disabled', true);

    $.ajax({
        url: 'http://localhost:5001/ponto',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ imagem: base64Image, matricula: matricula }),
        success: (response) => {
            console.log("Resposta do reconhecimento:", response);
        },
        error: (xhr, status, error) => {
            console.error("Erro ao enviar imagem:", error);
        },
        complete: () => {
            $('.btnPonto').prop('disabled', false);
        }
    });
}

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

export function mostrarConfiguracoes() {
    const configuracoes = document.querySelector('.configuracoes');
    if (configuracoes) {
        configuracoes.classList.toggle('show'); // Alterna a classe 'show' para mostrar/ocultar o menu
    } else {
        console.error("Elemento com a classe 'configuracoes' não encontrado.");
    }
}


// **************************************(((CADASTRO USUARIO)))*************************************************************************

// Cadastra os usuários do sistema no banco de dados
export function cadastarUsu() {
    // Captura os campos de cadastro de usuário
    const username = novoUsuario.length ? novoUsuario.val().trim() : '';
    const password = novaSenha.length ? novaSenha.val().trim() : '';

    // Função auxiliar para exibir alertas
    const showAlert = (icon, title, text, toast = false) => {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            toast: toast,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'colored-toast'
            }
        });
    };

    // Verifica se os imputs estão preenchidos
    if (!username || !password) {
        showAlert('error', 'Erro', 'Por favor, preencha todos os campos.');
        return;
    }

    // Verifica se o conteúdo da senha tem mais de 4 caracteres
    if (password.length < 4) {
        showAlert('info', 'Erro', 'A senha deve ter pelo menos 4 caracteres.', true);
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
                showAlert('success', 'Sucesso', 'Usuário cadastrado com sucesso!', true);

            // Se o envio dos dados deu errado... 
            } else {
                // Verifica se o usuário já existe
                if (data.message === "O usuário já existe") {
                    showAlert('warning', 'Atenção!', 'Nome de usuário já cadastrado.', true);
                // Caso o usuário não exista e ele não consiga cadastrar no banco (por algum outro motivo) 
                } else {
                    throw new Error(data.message || 'Erro ao cadastrar usuário');
                }
            }
        } catch (error) {
            // Caso haja algum erro de conexão
            console.error('Erro:', error);
            showAlert('error', 'Erro de conexão', 'Ocorreu um erro ao conectar ao servidor.', true);
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
            const response = await fetch('http://localhost:3000/verificarLogin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: usuarioValue, password: senhaValue }),
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