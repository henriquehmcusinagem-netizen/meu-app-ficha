import { Material, FormData, Calculos } from '@/types/ficha-tecnica';

export function calculateTotals(materiais: Material[], formData: FormData): Calculos {
  // Calculate total materials
  const totalMateriais = materiais.reduce((sum, material) => {
    return sum + (parseFloat(material.total) || 0);
  }, 0);

  // Calculate mechanic hours total
  const horasMecanico = parseFloat(formData.horasMecanico) || 0;
  const valorHoraMecanico = parseFloat(formData.valorHoraMecanico) || 0;
  const totalMecanico = horasMecanico * valorHoraMecanico;

  // Calculate welder hours total
  const horasSoldador = parseFloat(formData.horasSoldador) || 0;
  const valorHoraSoldador = parseFloat(formData.valorHoraSoldador) || 0;
  const totalSoldador = horasSoldador * valorHoraSoldador;

  // Calculate total hours
  const totalHoras = totalMecanico + totalSoldador;

  // Calculate general total
  const totalGeral = totalMateriais + totalHoras;

  return {
    totalMateriais,
    totalMecanico,
    totalSoldador,
    totalHoras,
    totalGeral,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}