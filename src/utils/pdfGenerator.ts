import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './helpers';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF();
  
  // Configurações da página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  
  // Função para adicionar quebra de página se necessário
  const addPageBreakIfNeeded = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Função para formatações auxiliares
  const formatRadioValue = (value: string) => {
    if (value === 'sim') return 'Sim';
    if (value === 'nao') return 'Não';
    return value || '-';
  };

  const formatCheckbox = (value: string | boolean) => {
    if (value === true || value === 'true' || value === 'sim') return 'Sim';
    if (value === false || value === 'false' || value === 'nao') return 'Não';
    return value || '-';
  };

  // Função para adicionar título de seção com fundo cinza
  const addSectionTitle = (title: string) => {
    addPageBreakIfNeeded(20);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, contentWidth, 15, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, contentWidth, 15);
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 5, yPosition + 10);
    yPosition += 20;
  };

  // Cabeçalho principal
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, 25, { align: 'center' });
  
  // Data e FTC
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dataFormatada}`, margin, 40);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, pageWidth - margin - 40, 40);
  
  yPosition = 55;

  // DADOS DO CLIENTE
  addSectionTitle('DADOS DO CLIENTE');
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Cliente:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.cliente || '-', margin + 25, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Solicitante:', margin + 105, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.solicitante || '-', margin + 140, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Fone/Email:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.fone_email || '-', margin + 40, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Data Visita:', margin + 105, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.data_visita || '-', margin + 140, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Data Entrega:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.data_entrega || '-', margin + 50, yPosition);
  yPosition += 20;

  // DADOS DA PEÇA/EQUIPAMENTO
  addSectionTitle('DADOS DA PEÇA/EQUIPAMENTO');
  
  doc.setFont(undefined, 'bold');
  doc.text('Nome da Peça:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.nome_peca || '-', margin + 45, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Qtd:', margin + 105, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.quantidade || '-', margin + 120, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Serviço:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.servico || '-', margin + 30, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Material Base:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.material_base || '-', margin + 45, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Dimensões:', margin + 105, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.dimensoes || '-', margin + 140, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Tolerância:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.tolerancia || '-', margin + 35, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Acab. Superf.:', margin + 80, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.acabamento_superficie || '-', margin + 120, yPosition);
  yPosition += 12;
  
  doc.setFont(undefined, 'bold');
  doc.text('Norma:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.norma_aplicavel || '-', margin + 25, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Certificação:', margin + 80, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.certificacao || '-', margin + 120, yPosition);
  yPosition += 20;

  // MATERIAL PARA COTAÇÃO
  const materiaisFiltrados = ficha.materiais?.filter(m => 
    m.descricao || (m.quantidade && parseFloat(m.quantidade) > 0) || (m.valor_unitario && parseFloat(m.valor_unitario) > 0)
  ) || [];
  
  if (materiaisFiltrados.length > 0) {
    addSectionTitle('MATERIAL PARA COTAÇÃO');
    
    // Cabeçalho da tabela
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setDrawColor(0, 0, 0);
    
    const tableY = yPosition;
    const rowHeight = 12;
    const colWidths = [50, 20, 15, 30, 35, 30, 25];
    let xPos = margin + 5;
    
    // Headers
    doc.rect(margin, tableY, contentWidth, rowHeight);
    doc.text('Descrição', xPos, tableY + 8);
    xPos += colWidths[0];
    doc.text('Qtd', xPos, tableY + 8);
    xPos += colWidths[1];
    doc.text('Un', xPos, tableY + 8);
    xPos += colWidths[2];
    doc.text('Valor Unit', xPos, tableY + 8);
    xPos += colWidths[3];
    doc.text('Fornecedor', xPos, tableY + 8);
    xPos += colWidths[4];
    doc.text('Cliente Int', xPos, tableY + 8);
    xPos += colWidths[5];
    doc.text('Total', xPos, tableY + 8);
    
    yPosition += rowHeight;
    
    // Dados da tabela (máximo 6 itens)
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    materiaisFiltrados.slice(0, 6).forEach((material, index) => {
      addPageBreakIfNeeded(rowHeight + 5);
      
      const currentY = yPosition + (index * rowHeight);
      doc.rect(margin, currentY, contentWidth, rowHeight);
      
      xPos = margin + 5;
      
      // Descrição
      const descricao = (material.descricao || '').substring(0, 22);
      doc.text(descricao, xPos, currentY + 8);
      xPos += colWidths[0];
      
      // Quantidade
      doc.text(material.quantidade || '', xPos, currentY + 8);
      xPos += colWidths[1];
      
      // Unidade
      doc.text(material.unidade || '', xPos, currentY + 8);
      xPos += colWidths[2];
      
      // Valor Unitário
      const valorUnit = material.valor_unitario ? formatCurrency(parseFloat(material.valor_unitario)) : '';
      doc.text(valorUnit.substring(0, 10), xPos, currentY + 8);
      xPos += colWidths[3];
      
      // Fornecedor
      const fornecedor = (material.fornecedor || '').substring(0, 15);
      doc.text(fornecedor, xPos, currentY + 8);
      xPos += colWidths[4];
      
      // Cliente Interno
      const clienteInt = (material.cliente_interno || '').substring(0, 12);
      doc.text(clienteInt, xPos, currentY + 8);
      xPos += colWidths[5];
      
      // Total
      const total = material.valor_total ? formatCurrency(parseFloat(material.valor_total)) : '';
      doc.text(total.substring(0, 10), xPos, currentY + 8);
    });
    
    yPosition += (materiaisFiltrados.slice(0, 6).length * rowHeight) + 15;
  }

  // EXECUÇÃO E DETALHES
  addSectionTitle('EXECUÇÃO E DETALHES');
  
  // Grid 4x2
  const colWidth = (contentWidth - 20) / 4;
  
  // Primeira linha
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('Execução:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.execucao || ''), margin + 35, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Visita Técnica:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.visita_tecnica || ''), margin + 45 + colWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Amostra:', margin + 5 + (colWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra || ''), margin + 35 + (colWidth * 2), yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Des. Final.:', margin + 5 + (colWidth * 3), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado || ''), margin + 35 + (colWidth * 3), yPosition);
  yPosition += 15;
  
  // Segunda linha
  doc.setFont(undefined, 'bold');
  doc.text('Projeto Por:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.projeto_desenvolvido_por || '-', margin + 35, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Desenho:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.desenho_peca || '-', margin + 30 + colWidth, yPosition);
  yPosition += 20;

  // TRATAMENTOS
  addSectionTitle('TRATAMENTOS');
  
  // Primeira linha de tratamentos
  doc.setFont(undefined, 'bold');
  doc.text('Pintura:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura || ''), margin + 30, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Cor:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.cor_pintura || '-', margin + 20 + colWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Galvanização:', margin + 5 + (colWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.galvanizacao || ''), margin + 40 + (colWidth * 2), yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Peso Galv.:', margin + 5 + (colWidth * 3), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.peso_peca_galv || '-', margin + 35 + (colWidth * 3), yPosition);
  yPosition += 15;
  
  // Segunda linha de tratamentos
  doc.setFont(undefined, 'bold');
  doc.text('Trat. Térmico:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico || ''), margin + 45, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Dureza:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.dureza || '-', margin + 30 + colWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Teste LP:', margin + 5 + (colWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.teste_lp || ''), margin + 30 + (colWidth * 2), yPosition);
  yPosition += 20;

  // HORAS DE SERVIÇO
  addSectionTitle('HORAS DE SERVIÇO');
  
  const horasServicos = [
    { label: "TORNO G", value: ficha.formData.torno_grande },
    { label: "TORNO P", value: ficha.formData.torno_pequeno },
    { label: "CNC", value: ficha.formData.cnc_tf },
    { label: "FRESA/FURAD.", value: ficha.formData.fresa_furad },
    { label: "PLASMA/OXI", value: ficha.formData.plasma_oxicorte },
    { label: "DOBRA", value: ficha.formData.dobra },
    { label: "CALANDRA", value: ficha.formData.calandra },
    { label: "MACARICO", value: ficha.formData.macarico_solda },
  ].filter(h => h.value && parseFloat(h.value) > 0);

  if (horasServicos.length > 0) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    let col = 0;
    horasServicos.forEach(hora => {
      const x = margin + 5 + (col % 4) * (colWidth);
      const y = yPosition + Math.floor(col / 4) * 10;
      addPageBreakIfNeeded(10);
      doc.text(`${hora.label}: ${hora.value}h`, x, y);
      col++;
    });
    yPosition += Math.ceil(horasServicos.length / 4) * 10 + 15;
  } else {
    yPosition += 20;
  }

  // TRANSPORTE
  addSectionTitle('TRANSPORTE');
  
  doc.setFont(undefined, 'bold');
  doc.text('Caminhão HMC:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), margin + 55, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Pickup HMC:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), margin + 45 + colWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Cliente:', margin + 5 + (colWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_cliente), margin + 30 + (colWidth * 2), yPosition);
  yPosition += 20;

  // CONTROLE
  addSectionTitle('CONTROLE');
  
  doc.setFont(undefined, 'bold');
  doc.text('Nº Orçamento:', margin + 5, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.num_orcamento || '-', margin + 50, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('OS:', margin + 5 + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.num_os || '-', margin + 20 + colWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('NF:', margin + 5 + (colWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.num_nf_remessa || '-', margin + 20 + (colWidth * 2), yPosition);
  yPosition += 20;

  // INFORMAÇÕES ADICIONAIS
  if (ficha.formData.observacoes && ficha.formData.observacoes.trim()) {
    addSectionTitle('INFORMAÇÕES ADICIONAIS');
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const observacoes = ficha.formData.observacoes;
    const lines = doc.splitTextToSize(observacoes, contentWidth - 10);
    
    lines.forEach((line: string) => {
      addPageBreakIfNeeded(8);
      doc.text(line, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 15;
  }

  // RESUMO DOS CÁLCULOS
  if (ficha.calculos) {
    addSectionTitle('RESUMO DOS CÁLCULOS');
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    
    doc.text('Horas por Peça:', margin + 5, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text((ficha.calculos.horasPorPeca?.toFixed(2) || '0') + ' h', margin + 55, yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Material por Peça:', margin + 5 + colWidth, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrency(ficha.calculos.materialPorPeca || 0), margin + 65 + colWidth, yPosition);
    yPosition += 15;
    
    doc.setFont(undefined, 'bold');
    doc.text('Total Horas:', margin + 5, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text((ficha.calculos.horasTodasPecas?.toFixed(2) || '0') + ' h', margin + 40, yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Total Material:', margin + 5 + colWidth, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrency(ficha.calculos.materialTodasPecas || 0), margin + 55 + colWidth, yPosition);
  }

  return doc.output('blob');
}

export function generatePDF(ficha: FichaSalva) {
  try {
    const blob = generatePDFBlob(ficha);
    const filename = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'SemCliente'}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}