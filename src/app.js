const express = require('express');
const multer = require('multer');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { criarRotasClientes } = require('./routes/clientes');
const { criarRotasInteracoes } = require('./routes/interacoes');
const { importarCsv } = require('./services/csvImporter');

function criarApp({ database, uploadDir, publicDir = path.join(__dirname, '..', 'public') }) {
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const extensaoValida = path.extname(file.originalname).toLowerCase() === '.csv';
      const erro = extensaoValida ? null : Object.assign(new Error('Selecione um arquivo CSV.'), { status: 400 });
      cb(erro, extensaoValida);
    }
  });

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(publicDir));
  app.use('/api/clientes/:whatsapp/interacoes', criarRotasInteracoes(database));
  app.use('/api/clientes', criarRotasClientes(database));

  app.get('/api/resumo', async (_req, res) => {
    const db = await database.read();
    const clientes = Object.values(db.clientes);
    const contar = (status) => clientes.filter((cliente) => cliente.status === status).length;
    res.json({
      total: clientes.length,
      pendentes: contar('Pendente'),
      aguardandoRetorno: contar('Aguardando retorno'),
      propostasEnviadas: contar('Proposta enviada'),
      fechados: contar('Fechado'),
      interacoes: clientes.reduce((total, cliente) => total + (cliente.interacoes?.length || 0), 0)
    });
  });

  app.post('/api/importar', upload.single('arquivo'), async (req, res) => {
    if (!req.file) {
      const erro = new Error('Arquivo CSV é obrigatório.');
      erro.status = 400;
      throw erro;
    }
    try {
      const resultado = await importarCsv(req.file.path, database);
      res.status(201).json(resultado);
    } finally {
      await fs.rm(req.file.path, { force: true }).catch(() => {});
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ erro: 'Endpoint não encontrado.' }));
  app.use((erro, _req, res, _next) => {
    const status = erro.status || (erro instanceof multer.MulterError ? 400 : 500);
    const mensagem = erro instanceof multer.MulterError && erro.code === 'LIMIT_FILE_SIZE'
      ? 'O CSV excede o limite de 5 MB.'
      : erro.message || 'Erro interno do servidor.';
    if (status >= 500) console.error(erro);
    res.status(status).json({ erro: mensagem });
  });
  return app;
}

module.exports = { criarApp };
