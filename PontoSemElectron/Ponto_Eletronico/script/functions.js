// Importando as funções globais e variaveis
import { voltarPagina, popUpNotification, hideNotification, showAlert, showErrorAlert } from './globalFunction.js'
import { containerid, retorno, barra, icone } from './variables.js'
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

    enviarDados(imagemCapturada);
}

// Função que envia os dados cadastrais para o MongoDB
export function enviarDados(imagemBase64) {
    // Captura dos campos comuns
    const nome = $('#nomeCompleto').length ? $('#nomeCompleto').val().trim() : '';
    const matricula = $('#matricula').length ? $('#matricula').val().trim() : '';
    const cpf = $('#cpf').length ? $('#cpf').val().trim() : '';
    const id = $('#idfunc').length ? $('#idfunc').val().trim() : '';
    const filial = $('#filial').length ? $('#filial').val().trim() : '';

    // Captura dos campos de cadastro de usuário
    const username = $('#username').length ? $('#username').val().trim() : '';
    const password = $('#password').length ? $('#password').val().trim() : '';

    // Verificação condicional para determinar o tipo de envio
    if (nome && matricula && cpf) {
        // Procede com o cadastro de funcionários
        const dadosFuncionario = {
            id,
            nome,
            matricula,
            cpf,
            filial,
            fotoBase64: imagemBase64,
            sync: false
        };

        fetch('http://localhost:3002/cadastrarFuncionario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFuncionario)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Funcionário cadastrado com sucesso!',
                    text: 'Agora você pode bater o ponto usando reconhecimento facial!',
                    confirmButtonText: 'OK'
                }).then(() => {
                    $('#nomeCompleto').val('');
                    $('#matricula').val('');
                    $('#cpf').val('');
                    $('#idfunc').val('');
                    $('#filial').val('');
                });
            } else {
                throw new Error('Erro ao cadastrar funcionário');
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

    } else if (username && password) {
        if (password.length < 4) {
            Swal.fire({
                icon: 'error',
                text: 'A senha deve ter pelo menos 4 caracteres.',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        // Certifique-se de que ambos `username` e `password` estão presentes na estrutura do corpo JSON
        const dadosUsuario = {
            username: username,
            password: password
        };
        console.log("Dados a serem enviados:", dadosUsuario);
        fetch('http://localhost:3002/cadastrarUsuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosUsuario)
        })
        .then(response => response.json()) // Transformar a resposta em JSON
        .then(data => {
            if (data.success) {
                // Limpa os campos de username e password após o sucesso
                console.log("Username:", username);
                console.log("Password:", password);
                $('#username').val('');
                $('#password').val('');
                
                // Exibe o toast de sucesso
                Swal.fire({
                    icon: 'success',
                    title: 'Usuário cadastrado com sucesso!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    customClass: {
                        popup: 'colored-toast'
                    }
                });
            } else {
                // Aqui você lida com o caso onde o usuário já existe
                if (data.message === "O usuário já existe") {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Atenção!',
                        text: 'Usuário já cadastrado.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        customClass: {
                            popup: 'colored-toast'
                        }
                    });
                } else {
                    throw new Error(data.message || 'Erro ao cadastrar usuário');
                }
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de conexão',
                text: 'Ocorreu um erro ao conectar ao servidor.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    popup: 'colored-toast'
                }
            });
        });

    } else {
        // Se nenhum conjunto de campos estiver completo, avisa o usuário
        Swal.fire({
            icon: 'warning',
            text: 'Por favor, preencha os campos necessários!',
            confirmButtonText: 'OK'
        });
    }
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

let videoStream; // Variável para armazenar o stream de vídeo

// Função para iniciar o reconhecimento facial automaticamente ao carregar a página
export function iniciarReconhecimentoAutomatico() {
    if (isTraining) {
        console.log("O sistema está em treinamento. Ponto não será registrado.");
        return; // Interrompe a execução se estiver em treinamento
    }

    popUpNotification('Iniciando reconhecimento facial...');
    const container = $('#container').get(0);
    if (container) {
        container.classList.add('hidden'); // Esconde o container
    } else {
        console.error("Elemento com id 'container' não encontrado.");
    }

    // Acessar a câmera
    const video = document.getElementById('video');
    const constraints = {
        video: { facingMode: 'user' } // Usar a câmera frontal
    };

    if (videoStream) {
        console.log("Câmera já ativada.");
        return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            videoStream = stream; // Armazena o stream
            video.srcObject = stream;
            video.play();
            $('#video-container').removeClass('hidden');
        })
        .catch((error) => {
            console.error("Erro ao acessar a câmera:", error);
            showErrorAlert("Não foi possível acessar a câmera. Verifique as permissões.");
        });
}

// Função para capturar a imagem e enviar para reconhecimento facial
export function capturarImagemPonto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // Define a resolução desejada para a captura
    canvas.width = 640;
    canvas.height = 480;

    // Desenha o frame do vídeo no canvas com a resolução aumentada
    context.drawImage(video, 0, 0, 640, 480);
    const base64Image = canvas.toDataURL('image/png');

    const matricula = "123456"; // Aqui você deve pegar a matrícula correta do contexto
    enviarImagemParaReconhecimento(base64Image, matricula);
}

export function enviarImagemParaReconhecimento(base64Image, matricula) {
    if (isTraining) {
        console.log("Em treinamento, a imagem não será usada para bater o ponto.");
        return; // Interrompe a execução se estiver em treinamento
    }

    console.log("Enviando imagem para reconhecimento...");
    $('.btnPonto').prop('disabled', true);

    $.ajax({
        url: 'http://localhost:5001/ponto',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ imagem: base64Image, matricula: matricula }),
        success: (response) => {
            console.log("Resposta de reconhecimento:", response);
            if (response.matricula) {
                alert("Foto recebida com sucesso");
                buscarFuncionarioPorMatricula(response.matricula)
                    .then(funcionario => {
                        const horaDaBatida = new Date().toISOString();
                        enviarPontoParaBanco(funcionario, horaDaBatida);
                    })
                    .catch(error => {
                        console.error("Erro ao buscar dados do funcionário:", error);
                        showErrorAlert("Erro ao buscar dados do funcionário: " + error);
                    });
            } else {
                showErrorAlert("Erro no reconhecimento facial");
                console.error("Erro no reconhecimento facial:", response);
            }
        },
        error: (xhr, status, error) => {
            console.error("Erro ao enviar imagem:", error);
            showErrorAlert("Erro no reconhecimento facial. Tente novamente.");
        },
        complete: () => {
            $('.btnPonto').prop('disabled', false);
            console.log("Botão reabilitado.");
        }
    });
}

// Função para mostrar a tela de resposta com os dados do funcionário
export function telaDeResposta(nome, cpf) {
    retorno.removeClass("hidden");
    containerid.addClass("hidden");
    barra.addClass("changebar-ativo");
    
    document.getElementById("nomeFuncionario").innerText = nome || "Nome não encontrado";
    document.getElementById("cpfFuncionario").innerText = cpf || "CPF não encontrado";

    setTimeout(() => {
        barra.removeClass("changebar-ativo");
        retorno.addClass("hidden");
        containerid.removeClass("hidden");
    }, 2500);
}

// Inicialização e vinculação de eventos
$(document).ready(() => {

    $('form').on('submit', (event) => {
        event.preventDefault(); // Previne o recarregamento da página
    });


    $('.btnPonto').on('click', iniciarReconhecimentoAutomatico);
    $('form').on('submit', (event) => event.preventDefault());
    $('#photo-button').on('click', capturarImagemPonto);

    if (window.electronAPI && typeof window.electronAPI.onRecognitionComplete === 'function') {
        window.electronAPI.onRecognitionComplete((result) => {
            if (result && result.nome && result.distancia) {
                const matricula = result.nome; // Supondo que a matrícula é retornada como 'nome'

                console.log("Resultado do reconhecimento facial:", result);
                popUpNotification('Face reconhecida com sucesso!');
                buscarFuncionarioPorMatricula(matricula) // Busca o funcionário usando a matrícula
                    .then(funcionario => {
                        const horaDaBatida = new Date().toISOString();
                        enviarPontoParaBanco(funcionario, horaDaBatida); // Envia o ponto ao banco
                    })
                    .catch(error => {
                        showErrorAlert("Erro ao buscar dados do funcionário: " + error);
                    });
            } else {
                erroDeFacial();
            }
        });
    }
});

export function mostrarConfiguracoes() {
    const configuracoes = document.querySelector('.configuracoes');
    if (configuracoes) {
        configuracoes.classList.toggle('show'); // Alterna a classe 'show' para mostrar/ocultar o menu
    } else {
        console.error("Elemento com a classe 'configuracoes' não encontrado.");
    }
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
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'swal-button-custom'
                }
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText)
            }
            return response.json() // Mudei para response.json()
        })
        .then(data => {
            // Limpa os inputs
            userNameInput.val('')
            passwordInput.val('')

            // Verifica se a resposta tem sucesso
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Usuário cadastrado com sucesso!',
                    text: 'Agora você pode logar com este usuário.',
                    confirmButtonText: 'OK'
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: data.message || 'Ocorreu um erro ao cadastrar o usuário.',
                    confirmButtonText: 'OK'
                })
            }
        })
        .catch(error => {
            console.error('Erro:', error)
            // Limpa os inputs
            userNameInput.val('')
            passwordInput.val('') // Corrigido para limpar a senha
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