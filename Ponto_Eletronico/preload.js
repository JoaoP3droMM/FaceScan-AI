const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Função para iniciar o reconhecimento facial
    startRecognition: () => {
        ipcRenderer.send('start-recognition');
    },

    // Função para parar o reconhecimento facial
    stopRecognition: () => {
        ipcRenderer.send('stop-recognition');
    },

    // Função para executar um script Python
    runPythonScript: () => ipcRenderer.invoke('runPythonScript'),

    // Função para iniciar a captura e o treinamento
    startCaptureAndTraining: (matricula) => {
        if (typeof matricula === 'string' && matricula.trim().length > 0) {
            ipcRenderer.send('start-capture', matricula);
        } else {
            console.error('Matrícula inválida fornecida para startCaptureAndTraining.');
        }
    },

    // Listeners para capturar logs, erros e conclusão da captura
    onCaptureLog: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('capture-log', (event, data) => callback(data));
        }
    },

    onCaptureError: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('capture-error', (event, error) => callback(error));
        }
    },

    onCaptureComplete: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('capture-complete', (event, code) => callback(code));
        }
    },

    // Listeners para capturar logs, erros e conclusão do treinamento
    onTrainingLog: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('training-log', (event, data) => callback(data));
        }
    },

    onTrainingError: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('training-error', (event, error) => callback(error));
        }
    },

    onTrainingComplete: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('training-complete', (event, code) => callback(code));
        }
    },

    // Listeners para reconhecimento facial
    onRecognitionComplete: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('recognition-complete', (event, result) => {
                console.log("Resultado do reconhecimento facial:", result);
                callback(result);
            });
        }
    },

    onRecognitionError: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('recognition-error', (event, error) => {
                console.error("Erro de reconhecimento facial:", error);
                callback(error);
            });
        }
    },

    // Listeners para logs de chat
    onChatLog: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('chat-log', (event, log) => {
                console.log("Log de chat:", log);
                callback(log);
            });
        }
    },
})