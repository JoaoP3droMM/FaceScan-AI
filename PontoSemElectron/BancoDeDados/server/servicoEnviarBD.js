const Service = require('node-windows').Service;

// Configura o serviço para enviarBanco.js
const svc = new Service({
  name: 'ServicoEnviarBanco',
  description: 'Serviço para enviar dados do banco',
  script: 'C:/Projetos/aCasaBrasileira/Ponto/NAMINHAMAQUINAFUNCIONA/BancoDeDados/server/enviarBanco.js'
});

svc.on('install', () => {
  svc.start();
});

svc.install();