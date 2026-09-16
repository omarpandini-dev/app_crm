const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

class JsonDatabase {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.backupPath = `${this.filePath}.bak`;
    this.queue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await this.#writeAtomic({ clientes: {} }, false);
    }
    await this.read();
  }

  async read() {
    let texto;
    try {
      texto = await fs.readFile(this.filePath, 'utf8');
      const dados = JSON.parse(texto);
      if (!dados || typeof dados !== 'object' || !dados.clientes || typeof dados.clientes !== 'object' || Array.isArray(dados.clientes)) {
        throw new Error('Estrutura inválida');
      }
      return dados;
    } catch (erro) {
      const detalhe = erro.code === 'ENOENT' ? 'arquivo não encontrado' : 'JSON vazio, inválido ou com estrutura incorreta';
      throw new Error(`Não foi possível ler ${path.basename(this.filePath)}: ${detalhe}. O arquivo original foi preservado.`);
    }
  }

  transaction(mutator) {
    const operacao = this.queue.then(async () => {
      const dados = await this.read();
      const resultado = await mutator(dados);
      await this.#writeAtomic(dados, true);
      return resultado;
    });
    this.queue = operacao.catch(() => {});
    return operacao;
  }

  async #writeAtomic(dados, criarBackup) {
    const tempPath = `${this.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    const conteudo = `${JSON.stringify(dados, null, 2)}\n`;
    try {
      if (criarBackup) await fs.copyFile(this.filePath, this.backupPath);
      await fs.writeFile(tempPath, conteudo, { encoding: 'utf8', flag: 'wx' });
      await fs.rename(tempPath, this.filePath);
    } catch (erro) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      throw erro;
    }
  }
}

module.exports = { JsonDatabase };
