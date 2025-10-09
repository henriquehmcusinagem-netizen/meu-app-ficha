/**
 * Utilitários de validação para PCP (Planejamento e Controle da Produção)
 * Valida processos de fabricação nas fichas técnicas
 */

interface FichaTecnica {
  // Processos antigos (ainda em uso)
  torno_grande?: number;
  torno_pequeno?: number;
  cnc_tf?: number;
  fresa_furad?: number;
  plasma_oxicorte?: number;
  dobra?: number;
  calandra?: number;
  macarico_solda?: number;
  des_montg?: number;
  balanceamento?: number;
  mandrilhamento?: number;
  tratamento?: number;
  pintura_horas?: number;
  lavagem_acab?: number;
  programacao_cam?: number;
  eng_tec?: number;

  // Processos novos (separados)
  torno_cnc?: number;
  centro_usinagem?: number;
  fresa?: number;
  furadeira?: number;
  macarico?: number;
  solda?: number;
  serra?: number;
  caldeiraria?: number;
  montagem?: number;
  lavagem?: number;
  acabamento?: number;
  tecnico_horas?: number;

  // Outros campos relevantes
  desenho_finalizado?: string;
  programacao_cam?: number;
}

export interface ResultadoValidacao {
  valido: boolean;
  alertas: string[];
  totalHoras: number;
  processosAtivos: string[];
}

/**
 * Valida processos de fabricação de uma ficha técnica
 * Verifica se há processos com horas > 0 e se fazem sentido
 */
export function validarProcessos(ficha: FichaTecnica): ResultadoValidacao {
  const alertas: string[] = [];
  const processosAtivos: string[] = [];
  let totalHoras = 0;

  // Mapear todos os processos (antigos e novos)
  const processos = [
    { nome: 'Torno Grande', valor: Number(ficha.torno_grande || 0) },
    { nome: 'Torno Pequeno', valor: Number(ficha.torno_pequeno || 0) },
    { nome: 'CNC/Torno CNC', valor: Number(ficha.cnc_tf || 0) + Number(ficha.torno_cnc || 0) },
    { nome: 'Centro de Usinagem', valor: Number(ficha.centro_usinagem || 0) },
    { nome: 'Fresa', valor: Number(ficha.fresa_furad || 0) + Number(ficha.fresa || 0) },
    { nome: 'Furadeira', valor: Number(ficha.furadeira || 0) },
    { nome: 'Plasma/Oxicorte', valor: Number(ficha.plasma_oxicorte || 0) },
    { nome: 'Dobra', valor: Number(ficha.dobra || 0) },
    { nome: 'Calandra', valor: Number(ficha.calandra || 0) },
    { nome: 'Maçarico', valor: Number(ficha.macarico_solda || 0) + Number(ficha.macarico || 0) },
    { nome: 'Solda', valor: Number(ficha.solda || 0) },
    { nome: 'Serra', valor: Number(ficha.serra || 0) },
    { nome: 'Caldeiraria', valor: Number(ficha.caldeiraria || 0) },
    { nome: 'Desmontagem', valor: Number(ficha.des_montg || 0) },
    { nome: 'Montagem', valor: Number(ficha.montagem || 0) },
    { nome: 'Balanceamento', valor: Number(ficha.balanceamento || 0) },
    { nome: 'Mandrilhamento', valor: Number(ficha.mandrilhamento || 0) },
    { nome: 'Tratamento', valor: Number(ficha.tratamento || 0) },
    { nome: 'Pintura', valor: Number(ficha.pintura_horas || 0) },
    { nome: 'Lavagem', valor: Number(ficha.lavagem_acab || 0) + Number(ficha.lavagem || 0) },
    { nome: 'Acabamento', valor: Number(ficha.acabamento || 0) },
    { nome: 'Programação CAM', valor: Number(ficha.programacao_cam || 0) },
    { nome: 'Engenharia/Técnico', valor: Number(ficha.eng_tec || 0) + Number(ficha.tecnico_horas || 0) },
  ];

  // Calcular total de horas e processos ativos
  processos.forEach((proc) => {
    if (proc.valor > 0) {
      totalHoras += proc.valor;
      processosAtivos.push(`${proc.nome} (${proc.valor}h)`);
    }
  });

  // Validação 1: Deve haver pelo menos 1 processo com horas
  if (totalHoras === 0) {
    alertas.push('⚠️ Nenhum processo de fabricação definido (0 horas totais)');
    return {
      valido: false,
      alertas,
      totalHoras: 0,
      processosAtivos: [],
    };
  }

  // Validação 2: Se desenho não finalizado, pode precisar de CAM
  const temCNC = (ficha.cnc_tf || 0) > 0 || (ficha.torno_cnc || 0) > 0 || (ficha.centro_usinagem || 0) > 0;
  const temCAM = (ficha.programacao_cam || 0) > 0;

  if (temCNC && !temCAM && ficha.desenho_finalizado === 'NAO') {
    alertas.push('⚠️ Processo CNC selecionado mas sem horas de Programação CAM e desenho não finalizado');
  }

  // Validação 3: Horas muito baixas (< 1h total) podem ser erro
  if (totalHoras < 1 && totalHoras > 0) {
    alertas.push(`⚠️ Total de horas muito baixo (${totalHoras}h) - confirmar se está correto`);
  }

  // Validação 4: Horas muito altas (> 200h) podem ser erro de digitação
  if (totalHoras > 200) {
    alertas.push(`⚠️ Total de horas muito alto (${totalHoras}h) - confirmar se está correto`);
  }

  // Se houver alertas mas total > 0, considerar válido mas com avisos
  const valido = totalHoras > 0;

  return {
    valido,
    alertas,
    totalHoras,
    processosAtivos,
  };
}

/**
 * Formata resultado de validação para exibição
 */
export function formatarValidacao(resultado: ResultadoValidacao): string {
  const { valido, alertas, totalHoras, processosAtivos } = resultado;

  if (!valido) {
    return `❌ Processos inválidos:\n${alertas.join('\n')}`;
  }

  let mensagem = `✅ Processos válidos\n📊 Total: ${totalHoras}h\n`;

  if (processosAtivos.length > 0) {
    mensagem += `\n🔧 Processos ativos:\n${processosAtivos.slice(0, 5).join('\n')}`;
    if (processosAtivos.length > 5) {
      mensagem += `\n... e mais ${processosAtivos.length - 5}`;
    }
  }

  if (alertas.length > 0) {
    mensagem += `\n\n${alertas.join('\n')}`;
  }

  return mensagem;
}
