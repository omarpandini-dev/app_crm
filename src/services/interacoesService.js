const crypto = require('node:crypto');
const { validarInteracao, httpError } = require('../utils/validation');

function obterCliente(db, whatsapp) {
  const cliente = db.clientes[whatsapp];
  if (!cliente) throw httpError(404, 'Cliente não encontrado.');
  if (!Array.isArray(cliente.interacoes)) cliente.interacoes = [];
  return cliente;
}

function recalcularUltimoContato(cliente) {
  cliente.ultimoContato = cliente.interacoes.length
    ? cliente.interacoes.reduce((maisRecente, item) => item.dataHora > maisRecente ? item.dataHora : maisRecente, '')
    : '';
}

function criarInteracao(cliente, body) {
  const dados = validarInteracao(body);
  const agora = new Date().toISOString();
  const interacao = { id: crypto.randomUUID(), ...dados, criadoEm: agora, atualizadoEm: agora };
  cliente.interacoes.push(interacao);
  recalcularUltimoContato(cliente);
  cliente.atualizadoEm = agora;
  return interacao;
}

function editarInteracao(cliente, id, body) {
  const interacao = cliente.interacoes.find((item) => item.id === id);
  if (!interacao) throw httpError(404, 'Interação não encontrada.');
  const dados = validarInteracao(body);
  Object.assign(interacao, dados, { atualizadoEm: new Date().toISOString() });
  recalcularUltimoContato(cliente);
  cliente.atualizadoEm = interacao.atualizadoEm;
  return interacao;
}

function excluirInteracao(cliente, id) {
  const indice = cliente.interacoes.findIndex((item) => item.id === id);
  if (indice < 0) throw httpError(404, 'Interação não encontrada.');
  const [excluida] = cliente.interacoes.splice(indice, 1);
  recalcularUltimoContato(cliente);
  cliente.atualizadoEm = new Date().toISOString();
  return excluida;
}

function ordenarInteracoes(interacoes) {
  return [...interacoes].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
}

module.exports = {
  obterCliente,
  criarInteracao,
  editarInteracao,
  excluirInteracao,
  ordenarInteracoes,
  recalcularUltimoContato
};
