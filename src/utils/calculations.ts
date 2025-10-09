import { Material, FormData, Calculos } from '@/types/ficha-tecnica';

export function calculateTotals(materiais: Material[], formData: FormData): Calculos {
  // Calculate total materials per piece
  const materialTotal = materiais.reduce((sum, material) => {
    return sum + (parseFloat(material.valor_total) || 0);
  }, 0);

  // Calculate total service hours per piece
  // APENAS CAMPOS ATIVOS (campos deprecated foram removidos após migration)
  const horasServico = [
    // Campos de Tornos e Usinagem
    parseFloat(formData.torno_grande) || 0,      // Torno 1200mm
    parseFloat(formData.torno_pequeno) || 0,     // Torno 650mm
    parseFloat(formData.torno_cnc) || 0,         // Torno CNC
    parseFloat(formData.centro_usinagem) || 0,   // Centro de Usinagem
    parseFloat(formData.fresa) || 0,             // Fresa
    parseFloat(formData.furadeira) || 0,         // Furadeira

    // Campos de Corte e Conformação
    parseFloat(formData.plasma_oxicorte) || 0,   // Plasma/Oxicorte
    parseFloat(formData.dobra) || 0,             // Dobra
    parseFloat(formData.calandra) || 0,          // Calandra
    parseFloat(formData.macarico) || 0,          // Maçarico
    parseFloat(formData.solda) || 0,             // Solda
    parseFloat(formData.serra) || 0,             // Serra
    parseFloat(formData.caldeiraria) || 0,       // Caldeiraria

    // Campos de Montagem e Especiais
    parseFloat(formData.des_montg) || 0,         // Desmontagem
    parseFloat(formData.montagem) || 0,          // Montagem
    parseFloat(formData.balanceamento) || 0,     // Balanceamento
    parseFloat(formData.mandrilhamento) || 0,    // Mandrilhamento
    parseFloat(formData.tratamento) || 0,        // Tratamento

    // Campos de Acabamento e Engenharia
    parseFloat(formData.pintura_horas) || 0,     // Pintura
    parseFloat(formData.lavagem) || 0,           // Lavagem
    parseFloat(formData.acabamento) || 0,        // Acabamento
    parseFloat(formData.programacao_cam) || 0,   // Programação CAM
    parseFloat(formData.eng_tec) || 0,           // Engenharia/Técnico
    parseFloat(formData.tecnico_horas) || 0,     // Técnico Horas
  ].reduce((sum, horas) => sum + horas, 0);

  const quantidade = parseFloat(formData.quantidade) || 1;

  return {
    horasPorPeca: horasServico, // Total de horas informado pelo técnico
    horasTodasPecas: horasServico, // Não multiplicar - técnico já informa total
    materialPorPeca: materialTotal, // Soma total de todos os materiais
    materialTodasPecas: materialTotal, // Manter o valor total como preenchido pelo técnico
  };
}

