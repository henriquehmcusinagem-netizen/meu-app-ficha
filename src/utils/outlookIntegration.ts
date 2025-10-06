import { FichaSalva } from '@/types/ficha-tecnica';
import { generateHTMLContent } from './htmlGenerator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Configuração do email comercial
const COMERCIAL_EMAIL = 'contato@hmcusinagem.com.br';

/**
 * Função auxiliar para upload do HTML e geração de link
 */
async function uploadHTMLAndGetLink(ficha: FichaSalva): Promise<string | null> {
  try {
    const htmlContent = await generateHTMLContent(ficha);
    const fileName = `ficha-${ficha.numeroFTC}-${Date.now()}.html`;
    const filePath = `temp/${fileName}`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

    const { data, error } = await supabase.storage
      .from('ficha-fotos')
      .upload(filePath, htmlBlob, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ficha-fotos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do HTML:', error);
    return null;
  }
}

/**
 * Função principal para enviar ficha técnica via Outlook
 * Gera HTML, baixa arquivo e abre Outlook com email pré-configurado
 */
export async function sendFichaViaOutlook(ficha: FichaSalva): Promise<void> {
  try {
    // 1. Gerar link do HTML para incluir no email
    toast({
      title: "Preparando email...",
      description: "Gerando link da ficha técnica e preparando email para comercial.",
    });

    const htmlLink = await uploadHTMLAndGetLink(ficha);

    // 2. Preparar dados do email (com link incluído)
    const emailData = prepareEmailData(ficha, htmlLink);

    // 3. Mostrar feedback ao usuário
    showUserInstructions(ficha.numeroFTC);

    // 4. Pequeno delay e abrir Outlook
    setTimeout(() => {
      openOutlookWithEmail(emailData);
    }, 1000);

  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível preparar o email. Tente novamente.",
      variant: "destructive"
    });
  }
}

/**
 * Baixa o arquivo HTML da ficha técnica
 */
function downloadHTMLFile(ficha: FichaSalva, htmlContent: string): Promise<void> {
  return new Promise((resolve) => {
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Nome do arquivo com data para evitar conflitos
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente.replace(/[^a-zA-Z0-9]/g, '_')}_${dataAtual}.html`;

    // Criar link de download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL do blob após pequeno delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve();
    }, 100);
  });
}

/**
 * Prepara os dados do email formatado
 */
function prepareEmailData(ficha: FichaSalva, htmlLink?: string | null) {
  const assunto = `[COTAÇÃO PRONTA] FTC ${ficha.numeroFTC} - ${ficha.formData.cliente}`;

  // Formato dos materiais para o email
  const materiaisFormatados = ficha.materiais
    .filter(m => m.descricao.trim() && parseFloat(m.quantidade) > 0)
    .map(m => `• ${m.descricao}: ${m.quantidade} ${m.unidade} x R$ ${parseFloat(m.valor_unitario).toFixed(2)} = R$ ${parseFloat(m.valor_total).toFixed(2)}`)
    .join('\n');

  // Calcular detalhamento de horas por equipamento
  const horasEquipamentos = [];
  if (ficha.formData.torno_grande && parseFloat(ficha.formData.torno_grande) > 0) {
    horasEquipamentos.push(`Torno Grande ${ficha.formData.torno_grande}h`);
  }
  if (ficha.formData.torno_pequeno && parseFloat(ficha.formData.torno_pequeno) > 0) {
    horasEquipamentos.push(`Torno Pequeno ${ficha.formData.torno_pequeno}h`);
  }
  if (ficha.formData.cnc_tf && parseFloat(ficha.formData.cnc_tf) > 0) {
    horasEquipamentos.push(`CNC/TF ${ficha.formData.cnc_tf}h`);
  }
  if (ficha.formData.fresa_furad && parseFloat(ficha.formData.fresa_furad) > 0) {
    horasEquipamentos.push(`Fresa/Furad ${ficha.formData.fresa_furad}h`);
  }
  if (ficha.formData.plasma_oxicorte && parseFloat(ficha.formData.plasma_oxicorte) > 0) {
    horasEquipamentos.push(`Plasma/Oxicorte ${ficha.formData.plasma_oxicorte}h`);
  }
  if (ficha.formData.dobra && parseFloat(ficha.formData.dobra) > 0) {
    horasEquipamentos.push(`Dobra ${ficha.formData.dobra}h`);
  }
  if (ficha.formData.calandra && parseFloat(ficha.formData.calandra) > 0) {
    horasEquipamentos.push(`Calandra ${ficha.formData.calandra}h`);
  }
  if (ficha.formData.macarico_solda && parseFloat(ficha.formData.macarico_solda) > 0) {
    horasEquipamentos.push(`Maçarico/Solda ${ficha.formData.macarico_solda}h`);
  }
  if (ficha.formData.des_montg && parseFloat(ficha.formData.des_montg) > 0) {
    horasEquipamentos.push(`Des/Montagem ${ficha.formData.des_montg}h`);
  }
  if (ficha.formData.balanceamento && parseFloat(ficha.formData.balanceamento) > 0) {
    horasEquipamentos.push(`Balanceamento ${ficha.formData.balanceamento}h`);
  }
  if (ficha.formData.mandrilhamento && parseFloat(ficha.formData.mandrilhamento) > 0) {
    horasEquipamentos.push(`Mandrilhamento ${ficha.formData.mandrilhamento}h`);
  }
  if (ficha.formData.tratamento && parseFloat(ficha.formData.tratamento) > 0) {
    horasEquipamentos.push(`Tratamento ${ficha.formData.tratamento}h`);
  }
  if (ficha.formData.pintura_horas && parseFloat(ficha.formData.pintura_horas) > 0) {
    horasEquipamentos.push(`Pintura ${ficha.formData.pintura_horas}h`);
  }
  if (ficha.formData.lavagem_acab && parseFloat(ficha.formData.lavagem_acab) > 0) {
    horasEquipamentos.push(`Lavagem/Acab ${ficha.formData.lavagem_acab}h`);
  }
  if (ficha.formData.inspecao && parseFloat(ficha.formData.inspecao) > 0) {
    horasEquipamentos.push(`Inspeção ${ficha.formData.inspecao}h`);
  }
  if (ficha.formData.outros_servicos && parseFloat(ficha.formData.outros_servicos) > 0) {
    horasEquipamentos.push(`Outros ${ficha.formData.outros_servicos}h`);
  }

  const detalhamentoHoras = horasEquipamentos.length > 0
    ? ` (${horasEquipamentos.join(', ')})`
    : '';

  // Formatação da data em português
  const dataFormatada = new Date(ficha.dataCriacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const corpo = `Prezado(a) Comercial,

Segue ficha técnica com cotação de materiais FINALIZADA para geração de orçamento.

═══════════════════════════════════════════════
DADOS DA FICHA TÉCNICA
═══════════════════════════════════════════════
• FTC Nº: ${ficha.numeroFTC}
• Cliente: ${ficha.formData.cliente}
• Solicitante: ${ficha.formData.solicitante}${ficha.formData.fone_email ? `\n• Contato: ${ficha.formData.fone_email}` : ''}

• Peça/Equipamento: ${ficha.formData.nome_peca}
• Quantidade: ${ficha.formData.quantidade}
• Serviço: ${ficha.formData.servico}
• Data Criação: ${dataFormatada}

═══════════════════════════════════════════════
MATERIAIS COTADOS (COMPRAS)
═══════════════════════════════════════════════
${materiaisFormatados}

💰 TOTAL MATERIAIS: R$ ${ficha.calculos.materialTodasPecas.toFixed(2)}

═══════════════════════════════════════════════
RESUMO TÉCNICO
═══════════════════════════════════════════════
• Horas Totais: ${ficha.calculos.horasTodasPecas}h${detalhamentoHoras}
• Execução: ${ficha.formData.execucao}
• Visita Técnica: ${ficha.formData.visita_tecnica}

═══════════════════════════════════════════════
ACESSO À FICHA TÉCNICA COMPLETA
═══════════════════════════════════════════════
${htmlLink ? `🔗 Link para FTC online: ${htmlLink}` : '📄 Arquivo HTML anexado com todos os detalhes'}

═══════════════════════════════════════════════
PRÓXIMOS PASSOS
═══════════════════════════════════════════════
✅ Cotação de materiais CONCLUÍDA pelo Compras
📊 Aguardando geração de orçamento pelo Comercial
📧 Ficha técnica completa disponível online

⚠️ IMPORTANTE:
• ${htmlLink ? 'Use o link acima para acessar a ficha técnica completa' : 'Anexe o arquivo HTML que foi baixado automaticamente'}
• O arquivo/link contém TODOS os detalhes da ficha técnica
• Após gerar o orçamento, preencha o campo "Nº Orçamento" no sistema

Atenciosamente,
Departamento de Compras
HMC Usinagem`;

  return { assunto, corpo };
}

/**
 * Abre o Outlook com o email pré-configurado
 */
function openOutlookWithEmail({ assunto, corpo }: { assunto: string; corpo: string }) {
  console.log('🔍 Iniciando abertura do Outlook para comercial:', COMERCIAL_EMAIL);

  const mailtoLink = `mailto:${COMERCIAL_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  console.log('📧 Link mailto criado (tamanho:', mailtoLink.length, 'caracteres)');

  // Tentar abrir o Outlook usando window.open como método principal
  try {
    console.log('🚀 Tentando abrir via window.open...');
    const newWindow = window.open(mailtoLink, '_self');

    // Verificar se window.open funcionou
    if (newWindow === null || typeof newWindow === 'undefined') {
      console.log('⚠️ window.open falhou, tentando fallback com location.href');
      window.location.href = mailtoLink;
    } else {
      console.log('✅ Outlook aberto com sucesso via window.open');

      // Mostrar feedback de sucesso
      toast({
        title: "📧 Outlook Aberto",
        description: "Email pré-configurado foi aberto no Outlook. Verifique sua aplicação de email.",
        duration: 3000
      });
    }
  } catch (error) {
    console.error('❌ Erro ao abrir Outlook:', error);

    // Fallback final: tentar abrir em nova janela
    try {
      console.log('🔄 Tentando fallback final com _blank...');
      window.open(mailtoLink, '_blank');

      toast({
        title: "⚠️ Outlook Aberto em Nova Aba",
        description: "O email foi aberto em uma nova aba. Se não funcionou, copie o link de email manual.",
        variant: "destructive"
      });
    } catch (finalError) {
      console.error('❌ Todos os métodos falharam:', finalError);

      toast({
        title: "❌ Erro ao Abrir Email",
        description: "Não foi possível abrir o Outlook automaticamente. Verifique se você tem um cliente de email configurado.",
        variant: "destructive"
      });
    }
  }
}

/**
 * Mostra instruções visuais para o usuário
 */
function showUserInstructions(numeroFTC: string) {
  toast({
    title: "📧 Preparando email para Comercial",
    description: `FTC ${numeroFTC} - Link da ficha incluído no email. O Outlook abrirá em seguida!`,
    duration: 4000
  });
}

/**
 * Função auxiliar para obter nome limpo do cliente
 */
export function getCleanClientName(cliente: string): string {
  return cliente
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .substring(0, 20); // Limita tamanho
}

/**
 * Verifica se todos os materiais têm preços para envio
 */
export function canSendToComercial(ficha: FichaSalva): boolean {
  const materiaisValidos = ficha.materiais.filter(m =>
    m.descricao.trim() && parseFloat(m.quantidade) > 0
  );

  if (materiaisValidos.length === 0) {
    return false;
  }

  // Verifica se todos os materiais válidos têm preços
  return materiaisValidos.every(m =>
    parseFloat(m.valor_unitario) > 0 && parseFloat(m.valor_total) > 0
  );
}