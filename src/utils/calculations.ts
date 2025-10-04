import { Material, FormData, Calculos } from '@/types/ficha-tecnica';

export function calculateTotals(materiais: Material[], formData: FormData): Calculos {
  // Calculate total materials per piece
  const materialTotal = materiais.reduce((sum, material) => {
    return sum + (parseFloat(material.valor_total) || 0);
  }, 0);

  // Calculate total service hours per piece
  // INCLUI CAMPOS ANTIGOS (14) + NOVOS (12) = 26 CAMPOS TOTAIS
  const horasServico = [
    // Campos antigos (14 campos - alguns deprecated)
    parseFloat(formData.torno_grande) || 0,
    parseFloat(formData.torno_pequeno) || 0,
    parseFloat(formData.cnc_tf) || 0,          // DEPRECATED - usar torno_cnc
    parseFloat(formData.fresa_furad) || 0,      // DEPRECATED - usar fresa + furadeira
    parseFloat(formData.plasma_oxicorte) || 0,
    parseFloat(formData.dobra) || 0,
    parseFloat(formData.calandra) || 0,
    parseFloat(formData.macarico_solda) || 0,   // DEPRECATED - usar macarico + solda
    parseFloat(formData.des_montg) || 0,        // Mantido para DESMONTAGEM
    parseFloat(formData.balanceamento) || 0,
    parseFloat(formData.mandrilhamento) || 0,
    parseFloat(formData.tratamento) || 0,
    parseFloat(formData.pintura_horas) || 0,
    parseFloat(formData.lavagem_acab) || 0,     // DEPRECATED - usar lavagem + acabamento
    parseFloat(formData.programacao_cam) || 0,
    parseFloat(formData.eng_tec) || 0,

    // 🆕 Novos campos (12 campos)
    parseFloat(formData.torno_cnc) || 0,
    parseFloat(formData.centro_usinagem) || 0,
    parseFloat(formData.fresa) || 0,
    parseFloat(formData.furadeira) || 0,
    parseFloat(formData.macarico) || 0,
    parseFloat(formData.solda) || 0,
    parseFloat(formData.serra) || 0,
    parseFloat(formData.caldeiraria) || 0,
    parseFloat(formData.montagem) || 0,
    parseFloat(formData.lavagem) || 0,
    parseFloat(formData.acabamento) || 0,
    parseFloat(formData.tecnico_horas) || 0,
  ].reduce((sum, horas) => sum + horas, 0);

  const quantidade = parseFloat(formData.quantidade) || 1;

  return {
    horasPorPeca: horasServico, // Total de horas informado pelo técnico
    horasTodasPecas: horasServico, // Não multiplicar - técnico já informa total
    materialPorPeca: materialTotal, // Soma total de todos os materiais
    materialTodasPecas: materialTotal, // Manter o valor total como preenchido pelo técnico
  };
}

