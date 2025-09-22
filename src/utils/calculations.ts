import { Material, FormData, Calculos } from '@/types/ficha-tecnica';

export function calculateTotals(materiais: Material[], formData: FormData): Calculos {
  // Calculate total materials per piece
  const materialTotal = materiais.reduce((sum, material) => {
    return sum + (parseFloat(material.valor_total) || 0);
  }, 0);

  // Calculate total service hours per piece
  const horasServico = [
    parseFloat(formData.torno_grande) || 0,
    parseFloat(formData.torno_pequeno) || 0,
    parseFloat(formData.cnc_tf) || 0,
    parseFloat(formData.fresa_furad) || 0,
    parseFloat(formData.plasma_oxicorte) || 0,
    parseFloat(formData.dobra) || 0,
    parseFloat(formData.calandra) || 0,
    parseFloat(formData.macarico_solda) || 0,
    parseFloat(formData.des_montg) || 0,
    parseFloat(formData.balanceamento) || 0,
    parseFloat(formData.mandrilhamento) || 0,
    parseFloat(formData.tratamento) || 0,
    parseFloat(formData.pintura_horas) || 0,
    parseFloat(formData.lavagem_acab) || 0,
    parseFloat(formData.programacao_cam) || 0,
    parseFloat(formData.eng_tec) || 0,
  ].reduce((sum, horas) => sum + horas, 0);

  const quantidade = parseFloat(formData.quantidade) || 1;

  return {
    horasPorPeca: horasServico,
    horasTodasPecas: horasServico * quantidade,
    materialPorPeca: materialTotal,
    materialTodasPecas: materialTotal * quantidade,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}