# CRM de Prospecção

Aplicação web local para gerenciar possíveis clientes interessados em landing pages. Os clientes são importados de CSV, salvos em `db.json` e podem ter um histórico ilimitado de interações. Não há banco SQL, MongoDB ou serviço externo.

## Requisitos

- Node.js 18 ou superior (recomendado: versão LTS atual)
- npm

## Instalação e execução

```bash
npm install
npm start
```

Depois, acesse [http://localhost:3000](http://localhost:3000). Para escolher outra porta:

```powershell
$env:PORT=4000; npm start
```

## Testes

```bash
npm test
```

Os 25 testes usam diretórios e arquivos JSON temporários, portanto não modificam o `db.json` real. A suíte cobre importação, duplicidades, validações, busca, filtros, persistência, CRUD de interações, recálculo do último contato, reinício e gravações concorrentes.

## Formato do CSV

O arquivo deve ser UTF-8 (com ou sem BOM), separado por vírgulas e conter exatamente estas colunas obrigatórias:

```text
Empresa,Segmento,Cidade,WhatsApp,Link WhatsApp,Endereço,Presença digital encontrada,Prioridade,Oportunidade para landing page,Fonte pública,Verificado em
```

Linhas vazias são ignoradas. Linhas sem um WhatsApp válido são contabilizadas como inválidas. O upload aceita somente arquivos `.csv` de até 5 MB e o arquivo temporário é apagado ao final da operação.

O arquivo de exemplo incluído no projeto é `empresas_joinville_para_landing_page.csv`.

## Normalização e duplicidades

O WhatsApp é a chave única do cliente. Espaços, parênteses, hífens, `+` e quaisquer outros caracteres que não sejam dígitos são removidos. Por exemplo, `+55 47 99622-4749` vira `5547996224749`.

Na reimportação, dados originários do CSV são atualizados somente quando o novo valor não está vazio. Status, último contato, observações, data de criação e interações são preservados. Duplicidades encontradas no próprio CSV também entram na contagem de “já cadastrados”.

## Persistência e backup

Os dados ficam em `db.json`, na raiz do projeto. O arquivo é criado automaticamente quando não existe.

As alterações passam por uma fila em memória, impedindo perda de dados entre gravações simultâneas. Cada escrita gera primeiro um arquivo temporário e cria `db.json.bak` antes de substituir uma base válida. JSON vazio ou inválido gera erro e o original não é sobrescrito.

Para um backup adicional, pare o servidor e copie `db.json` para um local seguro. Para restaurar, mantenha o servidor parado, renomeie a base atual e coloque a cópia na raiz com o nome `db.json`.

## Histórico de interações

Cada interação fica dentro do array `interacoes` do cliente e recebe um UUID gerado exclusivamente no backend. Os canais aceitos são WhatsApp, Ligação, E-mail, Reunião, Visita, Proposta, Observação e Outro.

Ao criar, editar ou excluir uma interação, o último contato é recalculado pela interação mais recente. Quando não há interações, o último contato pode ser preenchido manualmente. A interface mostra o histórico em uma linha do tempo, do mais recente para o mais antigo.

## API

Todas as respostas da API são JSON, exceto a exclusão bem-sucedida (`204`, sem corpo).

### Clientes e importação

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/clientes` | Lista clientes com busca, filtros e paginação |
| `GET` | `/api/clientes/:whatsapp` | Consulta um cliente |
| `PATCH` | `/api/clientes/:whatsapp` | Edita status, último contato e observações |
| `POST` | `/api/importar` | Importa o campo multipart `arquivo` |
| `GET` | `/api/resumo` | Retorna os indicadores do painel |

Parâmetros de listagem: `busca`, `status`, `prioridade`, `segmento`, `comInteracoes` (`1` ou `true`), `page` e `limit` (máximo 100). Os cards do painel usam esses filtros e podem ser combinados com a busca, prioridade e segmento.

Exemplo:

```text
GET /api/clientes?busca=pizzaria&status=Pendente&prioridade=Alta&page=1&limit=20
```

### Interações

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/clientes/:whatsapp/interacoes` | Lista o histórico ordenado |
| `GET` | `/api/clientes/:whatsapp/interacoes/:interacaoId` | Consulta uma interação |
| `POST` | `/api/clientes/:whatsapp/interacoes` | Cria uma interação |
| `PATCH` | `/api/clientes/:whatsapp/interacoes/:interacaoId` | Edita uma interação |
| `DELETE` | `/api/clientes/:whatsapp/interacoes/:interacaoId` | Exclui somente a interação indicada |

Corpo para criação ou edição:

```json
{
  "dataHora": "2026-09-18T14:30:00.000Z",
  "tipo": "WhatsApp",
  "titulo": "Primeiro contato",
  "descricao": "Apresentei o serviço de landing page.",
  "resultado": "Enviar portfólio e valores."
}
```

O `id`, `criadoEm` e `atualizadoEm` são controlados pelo backend.

## Estrutura principal

```text
public/                  Interface HTML, CSS e JavaScript
src/routes/              Rotas REST de clientes e interações
src/services/            Persistência, importador e regras de interação
src/utils/               Normalização e validações
tests/                   Suíte automatizada isolada
db.json                  Base local
server.js                Inicialização do Express
```
