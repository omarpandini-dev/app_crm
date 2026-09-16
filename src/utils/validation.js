const { STATUS, TIPOS_INTERACAO } = require('../constants');

function stringLimitada(valor, nome, maximo, { obrigatorio = false } = {}) {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') throw httpError(400, `${nome} deve ser um texto.`);
  const texto = valor.trim();
  if (obrigatorio && !texto) throw httpError(400, `${nome} é obrigatório.`);
  if (texto.length > maximo) throw httpError(400, `${nome} deve ter no máximo ${maximo} caracteres.`);
  return texto;
}

function dataIso(valor, nome = 'Data e hora', { vazio = false } = {}) {
  if ((valor === '' || valor == null) && vazio) return '';
  if (!valor || Number.isNaN(Date.parse(valor))) throw httpError(400, `${nome} inválida.`);
  return new Date(valor).toISOString();
}

function validarAtualizacaoCliente(body) {
  body = body || {};
  const permitidos = new Set(['status', 'ultimoContato', 'observacoes']);
  const extras = Object.keys(body || {}).filter((campo) => !permitidos.has(campo));
  if (extras.length) throw httpError(400, `Campos não permitidos: ${extras.join(', ')}.`);
  const dados = {};
  if (body.status !== undefined) {
    if (!STATUS.includes(body.status)) throw httpError(400, 'Status inválido.');
    dados.status = body.status;
  }
  if (body.ultimoContato !== undefined) dados.ultimoContato = dataIso(body.ultimoContato, 'Último contato', { vazio: true });
  if (body.observacoes !== undefined) dados.observacoes = stringLimitada(body.observacoes, 'Observações', 5000);
  return dados;
}

function validarInteracao(body) {
  if (!body || typeof body !== 'object') throw httpError(400, 'Dados da interação são obrigatórios.');
  const dataHora = dataIso(body.dataHora);
  if (!TIPOS_INTERACAO.includes(body.tipo)) throw httpError(400, 'Tipo de interação inválido.');
  const titulo = stringLimitada(body.titulo, 'Título', 150, { obrigatorio: true });
  const descricao = stringLimitada(body.descricao ?? '', 'Descrição', 5000);
  const resultado = stringLimitada(body.resultado ?? '', 'Resultado', 3000);
  return { dataHora, tipo: body.tipo, titulo, descricao, resultado };
}

function httpError(status, message) {
  const erro = new Error(message);
  erro.status = status;
  return erro;
}

module.exports = { validarAtualizacaoCliente, validarInteracao, httpError };
