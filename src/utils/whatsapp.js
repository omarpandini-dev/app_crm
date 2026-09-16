function normalizarWhatsApp(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

function whatsappValido(valor) {
  const numero = normalizarWhatsApp(valor);
  return numero.length >= 10 && numero.length <= 15;
}

module.exports = { normalizarWhatsApp, whatsappValido };
