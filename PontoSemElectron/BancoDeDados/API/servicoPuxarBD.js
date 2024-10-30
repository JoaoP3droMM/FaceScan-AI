const Service = require('node-windows').Service;

// Configura o serviço para puxarBanco.js
const svc = new Service({
    name: 'ServicoPuxarBanco',
    description: 'Serviço para puxar dados do banco',
    script: 'C:\\Projetos\\aCasaBrasileira\\Ponto\\NAMINHAMAQUINAFUNCIONA\\BancoDeDados\\API\\puxarBanco.js' // Corrigido para o caminho direto
  });

svc.on('install', () => {
  svc.start();
});

svc.install();