function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function criarVencimento(ano, mes, diaDesejado) {
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return new Date(ano, mes, Math.min(diaDesejado, ultimoDia));
}

function competenciaEncerrada(cliente, vencimento) {
  const competencia = formatarDataLocal(vencimento).slice(0, 7);
  return (cliente.pagamentos || []).some((pagamento) =>
    ['Pago', 'Cancelado'].includes(pagamento.status) && String(pagamento.dataVencimento || '').startsWith(competencia));
}

function calcularProximoVencimento(cliente, referencia = new Date()) {
  if (cliente.status !== 'Fechado' || !Number.isInteger(cliente.diaVencimento)) return '';
  const hoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  let vencimento = criarVencimento(hoje.getFullYear(), hoje.getMonth(), cliente.diaVencimento);
  if (vencimento < hoje) vencimento = criarVencimento(hoje.getFullYear(), hoje.getMonth() + 1, cliente.diaVencimento);
  let mesesVerificados = 0;
  while (competenciaEncerrada(cliente, vencimento) && mesesVerificados < 24) {
    vencimento = criarVencimento(vencimento.getFullYear(), vencimento.getMonth() + 1, cliente.diaVencimento);
    mesesVerificados += 1;
  }
  return formatarDataLocal(vencimento);
}

function calcularVencimentoAtrasado(cliente, referencia = new Date()) {
  if (cliente.status !== 'Fechado' || !Number.isInteger(cliente.diaVencimento)) return '';
  const hoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const atrasadosRegistrados = (cliente.pagamentos || [])
    .filter((pagamento) => ['Pendente', 'Atrasado'].includes(pagamento.status) && /^\d{4}-\d{2}-\d{2}$/.test(pagamento.dataVencimento))
    .map((pagamento) => pagamento.dataVencimento)
    .filter((data) => {
      const [ano, mes, dia] = data.split('-').map(Number);
      const vencimento = new Date(ano, mes - 1, dia);
      return vencimento < hoje && !competenciaEncerrada(cliente, vencimento);
    });
  const vencimentoMensal = criarVencimento(hoje.getFullYear(), hoje.getMonth(), cliente.diaVencimento);
  if (vencimentoMensal < hoje && !competenciaEncerrada(cliente, vencimentoMensal)) {
    atrasadosRegistrados.push(formatarDataLocal(vencimentoMensal));
  }
  return atrasadosRegistrados.sort()[0] || '';
}

function diasEmAtraso(cliente, referencia = new Date()) {
  const vencimento = calcularVencimentoAtrasado(cliente, referencia);
  if (!vencimento) return null;
  const [ano, mes, dia] = vencimento.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return Math.round((hoje - data) / 86400000);
}

function possuiVencimentoAtrasado(cliente, referencia = new Date()) {
  return Boolean(calcularVencimentoAtrasado(cliente, referencia));
}

function diasAteVencimento(cliente, referencia = new Date()) {
  const proximo = calcularProximoVencimento(cliente, referencia);
  if (!proximo) return null;
  const [ano, mes, dia] = proximo.split('-').map(Number);
  const vencimento = new Date(ano, mes - 1, dia);
  const hoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return Math.round((vencimento - hoje) / 86400000);
}

function venceEmBreve(cliente, referencia = new Date(), janelaDias = 7) {
  const dias = diasAteVencimento(cliente, referencia);
  return dias !== null && dias >= 0 && dias <= janelaDias;
}

function pagamentosPagosNoMes(cliente, referencia = new Date()) {
  const competencia = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, '0')}`;
  return (cliente.pagamentos || []).filter((pagamento) =>
    pagamento.status === 'Pago' && String(pagamento.dataPagamento || '').startsWith(competencia));
}

function clientePagoNoMes(cliente, referencia = new Date()) {
  return pagamentosPagosNoMes(cliente, referencia).length > 0;
}

function totalPagoNoMes(clientes, referencia = new Date()) {
  return clientes.reduce((total, cliente) => total + pagamentosPagosNoMes(cliente, referencia)
    .reduce((subtotal, pagamento) => subtotal + Number(pagamento.valor || 0), 0), 0);
}

module.exports = {
  calcularProximoVencimento,
  calcularVencimentoAtrasado,
  diasAteVencimento,
  diasEmAtraso,
  venceEmBreve,
  possuiVencimentoAtrasado,
  pagamentosPagosNoMes,
  clientePagoNoMes,
  totalPagoNoMes
};
