const path = require('node:path');
const fs = require('node:fs/promises');
const { JsonDatabase } = require('./src/services/database');
const { criarApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db.json');
const uploadDir = path.join(__dirname, 'uploads');

async function iniciar() {
  await fs.mkdir(uploadDir, { recursive: true });
  const database = new JsonDatabase(dbPath);
  await database.init();
  const app = criarApp({ database, uploadDir });
  const server = app.listen(PORT, () => {
    console.log(`CRM disponível em http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  iniciar().catch((erro) => {
    console.error('Falha ao iniciar:', erro.message);
    process.exitCode = 1;
  });
}

module.exports = { iniciar };
