const STATUS = ['Pendente', 'Contatado', 'Aguardando retorno', 'Não tem interesse', 'Já tem site', 'Proposta enviada', 'Negociação', 'Fechado', 'Contato inválido'];
const TIPOS = ['WhatsApp', 'Ligação', 'E-mail', 'Reunião', 'Visita', 'Proposta', 'Observação', 'Outro'];
const TITULOS_INTERACAO = [
  'Primeiro contato',
  'Tentativa de contato',
  'Contato realizado',
  'Follow-up',
  'Qualificação do lead',
  'Levantamento de necessidades',
  'Apresentação da solução',
  'Envio de portfólio',
  'Envio de proposta',
  'Proposta apresentada',
  'Negociação',
  'Reunião agendada',
  'Reunião realizada',
  'Retorno do cliente',
  'Tratativa de objeção',
  'Próximo passo definido',
  'Fechamento',
  'Pós-venda',
  'Sem retorno'
];
const DESCRICOES_POR_TITULO = {
  'Primeiro contato': [
    'Apresentei a empresa e a solução oferecida.',
    'Enviei uma mensagem inicial de apresentação.',
    'Conversei com o responsável pela primeira vez.',
    'Confirmei os dados e o melhor canal de contato.'
  ],
  'Tentativa de contato': [
    'Liguei, mas não fui atendido.',
    'Enviei mensagem e ainda não tive resposta.',
    'O contato estava indisponível no momento.',
    'Não consegui falar com o responsável.'
  ],
  'Contato realizado': [
    'Conversei com o responsável pela decisão.',
    'O cliente demonstrou interesse inicial.',
    'Apresentei brevemente os serviços disponíveis.',
    'Atualizei os dados de contato do cliente.'
  ],
  'Follow-up': [
    'Retomei o contato para verificar o andamento.',
    'Reforcei os benefícios da solução apresentada.',
    'Cobrei um retorno sobre a proposta enviada.',
    'Confirmei se o cliente recebeu os materiais.'
  ],
  'Qualificação do lead': [
    'O lead possui perfil compatível com a solução.',
    'Confirmei orçamento, necessidade e prazo.',
    'Identifiquei o responsável pela decisão.',
    'O lead ainda não está pronto para avançar.'
  ],
  'Levantamento de necessidades': [
    'Mapeei os objetivos e necessidades do cliente.',
    'Identifiquei os principais problemas atuais.',
    'Levantei funcionalidades e conteúdos necessários.',
    'Confirmei prazo, orçamento e expectativas.'
  ],
  'Apresentação da solução': [
    'Apresentei a solução e seus principais benefícios.',
    'Demonstrei como o projeto atenderá à necessidade.',
    'Expliquei etapas, prazo e formato de trabalho.',
    'Apresentei exemplos de projetos semelhantes.'
  ],
  'Envio de portfólio': [
    'Enviei o portfólio pelo WhatsApp.',
    'Enviei exemplos relacionados ao segmento do cliente.',
    'Compartilhei projetos e resultados anteriores.',
    'O cliente confirmou o recebimento do portfólio.'
  ],
  'Envio de proposta': [
    'Enviei a proposta comercial ao cliente.',
    'Encaminhei valores, escopo e prazo do projeto.',
    'A proposta foi enviada para análise interna.',
    'Confirmei o recebimento da proposta.'
  ],
  'Proposta apresentada': [
    'Apresentei os itens e valores da proposta.',
    'Expliquei o escopo, os prazos e as condições.',
    'Esclareci dúvidas sobre a proposta comercial.',
    'O cliente solicitou ajustes na proposta.'
  ],
  'Negociação': [
    'Negociamos valores e condições de pagamento.',
    'O cliente solicitou ajuste de escopo.',
    'Apresentei uma condição comercial alternativa.',
    'A negociação depende de aprovação interna.'
  ],
  'Reunião agendada': [
    'Agendei uma reunião de apresentação.',
    'Agendei uma reunião para levantamento de necessidades.',
    'Confirmei data, horário e participantes.',
    'Enviei o convite e o link da reunião.'
  ],
  'Reunião realizada': [
    'Realizamos a reunião de apresentação.',
    'Alinhamos necessidades, escopo e próximos passos.',
    'O cliente apresentou dúvidas e prioridades.',
    'Definimos responsáveis e prazos.'
  ],
  'Retorno do cliente': [
    'O cliente respondeu e demonstrou interesse.',
    'O cliente solicitou mais informações.',
    'O cliente pediu prazo para avaliar.',
    'O cliente informou que não seguirá neste momento.'
  ],
  'Tratativa de objeção': [
    'Esclareci uma objeção relacionada ao valor.',
    'Expliquei os benefícios e o retorno esperado.',
    'Ajustei a solução à necessidade apresentada.',
    'O cliente ainda possui dúvidas antes de avançar.'
  ],
  'Próximo passo definido': [
    'Definimos a data do próximo contato.',
    'Ficou combinado o envio de informações adicionais.',
    'O cliente fará uma avaliação interna.',
    'A próxima etapa será a apresentação da proposta.'
  ],
  'Fechamento': [
    'O cliente aprovou a proposta.',
    'O contrato foi enviado para assinatura.',
    'O pagamento inicial foi confirmado.',
    'O projeto foi confirmado e seguirá para execução.'
  ],
  'Pós-venda': [
    'Confirmei a satisfação após a entrega.',
    'Solicitei feedback sobre o projeto.',
    'Ofereci suporte e acompanhamento.',
    'Identifiquei uma nova oportunidade com o cliente.'
  ],
  'Sem retorno': [
    'O cliente não respondeu às últimas mensagens.',
    'Realizei novas tentativas sem sucesso.',
    'Aguardarei antes de fazer uma nova tentativa.',
    'O contato será pausado por falta de retorno.'
  ]
};

const STATUS_DOS_CARDS = new Set(['Pendente', 'Aguardando retorno', 'Proposta enviada', 'Fechado']);
const state = { page: 1, limit: 15, totalPaginas: 1, clienteAtual: null, pagamentoCliente: null, pixCliente: null, pixVencimento: '', timerBusca: null, summaryFilter: 'total' };
const $ = (seletor) => document.querySelector(seletor);

document.addEventListener('DOMContentLoaded', () => {
  preencherSelect($('#filtro-status'), STATUS);
  preencherSelect($('#cliente-status'), STATUS, false);
  preencherSelect($('#interacao-tipo'), TIPOS, false);
  preencherSelect($('#interacao-titulo'), TITULOS_INTERACAO);
  renderizarOpcoesDescricao('', '');
  registrarEventos();
  Promise.all([carregarResumo(), carregarClientes()]).catch(mostrarErro);
});

function preencherSelect(select, valores, preservarPrimeiro = true) {
  const primeiro = preservarPrimeiro ? select.firstElementChild : null;
  select.replaceChildren();
  if (primeiro) select.append(primeiro);
  valores.forEach((valor) => select.add(new Option(valor, valor)));
}

function registrarEventos() {
  document.querySelectorAll('[data-summary-filter]').forEach((card) => {
    card.addEventListener('click', () => selecionarCard(card.dataset.summaryFilter));
  });
  $('#form-importacao').addEventListener('submit', importarCsv);
  $('#abrir-gerador-pix').addEventListener('click', () => abrirModalPix({ empresa: 'Cobrança avulsa', whatsapp: '', proximoVencimento: '' }));
  $('#arquivo-csv').addEventListener('change', atualizarNomeArquivo);
  const dropZone = $('#drop-zone');
  ['dragenter', 'dragover'].forEach((evento) => dropZone.addEventListener(evento, (e) => { e.preventDefault(); dropZone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((evento) => dropZone.addEventListener(evento, (e) => { e.preventDefault(); dropZone.classList.remove('dragging'); }));
  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) {
      const transferencia = new DataTransfer();
      transferencia.items.add(e.dataTransfer.files[0]);
      $('#arquivo-csv').files = transferencia.files;
      atualizarNomeArquivo();
    }
  });
  $('#busca').addEventListener('input', () => {
    clearTimeout(state.timerBusca);
    state.timerBusca = setTimeout(aplicarFiltros, 300);
  });
  $('#filtro-status').addEventListener('change', () => {
    const status = $('#filtro-status').value;
    state.summaryFilter = STATUS_DOS_CARDS.has(status) ? status : (status ? '' : 'total');
    atualizarCardsAtivos();
    aplicarFiltros();
  });
  ['#filtro-prioridade', '#filtro-segmento'].forEach((id) => $(id).addEventListener('change', aplicarFiltros));
  $('#limpar-filtros').addEventListener('click', () => {
    $('#form-filtros').reset();
    state.summaryFilter = 'total';
    atualizarCardsAtivos();
    aplicarFiltros();
  });
  $('#pagina-anterior').addEventListener('click', () => mudarPagina(-1));
  $('#proxima-pagina').addEventListener('click', () => mudarPagina(1));
  $('#form-cliente').addEventListener('submit', salvarCliente);
  $('#cliente-status').addEventListener('change', atualizarCampoVencimento);
  $('#nova-interacao').addEventListener('click', abrirNovaInteracao);
  $('#interacao-titulo').addEventListener('change', () => renderizarOpcoesDescricao($('#interacao-titulo').value, ''));
  $('#form-interacao').addEventListener('submit', salvarInteracao);
  $('#novo-pagamento').addEventListener('click', () => abrirNovoPagamento());
  $('#pagamento-status').addEventListener('change', atualizarCampoDataPagamento);
  $('#form-pagamento').addEventListener('submit', salvarPagamento);
  $('#form-pix').addEventListener('submit', gerarPix);
  $('#copiar-pix').addEventListener('click', copiarCodigoPix);
  $('#pix-valor').addEventListener('input', () => { $('#pix-resultado').hidden = true; });
  document.querySelectorAll('[data-close]').forEach((botao) => botao.addEventListener('click', () => $(`#${botao.dataset.close}`).close()));
  $('#dialog-cliente').addEventListener('close', () => { state.clienteAtual = null; });
}

async function api(url, opcoes = {}) {
  const resposta = await fetch(url, opcoes);
  const tipo = resposta.headers.get('content-type') || '';
  const corpo = tipo.includes('application/json') ? await resposta.json() : null;
  if (!resposta.ok) throw new Error(corpo?.erro || `Erro HTTP ${resposta.status}`);
  return corpo;
}

async function carregarResumo() {
  const resumo = await api('/api/resumo');
  $('#resumo-total').textContent = resumo.total;
  $('#resumo-pendentes').textContent = resumo.pendentes;
  $('#resumo-aguardando').textContent = resumo.aguardandoRetorno;
  $('#resumo-propostas').textContent = resumo.propostasEnviadas;
  $('#resumo-fechados').textContent = resumo.fechados;
  $('#resumo-vencimentos').textContent = resumo.proximosVencimentos;
  $('#resumo-atrasados').textContent = resumo.vencimentosAtrasados;
  $('#resumo-pagos').textContent = formatarMoeda(resumo.totalPagoMes);
  $('#resumo-pagos').title = `${resumo.clientesPagosMes} ${resumo.clientesPagosMes === 1 ? 'cliente pago' : 'clientes pagos'} no mês`;
  $('#resumo-interacoes').textContent = resumo.interacoes;
}

async function carregarClientes() {
  const params = new URLSearchParams({ page: state.page, limit: state.limit });
  const filtros = { busca: $('#busca').value, status: $('#filtro-status').value, prioridade: $('#filtro-prioridade').value, segmento: $('#filtro-segmento').value };
  Object.entries(filtros).forEach(([chave, valor]) => { if (valor) params.set(chave, valor); });
  if (state.summaryFilter === 'interacoes') params.set('comInteracoes', '1');
  if (state.summaryFilter === 'vencimentos') params.set('proximosVencimentos', '1');
  if (state.summaryFilter === 'atrasados') params.set('vencimentosAtrasados', '1');
  if (state.summaryFilter === 'pagos') params.set('pagosMes', '1');
  const dados = await api(`/api/clientes?${params}`);
  $('#coluna-pix').hidden = !filtroExibePix();
  $('#coluna-pagamento').hidden = !filtroExibePix();
  state.totalPaginas = dados.paginacao.totalPaginas;
  if (state.page > state.totalPaginas) { state.page = state.totalPaginas; return carregarClientes(); }
  renderizarClientes(dados.clientes);
  atualizarSegmentos(dados.opcoes.segmentos);
  $('#contador-clientes').textContent = `${dados.paginacao.total} ${dados.paginacao.total === 1 ? 'cliente' : 'clientes'}`;
  $('#info-pagina').textContent = `Página ${state.page} de ${state.totalPaginas}`;
  $('#pagina-anterior').disabled = state.page <= 1;
  $('#proxima-pagina').disabled = state.page >= state.totalPaginas;
}

function atualizarSegmentos(segmentos) {
  const select = $('#filtro-segmento');
  const atual = select.value;
  const primeiro = select.firstElementChild;
  select.replaceChildren(primeiro);
  segmentos.forEach((valor) => select.add(new Option(valor, valor)));
  select.value = atual;
}

function selecionarCard(filtro) {
  state.summaryFilter = filtro;
  $('#filtro-status').value = STATUS_DOS_CARDS.has(filtro) ? filtro : '';
  atualizarCardsAtivos();
  aplicarFiltros();
}

function atualizarCardsAtivos() {
  document.querySelectorAll('[data-summary-filter]').forEach((card) => {
    const ativo = card.dataset.summaryFilter === state.summaryFilter;
    card.classList.toggle('active', ativo);
    card.setAttribute('aria-pressed', String(ativo));
  });
}

function renderizarClientes(clientes) {
  const tbody = $('#lista-clientes');
  tbody.replaceChildren();
  $('#estado-vazio').hidden = clientes.length > 0;
  clientes.forEach((cliente) => {
    const tr = document.createElement('tr');
    const celulas = [
      criarTdEmpresa(cliente),
      criarCelulaContato(cliente),
      criarTdComElemento('span', cliente.prioridade || '—', `priority priority-${slug(cliente.prioridade)}`),
      criarTdComElemento('span', cliente.status, `badge badge-${slug(cliente.status)}`),
      criarTdTexto(formatarData(cliente.ultimoContato)),
      criarTdVencimento(cliente),
      criarTdInteracoes(cliente)
    ];
    if (filtroExibePix()) celulas.push(criarTdPagamento(cliente), criarTdPix(cliente));
    celulas.push(criarTdAcoes(cliente));
    tr.append(...celulas);
    tbody.append(tr);
  });
}

function criarTdEmpresa(cliente) {
  const td = document.createElement('td');
  const wrap = el('div', '', 'company-cell');
  wrap.append(el('span', iniciais(cliente.empresa), 'company-avatar'));
  const info = document.createElement('div');
  info.append(el('span', cliente.empresa || 'Sem nome', 'cell-title'), el('span', `${cliente.segmento || 'Sem segmento'} · ${cliente.cidade || 'Sem cidade'}`, 'cell-subtitle'));
  wrap.append(info); td.append(wrap); return td;
}

function criarCelulaContato(cliente) {
  const td = document.createElement('td');
  td.append(el('span', formatarWhatsApp(cliente.whatsapp), 'cell-title'), el('span', cliente.endereco || 'Sem endereço', 'cell-subtitle'));
  return td;
}

function criarTdTexto(texto) { const td = document.createElement('td'); td.textContent = texto; return td; }
function criarTdComElemento(tag, texto, classe) { const td = document.createElement('td'); td.append(el(tag, texto, classe)); return td; }
function filtroExibePix() { return ['vencimentos', 'atrasados'].includes(state.summaryFilter); }
function criarTdVencimento(cliente) {
  const td = document.createElement('td');
  if (cliente.vencimentoAtrasado) {
    const dias = cliente.diasEmAtraso;
    const wrap = el('span', '', 'due-date overdue');
    wrap.append(el('strong', formatarDataCurta(cliente.vencimentoAtrasado)), el('span', `${dias} ${dias === 1 ? 'dia' : 'dias'} em atraso`));
    td.append(wrap); return td;
  }
  if (!cliente.proximoVencimento) { td.textContent = '—'; return td; }
  const dias = cliente.diasAteVencimento;
  const classe = dias === 0 ? 'due-date today' : dias <= 7 ? 'due-date soon' : 'due-date';
  const wrap = el('span', '', classe);
  const lembrete = dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : `Em ${dias} dias`;
  wrap.append(el('strong', formatarDataCurta(cliente.proximoVencimento)), el('span', lembrete));
  td.append(wrap); return td;
}
function criarTdInteracoes(cliente) {
  const td = document.createElement('td');
  const quantidade = cliente.interacoes?.length || 0;
  const botao = el('button', String(quantidade), 'interactions-count');
  botao.type = 'button';
  botao.title = 'Visualizar interações salvas';
  botao.setAttribute('aria-label', `Ver ${quantidade} ${quantidade === 1 ? 'interação' : 'interações'} de ${cliente.empresa || 'cliente'}`);
  botao.addEventListener('click', () => abrirInteracoesRapidas(cliente));
  td.append(botao);
  return td;
}
function criarTdPix(cliente) {
  const td = document.createElement('td');
  const botao = el('button', '', 'pix-button');
  botao.type = 'button'; botao.title = 'Gerar QR Code Pix';
  botao.setAttribute('aria-label', `Gerar Pix para ${cliente.empresa || 'cliente'}`);
  botao.append(el('span', '💳', 'pix-payment-emoji')); botao.addEventListener('click', () => abrirModalPix(cliente));
  td.append(botao); return td;
}
function criarTdPagamento(cliente) {
  const td = document.createElement('td');
  const botao = el('button', '＋ Registrar', 'payment-quick-button');
  botao.type = 'button'; botao.title = 'Registrar novo pagamento';
  botao.setAttribute('aria-label', `Registrar pagamento de ${cliente.empresa || 'cliente'}`);
  botao.addEventListener('click', () => abrirNovoPagamento(cliente));
  td.append(botao); return td;
}
function criarTdAcoes(cliente) {
  const td = document.createElement('td');
  const wrap = el('div', '', 'row-actions');
  const detalhes = el('button', 'Ver detalhes', 'details-button'); detalhes.type = 'button'; detalhes.addEventListener('click', () => abrirCliente(cliente.whatsapp));
  const whats = el('a', 'W', 'whatsapp-button'); whats.href = cliente.linkWhatsApp || `https://wa.me/${cliente.whatsapp}`; whats.target = '_blank'; whats.rel = 'noopener noreferrer'; whats.title = 'Abrir WhatsApp';
  wrap.append(detalhes, whats); td.append(wrap); return td;
}

function abrirModalPix(cliente) {
  state.pixCliente = cliente;
  state.pixVencimento = cliente.vencimentoAtrasado || cliente.proximoVencimento || '';
  $('#form-pix').reset();
  const identificacao = [cliente.empresa || 'Cliente', cliente.whatsapp ? formatarWhatsApp(cliente.whatsapp) : ''].filter(Boolean);
  $('#pix-cliente').textContent = identificacao.join(' · ');
  $('#pix-valor').value = '50.00';
  $('#pix-vencimento').value = state.pixVencimento;
  $('#pix-vencimento-wrap').hidden = !state.pixVencimento;
  $('#pix-valor-wrap').classList.toggle('full', !state.pixVencimento);
  $('#pix-resultado').hidden = true;
  $('#pix-qrcode').removeAttribute('src');
  $('#pix-copia-cola').value = '';
  $('#dialog-pix').showModal();
}

async function gerarPix(evento) {
  evento.preventDefault();
  if (!state.pixCliente) return;
  const body = {
    valor: Number($('#pix-valor').value),
    whatsapp: state.pixCliente.whatsapp,
    dataVencimento: state.pixVencimento
  };
  await comBotaoCarregando(evento.submitter, async () => {
    const resultado = await api('/api/pix/qrcode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    $('#pix-qrcode').src = resultado.qrCode;
    $('#pix-copia-cola').value = resultado.payload;
    $('#pix-resultado-valor').textContent = formatarMoeda(resultado.valor);
    $('#pix-txid').textContent = `Identificador: ${resultado.txid}`;
    $('#pix-resultado').hidden = false;
  });
}

async function copiarCodigoPix() {
  const campo = $('#pix-copia-cola');
  if (!campo.value) return;
  try {
    await navigator.clipboard.writeText(campo.value);
  } catch {
    campo.select();
    document.execCommand('copy');
    campo.setSelectionRange(0, 0);
  }
  toast('Código Pix copiado.', 'success');
}

async function abrirInteracoesRapidas(cliente) {
  const dialog = $('#dialog-interacoes-rapidas');
  const lista = $('#interacoes-rapidas-lista');
  $('#interacoes-rapidas-empresa').textContent = cliente.empresa || 'Interações salvas';
  $('#interacoes-rapidas-subtitulo').textContent = `${cliente.segmento || 'Sem segmento'} · ${formatarWhatsApp(cliente.whatsapp)}`;
  lista.replaceChildren(el('div', 'Carregando interações…', 'quick-history-empty'));
  dialog.showModal();
  try {
    const interacoes = await api(`/api/clientes/${cliente.whatsapp}/interacoes`);
    renderizarInteracoesRapidas(interacoes);
  } catch (erro) {
    dialog.close();
    mostrarErro(erro);
  }
}

function renderizarInteracoesRapidas(interacoes) {
  const lista = $('#interacoes-rapidas-lista');
  lista.replaceChildren();
  if (!interacoes.length) {
    const vazio = el('div', '', 'quick-history-empty');
    vazio.append(el('strong', 'Nenhuma interação registrada'), el('span', 'Abra os detalhes do cliente para adicionar o primeiro contato.'));
    lista.append(vazio);
    return;
  }
  interacoes.forEach((item) => {
    const article = el('article', '', 'quick-history-item');
    const header = document.createElement('header');
    header.append(el('span', item.tipo, 'timeline-channel'), el('time', formatarData(item.dataHora, true), 'timeline-date'));
    article.append(header, el('h3', item.titulo));
    if (item.descricao) article.append(el('p', item.descricao));
    if (item.resultado) article.append(el('p', `Próximo passo: ${item.resultado}`, 'timeline-result'));
    lista.append(article);
  });
}

async function abrirCliente(whatsapp) {
  try {
    const cliente = await api(`/api/clientes/${encodeURIComponent(whatsapp)}`);
    state.clienteAtual = cliente;
    renderizarDetalhes(cliente);
    if (!$('#dialog-cliente').open) $('#dialog-cliente').showModal();
  } catch (erro) { mostrarErro(erro); }
}

function renderizarDetalhes(cliente) {
  $('#detalhe-empresa').textContent = cliente.empresa || 'Cliente sem nome';
  $('#detalhe-subtitulo').textContent = `${cliente.segmento || 'Sem segmento'} · ${cliente.cidade || 'Sem cidade'}`;
  const grid = $('#dados-importados'); grid.replaceChildren();
  const campos = [
    ['WhatsApp', formatarWhatsApp(cliente.whatsapp)], ['Prioridade', cliente.prioridade], ['Endereço', cliente.endereco],
    ['Presença digital', cliente.presencaDigital], ['Oportunidade', cliente.oportunidadeLandingPage, true],
    ['Fonte pública', cliente.fontePublica, true, cliente.fontePublica], ['Verificado em', cliente.verificadoEm]
  ];
  campos.forEach(([rotulo, valor, full, link]) => {
    const item = el('div', '', `detail-item${full ? ' full' : ''}`); item.append(el('span', rotulo));
    if (link) { const a = el('a', valor || '—'); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; item.append(a); }
    else item.append(el('strong', valor || '—'));
    grid.append(item);
  });
  $('#cliente-status').value = cliente.status;
  $('#cliente-dia-vencimento').value = cliente.diaVencimento || '';
  atualizarCampoVencimento();
  $('#cliente-ultimo-contato').value = paraInputData(cliente.ultimoContato);
  $('#cliente-ultimo-contato').disabled = (cliente.interacoes?.length || 0) > 0;
  $('#cliente-ultimo-contato').title = $('#cliente-ultimo-contato').disabled ? 'Calculado automaticamente pelas interações' : '';
  $('#cliente-observacoes').value = cliente.observacoes || '';
  $('#novo-pagamento').disabled = cliente.status !== 'Fechado';
  $('#novo-pagamento').title = cliente.status === 'Fechado' ? '' : 'Altere o status para Fechado antes de registrar pagamentos';
  renderizarTimeline(cliente.interacoes || []);
  renderizarPagamentos(cliente.pagamentos || []);
}

function atualizarCampoVencimento() {
  const fechado = $('#cliente-status').value === 'Fechado';
  $('#cliente-vencimento-wrap').hidden = !fechado;
  $('#cliente-dia-vencimento').required = fechado;
}

function renderizarTimeline(interacoes) {
  const timeline = $('#timeline'); timeline.replaceChildren();
  const ordenadas = [...interacoes].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  if (!ordenadas.length) { timeline.append(el('div', 'Nenhuma interação registrada. Comece adicionando o primeiro contato.', 'timeline-empty')); return; }
  ordenadas.forEach((item) => {
    const article = el('article', '', 'timeline-item'); article.append(el('span', '', 'timeline-marker'));
    const meta = el('div', '', 'timeline-meta'); meta.append(el('span', item.tipo, 'timeline-channel'), el('time', formatarData(item.dataHora, true), 'timeline-date'));
    article.append(meta, el('h4', item.titulo));
    if (item.descricao) article.append(el('p', item.descricao));
    if (item.resultado) article.append(el('p', `Próximo passo: ${item.resultado}`, 'timeline-result'));
    const acoes = el('div', '', 'timeline-actions');
    const editar = el('button', 'Editar', 'text-button'); editar.type = 'button'; editar.addEventListener('click', () => abrirEditarInteracao(item));
    const excluir = el('button', 'Excluir', 'text-button danger'); excluir.type = 'button'; excluir.addEventListener('click', () => excluirInteracao(item));
    acoes.append(editar, excluir); article.append(acoes); timeline.append(article);
  });
}

async function salvarCliente(evento) {
  evento.preventDefault();
  if (!state.clienteAtual) return;
  const body = { status: $('#cliente-status').value, observacoes: $('#cliente-observacoes').value };
  if (body.status === 'Fechado') body.diaVencimento = Number($('#cliente-dia-vencimento').value);
  if (!$('#cliente-ultimo-contato').disabled) body.ultimoContato = $('#cliente-ultimo-contato').value ? new Date($('#cliente-ultimo-contato').value).toISOString() : '';
  await comBotaoCarregando(evento.submitter, async () => {
    state.clienteAtual = await api(`/api/clientes/${state.clienteAtual.whatsapp}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    renderizarDetalhes(state.clienteAtual); toast('Alterações salvas com sucesso.', 'success');
    await Promise.all([carregarClientes(), carregarResumo()]);
  });
}

function abrirNovaInteracao() {
  $('#form-interacao').reset(); $('#interacao-id').value = ''; $('#titulo-form-interacao').textContent = 'Nova interação';
  renderizarOpcoesDescricao('', '');
  $('#interacao-data').value = paraInputData(new Date().toISOString()); $('#dialog-interacao').showModal();
}

function abrirEditarInteracao(item) {
  $('#interacao-id').value = item.id; $('#titulo-form-interacao').textContent = 'Editar interação';
  $('#interacao-data').value = paraInputData(item.dataHora); $('#interacao-tipo').value = item.tipo;
  garantirOpcaoTitulo(item.titulo); $('#interacao-titulo').value = item.titulo;
  renderizarOpcoesDescricao(item.titulo, item.descricao || '');
  $('#interacao-resultado').value = item.resultado || ''; $('#dialog-interacao').showModal();
}

function garantirOpcaoTitulo(titulo) {
  const select = $('#interacao-titulo');
  if (titulo && ![...select.options].some((opcao) => opcao.value === titulo)) {
    select.add(new Option(`${titulo} (personalizado)`, titulo));
  }
}

function renderizarOpcoesDescricao(titulo, descricao) {
  const container = $('#interacao-descricao-opcoes');
  const campoOutro = $('#interacao-descricao');
  const wrapOutro = $('#interacao-descricao-outro-wrap');
  container.replaceChildren();
  campoOutro.value = descricao;
  campoOutro.dataset.customValue = '';

  if (!titulo) {
    container.append(el('p', 'Selecione primeiro um título para ver as descrições sugeridas.', 'description-hint'));
    wrapOutro.hidden = true;
    return;
  }

  const opcoes = DESCRICOES_POR_TITULO[titulo] || [];
  const descricaoSugerida = opcoes.includes(descricao);
  if (descricao && !descricaoSugerida) campoOutro.dataset.customValue = descricao;

  opcoes.forEach((opcao, indice) => {
    const label = el('label', '', 'radio-choice');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'interacao-descricao-opcao'; input.value = opcao;
    input.id = `descricao-opcao-${indice}`; input.checked = descricao === opcao;
    input.addEventListener('change', () => {
      if (campoOutro.value && !opcoes.includes(campoOutro.value)) campoOutro.dataset.customValue = campoOutro.value;
      campoOutro.value = opcao;
      wrapOutro.hidden = true;
    });
    label.append(input, el('span', opcao));
    container.append(label);
  });

  const labelOutro = el('label', '', 'radio-choice');
  const radioOutro = document.createElement('input');
  radioOutro.type = 'radio'; radioOutro.name = 'interacao-descricao-opcao'; radioOutro.value = '__outros__';
  radioOutro.id = 'descricao-opcao-outros'; radioOutro.checked = Boolean(descricao && !descricaoSugerida);
  radioOutro.addEventListener('change', () => {
    if (opcoes.includes(campoOutro.value)) campoOutro.value = campoOutro.dataset.customValue || '';
    wrapOutro.hidden = false;
    campoOutro.focus();
  });
  labelOutro.append(radioOutro, el('span', 'Outros'));
  container.append(labelOutro);
  wrapOutro.hidden = !radioOutro.checked;
}

async function salvarInteracao(evento) {
  evento.preventDefault();
  const id = $('#interacao-id').value;
  const body = { dataHora: new Date($('#interacao-data').value).toISOString(), tipo: $('#interacao-tipo').value, titulo: $('#interacao-titulo').value, descricao: $('#interacao-descricao').value, resultado: $('#interacao-resultado').value };
  const url = `/api/clientes/${state.clienteAtual.whatsapp}/interacoes${id ? `/${id}` : ''}`;
  await comBotaoCarregando(evento.submitter, async () => {
    await api(url, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    $('#dialog-interacao').close(); toast(id ? 'Interação atualizada.' : 'Interação registrada.', 'success');
    await atualizarClienteAtual();
  });
}

async function excluirInteracao(item) {
  if (!confirm(`Excluir a interação “${item.titulo}”? Esta ação não pode ser desfeita.`)) return;
  try {
    await api(`/api/clientes/${state.clienteAtual.whatsapp}/interacoes/${item.id}`, { method: 'DELETE' });
    toast('Interação excluída. As demais foram preservadas.', 'success'); await atualizarClienteAtual();
  } catch (erro) { mostrarErro(erro); }
}

function renderizarPagamentos(pagamentos) {
  const lista = $('#pagamentos-lista');
  lista.replaceChildren();
  const ordenados = [...pagamentos].sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento));
  if (!ordenados.length) {
    lista.append(el('div', 'Nenhum pagamento registrado para este cliente.', 'payments-empty'));
    return;
  }
  ordenados.forEach((pagamento) => {
    const item = el('article', '', 'payment-item');
    const vencimento = document.createElement('div');
    vencimento.append(el('strong', formatarDataCurta(pagamento.dataVencimento)), el('small', 'Vencimento'));
    const valor = document.createElement('div');
    valor.append(el('strong', formatarMoeda(pagamento.valor)), el('small', pagamento.dataPagamento ? `Pago em ${formatarDataCurta(pagamento.dataPagamento)}` : 'Pagamento não informado'));
    const status = el('span', pagamento.status, `payment-status ${slug(pagamento.status)}`);
    const acoes = el('div', '', 'payment-actions');
    const editar = el('button', 'Editar', 'text-button'); editar.type = 'button'; editar.addEventListener('click', () => abrirEditarPagamento(pagamento));
    const excluir = el('button', 'Excluir', 'text-button danger'); excluir.type = 'button'; excluir.addEventListener('click', () => excluirPagamento(pagamento));
    acoes.append(editar, excluir); item.append(vencimento, valor, status, acoes); lista.append(item);
  });
}

function abrirNovoPagamento(cliente = state.clienteAtual) {
  if (!cliente || cliente.status !== 'Fechado') return toast('Defina o cliente como Fechado antes de registrar pagamentos.', 'error');
  state.pagamentoCliente = cliente;
  $('#form-pagamento').reset();
  $('#pagamento-id').value = '';
  $('#titulo-form-pagamento').textContent = 'Novo pagamento';
  $('#pagamento-valor').value = '50.00';
  $('#pagamento-status').value = 'Pendente';
  $('#pagamento-vencimento').value = cliente.vencimentoAtrasado || cliente.proximoVencimento || hojeIsoLocal();
  atualizarCampoDataPagamento();
  $('#dialog-pagamento').showModal();
}

function abrirEditarPagamento(pagamento) {
  state.pagamentoCliente = state.clienteAtual;
  $('#pagamento-id').value = pagamento.id;
  $('#titulo-form-pagamento').textContent = 'Editar pagamento';
  $('#pagamento-vencimento').value = pagamento.dataVencimento;
  $('#pagamento-valor').value = Number(pagamento.valor).toFixed(2);
  $('#pagamento-status').value = pagamento.status;
  $('#pagamento-data').value = pagamento.dataPagamento || '';
  $('#pagamento-observacoes').value = pagamento.observacoes || '';
  atualizarCampoDataPagamento(false);
  $('#dialog-pagamento').showModal();
}

function atualizarCampoDataPagamento(limpar = true) {
  const pago = $('#pagamento-status').value === 'Pago';
  const campo = $('#pagamento-data');
  campo.disabled = !pago;
  campo.required = pago;
  if (!pago && limpar) campo.value = '';
  if (pago && !campo.value) campo.value = hojeIsoLocal();
}

async function salvarPagamento(evento) {
  evento.preventDefault();
  const id = $('#pagamento-id').value;
  const body = {
    dataVencimento: $('#pagamento-vencimento').value,
    valor: Number($('#pagamento-valor').value),
    status: $('#pagamento-status').value,
    dataPagamento: $('#pagamento-data').disabled ? '' : $('#pagamento-data').value,
    observacoes: $('#pagamento-observacoes').value
  };
  if (!state.pagamentoCliente) return;
  const url = `/api/clientes/${state.pagamentoCliente.whatsapp}/pagamentos${id ? `/${id}` : ''}`;
  await comBotaoCarregando(evento.submitter, async () => {
    await api(url, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    $('#dialog-pagamento').close();
    toast(id ? 'Pagamento atualizado.' : 'Pagamento registrado.', 'success');
    if (state.clienteAtual?.whatsapp === state.pagamentoCliente.whatsapp && $('#dialog-cliente').open) await atualizarClienteAtual();
    else await Promise.all([carregarClientes(), carregarResumo()]);
  });
}

async function excluirPagamento(pagamento) {
  if (!confirm(`Excluir o pagamento de ${formatarMoeda(pagamento.valor)} com vencimento em ${formatarDataCurta(pagamento.dataVencimento)}?`)) return;
  try {
    await api(`/api/clientes/${state.clienteAtual.whatsapp}/pagamentos/${pagamento.id}`, { method: 'DELETE' });
    toast('Pagamento excluído.', 'success');
    await atualizarClienteAtual();
  } catch (erro) { mostrarErro(erro); }
}

async function atualizarClienteAtual() {
  const whatsapp = state.clienteAtual.whatsapp;
  state.clienteAtual = await api(`/api/clientes/${whatsapp}`);
  renderizarDetalhes(state.clienteAtual);
  await Promise.all([carregarClientes(), carregarResumo()]);
}

async function importarCsv(evento) {
  evento.preventDefault();
  const arquivo = $('#arquivo-csv').files[0];
  if (!arquivo || !arquivo.name.toLowerCase().endsWith('.csv')) return toast('Selecione um arquivo CSV válido.', 'error');
  const form = new FormData(); form.append('arquivo', arquivo);
  await comBotaoCarregando(evento.submitter, async () => {
    const resultado = await api('/api/importar', { method: 'POST', body: form });
    toast(`Importados: ${resultado.importados} · Já cadastrados: ${resultado.jaCadastrados} · Inválidos: ${resultado.invalidos} · Processados: ${resultado.totalProcessados}`, 'success', 7000);
    $('#form-importacao').reset(); atualizarNomeArquivo(); state.page = 1;
    await Promise.all([carregarClientes(), carregarResumo()]);
  });
}

function atualizarNomeArquivo() {
  const arquivo = $('#arquivo-csv').files[0];
  const strong = $('#drop-zone strong'); const small = $('#drop-zone small');
  strong.textContent = arquivo ? arquivo.name : 'Selecione ou arraste um CSV';
  small.textContent = arquivo ? `${(arquivo.size / 1024).toFixed(1)} KB · pronto para importar` : 'Até 5 MB · dados preservados na reimportação';
}

async function comBotaoCarregando(botao, callback) {
  const original = botao.textContent; botao.disabled = true; botao.textContent = 'Aguarde…';
  try { await callback(); } catch (erro) { mostrarErro(erro); } finally { botao.disabled = false; botao.textContent = original; }
}

function aplicarFiltros() { state.page = 1; carregarClientes().catch(mostrarErro); }
function mudarPagina(delta) { state.page += delta; carregarClientes().catch(mostrarErro); }
function el(tag, texto = '', classe = '') { const elemento = document.createElement(tag); elemento.textContent = texto; if (classe) elemento.className = classe; return elemento; }
function slug(valor = '') { return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function iniciais(nome = '') { return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || '?'; }
function formatarWhatsApp(numero = '') { return numero.length === 13 && numero.startsWith('55') ? `+${numero.slice(0,2)} (${numero.slice(2,4)}) ${numero.slice(4,9)}-${numero.slice(9)}` : numero; }
function formatarData(valor, hora = false) { if (!valor) return '—'; const data = new Date(valor); if (Number.isNaN(data.getTime())) return valor; return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', ...(hora ? { timeStyle: 'short' } : {}) }).format(data); }
function formatarDataCurta(valor) { if (!valor) return '—'; const [ano, mes, dia] = valor.split('-').map(Number); return new Intl.DateTimeFormat('pt-BR').format(new Date(ano, mes - 1, dia)); }
function formatarMoeda(valor) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0); }
function hojeIsoLocal() { const agora = new Date(); const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function paraInputData(valor) { if (!valor) return ''; const data = new Date(valor); const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
function mostrarErro(erro) { console.error(erro); toast(erro.message || 'Não foi possível concluir a operação.', 'error', 6000); }
function toast(mensagem, tipo = '', duracao = 4000) { const item = el('div', mensagem, `toast ${tipo}`); $('#toast-container').append(item); setTimeout(() => item.remove(), duracao); }
