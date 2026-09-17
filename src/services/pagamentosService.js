const crypto = require('node:crypto');
const { validarPagamento, httpError } = require('../utils/validation');

function obterClienteComPagamentos(db, whatsapp) {
  const cliente = db.clientes[whatsapp];
  if (!cliente) throw httpError(404, 'Cliente não encontrado.');
  if (!Array.isArray(cliente.pagamentos)) cliente.pagamentos = [];
  return cliente;
}

function criarPagamento(cliente, body) {
  const dados = validarPagamento(body);
  const agora = new Date().toISOString();
  const pagamento = { id: crypto.randomUUID(), ...dados, criadoEm: agora, atualizadoEm: agora };
  cliente.pagamentos.push(pagamento);
  cliente.atualizadoEm = agora;
  return pagamento;
}

function editarPagamento(cliente, id, body) {
  const pagamento = cliente.pagamentos.find((item) => item.id === id);
  if (!pagamento) throw httpError(404, 'Pagamento não encontrado.');
  Object.assign(pagamento, validarPagamento(body, pagamento), { atualizadoEm: new Date().toISOString() });
  cliente.atualizadoEm = pagamento.atualizadoEm;
  return pagamento;
}

function excluirPagamento(cliente, id) {
  const indice = cliente.pagamentos.findIndex((item) => item.id === id);
  if (indice < 0) throw httpError(404, 'Pagamento não encontrado.');
  const [excluido] = cliente.pagamentos.splice(indice, 1);
  cliente.atualizadoEm = new Date().toISOString();
  return excluido;
}

function ordenarPagamentos(pagamentos) {
  return [...pagamentos].sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento));
}

module.exports = { obterClienteComPagamentos, criarPagamento, editarPagamento, excluirPagamento, ordenarPagamentos };
