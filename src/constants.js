const STATUS = [
  'Pendente',
  'Contatado',
  'Aguardando retorno',
  'Não tem interesse',
  'Já tem site',
  'Proposta enviada',
  'Negociação',
  'Fechado',
  'Contato inválido'
];

const TIPOS_INTERACAO = [
  'WhatsApp',
  'Ligação',
  'E-mail',
  'Reunião',
  'Visita',
  'Proposta',
  'Observação',
  'Outro'
];

const COLUNAS_CSV = [
  'Empresa',
  'Segmento',
  'Cidade',
  'WhatsApp',
  'Link WhatsApp',
  'Endereço',
  'Presença digital encontrada',
  'Prioridade',
  'Oportunidade para landing page',
  'Fonte pública',
  'Verificado em'
];

module.exports = { STATUS, TIPOS_INTERACAO, COLUNAS_CSV };
