const express = require('express');
const { httpError } = require('../utils/validation');
const {
  obterCliente,
  criarInteracao,
  editarInteracao,
  excluirInteracao,
  ordenarInteracoes
} = require('../services/interacoesService');

function criarRotasInteracoes(database) {
  const router = express.Router({ mergeParams: true });

  router.get('/', async (req, res) => {
    const db = await database.read();
    const cliente = obterCliente(db, req.params.whatsapp);
    res.json(ordenarInteracoes(cliente.interacoes));
  });

  router.get('/:interacaoId', async (req, res) => {
    const db = await database.read();
    const cliente = obterCliente(db, req.params.whatsapp);
    const interacao = cliente.interacoes.find((item) => item.id === req.params.interacaoId);
    if (!interacao) throw httpError(404, 'Interação não encontrada.');
    res.json(interacao);
  });

  router.post('/', async (req, res) => {
    const interacao = await database.transaction((db) => {
      const cliente = obterCliente(db, req.params.whatsapp);
      return structuredClone(criarInteracao(cliente, req.body));
    });
    res.status(201).json(interacao);
  });

  router.patch('/:interacaoId', async (req, res) => {
    const interacao = await database.transaction((db) => {
      const cliente = obterCliente(db, req.params.whatsapp);
      return structuredClone(editarInteracao(cliente, req.params.interacaoId, req.body));
    });
    res.json(interacao);
  });

  router.delete('/:interacaoId', async (req, res) => {
    await database.transaction((db) => {
      const cliente = obterCliente(db, req.params.whatsapp);
      excluirInteracao(cliente, req.params.interacaoId);
    });
    res.status(204).end();
  });

  return router;
}

module.exports = { criarRotasInteracoes };
