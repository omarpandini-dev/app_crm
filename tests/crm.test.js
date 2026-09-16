const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { JsonDatabase } = require('../src/services/database');
const { criarApp } = require('../src/app');

const CABECALHO = 'Empresa,Segmento,Cidade,WhatsApp,Link WhatsApp,Endereço,Presença digital encontrada,Prioridade,Oportunidade para landing page,Fonte pública,Verificado em';
const LINHA = 'Arte da Pizza,Pizzaria,Joinville/SC,+55 47 99622-4749,https://wa.me/5547996224749,"Rua A, 10",Diretório,Alta,Criar landing page,https://example.com,2026-09-16';
const CSV = `${CABECALHO}\n${LINHA}\n`;
const WHATSAPP = '5547996224749';
const INTERACAO = { dataHora: '2026-09-18T14:30:00.000Z', tipo: 'WhatsApp', titulo: 'Primeiro contato', descricao: 'Apresentei o serviço.', resultado: 'Enviar portfólio.' };

let dir;
let dbPath;
let database;
let app;

test.beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'crm-test-'));
  dbPath = path.join(dir, 'db.json');
  const uploadDir = path.join(dir, 'uploads');
  await fs.mkdir(uploadDir);
  database = new JsonDatabase(dbPath);
  await database.init();
  app = criarApp({ database, uploadDir, publicDir: path.join(__dirname, '..', 'public') });
});

test.afterEach(async () => {
  const resolvido = path.resolve(dir);
  assert.ok(resolvido.startsWith(path.resolve(os.tmpdir())), 'diretório temporário fora do local esperado');
  await fs.rm(resolvido, { recursive: true, force: true });
});

async function importar(conteudo = CSV, nome = 'clientes.csv') {
  return request(app).post('/api/importar').attach('arquivo', Buffer.from(conteudo, 'utf8'), nome);
}

async function criarCliente(extra = {}) {
  const agora = new Date().toISOString();
  await database.transaction((db) => {
    db.clientes[WHATSAPP] = {
      whatsapp: WHATSAPP, empresa: 'Arte da Pizza', segmento: 'Pizzaria', cidade: 'Joinville/SC',
      linkWhatsApp: '', endereco: '', presencaDigital: '', prioridade: 'Alta', oportunidadeLandingPage: '', fontePublica: '', verificadoEm: '',
      status: 'Pendente', ultimoContato: '', observacoes: '', interacoes: [], criadoEm: agora, atualizadoEm: agora, ...extra
    };
  });
}

async function postarInteracao(dados = INTERACAO, whatsapp = WHATSAPP) {
  return request(app).post(`/api/clientes/${whatsapp}/interacoes`).send(dados);
}

test('1. importa um cliente novo', async () => {
  const res = await importar();
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { importados: 1, jaCadastrados: 0, invalidos: 0, totalProcessados: 1 });
  assert.equal((await database.read()).clientes[WHATSAPP].status, 'Pendente');
});

test('2. reimporta o mesmo WhatsApp sem duplicar', async () => {
  await importar();
  const res = await importar();
  assert.equal(res.body.importados, 0);
  assert.equal(res.body.jaCadastrados, 1);
  assert.equal(Object.keys((await database.read()).clientes).length, 1);
});

test('3. reconhece WhatsApp com formatação diferente', async () => {
  await importar();
  const segunda = CSV.replace('+55 47 99622-4749', '(55) 47 99622 4749');
  const res = await importar(segunda);
  assert.equal(res.body.jaCadastrados, 1);
  assert.equal(Object.keys((await database.read()).clientes).length, 1);
});

test('4. identifica duas linhas duplicadas no mesmo CSV', async () => {
  const res = await importar(`${CABECALHO}\n${LINHA}\n${LINHA}\n`);
  assert.deepEqual(res.body, { importados: 1, jaCadastrados: 1, invalidos: 0, totalProcessados: 2 });
});

test('5. rejeita linha sem WhatsApp', async () => {
  const res = await importar(`${CABECALHO}\n${LINHA.replace('+55 47 99622-4749', '')}\n`);
  assert.equal(res.body.invalidos, 1);
  assert.equal(res.body.importados, 0);
});

test('6. rejeita CSV sem coluna obrigatória', async () => {
  const res = await importar('Empresa,WhatsApp\nTeste,5547999999999\n');
  assert.equal(res.status, 400);
  assert.match(res.body.erro, /Colunas obrigatórias ausentes/);
});

test('7. preserva campos manuais e interações na reimportação', async () => {
  await importar();
  await request(app).patch(`/api/clientes/${WHATSAPP}`).send({ status: 'Negociação', ultimoContato: '2026-09-17T10:00:00.000Z', observacoes: 'Importante' });
  const interacao = await postarInteracao();
  await importar(CSV.replace('Arte da Pizza', 'Arte da Pizza Atualizada'));
  const cliente = (await database.read()).clientes[WHATSAPP];
  assert.equal(cliente.status, 'Negociação');
  assert.equal(cliente.observacoes, 'Importante');
  assert.equal(cliente.interacoes[0].id, interacao.body.id);
  assert.equal(cliente.empresa, 'Arte da Pizza Atualizada');
});

test('8. edita status, último contato e observações', async () => {
  await criarCliente();
  const res = await request(app).patch(`/api/clientes/${WHATSAPP}`).send({ status: 'Contatado', ultimoContato: '2026-09-20T12:00:00Z', observacoes: 'Ligou' });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'Contatado');
  assert.equal(res.body.ultimoContato, '2026-09-20T12:00:00.000Z');
  assert.equal(res.body.observacoes, 'Ligou');
});

test('9. persiste alterações no db.json formatado', async () => {
  await criarCliente();
  await request(app).patch(`/api/clientes/${WHATSAPP}`).send({ observacoes: 'Persistido' });
  const texto = await fs.readFile(dbPath, 'utf8');
  assert.match(texto, /\n  "clientes":/);
  assert.equal(JSON.parse(texto).clientes[WHATSAPP].observacoes, 'Persistido');
  await fs.access(`${dbPath}.bak`);
});

test('10. aplica busca, filtros e paginação', async () => {
  await criarCliente();
  await database.transaction((db) => { db.clientes['5547999999999'] = { ...db.clientes[WHATSAPP], whatsapp: '5547999999999', empresa: 'Oficina Central', segmento: 'Automotivo', prioridade: 'Baixa', status: 'Fechado', interacoes: [{ id: 'teste' }] }; });
  const busca = await request(app).get('/api/clientes?busca=pizza&status=Pendente&prioridade=Alta&segmento=Pizzaria&page=1&limit=1');
  assert.equal(busca.body.clientes.length, 1);
  assert.equal(busca.body.paginacao.total, 1);
  const filtro = await request(app).get('/api/clientes?status=Fechado');
  assert.equal(filtro.body.clientes[0].empresa, 'Oficina Central');
  const comInteracoes = await request(app).get('/api/clientes?comInteracoes=1');
  assert.equal(comInteracoes.body.clientes.length, 1);
  assert.equal(comInteracoes.body.clientes[0].empresa, 'Oficina Central');
});

test('11. cria interação com ID gerado no backend', async () => {
  await criarCliente();
  const res = await postarInteracao({ ...INTERACAO, id: 'id-injetado' });
  assert.equal(res.status, 201);
  assert.notEqual(res.body.id, 'id-injetado');
  assert.match(res.body.id, /^[0-9a-f-]{36}$/);
});

test('12. lista interações da mais recente para a mais antiga', async () => {
  await criarCliente();
  await postarInteracao({ ...INTERACAO, dataHora: '2026-09-18T10:00:00Z', titulo: 'Antiga' });
  await postarInteracao({ ...INTERACAO, dataHora: '2026-09-19T10:00:00Z', titulo: 'Nova' });
  const res = await request(app).get(`/api/clientes/${WHATSAPP}/interacoes`);
  assert.deepEqual(res.body.map((i) => i.titulo), ['Nova', 'Antiga']);
});

test('13. consulta uma interação pelo ID', async () => {
  await criarCliente();
  const criada = await postarInteracao();
  const res = await request(app).get(`/api/clientes/${WHATSAPP}/interacoes/${criada.body.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.titulo, INTERACAO.titulo);
});

test('14. edita interação preservando ID e data de criação', async () => {
  await criarCliente();
  const criada = await postarInteracao();
  const res = await request(app).patch(`/api/clientes/${WHATSAPP}/interacoes/${criada.body.id}`).send({ ...INTERACAO, titulo: 'Contato atualizado' });
  assert.equal(res.body.id, criada.body.id);
  assert.equal(res.body.criadoEm, criada.body.criadoEm);
  assert.equal(res.body.titulo, 'Contato atualizado');
});

test('15. exclui uma interação', async () => {
  await criarCliente();
  const criada = await postarInteracao();
  const exclusao = await request(app).delete(`/api/clientes/${WHATSAPP}/interacoes/${criada.body.id}`);
  assert.equal(exclusao.status, 204);
  assert.equal((await database.read()).clientes[WHATSAPP].interacoes.length, 0);
});

test('16. retorna 404 ao criar interação para cliente inexistente', async () => {
  const res = await postarInteracao(INTERACAO, '5511999999999');
  assert.equal(res.status, 404);
});

test('17. retorna 404 ao editar interação inexistente', async () => {
  await criarCliente();
  const res = await request(app).patch(`/api/clientes/${WHATSAPP}/interacoes/inexistente`).send(INTERACAO);
  assert.equal(res.status, 404);
});

test('18. valida campos obrigatórios, tipo e limites', async () => {
  await criarCliente();
  assert.equal((await postarInteracao({ ...INTERACAO, titulo: '' })).status, 400);
  assert.equal((await postarInteracao({ ...INTERACAO, tipo: 'Fax' })).status, 400);
  assert.equal((await postarInteracao({ ...INTERACAO, dataHora: 'ontem' })).status, 400);
  assert.equal((await request(app).patch(`/api/clientes/${WHATSAPP}`).send({ status: 'Inventado' })).status, 400);
});

test('19. atualiza automaticamente o último contato', async () => {
  await criarCliente({ ultimoContato: '2026-09-01T00:00:00.000Z' });
  await postarInteracao();
  assert.equal((await database.read()).clientes[WHATSAPP].ultimoContato, INTERACAO.dataHora);
});

test('20. recalcula último contato ao editar interação', async () => {
  await criarCliente();
  const primeira = await postarInteracao({ ...INTERACAO, dataHora: '2026-09-18T10:00:00Z' });
  await postarInteracao({ ...INTERACAO, dataHora: '2026-09-19T10:00:00Z' });
  await request(app).patch(`/api/clientes/${WHATSAPP}/interacoes/${primeira.body.id}`).send({ ...INTERACAO, dataHora: '2026-09-20T10:00:00Z' });
  assert.equal((await database.read()).clientes[WHATSAPP].ultimoContato, '2026-09-20T10:00:00.000Z');
});

test('21. recalcula último contato ao excluir a interação mais recente', async () => {
  await criarCliente();
  await postarInteracao({ ...INTERACAO, dataHora: '2026-09-18T10:00:00Z' });
  const recente = await postarInteracao({ ...INTERACAO, dataHora: '2026-09-20T10:00:00Z' });
  await request(app).delete(`/api/clientes/${WHATSAPP}/interacoes/${recente.body.id}`);
  assert.equal((await database.read()).clientes[WHATSAPP].ultimoContato, '2026-09-18T10:00:00.000Z');
});

test('22. preserva as demais interações ao excluir somente uma', async () => {
  await criarCliente();
  const uma = await postarInteracao({ ...INTERACAO, titulo: 'Uma' });
  const duas = await postarInteracao({ ...INTERACAO, titulo: 'Duas' });
  await request(app).delete(`/api/clientes/${WHATSAPP}/interacoes/${uma.body.id}`);
  const restantes = (await database.read()).clientes[WHATSAPP].interacoes;
  assert.equal(restantes.length, 1);
  assert.equal(restantes[0].id, duas.body.id);
});

test('23. cadastra várias interações para o mesmo cliente', async () => {
  await criarCliente();
  await Promise.all([1, 2, 3].map((n) => postarInteracao({ ...INTERACAO, titulo: `Contato ${n}` })));
  const cliente = (await database.read()).clientes[WHATSAPP];
  assert.equal(cliente.interacoes.length, 3);
  assert.equal(new Set(cliente.interacoes.map((i) => i.id)).size, 3);
});

test('24. mantém interações após recriar a camada de banco (reinício)', async () => {
  await criarCliente();
  const criada = await postarInteracao();
  const reiniciado = new JsonDatabase(dbPath);
  await reiniciado.init();
  assert.equal((await reiniciado.read()).clientes[WHATSAPP].interacoes[0].id, criada.body.id);
});

test('25. serializa duas gravações simultâneas sem perda de dados', async () => {
  await criarCliente();
  const [status, observacoes] = await Promise.all([
    request(app).patch(`/api/clientes/${WHATSAPP}`).send({ status: 'Fechado' }),
    request(app).patch(`/api/clientes/${WHATSAPP}`).send({ observacoes: 'Gravação concorrente' })
  ]);
  assert.equal(status.status, 200);
  assert.equal(observacoes.status, 200);
  const cliente = (await database.read()).clientes[WHATSAPP];
  assert.equal(cliente.status, 'Fechado');
  assert.equal(cliente.observacoes, 'Gravação concorrente');
});
