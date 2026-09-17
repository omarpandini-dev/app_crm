const { STATUS, TIPOS_INTERACAO, STATUS_PAGAMENTO } = require('../constants');

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
  const permitidos = new Set(['status', 'ultimoContato', 'observacoes', 'diaVencimento']);
  const extras = Object.keys(body || {}).filter((campo) => !permitidos.has(campo));
  if (extras.length) throw httpError(400, `Campos não permitidos: ${extras.join(', ')}.`);
  const dados = {};
  if (body.status !== undefined) {
    if (!STATUS.includes(body.status)) throw httpError(400, 'Status inválido.');
    dados.status = body.status;
  }
  if (body.ultimoContato !== undefined) dados.ultimoContato = dataIso(body.ultimoContato, 'Último contato', { vazio: true });
  if (body.observacoes !== undefined) dados.observacoes = stringLimitada(body.observacoes, 'Observações', 5000);
  if (body.diaVencimento !== undefined) {
    if (body.diaVencimento === '' || body.diaVencimento === null) dados.diaVencimento = null;
    else {
      const dia = Number(body.diaVencimento);
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) throw httpError(400, 'O dia de vencimento deve estar entre 1 e 31.');
      dados.diaVencimento = dia;
    }
  }
  return dados;
}

function dataSomente(valor, nome, { obrigatorio = false } = {}) {
  if (valor === '' || valor == null) {
    if (obrigatorio) throw httpError(400, `${nome} é obrigatória.`);
    return '';
  }
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw httpError(400, `${nome} inválida.`);
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) throw httpError(400, `${nome} inválida.`);
  return valor;
}

function validarPagamento(body, atual = {}) {
  body = body || {};
  const dataVencimento = body.dataVencimento !== undefined ? dataSomente(body.dataVencimento, 'Data de vencimento', { obrigatorio: true }) : atual.dataVencimento;
  if (!dataVencimento) throw httpError(400, 'Data de vencimento é obrigatória.');
  const valor = Number(body.valor !== undefined ? body.valor : (atual.valor ?? 50));
  if (!Number.isFinite(valor) || valor <= 0 || valor > 1000000) throw httpError(400, 'Valor do pagamento inválido.');
  const dataPagamento = body.dataPagamento !== undefined ? dataSomente(body.dataPagamento, 'Data de pagamento') : (atual.dataPagamento || '');
  let status = body.status !== undefined ? body.status : (atual.status || (dataPagamento ? 'Pago' : 'Pendente'));
  if (!STATUS_PAGAMENTO.includes(status)) throw httpError(400, 'Status do pagamento inválido.');
  if (dataPagamento) status = 'Pago';
  if (status === 'Pago' && !dataPagamento) throw httpError(400, 'Informe a data do pagamento para marcar como pago.');
  const observacoes = body.observacoes !== undefined ? stringLimitada(body.observacoes, 'Observações do pagamento', 1000) : (atual.observacoes || '');
  return { dataVencimento, dataPagamento, valor: Math.round(valor * 100) / 100, status, observacoes };
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

module.exports = { validarAtualizacaoCliente, validarInteracao, validarPagamento, httpError };
