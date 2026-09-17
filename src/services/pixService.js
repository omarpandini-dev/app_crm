const QRCode = require('qrcode');
const { httpError } = require('../utils/validation');

const CONFIG_PIX = {
  chave: process.env.PIX_KEY || '62197420000167',
  nome: process.env.PIX_RECEIVER_NAME || 'OJP SISTEMAS LTDA',
  cidade: process.env.PIX_RECEIVER_CITY || 'JOINVILLE'
};

function normalizarTexto(valor, limite) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .toUpperCase()
    .slice(0, limite);
}

function campo(id, valor) {
  const texto = String(valor);
  return `${id}${String(texto.length).padStart(2, '0')}${texto}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function criarTxid({ whatsapp = '', dataVencimento = '' } = {}) {
  const contato = String(whatsapp).replace(/\D/g, '').slice(-11);
  const data = String(dataVencimento).replace(/\D/g, '').slice(0, 8);
  const referencia = contato || data ? `CRM${contato}${data}` : `CRM${Date.now().toString(36)}`;
  return normalizarTexto(referencia, 25) || '***';
}

function gerarPayloadPix({ valor, whatsapp, dataVencimento }) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0.01 || numero > 1000000) throw httpError(400, 'Informe um valor Pix válido.');
  const chave = String(CONFIG_PIX.chave).replace(/\D/g, '');
  if (chave.length !== 14) throw new Error('A chave Pix CNPJ configurada é inválida.');
  const contaPix = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const txid = criarTxid({ whatsapp, dataVencimento });
  const adicional = campo('05', txid);
  const semCrc = [
    campo('00', '01'),
    campo('26', contaPix),
    campo('52', '0000'),
    campo('53', '986'),
    campo('54', numero.toFixed(2)),
    campo('58', 'BR'),
    campo('59', normalizarTexto(CONFIG_PIX.nome, 25)),
    campo('60', normalizarTexto(CONFIG_PIX.cidade, 15)),
    campo('62', adicional),
    '6304'
  ].join('');
  return { payload: `${semCrc}${crc16(semCrc)}`, txid, valor: Math.round(numero * 100) / 100 };
}

async function gerarQrCodePix(dados) {
  const pix = gerarPayloadPix(dados);
  const qrCode = await QRCode.toDataURL(pix.payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 420,
    color: { dark: '#102c3d', light: '#ffffff' }
  });
  return { ...pix, qrCode, recebedor: CONFIG_PIX.nome, cidade: CONFIG_PIX.cidade, chave: CONFIG_PIX.chave };
}

module.exports = { gerarPayloadPix, gerarQrCodePix, crc16, CONFIG_PIX };
