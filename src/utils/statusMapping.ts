import { StatusFicha } from '@/types/ficha-tecnica';

/**
 * Mapeia status do banco de dados para status da interface
 * Esta função converte os status antigos (que ainda estão no banco)
 * para os novos status usados na interface
 */
export function mapDatabaseStatusToInterface(databaseStatus: string): StatusFicha {
  let result: StatusFicha;
  switch (databaseStatus) {
    case 'aguardando_cotacao':
      result = 'aguardando_cotacao_compras';
      break;
    case 'preenchida':
      result = 'aguardando_cotacao_compras';
      break;
    case 'orcamento_gerado':
      result = 'aguardando_orcamento_comercial';
      break;
    case 'finalizada':
      result = 'orcamento_enviado_cliente';
      break;
    case 'rascunho':
      result = 'rascunho';
      break;
    case 'aguardando_cotacao_compras':
      result = 'aguardando_cotacao_compras';
      break;
    case 'aguardando_orcamento_comercial':
      result = 'aguardando_orcamento_comercial';
      break;
    case 'orcamento_enviado_cliente':
      result = 'orcamento_enviado_cliente';
      break;
    default:
      result = 'rascunho' as StatusFicha; // Fallback seguro
  }

  return result;
}

/**
 * Mapeia status da interface para status do banco de dados
 * Esta função converte os status novos da interface para os status
 * antigos que ainda funcionam no banco atual
 */
export function mapInterfaceStatusToDatabase(interfaceStatus: StatusFicha): string {
  switch (interfaceStatus) {
    case 'aguardando_cotacao_compras':
      return 'aguardando_cotacao';
    case 'aguardando_orcamento_comercial':
      return 'orcamento_gerado';
    case 'orcamento_enviado_cliente':
      return 'finalizada';
    case 'rascunho':
      return 'rascunho';
    default:
      return 'rascunho';
  }
}

/**
 * Retorna o status anterior no fluxo de trabalho
 * Retorna null se o status atual não pode ser estornado (rascunho)
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