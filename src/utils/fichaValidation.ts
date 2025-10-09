import { FormData, Material, StatusFicha } from "@/types/ficha-tecnica";

export interface ValidationError {
  field: string;        // Nome técnico do campo
  label: string;        // Label amigável para exibição
  message: string;      // Mensagem de erro
  section: string;      // Seção do formulário
  severity: 'error' | 'warning'; // Severidade (error bloqueia, warning apenas avisa)
}

/**
 * Valida todos os campos da ficha técnica baseado no status atual
 * @param formData - Dados do formulário
 * @param materiais - Lista de materiais
 * @param currentStatus - Status atual da ficha
 * @returns Array de erros de validação
 */
export function validateFichaFields(
  formData: FormData,
  materiais: Material[],
  currentStatus: StatusFicha
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isRascunho = currentStatus === 'rascunho';

  // ============================================
  // 1. CAMPOS SEMPRE OBRIGATÓRIOS (todos os status)
  // ============================================

  // Dados do Cliente
  if (!formData.cliente?.trim()) {
    errors.push({
      field: 'cliente',
      label: 'Cliente',
      message: 'Nome do cliente é obrigatório',
      section: 'Dados do Cliente',
      severity: 'error'
    });
  }

  if (!formData.solicitante?.trim()) {
    errors.push({
      field: 'solicitante',
      label: 'Solicitante',
      message: 'Nome do solicitante é obrigatório',
      section: 'Dados do Cliente',
      severity: 'error'
    });
  }

  // Telefone é opcional (pode ter apenas WhatsApp ou outros meios de contato)

  // Email é opcional, mas se for fornecido, deve ser válido
  if (formData.email?.trim() && !isValidEmail(formData.email)) {
    errors.push({
      field: 'email',
      label: 'Email',
      message: 'Email inválido (formato incorreto)',
      section: 'Dados do Cliente',
      severity: 'error'
    });
  }

  // Dados da Peça
  if (!formData.nome_peca?.trim()) {
    errors.push({
      field: 'nome_peca',
      label: 'Nome da Peça',
      message: 'Nome da peça/equipamento é obrigatório',
      section: 'Dados da Peça',
      severity: 'error'
    });
  }

  if (!formData.quantidade?.trim() || parseFloat(formData.quantidade) <= 0) {
    errors.push({
      field: 'quantidade',
      label: 'Quantidade',
      message: 'Quantidade deve ser maior que zero',
      section: 'Dados da Peça',
      severity: 'error'
    });
  }

  if (!formData.servico?.trim()) {
    errors.push({
      field: 'servico',
      label: 'Serviço',
      message: 'Descrição do serviço é obrigatória',
      section: 'Dados da Peça',
      severity: 'error'
    });
  }

  // ============================================
  // 2. CAMPOS OPCIONAIS - REMOVIDOS POR DECISÃO DO USUÁRIO
  // ============================================
  // Os seguintes campos NÃO são mais obrigatórios em nenhum status:
  // - data_entrega (preenchida quando souber)
  // - observacoes_adicionais (opcional)
  // - num_orcamento (preenchido pelo comercial depois)
  // - num_os (preenchido pela produção depois)
  // - num_desenho (nem sempre existe)
  // - num_nf_remessa (preenchido depois)
  // - materiais.valor_unitario (preenchido pelas compras)
  // - materiais.fornecedor (preenchido pelas compras)
  //
  // Apenas validações condicionais (pintura, galvanização, etc) são mantidas abaixo.

  // ============================================
  // 3. VALIDAÇÕES CONDICIONAIS (todos os status)
  // ============================================

  // Pintura: Se marcado SIM, cor é obrigatória
  if (formData.pintura === 'SIM' && !formData.cor_pintura?.trim()) {
    errors.push({
      field: 'cor_pintura',
      label: 'Cor da Pintura',
      message: 'Cor da pintura é obrigatória quando "Pintura" é marcada como SIM',
      section: 'Tratamentos e Acabamentos',
      severity: 'error'
    });
  }

  // Galvanização: Se marcado SIM, peso é obrigatório
  if (formData.galvanizacao === 'SIM' && (!formData.peso_peca_galv?.trim() || parseFloat(formData.peso_peca_galv) <= 0)) {
    errors.push({
      field: 'peso_peca_galv',
      label: 'Peso para Galvanização',
      message: 'Peso da peça é obrigatório quando "Galvanização" é marcada como SIM',
      section: 'Tratamentos e Acabamentos',
      severity: 'error'
    });
  }

  // Tratamento Térmico: Se marcado SIM, peso e tempera/reven são obrigatórios
  if (formData.tratamento_termico === 'SIM') {
    if (!formData.peso_peca_trat?.trim() || parseFloat(formData.peso_peca_trat) <= 0) {
      errors.push({
        field: 'peso_peca_trat',
        label: 'Peso para Tratamento Térmico',
        message: 'Peso da peça é obrigatório quando "Tratamento Térmico" é marcado como SIM',
        section: 'Tratamentos e Acabamentos',
        severity: 'error'
      });
    }

    if (!formData.tempera_reven?.trim()) {
      errors.push({
        field: 'tempera_reven',
        label: 'Tempera/Revenimento',
        message: 'Especificações de Tempera/Revenimento são obrigatórias quando "Tratamento Térmico" é marcado como SIM',
        section: 'Tratamentos e Acabamentos',
        severity: 'error'
      });
    }
  }

  // Visita Técnica: Se marcado SIM, horas e data são obrigatórias
  if (formData.visita_tecnica === 'SIM') {
    if (!formData.visita_horas?.trim() || parseFloat(formData.visita_horas) <= 0) {
      errors.push({
        field: 'visita_horas',
        label: 'Horas de Visita',
        message: 'Horas de visita são obrigatórias quando "Visita Técnica" é marcada como SIM',
        section: 'Execução e Detalhes',
        severity: 'error'
      });
    }

    if (!formData.data_visita?.trim()) {
      errors.push({
        field: 'data_visita',
        label: 'Data da Visita',
        message: 'Data da visita é obrigatória quando "Visita Técnica" é marcada como SIM',
        section: 'Dados do Cliente',
        severity: 'error'
      });
    }
  }

  // Balanceamento: Se marcado SIM, rotação é obrigatória
  if (formData.balanceamento_campo === 'SIM' && !formData.rotacao?.trim()) {
    errors.push({
      field: 'rotacao',
      label: 'Rotação (RPM)',
      message: 'Rotação é obrigatória quando "Balanceamento" é marcado como SIM',
      section: 'Tratamentos e Acabamentos',
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Valida se um email tem formato válido
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Agrupa erros por seção para melhor visualização
 */
export function groupErrorsBySection(errors: ValidationError[]): Map<string, ValidationError[]> {
  const grouped = new Map<string, ValidationError[]>();

  errors.forEach(error => {
    const existing = grouped.get(error.section) || [];
    existing.push(error);
    grouped.set(error.section, existing);
  });

  return grouped;
}

/**
 * Retorna apenas erros críticos (severity = 'error')
 */
export function getCriticalErrors(errors: ValidationError[]): ValidationError[] {
  return errors.filter(e => e.severity === 'error');
}

/**
 * Retorna apenas avisos (severity = 'warning')
 */
export function getWarnings(errors: ValidationError[]): ValidationError[] {
  return errors.filter(e => e.severity === 'warning');
}
