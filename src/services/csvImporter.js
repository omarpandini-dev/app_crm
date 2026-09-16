const fs = require('node:fs/promises');
const { parse } = require('csv-parse/sync');
const { COLUNAS_CSV } = require('../constants');
const { normalizarWhatsApp, whatsappValido } = require('../utils/whatsapp');
const { httpError } = require('../utils/validation');

const MAPA = {
  Empresa: 'empresa',
  Segmento: 'segmento',
  Cidade: 'cidade',
  WhatsApp: 'whatsapp',
  'Link WhatsApp': 'linkWhatsApp',
  'Endereço': 'endereco',
  'Presença digital encontrada': 'presencaDigital',
  Prioridade: 'prioridade',
  'Oportunidade para landing page': 'oportunidadeLandingPage',
  'Fonte pública': 'fontePublica',
  'Verificado em': 'verificadoEm'
};

function normalizarCabecalho(valor) {
  return String(valor).replace(/^\uFEFF/, '').trim();
}

async function importarCsv(filePath, database) {
  const buffer = await fs.readFile(filePath);
  const texto = buffer.toString('utf8').replace(/^\uFEFF/, '');
  let linhas;
  try {
    linhas = parse(texto, { columns: (headers) => headers.map(normalizarCabecalho), skip_empty_lines: true, trim: true, bom: true });
  } catch (erro) {
    throw httpError(400, `CSV inválido: ${erro.message}`);
  }

  const cabecalhos = texto.split(/\r?\n/, 1)[0]
    ? parse(texto.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, ''), { relax_quotes: true })[0].map(normalizarCabecalho)
    : [];
  const faltantes = COLUNAS_CSV.filter((coluna) => !cabecalhos.includes(coluna));
  if (faltantes.length) throw httpError(400, `Colunas obrigatórias ausentes: ${faltantes.join(', ')}.`);

  return database.transaction((db) => {
    const agora = new Date().toISOString();
    const vistos = new Set();
    let importados = 0;
    let jaCadastrados = 0;
    let invalidos = 0;

    for (const linha of linhas) {
      const whatsapp = normalizarWhatsApp(linha.WhatsApp);
      if (!whatsappValido(whatsapp)) {
        invalidos += 1;
        continue;
      }
      if (vistos.has(whatsapp)) {
        jaCadastrados += 1;
        continue;
      }
      vistos.add(whatsapp);
      const importado = {};
      for (const [coluna, campo] of Object.entries(MAPA)) {
        importado[campo] = campo === 'whatsapp' ? whatsapp : String(linha[coluna] ?? '').trim();
      }
      const existente = db.clientes[whatsapp];
      if (existente) {
        jaCadastrados += 1;
        let alterou = false;
        for (const [campo, valor] of Object.entries(importado)) {
          if (campo !== 'whatsapp' && valor && existente[campo] !== valor) {
            existente[campo] = valor;
            alterou = true;
          }
        }
        if (alterou) existente.atualizadoEm = agora;
        continue;
      }
      db.clientes[whatsapp] = {
        ...importado,
        status: 'Pendente',
        ultimoContato: '',
        observacoes: '',
        interacoes: [],
        criadoEm: agora,
        atualizadoEm: agora
      };
      importados += 1;
    }
    return { importados, jaCadastrados, invalidos, totalProcessados: linhas.length };
  });
}

module.exports = { importarCsv };
