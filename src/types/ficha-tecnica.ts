export interface FormData {
  cliente: string;
  obra: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  email: string;
  equipamento: string;
  modelo: string;
  marca: string;
  numeroSerie: string;
  ano: string;
  horimetro: string;
  servico: string;
  observacoes: string;
  solda: string;
  pintura: string;
  usinagem: string;
  outros: string;
  horasMecanico: string;
  valorHoraMecanico: string;
  horasSoldador: string;
  valorHoraSoldador: string;
}

export interface Material {
  id: number;
  item: number;
  quantidade: string;
  unidade: string;
  descricao: string;
  valorUnitario: string;
  total: string;
}

export interface Foto {
  id: number;
  file: File;
  preview: string;
  name: string;
  size: number;
}

export interface Calculos {
  totalMateriais: number;
  totalMecanico: number;
  totalSoldador: number;
  totalHoras: number;
  totalGeral: number;
}