const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const axios = require('axios') // Para fazer requisições HTTP

let mainWindow
let recognitionProcess = null

// Função para criar a janela principal
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 2000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: true,
        },
        icon: path.join(__dirname, 'build/icon.png'),
        
        // Esconde a menu bar
        autoHideMenuBar: true,
    })

    mainWindow.loadFile('html/ponto.html')

    // Interromper o reconhecimento e fechar a câmera quando a janela for fechada
    mainWindow.on('close', () => {
        if (recognitionProcess) {
            console.log('Finalizando processo de reconhecimento e fechando câmera...')
            recognitionProcess.kill(); // Mata o processo de reconhecimento
        }
    })
}

// Função para executar scripts Python usando spawn (para permitir matar o processo)
function execPythonScript(scriptPath, args = [], onData, onError, onClose) {
    const pythonProcess = spawn('python', [scriptPath, ...args]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        if (onData) onData(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        if (onError) onError(data.toString());
    });

    pythonProcess.on('close', (code) => {
        console.log(`Processo de Python finalizado com código ${code}`);
        if (onClose) onClose(code);
    });

    return pythonProcess; // Retorna o processo para que possamos matá-lo se necessário
}

// Função para iniciar a captura e o treinamento
function startCaptureAndTraining(matricula) {
    console.log(`Iniciando captura com a matrícula: ${matricula}`)

    const capturaScriptPath = path.join("C:/", "Program Files", "PontoCB", "reconhecimentoFacial", "captura.py" )
    execPythonScript(capturaScriptPath, [matricula],
        (data) => {
            console.log(`Saída da captura: ${data}`)
            mainWindow.webContents.send('capture-log', data)
        },
        (error) => {
            console.error(`Erro no script de captura: ${error}`)
            mainWindow.webContents.send('capture-error', error)
        },
        () => {
            console.log("Captura finalizada.")

            // Iniciar o treinamento
            const treinamentoScriptPath = path.join('C:/', 'Program Files', 'PontoCB', 'reconhecimentoFacial', 'treinamento.py')
            execPythonScript(treinamentoScriptPath, [],
                (data) => {
                    console.log(`Saída do treinamento: ${data}`)
                    mainWindow.webContents.send('training-log', data)
                },
                (error) => {
                    console.error(`Erro no script de treinamento: ${error}`)
                    mainWindow.webContents.send('training-error', error)
                },
                (code) => {
                    console.log(`Treinamento finalizado com o código ${code}`)
                    mainWindow.webContents.send('training-complete', code)
                }
            )
        }
    )
}

// Função para iniciar o reconhecimento facial
function startRecognition() {
    console.log("Iniciando reconhecimento facial...");

    const reconhecimentoScriptPath = path.join("C:/", "Program Files", "PontoCB", "reconhecimentoFacial", "reconhecimento.py");

    // Atribua o processo do reconhecimento à variável recognitionProcess
    recognitionProcess = execPythonScript(reconhecimentoScriptPath, [],
        (data) => {
            console.log("Dados recebidos do script Python:", data);
            try {
                const jsonLines = data.split('\n').filter(line => line.trim().startsWith('{'));
                if (jsonLines.length > 0) {
                    const result = JSON.parse(jsonLines[0].trim());
                    console.log("JSON processado com sucesso:", result);
                    mainWindow.webContents.send('recognition-complete', result);
                } else {
                    throw new Error("Nenhum JSON válido encontrado na saída do script Python.");
                }
            } catch (error) {
                console.error("Erro ao processar a resposta do reconhecimento:", error);
                mainWindow.webContents.send('recognition-error', error.message);
            }
        },
        (error) => {
            console.error("Erro no reconhecimento facial:", error);
            mainWindow.webContents.send('recognition-error', error);
        }
    );
}

// Função para executar o script Python e processar a matrícula
function executeRecognitionAndGetMatricula() {
    console.log("Iniciando reconhecimento facial e obtendo matrícula...")

    const reconhecimentoScriptPath = path.join("C:/", "Program Files", "PontoCB", "reconhecimentoFacial", "reconhecimento.py")
    execPythonScript(reconhecimentoScriptPath, [],
        (data) => {
            console.log("Dados recebidos do script Python:", data)
            try {
                const jsonLines = data.split('\n').filter(line => line.trim().startsWith('{'))
                if (jsonLines.length > 0) {
                    const result = JSON.parse(jsonLines[0].trim())
                    console.log("JSON processado com sucesso:", result)
                    const matricula = result.matricula // Ajuste conforme a estrutura do seu JSON
                    console.log(`Matrícula recebida: ${matricula}`)
                    
                    // **Buscar dados no banco de dados usando chamada HTTP para API**
                    axios.get(`http://localhost:3000/buscarFuncionario/${matricula}`)
                        .then(response => {
                            console.log("Funcionário encontrado:", response.data)
                            mainWindow.webContents.send('funcionario-dados', response.data)
                        })
                        .catch(error => {
                            console.error("Erro ao buscar funcionário:", error)
                            mainWindow.webContents.send('buscar-error', error.message)
                        })

                } else {
                    throw new Error("Nenhum JSON válido encontrado na saída do script Python.")
                }
            } catch (error) {
                console.error("Erro ao processar a resposta do reconhecimento:", error)
                mainWindow.webContents.send('recognition-error', error.message)
            }
        },
        (error) => {
            console.error("Erro no reconhecimento facial:", error)
            mainWindow.webContents.send('recognition-error', error)
        }
    )
}

// Eventos do Electron
app.whenReady().then(() => {
    createWindow()

    ipcMain.on('start-capture', (event, matricula) => startCaptureAndTraining(matricula))
    ipcMain.on('start-recognition', () => {
        console.log("Recebido pedido de reconhecimento facial")
        startRecognition()
    })
    ipcMain.on('execute-recognition', () => {
        console.log("Recebido pedido de reconhecimento e obtenção de matrícula")
        executeRecognitionAndGetMatricula()
    })

    // Evento para parar o reconhecimento facial
    ipcMain.on('stop-recognition', () => {
        if (recognitionProcess) {
            console.log('Parando o reconhecimento facial...');
            recognitionProcess.kill(); // Mata o processo de reconhecimento facial
            recognitionProcess = null; // Limpa a referência ao processo
        } else {
            console.log('Nenhum processo de reconhecimento em andamento.');
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})