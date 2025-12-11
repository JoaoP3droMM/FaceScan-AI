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
const csrftoken = getCookie('csrftoken')

// Elementos do DOM
const video = document.getElementById('webcam')
const canvas = document.getElementById('canvas')
const statusDiv = document.getElementById('status')
const matriculaInput = document.getElementById('matricula')

const btnStart = document.getElementById('btnStartWebcam')
const btnCaptura = document.getElementById('btnCaptura')
const btnTreinamento = document.getElementById('btnTreinamento')
const btnReconhecimento = document.getElementById('btnReconhecimento')

let stream = null

// Ligar Webcam
btnStart.addEventListener('click', async () => {
    if (stream) { // Desliga se já estiver ligada
        stream.getTracks().forEach(track => track.stop())
        video.srcObject = null
        stream = null
        btnStart.textContent = '1. Ligar Webcam'
        return
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        video.srcObject = stream
        btnStart.textContent = 'Desligar Webcam'
        statusDiv.textContent = 'Webcam ligada.'
    } catch (err) {
        console.error('Erro ao acessar a webcam: ', err)
        statusDiv.textContent = 'Erro ao acessar webcam.'
    }
})

// Função helper para tirar a foto e pegar os dados
function snapPicture() {
    if (!stream) {
        statusDiv.textContent = 'Ligue a webcam primeiro.'
        return null
    }
    const context = canvas.getContext('2d')
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.setTransform(1, 0, 0, 1, 0, 0) 
    return canvas.toDataURL('image/jpeg')
}

// Salvar Foto
btnCaptura.addEventListener('click', async () => {
    const matricula = matriculaInput.value
    if (!matricula) {
        statusDiv.textContent = 'Digite a matrícula.'
        return
    }
    const imageData = snapPicture()
    if (!imageData) return

    statusDiv.textContent = 'Salvando foto...'
    btnCaptura.disabled = true

    try {
        const response = await fetch('/salvar-foto/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                matricula: matricula,
                image_data: imageData
            })
        })

        const result = await response.json()
        statusDiv.textContent = result.message || result.error
    
    } catch (err) {
        console.error('Erro em salvar-foto:', err)
        statusDiv.textContent = 'Erro ao salvar. Tente novamente.'
    } finally {
        btnCaptura.disabled = false
    }
})

// Treinar Modelo
btnTreinamento.addEventListener('click', async () => {
    statusDiv.textContent = 'Iniciando treinamento... Isso pode demorar.'
    btnTreinamento.disabled = true
    
    try {
        const response = await fetch('/run-treinamento/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            }
        })
        const result = await response.json()

        if (result.status === 'ok') {
            let outputMsg = result.output.split('\n').filter(line => line.trim() !== '').pop() || 'Concluído'
            statusDiv.textContent = `Treinamento: ${outputMsg}`
        } else {
            statusDiv.textContent = `Erro no treinamento: ${result.error}`
        }
    } catch (err) {
        console.error('Erro em run-treinamento:', err)
        statusDiv.textContent = 'Erro ao treinar. Tente novamente.'
    } finally {
        btnTreinamento.disabled = false
    }
})

// Reconhecer
btnReconhecimento.addEventListener('click', async () => {
    const imageData = snapPicture()
    if (!imageData) return

    statusDiv.textContent = 'Reconhecendo...'
    btnReconhecimento.disabled = true

    try {
        const response = await fetch('/reconhecer-foto/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                image_data: imageData
            })
        })

        const result = await response.json()
        
        if (result.nome && result.nome !== 'Desconhecido') {
            statusDiv.textContent = `Pessoa identificada: ${result.nome} (Distância: ${result.distancia.toFixed(4)})`
        } else if (result.error) {
            statusDiv.textContent = `Erro: ${result.error}`
        } 
        else {
            statusDiv.textContent = 'Desconhecido.'
        }
    } catch (err) {
        console.error('Erro em reconhecer-foto:', err)
        statusDiv.textContent = 'Erro ao reconhecer. Tente novamente.'
    } finally {
        btnReconhecimento.disabled = false
    }
})