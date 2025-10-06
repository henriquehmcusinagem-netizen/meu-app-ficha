export interface FormData {
  // Dados do Cliente
  cliente: string;
  cliente_predefinido?: string;
  solicitante: string;
  fone_email: string;
  data_visita: string;
  data_entrega: string;
  
  // Dados da Peça/Equipamento
  nome_peca: string;
  quantidade: string;
  servico: string;
  
  // Material para Cotação
  material_por_peca: string;
  material_todas_pecas: string;
  
  // Execução e Detalhes
  execucao: string; // HMC ou CLIENTE
  visita_tecnica: string; // SIM ou NAO
  visita_horas: string;
  tem_peca_amostra: string; // SIM ou NAO

  // 🆕 NOVOS CAMPOS - Peças e Amostras
  peca_foi_desmontada: string; // SIM ou NAO
  peca_condicao: string; // NOVA ou USADA
  precisa_peca_teste: string; // SIM ou NAO
  responsavel_tecnico: string; // Carlos | Lucas | Henrique | Fábio | Outro

  projeto_desenvolvido_por: string; // HMC ou CLIENTE ou HMC/CLIENTE
  desenho_peca: string; // HMC ou CLIENTE
  desenho_finalizado: string; // SIM ou NAO
  transporte_caminhao_hmc: boolean;
  transporte_pickup_hmc: boolean;
  transporte_cliente: boolean;
  transporte: string; // Campo para FichaTecnicaForm
  
  // Tratamentos e Acabamentos - Campos extras para outlookIntegration
  inspecao: string;
  outros_servicos: string;
  
  // Tratamentos e Acabamentos
  pintura: string; // SIM ou NAO
  cor_pintura: string;
  galvanizacao: string; // SIM ou NAO
  peso_peca_galv: string;
  tratamento_termico: string; // SIM ou NAO
  peso_peca_trat: string;
  tempera_reven: string;
  cementacao: string;
  dureza: string;
  teste_lp: string; // SIM ou NAO
  balanceamento_campo: string; // SIM ou NAO
  rotacao: string; // RPM (condicional, só se balanceamento_campo = SIM)
  fornecimento_desenho: string; // SIM ou NAO
  fotos_relatorio: string; // SIM ou NAO
  relatorio_tecnico: string; // SIM ou NAO
  emissao_art: string; // SIM ou NAO
  servicos_terceirizados: string;

  // 🆕 NOVOS CAMPOS EXTRAS
  observacoes_adicionais: string; // Textarea para observações gerais
  prioridade: string; // Baixa | Normal | Alta | Emergência
  dados_orcamento?: string; // JSON estruturado do orçamento (OrcamentoData)

  // Horas de Serviço - CAMPOS ANTIGOS (manter por compatibilidade)
  horas_por_peca: string;
  horas_todas_pecas: string;
  torno_grande: string;
  torno_pequeno: string;
  cnc_tf: string; // DEPRECATED - usar torno_cnc
  fresa_furad: string; // DEPRECATED - usar fresa + furadeira
  plasma_oxicorte: string;
  dobra: string;
  calandra: string;
  macarico_solda: string; // DEPRECATED - usar macarico + solda
  des_montg: string; // Mantido para DESMONTAGEM
  balanceamento: string;
  mandrilhamento: string;
  tratamento: string;
  pintura_horas: string;
  lavagem_acab: string; // DEPRECATED - usar lavagem + acabamento
  programacao_cam: string;
  eng_tec: string;

  // 🆕 NOVOS CAMPOS - Horas de Produção
  torno_cnc: string; // Substitui cnc_tf
  centro_usinagem: string;
  fresa: string; // Separado de fresa_furad
  furadeira: string; // Separado de fresa_furad
  macarico: string; // Separado de macarico_solda
  solda: string; // Separado de macarico_solda
  serra: string;
  caldeiraria: string;
  montagem: string; // Separado de des_montg
  lavagem: string; // Separado de lavagem_acab
  acabamento: string; // Separado de lavagem_acab
  tecnico_horas: string;
  
  
  // Controle
  num_orcamento: string;
  num_os: string;
  num_desenho: string;
  num_nf_remessa: string;
}

export interface Material {
  id: number;
  descricao: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
  fornecedor: string;
  cliente_interno: string;
  cliente_interno_tipo: string;
  valor_total: string;
}

export interface Foto {
  id: number;
  file?: File;
  preview?: string;
  name: string;
  size: number;
  storagePath?: string;
}

export interface Calculos {
  horasPorPeca: number;
  horasTodasPecas: number;
  materialPorPeca: number;
  materialTodasPecas: number;
}

// 📊 ORÇAMENTO - Interfaces para geração de orçamentos
export interface OrcamentoItem {
  id: number;
  item: string;                      // Numeração (1, 2, 3...)
  quantidade: number;
  descricao: string;                 // Nome da Peça
  valorUnitario: number;
  valorTotal: number;
}

export interface OrcamentoData {
  // Itens do orçamento
  itens: OrcamentoItem[];

  // Formação de preço
  custoBase: {
    materiaisCotados: number;        // Auto-calculado dos materiais
    materiasPrimaEstoque: number;    // Input manual
    servicosTerceiros: number;       // Input manual
    horasProducao: {
      horas: number;                 // Auto-calculado (campos de produção)
      valorHora: number;             // Input manual (R$/h) - padrão R$ 53,00
      total: number;                 // Auto-calculado
    };
    horasDespesasFixas: {
      horas: number;                 // Auto-calculado (eng, técnico, CAM, lavagem, acabamento)
      valorHora: number;             // Input manual (R$/h) - padrão R$ 0,00
      total: number;                 // Auto-calculado
    };
    totalCustoIndustrial: number;    // Auto-calculado
  };

  // Percentuais
  percentuais: {
    despesasVariaveis: number;       // % Input
    despesasFixas: number;           // % Input
    margemLucro: number;             // % Input
  };

  // Configurações
  config: {
    prazoEntrega: number;            // dias
    validadeProposta: number;        // dias
    prazoPagamento: number;          // dias
    condicoesPagamento: string;
    garantia: number;                // dias
  };

  // Preço final calculado
  precoVendaFinal: number;
}

export const clientesPredefinidos = [
  "BTP", "TEG", "TEAG", "TES", "DPWORLD", "ECOPORTO", "T39", 
  "SANTOS BRASIL", "MILLS", "ADM", "CLI - RUMO", "TGG", "CMOC", 
  "T12A", "ULTRAFERTIL", "RIO BRASIL SEPETIBA", "TERLOC", "INOVE", 
  "XCMG", "COPERSUCAR", "TERRACOM", "TGRAO", "PORÃ", "CUTRALE", 
  "CONSUMIDOR", "STERN", "COIMBRA - USIT", "MARIMEX", "KEPLER", 
  "ELDORADO"
];

// Status da Ficha Técnica - Fluxo Completo
// Atenção: Estes valores devem estar SINCRONIZADOS com a constraint do banco
// Ver migration: 20250926104505_update_status_constraint.sql
export type StatusFicha =
  | 'rascunho'                        // Técnico ainda preenchendo
  | 'preenchida'                      // Técnico finalizou preenchimento (status intermediário)
  | 'aguardando_cotacao_compras'      // Aguardando compras cotar materiais
  | 'aguardando_orcamento_comercial'  // Compras cotou, aguardando comercial gerar orçamento
  | 'orcamento_enviado_cliente';      // Comercial gerou e enviou orçamento ao cliente

// Interface for saved fichas
export interface FichaSalva {
  id: string;
  numeroFTC: string;
  dataCriacao: string;
  dataUltimaEdicao: string;
  status: StatusFicha;
  versao_orcamento_atual?: number; // 🆕 Versão atual do orçamento (incrementada a cada geração)
  versao_ftc_atual?: number; // 🆕 Versão atual da FTC Cliente (incrementada a cada geração)
  formData: FormData;
  materiais: Material[];
  fotos: Foto[]; // Now includes both new photos and saved photos with real URLs
  fotosCount?: number; // Count of photos without loading them (for performance)
  calculos: Calculos;
  resumo: {
    cliente: string;
    servico: string;
    quantidade: string;
    valorTotal: number;
  };
}

// Configuração dos status com cores e labels - Fluxo Atualizado
export const STATUS_CONFIG = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-800',
    icon: '✏️',
    description: 'Técnico ainda preenchendo',
    department: 'tecnico'
  },
  aguardando_cotacao_compras: {
    label: 'Aguardando Cotação (Compras)',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '💰',
    description: 'Compras cotando materiais',
    department: 'compras'
  },
  aguardando_orcamento_comercial: {
    label: 'Aguardando Orçamento (Comercial)',
    color: 'bg-purple-100 text-purple-800',
    icon: '📊',
    description: 'Comercial gerando orçamento',
    department: 'comercial'
  },
  orcamento_enviado_cliente: {
    label: 'Orçamento Enviado',
    color: 'bg-green-100 text-green-800',
    icon: '📤',
    description: 'Orçamento enviado ao cliente',
    department: 'comercial'
  }
} as const;