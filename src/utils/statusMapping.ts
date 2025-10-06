import { StatusFicha } from '@/types/ficha-tecnica';

/**
 * Retorna o status anterior no fluxo de trabalho
 * Retorna null se o status atual não pode ser estornado (rascunho)
 *
 * Fluxo de estorno:
 * orcamento_enviado_cliente → aguardando_orcamento_comercial
 * aguardando_orcamento_comercial → aguardando_cotacao_compras
 * aguardando_cotacao_compras → rascunho
 * rascunho → null (não pode estornar)
 */
export function getPreviousStatus(currentStatus: StatusFicha): StatusFicha | null {
  switch (currentStatus) {
    case 'aguardando_cotacao_compras':
      return 'rascunho'; // Devolve para técnico
    case 'aguardando_orcamento_comercial':
      return 'aguardando_cotacao_compras'; // Devolve para compras
    case 'orcamento_enviado_cliente':
      return 'aguardando_orcamento_comercial'; // Reabre comercial
    case 'rascunho':
      return null; // Não pode estornar
    default:
      return null;
  }
}

/**
 * Verifica se um status pode ser estornado
 */
export function canRevertStatus(currentStatus: StatusFicha): boolean {
  return getPreviousStatus(currentStatus) !== null;
}