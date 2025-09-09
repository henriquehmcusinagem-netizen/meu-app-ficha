import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  const formatRadioValue = (value: string) => value || "—";
  const formatCheckbox = (value: boolean) => value ? "✓" : "—";

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Filter materials like in HTML export
  const materiaisPreenchidos = ficha.materiais.filter(m => 
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  // Filter service hours like in HTML export
  const horasServicos = [
    { label: "TORNO G", value: ficha.formData.torno_grande },
    { label: "TORNO P", value: ficha.formData.torno_pequeno },
    { label: "CNC", value: ficha.formData.cnc_tf },
    { label: "FRESA/FURAD.", value: ficha.formData.fresa_furad },
    { label: "PLASMA/OXICORTE", value: ficha.formData.plasma_oxicorte },
    { label: "DOBRA", value: ficha.formData.dobra },
    { label: "CALANDRA", value: ficha.formData.calandra },
    { label: "MACARICO/SOLDA", value: ficha.formData.macarico_solda },
    { label: "DES/MONT.", value: ficha.formData.des_montg },
    { label: "BALANCEAMENTO", value: ficha.formData.balanceamento },
    { label: "MANDRILHAMENTO", value: ficha.formData.mandrilhamento },
    { label: "TRATAMENTO", value: ficha.formData.tratamento },
    { label: "PINTURA", value: ficha.formData.pintura_horas },
    { label: "LAVAGEM/ACAB.", value: ficha.formData.lavagem_acab },
    { label: "PROG. CAM", value: ficha.formData.programacao_cam },
    { label: "ENG/TEC", value: ficha.formData.eng_tec }
  ].filter(h => parseFloat(h.value || "0") > 0);

  // Header - matching HTML layout
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Data: ${ficha.dataCriacao}`, 20, yPosition);
  doc.text('FICHA TÉCNICA DE COTAÇÃO - FTC', pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Nº ${ficha.numeroFTC}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 15;

  // Draw border around header section
  doc.setLineWidth(0.5);
  doc.rect(15, 10, pageWidth - 30, 20);
  yPosition += 5;

  // DADOS DO CLIENTE section
  checkPageBreak(35);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('DADOS DO CLIENTE', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // First row - Cliente and Solicitante
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', 22, yPosition);
  doc.text('SOLICITANTE:', pageWidth / 2 + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.cliente || '—', 22, yPosition + 5);
  doc.text(ficha.formData.solicitante || '—', pageWidth / 2 + 5, yPosition + 5);
  yPosition += 15;

  // Second row - Fone/Email, Data Visita, Data Entrega
  doc.setFont('helvetica', 'bold');
  doc.text('FONE/EMAIL:', 22, yPosition);
  doc.text('DATA VISITA:', 90, yPosition);
  doc.text('DATA ENTREGA:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.fone_email || '—', 22, yPosition + 5);
  doc.text(ficha.formData.data_visita || '—', 90, yPosition + 5);
  doc.text(ficha.formData.data_entrega || '—', 140, yPosition + 5);
  yPosition += 18;

  // DADOS DA PEÇA/EQUIPAMENTO section
  checkPageBreak(45);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('DADOS DA PEÇA/EQUIPAMENTO', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOME DA PEÇA/EQUIPAMENTO:', 22, yPosition);
  doc.text('QUANTIDADE:', pageWidth / 2 + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.nome_peca || '—', 22, yPosition + 5);
  doc.text(ficha.formData.quantidade || '1', pageWidth / 2 + 5, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('SERVIÇO A SER REALIZADO:', 22, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.servico || '—', 22, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('MATERIAL BASE:', 22, yPosition);
  doc.text('DIMENSÕES:', pageWidth / 2 + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.material_base || '—', 22, yPosition + 5);
  doc.text(ficha.formData.dimensoes || '—', pageWidth / 2 + 5, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('TOLERÂNCIA:', 22, yPosition);
  doc.text('ACABAMENTO SUPERFÍCIE:', 90, yPosition);
  doc.text('NORMA APLICÁVEL:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.tolerancia || '—', 22, yPosition + 5);
  doc.text(ficha.formData.acabamento_superficie || '—', 90, yPosition + 5);
  doc.text(ficha.formData.norma_aplicavel || '—', 140, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICAÇÃO:', 22, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.certificacao || '—', 22, yPosition + 5);
  yPosition += 18;

  // MATERIAL PARA COTAÇÃO section
  if (materiaisPreenchidos.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
    doc.text('MATERIAL PARA COTAÇÃO', 22, yPosition + 3);
    yPosition += 12;

    // Table headers
    const colWidths = [50, 20, 30, 25, 25, 25];
    const headers = ['Descrição', 'Qtd', 'Fornecedor', 'Cliente Int.', 'Valor Unit.', 'Valor Total'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = 22;
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    materiaisPreenchidos.slice(0, 6).forEach(material => {
      checkPageBreak(8);
      xPos = 22;
      const values = [
        material.descricao || '—',
        material.quantidade || '—',
        material.fornecedor || '—',
        material.cliente_interno || '—',
        material.valor_unitario ? formatCurrency(Number(material.valor_unitario)) : '—',
        material.valor_total ? formatCurrency(Number(material.valor_total)) : '—'
      ];
      
      values.forEach((value, index) => {
        doc.text(String(value).substring(0, 12), xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 6;
    });
    yPosition += 12;
  }

  // EXECUÇÃO E DETALHES section
  checkPageBreak(35);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('EXECUÇÃO E DETALHES', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTADO EM:', 22, yPosition);
  doc.text('VISITA TÉCNICA:', 90, yPosition);
  doc.text('PEÇA AMOSTRA:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`HMC: ${ficha.formData.execucao === 'HMC' ? '✓' : '—'} | Cliente: ${ficha.formData.execucao === 'CLIENTE' ? '✓' : '—'}`, 22, yPosition + 5);
  doc.text(`Sim: ${ficha.formData.visita_tecnica === 'SIM' ? '✓' : '—'} | Não: ${ficha.formData.visita_tecnica === 'NAO' ? '✓' : '—'}`, 90, yPosition + 5);
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra), 140, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('PROJETO POR:', 22, yPosition);
  doc.text('DESENHO FINALIZADO:', 90, yPosition);
  doc.text('DESENHO:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.projeto_desenvolvido_por), 22, yPosition + 5);
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado), 90, yPosition + 5);
  doc.text(ficha.formData.desenho_peca || '—', 140, yPosition + 5);
  yPosition += 18;

  // TRATAMENTOS section
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('TRATAMENTOS', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PINTURA:', 22, yPosition);
  doc.text('COR:', 60, yPosition);
  doc.text('GALVANIZAÇÃO:', 100, yPosition);
  doc.text('PESO P/ GALV.:', 150, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura), 22, yPosition + 5);
  doc.text(ficha.formData.cor_pintura || '—', 60, yPosition + 5);
  doc.text(formatRadioValue(ficha.formData.galvanizacao), 100, yPosition + 5);
  doc.text(ficha.formData.peso_peca_galv || '—', 150, yPosition + 5);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('TRAT. TÉRMICO:', 22, yPosition);
  doc.text('TEMPERA/REVEN.:', 70, yPosition);
  doc.text('DUREZA:', 120, yPosition);
  doc.text('ENSAIO LP:', 150, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico), 22, yPosition + 5);
  doc.text(ficha.formData.tempera_reven || '—', 70, yPosition + 5);
  doc.text(ficha.formData.dureza || '—', 120, yPosition + 5);
  doc.text(formatRadioValue(ficha.formData.teste_lp), 150, yPosition + 5);
  yPosition += 18;

  // HORAS DE SERVIÇO section
  if (horasServicos.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
    doc.text('HORAS DE SERVIÇO', 22, yPosition + 3);
    yPosition += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let col = 0;
    horasServicos.forEach(hora => {
      const x = 22 + (col % 4) * 45;
      const y = yPosition + Math.floor(col / 4) * 8;
      checkPageBreak(10);
      doc.text(`${hora.label}: ${hora.value}h`, x, y);
      col++;
    });
    yPosition += Math.ceil(horasServicos.length / 4) * 8 + 12;
  }

  // TRANSPORTE section
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('TRANSPORTE', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CAMINHÃO HMC:', 22, yPosition);
  doc.text('PICKUP HMC:', 80, yPosition);
  doc.text('CLIENTE:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), 22, yPosition + 5);
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), 80, yPosition + 5);
  doc.text(formatCheckbox(ficha.formData.transporte_cliente), 140, yPosition + 5);
  yPosition += 18;

  // CONTROLE section
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
  doc.text('CONTROLE', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nº ORÇAMENTO:', 22, yPosition);
  doc.text('OS:', 90, yPosition);
  doc.text('NF:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.formData.num_orcamento || '—', 22, yPosition + 5);
  doc.text(ficha.formData.num_os || '—', 90, yPosition + 5);
  doc.text(ficha.formData.num_nf_remessa || '—', 140, yPosition + 5);
  yPosition += 18;

  // INFORMAÇÕES ADICIONAIS section
  if (ficha.formData.observacoes || ficha.formData.condicoes_especiais || ficha.formData.descricao_geral) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 2, pageWidth - 40, 8, 'F');
    doc.text('INFORMAÇÕES ADICIONAIS', 22, yPosition + 3);
    yPosition += 12;

    doc.setFontSize(10);
    if (ficha.formData.observacoes) {
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES:', 22, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(ficha.formData.observacoes.substring(0, 80), 22, yPosition + 5);
      yPosition += 12;
    }
    if (ficha.formData.condicoes_especiais) {
      doc.setFont('helvetica', 'bold');
      doc.text('CONDIÇÕES ESPECIAIS:', 22, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(ficha.formData.condicoes_especiais.substring(0, 80), 22, yPosition + 5);
      yPosition += 12;
    }
    if (ficha.formData.descricao_geral) {
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIÇÃO GERAL:', 22, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(ficha.formData.descricao_geral.substring(0, 80), 22, yPosition + 5);
      yPosition += 12;
    }
  }

  // RESUMO DOS CÁLCULOS section
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 2, pageWidth - 40, 20, 'F');
  doc.text('RESUMO DOS CÁLCULOS', 22, yPosition + 3);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Horas/Peça:', 25, yPosition);
  doc.text('Horas Total:', 70, yPosition);
  doc.text('Material/Peça:', 115, yPosition);
  doc.text('Material Total:', 160, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.calculos.horasPorPeca.toFixed(1)}h`, 25, yPosition + 5);
  doc.text(`${ficha.calculos.horasTodasPecas.toFixed(1)}h`, 70, yPosition + 5);
  doc.text(formatCurrency(ficha.calculos.materialPorPeca), 115, yPosition + 5);
  doc.text(formatCurrency(ficha.calculos.materialTodasPecas), 160, yPosition + 5);

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

export function generatePDF(ficha: FichaSalva) {
  // Use the blob function and download
  const blob = generatePDFBlob(ficha);
  
  // Generate filename and save
  const filename = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'SemCliente'}.pdf`;
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}