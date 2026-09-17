const express = require('express');
const { validarAtualizacaoCliente, httpError } = require('../utils/validation');
const {
  calcularProximoVencimento,
  calcularVencimentoAtrasado,
  diasAteVencimento,
  diasEmAtraso,
  venceEmBreve,
  possuiVencimentoAtrasado,
  clientePagoNoMes
} = require('../services/vencimentosService');

function criarRotasClientes(database) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const db = await database.read();
    const busca = String(req.query.busca || '').trim().toLocaleLowerCase('pt-BR');
    const status = String(req.query.status || '');
    const prioridade = String(req.query.prioridade || '');
    const segmento = String(req.query.segmento || '');
    const comInteracoes = req.query.comInteracoes === '1' || req.query.comInteracoes === 'true';
    const proximosVencimentos = req.query.proximosVencimentos === '1' || req.query.proximosVencimentos === 'true';
    const pagosMes = req.query.pagosMes === '1' || req.query.pagosMes === 'true';
    const vencimentosAtrasados = req.query.vencimentosAtrasados === '1' || req.query.vencimentosAtrasados === 'true';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    let clientes = Object.values(db.clientes);
    const segmentos = [...new Set(clientes.map((cliente) => cliente.segmento).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (busca) clientes = clientes.filter((cliente) => [cliente.empresa, cliente.whatsapp, cliente.segmento, cliente.cidade]
      .some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(busca)));
    if (status) clientes = clientes.filter((cliente) => cliente.status === status);
    if (prioridade) clientes = clientes.filter((cliente) => cliente.prioridade === prioridade);
    if (segmento) clientes = clientes.filter((cliente) => cliente.segmento === segmento);
    if (comInteracoes) clientes = clientes.filter((cliente) => (cliente.interacoes?.length || 0) > 0);
    if (proximosVencimentos) clientes = clientes.filter((cliente) => venceEmBreve(cliente));
    if (pagosMes) clientes = clientes.filter((cliente) => clientePagoNoMes(cliente));
    if (vencimentosAtrasados) clientes = clientes.filter((cliente) => possuiVencimentoAtrasado(cliente));
    clientes.sort((a, b) => String(a.empresa).localeCompare(String(b.empresa), 'pt-BR'));
    const total = clientes.length;
    const totalPaginas = Math.max(1, Math.ceil(total / limit));
    const inicio = (page - 1) * limit;
    const pagina = clientes.slice(inicio, inicio + limit).map((cliente) => ({
      ...cliente,
      proximoVencimento: calcularProximoVencimento(cliente),
      diasAteVencimento: diasAteVencimento(cliente),
      vencimentoAtrasado: calcularVencimentoAtrasado(cliente),
      diasEmAtraso: diasEmAtraso(cliente)
    }));
    res.json({ clientes: pagina, paginacao: { page, limit, total, totalPaginas }, opcoes: { segmentos } });
  });

  router.get('/:whatsapp', async (req, res) => {
    const db = await database.read();
    const cliente = db.clientes[req.params.whatsapp];
    if (!cliente) throw httpError(404, 'Cliente não encontrado.');
    res.json({
      ...cliente,
      proximoVencimento: calcularProximoVencimento(cliente),
      diasAteVencimento: diasAteVencimento(cliente),
      vencimentoAtrasado: calcularVencimentoAtrasado(cliente),
      diasEmAtraso: diasEmAtraso(cliente)
    });
  });

  router.patch('/:whatsapp', async (req, res) => {
    const dados = validarAtualizacaoCliente(req.body);
    const cliente = await database.transaction((db) => {
      const atual = db.clientes[req.params.whatsapp];
      if (!atual) throw httpError(404, 'Cliente não encontrado.');
      if (dados.ultimoContato !== undefined && atual.interacoes?.length) {
        throw httpError(400, 'O último contato é calculado automaticamente quando existem interações.');
      }
      const futuro = { ...atual, ...dados };
      if (futuro.status === 'Fechado' && !futuro.diaVencimento) {
        throw httpError(400, 'Informe o dia de vencimento do cliente.');
      }
      Object.assign(atual, dados, { atualizadoEm: new Date().toISOString() });
      return structuredClone(atual);
    });
    res.json(cliente);
  });

  return router;
}

module.exports = { criarRotasClientes };
