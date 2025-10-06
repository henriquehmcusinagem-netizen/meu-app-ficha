/**
 * Feature Flags - Sistema de controle de funcionalidades
 *
 * Permite ativar/desativar módulos novos sem quebrar produção
 *
 * IMPORTANTE: Em produção, deixar tudo FALSE até validar completamente
 */

export const FEATURES = {
  /**
   * Módulo de Compras (Beta)
   * - Cotação de materiais
   * - Requisições de compra
   * - Controle de estoque/trânsito
   */
  ENABLE_COMPRAS_MODULE: import.meta.env.VITE_ENABLE_COMPRAS === 'true',

  /**
   * Módulo Comercial (Beta)
   * - Gestão de orçamentos
   * - Aprovações de clientes
   * - Estatísticas comerciais
   */
  ENABLE_COMERCIAL_MODULE: import.meta.env.VITE_ENABLE_COMERCIAL === 'true',

  /**
   * Módulo PCP (Beta)
   * - Validação de requisições
   * - Aprovação de medidas/desenhos
   * - Liberação para compras
   */
  ENABLE_PCP_MODULE: import.meta.env.VITE_ENABLE_PCP === 'true',

  /**
   * Módulo de Produção (Beta)
   * - Ordens de Serviço (OS)
   * - Controle de processos
   * - Gestão de chão de fábrica
   */
  ENABLE_PRODUCAO_MODULE: import.meta.env.VITE_ENABLE_PRODUCAO === 'true',
} as const;

/**
 * Helper para debug
 */
export function logFeatureFlags() {
  console.log('🎛️ Feature Flags Status:', {
    Compras: FEATURES.ENABLE_COMPRAS_MODULE ? '✅ ON' : '❌ OFF',
    Comercial: FEATURES.ENABLE_COMERCIAL_MODULE ? '✅ ON' : '❌ OFF',
    PCP: FEATURES.ENABLE_PCP_MODULE ? '✅ ON' : '❌ OFF',
    Producao: FEATURES.ENABLE_PRODUCAO_MODULE ? '✅ ON' : '❌ OFF',
  });
}

/**
 * Verifica se pelo menos um módulo novo está ativo
 */
export function hasAnyNewModule(): boolean {
  return Object.values(FEATURES).some(flag => flag === true);
}
