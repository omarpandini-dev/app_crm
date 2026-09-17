const express = require('express');
const { httpError } = require('../utils/validation');
const {
  obterClienteComPagamentos,
  criarPagamento,
  editarPagamento,
  excluirPagamento,
  ordenarPagamentos
} = require('../services/pagamentosService');

function criarRotasPagamentos(database) {
  const router = express.Router({ mergeParams: true });

  router.get('/', async (req, res) => {
    const db = await database.read();
    const cliente = obterClienteComPagamentos(db, req.params.whatsapp);
    res.json(ordenarPagamentos(cliente.pagamentos));
  });

  router.get('/:pagamentoId', async (req, res) => {
    const db = await database.read();
    const cliente = obterClienteComPagamentos(db, req.params.whatsapp);
    const pagamento = cliente.pagamentos.find((item) => item.id === req.params.pagamentoId);
    if (!pagamento) throw httpError(404, 'Pagamento não encontrado.');
    res.json(pagamento);
  });

  router.post('/', async (req, res) => {
    const pagamento = await database.transaction((db) => {
      const cliente = obterClienteComPagamentos(db, req.params.whatsapp);
      return structuredClone(criarPagamento(cliente, req.body));
    });
    res.status(201).json(pagamento);
  });

  router.patch('/:pagamentoId', async (req, res) => {
    const pagamento = await database.transaction((db) => {
      const cliente = obterClienteComPagamentos(db, req.params.whatsapp);
      return structuredClone(editarPagamento(cliente, req.params.pagamentoId, req.body));
    });
    res.json(pagamento);
  });

  router.delete('/:pagamentoId', async (req, res) => {
    await database.transaction((db) => {
      const cliente = obterClienteComPagamentos(db, req.params.whatsapp);
      excluirPagamento(cliente, req.params.pagamentoId);
    });
    res.status(204).end();
  });

  return router;
}

module.exports = { criarRotasPagamentos };
