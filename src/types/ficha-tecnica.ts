export interface FormData {
  // Dados do Cliente
  cliente: string;
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
  projeto_desenvolvido_por: string; // HMC ou CLIENTE ou HMC/CLIENTE
  desenho_peca: string; // HMC ou CLIENTE
  desenho_finalizado: string; // SIM ou NAO
  transporte_caminhao_hmc: boolean;
  transporte_pickup_hmc: boolean;
  transporte_cliente: boolean;
  
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
  balanceamento_campo: string;
  rotacao: string;
  fornecimento_desenho: string; // SIM ou NAO
  fotos_relatorio: string; // SIM ou NAO
  relatorio_tecnico: string; // SIM ou NAO
  emissao_art: string; // SIM ou NAO
  servicos_terceirizados: string;
  
  // Horas de Serviço
  horas_por_peca: string;
  horas_todas_pecas: string;
  torno_grande: string;
  torno_pequeno: string;
  cnc_tf: string;
  fresa_furad: string;
  plasma_oxicorte: string;
  dobra: string;
  calandra: string;
  macarico_solda: string;
  des_montg: string;
  balanceamento: string;
  mandrilhamento: string;
  tratamento: string;
  pintura_horas: string;
  lavagem_acab: string;
  programacao_cam: string;
  eng_tec: string;
  
  
  // Controle
  num_orcamento: string;
  num_os: string;
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

export const clientesPredefinidos = [
  "BTP", "TEG", "TEAG", "TES", "DPWORLD", "ECOPORTO", "T39", 
  "SANTOS BRASIL", "MILLS", "ADM", "CLI - RUMO", "TGG", "CMOC", 
  "T12A", "ULTRAFERTIL", "RIO BRASIL SEPETIBA", "TERLOC", "INOVE", 
  "XCMG", "COPERSUCAR", "TERRACOM", "TGRAO", "PORÃ", "CUTRALE", 
  "CONSUMIDOR", "STERN", "COIMBRA - USIT", "MARIMEX", "KEPLER", 
  "ELDORADO"
];

// Interface for saved fichas
export interface FichaSalva {
  id: string;
  numeroFTC: string;
  dataCriacao: string;
  dataUltimaEdicao: string;
  status: 'rascunho' | 'finalizada';
  formData: FormData;
  materiais: Material[];
  fotos: Foto[]; // Now includes both new photos and saved photos with real URLs
  calculos: Calculos;
  resumo: {
    cliente: string;
    servico: string;
    quantidade: string;
    valorTotal: number;
  };
}