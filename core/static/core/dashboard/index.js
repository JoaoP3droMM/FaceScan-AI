function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// const dadosJSON = [
//     {
//         "nome": "Ana Silva",
//         "matricula": "2023001",
//         "dataRegistro": "10/01/2023",
//         "ultimoReconhecimento": "05/10/2023 08:30"
//     },
//     {
//         "nome": "Carlos Oliveira",
//         "matricula": "2023045",
//         "dataRegistro": "15/02/2023",
//         "ultimoReconhecimento": "05/10/2023 08:35"
//     },
//     {
//         "nome": "Mariana Souza",
//         "matricula": "2023112",
//         "dataRegistro": "20/03/2023",
//         "ultimoReconhecimento": "04/10/2023 18:00"
//     },
//     {
//         "nome": "Roberto Lima",
//         "matricula": "2022890",
//         "dataRegistro": "05/11/2022",
//         "ultimoReconhecimento": "05/10/2023 09:00"
//     },
//     {
//         "nome": "Fernanda Costa",
//         "matricula": "2023334",
//         "dataRegistro": "12/06/2023",
//         "ultimoReconhecimento": "03/10/2023 14:20"
//     }
// ];

// 2. Função para renderizar a tabela
function carregarTabela(dados) {
    const tbody = document.getElementById('tabela-usuarios');
    tbody.innerHTML = ''; // Limpa antes de preencher
    const minLinhas = 10; // Para manter o design bonito
    dados.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.nome}</td>
            <td>${usuario.matricula}</td>
            <td>${usuario.data_registro}</td>        
            <td>${usuario.ultimo_reconhecimento}</td>
        `;
        tbody.appendChild(tr);
    });
    const linhasRestantes = minLinhas - dados.length;
    if (linhasRestantes > 0) {
        for (let i = 0; i < linhasRestantes; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td>`;
            tbody.appendChild(tr);
        }
    }
}
async function buscarUsuarios() {
    const tbody = document.getElementById('tabela-usuarios');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Carregando dados...</td></tr>';
    try {
        const response = await fetch('/lista-usuarios/');
        const dadosReais = await response.json();
        carregarTabela(dadosReais);
    } catch (erro) {
        console.error('Erro ao buscar usuários:', erro);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center">Erro ao carregar tabela.</td></tr>';
    }
}

// carregarTabela(dadosJSON);
document.addEventListener('DOMContentLoaded', () => {
    buscarUsuarios();
});

// ___________Modal Cadastro______________
function abrirModal() {
    const modal = document.getElementById('modal-cadastro-overlay');
    const msgBox = document.getElementById('msg-feedback');
    if (modal) {
        toggleModalView('form'); 
        modal.style.display = 'flex';
    }
    if (msgBox) msgBox.style.display = 'none';
}

function fecharModal() {
    const modal = document.getElementById('modal-cadastro-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Fechar ao clicar fora da modal (na parte escura)
window.onclick = function(event) {
    const modal = document.getElementById('modal-cadastro-overlay');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

let stream = null;

// Funções da Modal (já existentes, mas atualizadas)
function abrirModal() {
    const modal = document.getElementById('modal-cadastro-overlay');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModal() {
    const modal = document.getElementById('modal-cadastro-overlay');
    if (modal) {
        modal.style.display = 'none';
        pararCamera(); 
    }
}

function exibirMensagem(texto, tipo) {
    const msgBox = document.getElementById('msg-feedback');
    if (!msgBox) return;
    msgBox.textContent = texto;
    msgBox.style.display = 'block';
    msgBox.className = 'feedback-box ' + (tipo === 'sucesso' ? 'feedback-success' : 'feedback-error');
}

// Fechar ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modal-cadastro-overlay');
    if (event.target == modal) {
        fecharModal(); // Chama a função que já desliga a câmera
    }
}

// iniciar o treinamento
async function executarTreinamento() {
    const statusTxt = document.getElementById('status-treinamento');
    const csrftoken = getCookie('csrftoken');
    if(statusTxt) statusTxt.textContent = 'Solicitando treinamento ao servidor...';
    try {
        const response = await fetch('/run-treinamento/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            }
        });
        const result = await response.json();
        if (result.status === 'ok') {
            let outputMsg = 'Concluído';
            if (result.output) {
                outputMsg = result.output.split('\n').filter(line => line.trim() !== '').pop() || 'Concluído';
            }
            if(statusTxt) {
                statusTxt.style.color = 'green';
                statusTxt.textContent = `Treinamento finalizado: ${outputMsg}`;
            }
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            if(statusTxt) {
                statusTxt.style.color = 'red';
                statusTxt.textContent = `Erro no treinamento: ${result.error}`;
            }
        }
    } catch (err) {
        console.error('Erro em run-treinamento:', err);
        if(statusTxt) {
            statusTxt.style.color = 'red';
            statusTxt.textContent = 'Erro de conexão ao tentar treinar.';
        }
    }
}

function toggleModalView(view) {
    const viewForm = document.getElementById('view-form');
    const viewSuccess = document.getElementById('view-success');
    
    if (view === 'form') {
        viewForm.style.display = 'block';
        viewSuccess.style.display = 'none';
    } else if (view === 'success') {
        viewForm.style.display = 'none';
        viewSuccess.style.display = 'flex'; // Flex para centralizar
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCamera = document.getElementById('btn-camera-toggle');
    const videoElement = document.getElementById('video-preview');
    const textoPlaceholder = document.getElementById('texto-camera');
    window.pararCamera = function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            stream = null;
            videoElement.style.display = 'none';
            if(textoPlaceholder) textoPlaceholder.style.display = 'block';
            if(btnCamera) btnCamera.innerHTML = '<i class="fa-solid fa-video"></i> Ligar Webcam';
            if(btnCamera) btnCamera.classList.replace('btn-red', 'btn-blue');
        }
    };
    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            console.log(`Click na câmera`);
            if (stream) {
                pararCamera();
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                videoElement.srcObject = stream;
                videoElement.style.display = 'block'; // Mostra o vídeo
                if(textoPlaceholder) textoPlaceholder.style.display = 'none'; // Esconde o texto
                btnCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i> Desligar Webcam';
                btnCamera.classList.replace('btn-blue', 'btn-red');
            } catch (err) {
                console.error('Erro ao acessar a webcam: ', err);
                alert('Erro ao acessar webcam. Verifique as permissões.');
            }
        });
    }
});

const nomeInput = document.getElementById('nome-usuario');
const matriculaInput = document.getElementById('matricula-usuario');
const btnCaptura = document.querySelector('.btn-submit-modal'); 
const canvas = document.createElement('canvas');
function snapPicture(videoId) {
    const id = videoId || 'video-preview';
    const video = document.getElementById(id);
    if (!video || !video.srcObject) {
        alert('Ligue a webcam primeiro.');
        return null;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0); 
    return canvas.toDataURL('image/jpeg');
}
if (btnCaptura) {
    btnCaptura.addEventListener('click', async (e) => {
        e.preventDefault(); 
        const nome = nomeInput.value.trim();
        const matricula = matriculaInput.value.trim();
        const csrftoken = getCookie('csrftoken');
        if (!nome || !matricula) {
            alert('Por favor, preencha o Nome e a Matrícula.');
            return;
        }
        const imageData = snapPicture();
        if (!imageData) return; 
        const textoOriginal = btnCaptura.innerHTML;
        btnCaptura.textContent = 'Salvando...';
        btnCaptura.disabled = true;
        try {
            const response = await fetch('/salvar-foto/', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    nome: nome,
                    matricula: matricula,
                    image_data: imageData
                })
            });
            const result = await response.json();
            if (response.ok) {
                document.getElementById('success-user-id').textContent = matricula;
                toggleModalView('success');
                // setTimeout(() => {
                //     fecharModal();
                //     window.location.reload();
                // }, 3000);
                await executarTreinamento();
            } else {
                exibirMensagem('Erro: ' + (result.message || result.error), 'erro');
                btnCaptura.disabled = false;
                btnCaptura.textContent = textoOriginal;
            }
        } catch (err) {
            console.error(err);
            exibirMensagem('Erro de conexão.', 'erro');
            btnCaptura.disabled = false;
            btnCaptura.textContent = textoOriginal;
        } finally {
            btnCaptura.disabled = false;
            btnCaptura.innerHTML = textoOriginal;
        }
    });
}

// _________________________________________ FIM Modal cadastro

//#region Reconhecimento modal
// ==============================================================
// LÓGICA DO MODAL DE Reconhecimento
// ==============================================================
let streamReconhecimento = null;

// Abrir Modal e Ligar Câmera
async function abrirModalReconhecimento() {
    const modal = document.getElementById('modal-reconhecimento-overlay');
    const msgBox = document.getElementById('msg-reconhecimento');
    const loader = document.getElementById('loader-camera-rec');
    if (modal) {
        modal.style.display = 'flex';
        if (msgBox) msgBox.style.display = 'none';
        const videoElement = document.getElementById('video-reconhecimento');
        try {
            if (loader) loader.style.display = 'block';
            streamReconhecimento = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoElement.srcObject = streamReconhecimento;
            videoElement.onloadedmetadata = () => {
                if (loader) loader.style.display = 'none';
            };
        } catch (err) {
            console.error("Erro ao ligar câmera de reconhecimento:", err);
            alert("Não foi possível acessar a câmera.");
        }
    }
}

function fecharModalReconhecimento() {
    const modal = document.getElementById('modal-reconhecimento-overlay');
    if (modal) {
        modal.style.display = 'none';
        if (streamReconhecimento) {
            streamReconhecimento.getTracks().forEach(track => track.stop());
            const videoElement = document.getElementById('video-reconhecimento');
            if (videoElement) videoElement.srcObject = null;
            streamReconhecimento = null;
        }
    }
}

const btnReconhecimento = document.getElementById('btn-reconhecer');

if (btnReconhecimento) {
    btnReconhecimento.addEventListener('click', async () => {
        const msgBox = document.getElementById('msg-reconhecimento');
        const scanLine = document.getElementById('scan-line');
        const csrftoken = getCookie('csrftoken');
        // 1. Tira a foto do vídeo de RECONHECIMENTO
        const imageData = snapPicture('video-reconhecimento');
        if (!imageData) {
            exibirFeedbackRec('Câmera não iniciada.', 'erro');
            return;
        }
        btnReconhecimento.disabled = true;
        btnReconhecimento.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
        
        if (scanLine) {
            scanLine.style.display = 'block';
            scanLine.classList.add('scan-animation'); // Adicione a animação no CSS se quiser
        }
        if (msgBox) msgBox.style.display = 'none';

        try {
            const response = await fetch('/reconhecer-foto/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ image_data: imageData })
            });
            const result = await response.json();
            if (result.nome && result.nome !== 'Desconhecido') {
                // SUCESSO: Pessoa Encontrada
                const texto = `Identificado: <strong>${result.nome}</strong>`;
                const subtexto = `(Precisão: ${(1 - result.distancia).toFixed(2)}%)`; // Opcional: converte distancia em %
                exibirFeedbackRec(`${texto} <br> <span style="font-size:12px">${subtexto}</span>`, 'sucesso');
            } else if (result.error) {
                // ERRO TÉCNICO
                exibirFeedbackRec(`Erro: ${result.error}`, 'erro');
            } else {
                // DESCONHECIDO
                exibirFeedbackRec('Rosto desconhecido ou não cadastrado.', 'aviso');
            }
        } catch (err) {
            console.error('Erro em reconhecer-foto:', err);
            exibirFeedbackRec('Erro de conexão com o servidor.', 'erro');
        } finally {
            btnReconhecimento.disabled = false;
            btnReconhecimento.innerHTML = '<i class="fa-solid fa-expand"></i> Reconhecer';
            if (scanLine) {
                scanLine.style.display = 'none';
                scanLine.classList.remove('scan-animation');
            }
        }
    });
}

function exibirFeedbackRec(htmlTexto, tipo) {
    const msgBox = document.getElementById('msg-reconhecimento');
    if (!msgBox) return;
    msgBox.innerHTML = htmlTexto;
    msgBox.style.display = 'block';
    msgBox.className = 'feedback-box';
    if (tipo === 'sucesso') {
        msgBox.classList.add('feedback-success');
    } else if (tipo === 'erro') {
        msgBox.classList.add('feedback-error');  
    } else {
        msgBox.style.backgroundColor = '#fff3cd';
        msgBox.style.color = '#856404';
        msgBox.style.border = '1px solid #ffeeba';
    }
}
// _________________________________________ FIM Modal cadastro
//#endregion
//#region Delete user
// ==============================================================
// LÓGICA DO MODAL DE DELEÇÃO
// ==============================================================

function toggleDeleteView(viewName) {
    const viewSearch = document.getElementById('view-delete-search');
    const viewConfirm = document.getElementById('view-delete-confirm');
    const viewSuccess = document.getElementById('view-delete-success');
    const msgBox = document.getElementById('msg-delete-feedback');

    viewSearch.style.display = 'none';
    viewConfirm.style.display = 'none';
    viewSuccess.style.display = 'none';
    if (msgBox) msgBox.style.display = 'none';
    if (viewName === 'search') {
        viewSearch.style.display = 'block';
    } else if (viewName === 'confirm') {
        viewConfirm.style.display = 'block';
    } else if (viewName === 'success') {
        viewSuccess.style.display = 'flex';
    }
}

function abrirModalDelete() {
    const modal = document.getElementById('modal-delete-overlay');
    const inputSearch = document.getElementById('delete-search-input');
    if (modal) {
        toggleDeleteView('search');
        modal.style.display = 'flex';
    }
}

function fecharModalDelete() {
    const modal = document.getElementById('modal-delete-overlay');
    if (modal) modal.style.display = 'none';
}

const btnDeleteSearch = document.getElementById('btn-delete-search-action');
if (btnDeleteSearch) {
    btnDeleteSearch.addEventListener('click', async () => {
        const matriculaInput = document.getElementById('delete-search-input');
        const matricula = matriculaInput.value.trim();
        
        const feedbackBox = document.getElementById('msg-delete-feedback');
        const showFeedback = (msg, type) => {
            feedbackBox.textContent = msg;
            feedbackBox.style.display = 'block';
            feedbackBox.className = 'feedback-box ' + (type === 'erro' ? 'feedback-error' : 'feedback-success');
        };
        feedbackBox.style.display = 'none'; // Limpa anterior
        if (!matricula) {
            showFeedback('Por favor, informe uma matrícula.', 'erro');
            return;
        }
        const originalText = btnDeleteSearch.innerHTML;
        btnDeleteSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
        btnDeleteSearch.disabled = true;

        try {
            const response = await fetch(`/api/buscar-usuario/?matricula=${matricula}`);
            const data = await response.json();
            if (response.ok) {
                document.getElementById('del-confirm-matricula').value = data.matricula;
                document.getElementById('del-confirm-nome').value = data.nome;
                document.getElementById('del-confirm-data').value = data.data_registro_formatada;
                
                toggleDeleteView('confirm');
            } else {
                showFeedback(data.error || 'Usuário não encontrado.', 'erro');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            showFeedback('Erro de conexão ao buscar usuário.', 'erro');
        } finally {
            btnDeleteSearch.innerHTML = originalText;
            btnDeleteSearch.disabled = false;
        }
    });
}

const btnDeleteConfirm = document.getElementById('btn-delete-confirm-action');
if (btnDeleteConfirm) {
    btnDeleteConfirm.addEventListener('click', async () => {
        const matriculaParaDeletar = document.getElementById('del-confirm-matricula').value;
        const csrftoken = getCookie('csrftoken');
        const originalText = btnDeleteConfirm.innerHTML;
        btnDeleteConfirm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deletando...';
        btnDeleteConfirm.disabled = true;

        try {
            const response = await fetch('/api/deletar-usuario/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ matricula: matriculaParaDeletar })
            });
            const result = await response.json();

            if (response.ok) {
                document.getElementById('deleted-user-id').textContent = matriculaParaDeletar;
                toggleDeleteView('success');
                setTimeout(() => {
                    fecharModalDelete();
                    window.location.reload();
                }, 2500);
            } else {
                toggleDeleteView('search');
                const feedbackBox = document.getElementById('msg-delete-feedback');
                feedbackBox.textContent = 'Erro ao deletar: ' + (result.error || 'Erro desconhecido');
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'feedback-box feedback-error';
            }
        } catch (error) {
            console.error('Erro na deleção:', error);
            alert('Erro de conexão ao tentar deletar.');
            toggleDeleteView('search');
        } finally {
            btnDeleteConfirm.innerHTML = originalText;
            btnDeleteConfirm.disabled = false;
        }
    });
}
// _________________________________________ FIM Modal Delete user
//#endregion
//#region Update user
// ==============================================================
// LÓGICA DO MODAL DE Atualização
// ==============================================================
function toggleUpdateView(viewName) {
    const viewSearch = document.getElementById('view-update-search');
    const viewForm = document.getElementById('view-update-form');
    const viewSuccess = document.getElementById('view-update-success');
    const msgBox = document.getElementById('msg-update-feedback');

    viewSearch.style.display = 'none';
    viewForm.style.display = 'none';
    viewSuccess.style.display = 'none';
    if (msgBox) msgBox.style.display = 'none';

    if (viewName === 'search') viewSearch.style.display = 'block';
    else if (viewName === 'form') viewForm.style.display = 'block';
    else if (viewName === 'success') viewSuccess.style.display = 'flex';
}

// 2. Abrir/Fechar
function abrirModalUpdate() {
    const modal = document.getElementById('modal-update-overlay');
    const inputSearch = document.getElementById('update-search-input');
    if (modal) {
        toggleUpdateView('search');
        if (inputSearch) inputSearch.value = '';
        modal.style.display = 'flex';
    }
}

function fecharModalUpdate() {
    const modal = document.getElementById('modal-update-overlay');
    if (modal) modal.style.display = 'none';
}

const btnUpdateSearch = document.getElementById('btn-update-search-action');
if (btnUpdateSearch) {
    btnUpdateSearch.addEventListener('click', async () => {
        const matricula = document.getElementById('update-search-input').value.trim();
        const feedbackBox = document.getElementById('msg-update-feedback');
        const showFb = (msg) => {
            feedbackBox.textContent = msg;
            feedbackBox.style.display = 'block';
            feedbackBox.className = 'feedback-box feedback-error';
        };
        if (!matricula) {
            showFb('Informe a matrícula.');
            return;
        }
        const originalText = btnUpdateSearch.innerHTML;
        btnUpdateSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
        btnUpdateSearch.disabled = true;

        try {
            const response = await fetch(`/api/buscar-usuario/?matricula=${matricula}`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('edit-matricula').value = data.matricula;
                document.getElementById('edit-nome').value = data.nome;
                document.getElementById('edit-data').value = data.data_registro_formatada;
                
                toggleUpdateView('form');
            } else {
                showFb(data.error || 'Usuário não encontrado.');
            }
        } catch (error) {
            console.error(error);
            showFb('Erro de conexão.');
        } finally {
            btnUpdateSearch.innerHTML = originalText;
            btnUpdateSearch.disabled = false;
        }
    });
}

const btnUpdateSave = document.getElementById('btn-update-save-action');
if (btnUpdateSave) {
    btnUpdateSave.addEventListener('click', async () => {
        const matricula = document.getElementById('edit-matricula').value;
        const novoNome = document.getElementById('edit-nome').value.trim();
        const csrftoken = getCookie('csrftoken');
        if (!novoNome) {
            alert('O nome não pode ficar vazio.');
            return;
        }
        const originalText = btnUpdateSave.innerHTML;
        btnUpdateSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btnUpdateSave.disabled = true;

        try {
            const response = await fetch('/api/atualizar-usuario/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ 
                    matricula: matricula,
                    novo_nome: novoNome 
                })
            });
            const result = await response.json();
            if (response.ok) {
                toggleUpdateView('success');
                setTimeout(() => {
                    fecharModalUpdate();
                    window.location.reload();
                }, 2000);
            } else {
                alert('Erro ao atualizar: ' + (result.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar.');
        } finally {
            btnUpdateSave.innerHTML = originalText;
            btnUpdateSave.disabled = false;
        }
    });
}