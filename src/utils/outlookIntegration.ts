import { FichaSalva } from '@/types/ficha-tecnica';
import { generateHTMLContent } from './htmlGenerator';
import { toast } from '@/components/ui/use-toast';

// Configuração do email comercial
const COMERCIAL_EMAIL = 'contato@hmcusinagem.com.br';

/**
 * Função principal para enviar ficha técnica via Outlook
 * Gera HTML, baixa arquivo e abre Outlook com email pré-configurado
 */
export async function sendFichaViaOutlook(ficha: FichaSalva): Promise<void> {
  try {
    // 1. Gerar HTML otimizado da ficha (com destaque comercial)
    const htmlContent = generateHTMLContent(ficha);

    // 2. Baixar HTML automaticamente
    await downloadHTMLFile(ficha, htmlContent);

    // 3. Preparar dados do email
    const emailData = prepareEmailData(ficha);

    // 4. Tentar compartilhar via Web Share API primeiro
    const fileName = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente.replace(/[^a-zA-Z0-9]/g, '_')}.html`;

    if (navigator.share && navigator.canShare) {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const shareData = {
        title: emailData.assunto,
        text: emailData.corpo,
        files: [new File([blob], fileName, { type: 'text/html' })]
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "📧 Email compartilhado!",
          description: "Ficha técnica enviada com anexo HTML.",
          duration: 4000
        });
        return;
      }
    }

    // 5. Fallback: Mostrar feedback ao usuário
    showUserInstructions(ficha.numero_ftc, fileName);

    // 6. Pequeno delay e abrir Outlook
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
function prepareEmailData(ficha: FichaSalva) {
  const assunto = `[COTAÇÃO PRONTA] FTC ${ficha.numeroFTC} - ${ficha.formData.cliente}`;

  // Formato dos materiais para o email
  const materiaisFormatados = ficha.materiais
    .filter(m => m.descricao.trim() && parseFloat(m.quantidade) > 0)
    .map(m => `• ${m.descricao}: ${m.quantidade} ${m.unidade} x R$ ${m.valor_unitario} = R$ ${m.valor_total}`)
    .join('\n');

  const corpo = `Prezado(a) Comercial,

Segue ficha técnica com cotação de materiais FINALIZADA para geração de orçamento.

═══════════════════════════════════════════════
DADOS DA FICHA TÉCNICA
═══════════════════════════════════════════════
• FTC Nº: ${ficha.numeroFTC}
• Cliente: ${ficha.formData.cliente}
• Solicitante: ${ficha.formData.solicitante}
• Contato: ${ficha.formData.fone_email}

• Peça/Equipamento: ${ficha.formData.nome_peca}
• Quantidade: ${ficha.formData.quantidade}
• Serviço: ${ficha.formData.servico}

═══════════════════════════════════════════════
MATERIAIS COTADOS (COMPRAS)
═══════════════════════════════════════════════
${materiaisFormatados}

💰 TOTAL MATERIAIS: R$ ${ficha.calculos.materialTodasPecas.toFixed(2)}

═══════════════════════════════════════════════
RESUMO TÉCNICO
═══════════════════════════════════════════════
• Horas por Peça: ${ficha.calculos.horasPorPeca}h
• Horas Totais: ${ficha.calculos.horasTodasPecas}h
• Execução: ${ficha.formData.execucao}
• Visita Técnica: ${ficha.formData.visita_tecnica}

═══════════════════════════════════════════════
PRÓXIMOS PASSOS
═══════════════════════════════════════════════
✅ Cotação de materiais CONCLUÍDA pelo Compras
📊 Aguardando geração de orçamento pelo Comercial
📧 Ficha técnica completa anexada (arquivo HTML)

⚠️ IMPORTANTE:
• Anexe o arquivo HTML que foi baixado automaticamente
• O arquivo contém TODOS os detalhes da ficha técnica
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
  const mailtoLink = `mailto:${COMERCIAL_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

  // Tentar abrir o Outlook
  try {
    window.location.href = mailtoLink;
  } catch (error) {
    // Fallback: abrir em nova janela
    window.open(mailtoLink, '_blank');
  }
}

/**
 * Mostra instruções visuais para o usuário
 */
function showUserInstructions(numeroFTC: string, fileName?: string) {
  const arquivo = fileName || `FTC_${numeroFTC}.html`;
  toast({
    title: "📧 Preparando email para Comercial",
    description: `Arquivo ${arquivo} foi baixado. O Outlook abrirá em seguida - anexe o arquivo e envie!`,
    duration: 6000
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