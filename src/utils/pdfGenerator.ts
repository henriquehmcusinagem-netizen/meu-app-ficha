import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Configurações compactas - uma folha apenas
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 8;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  
  // Funções auxiliares para formatação
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

  // Função para título de seção compacto
  const addSectionTitle = (title: string) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, contentWidth, 5, 'F');
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 2, yPosition + 3.5);
    yPosition += 7;
  };

  // Cabeçalho super compacto
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, 12, { align: 'center' });
  
  // Data e FTC na mesma linha
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dataFormatada}`, margin, 18);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, pageWidth - margin - 30, 18);
  
  yPosition = 22;

  // DADOS DO CLIENTE E PEÇA lado a lado
  addSectionTitle('DADOS CLIENTE/PEÇA');
  
  doc.setFontSize(6);
  const colWidth = contentWidth / 2;
  
  // Coluna esquerda - Cliente
  doc.setFont(undefined, 'bold');
  doc.text('Cliente:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.cliente || '-').substring(0, 20), margin + 18, yPosition);
  yPosition += 4;
  
  doc.setFont(undefined, 'bold');
  doc.text('Solicitante:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.solicitante || '-').substring(0, 15), margin + 25, yPosition);
  yPosition += 4;
  
  doc.setFont(undefined, 'bold');
  doc.text('Fone/Email:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.fone_email || '-').substring(0, 18), margin + 25, yPosition);
  
  // Coluna direita - Peça (mesma altura)
  yPosition -= 8;
  doc.setFont(undefined, 'bold');
  doc.text('Nome da Peça:', margin + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.nome_peca || '-').substring(0, 18), margin + colWidth + 28, yPosition);
  yPosition += 4;
  
  doc.setFont(undefined, 'bold');
  doc.text('Qtd:', margin + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(ficha.formData.quantidade || '-', margin + colWidth + 12, yPosition);
  doc.text('Serviço:', margin + colWidth + 25, yPosition);
  doc.text((ficha.formData.servico || '-').substring(0, 12), margin + colWidth + 35, yPosition);
  yPosition += 4;
  
  doc.setFont(undefined, 'bold');
  doc.text('Material:', margin + colWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.material_base || '-').substring(0, 15), margin + colWidth + 20, yPosition);
  yPosition += 6;

  // MATERIAL PARA COTAÇÃO - Tabela compacta
  const materiaisFiltrados = ficha.materiais?.filter(m => 
    m.descricao || (m.quantidade && parseFloat(m.quantidade) > 0) || (m.valor_unitario && parseFloat(m.valor_unitario) > 0)
  ).slice(0, 3) || []; // Máximo 3 itens
  
  if (materiaisFiltrados.length > 0) {
    addSectionTitle('MATERIAIS');
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(5);
    
    // Cabeçalho tabela compacta
    const colWidths = [45, 15, 12, 25, 25, 20, 20];
    let xPos = margin + 1;
    
    doc.text('Descrição', xPos, yPosition);
    xPos += colWidths[0];
    doc.text('Qtd', xPos, yPosition);
    xPos += colWidths[1];
    doc.text('Un', xPos, yPosition);
    xPos += colWidths[2];
    doc.text('Valor Unit', xPos, yPosition);
    xPos += colWidths[3];
    doc.text('Fornecedor', xPos, yPosition);
    xPos += colWidths[4];
    doc.text('Cliente Int', xPos, yPosition);
    xPos += colWidths[5];
    doc.text('Total', xPos, yPosition);
    yPosition += 4;
    
    // Dados da tabela
    doc.setFont(undefined, 'normal');
    materiaisFiltrados.forEach(material => {
      xPos = margin + 1;
      doc.text((material.descricao || '').substring(0, 25), xPos, yPosition);
      xPos += colWidths[0];
      doc.text(material.quantidade || '', xPos, yPosition);
      xPos += colWidths[1];
      doc.text(material.unidade || '', xPos, yPosition);
      xPos += colWidths[2];
      const valorUnit = material.valor_unitario ? formatCurrency(parseFloat(material.valor_unitario)) : '';
      doc.text(valorUnit.substring(0, 8), xPos, yPosition);
      xPos += colWidths[3];
      doc.text((material.fornecedor || '').substring(0, 12), xPos, yPosition);
      xPos += colWidths[4];
      doc.text((material.cliente_interno || '').substring(0, 10), xPos, yPosition);
      xPos += colWidths[5];
      const total = material.valor_total ? formatCurrency(parseFloat(material.valor_total)) : '';
      doc.text(total.substring(0, 8), xPos, yPosition);
      
      yPosition += 4;
    });
    yPosition += 2;
  }

  // EXECUÇÃO E DETALHES - Grid compacto
  addSectionTitle('EXECUÇÃO/DETALHES');
  
  doc.setFontSize(6);
  const gridWidth = contentWidth / 4;
  
  // Primeira linha
  doc.setFont(undefined, 'bold');
  doc.text('Execução:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.execucao || ''), margin + 20, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Visita:', margin + 1 + gridWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.visita_tecnica || ''), margin + 15 + gridWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Amostra:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra || ''), margin + 20 + (gridWidth * 2), yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Des.Final:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado || ''), margin + 22 + (gridWidth * 3), yPosition);
  yPosition += 5;

  // TRATAMENTOS - Layout compacto 2x4
  addSectionTitle('TRATAMENTOS');
  
  // Primeira linha
  doc.setFont(undefined, 'bold');
  doc.text('Pintura:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura || ''), margin + 18, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Cor:', margin + 1 + gridWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.cor_pintura || '-').substring(0, 8), margin + 12 + gridWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Galvaniz:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.galvanizacao || ''), margin + 22 + (gridWidth * 2), yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('P.Galv:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.peso_peca_galv || '-').substring(0, 6), margin + 18 + (gridWidth * 3), yPosition);
  yPosition += 4;
  
  // Segunda linha
  doc.setFont(undefined, 'bold');
  doc.text('T.Térmico:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico || ''), margin + 22, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Dureza:', margin + 1 + gridWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.dureza || '-').substring(0, 8), margin + 18 + gridWidth, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Teste LP:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatRadioValue(ficha.formData.teste_lp || ''), margin + 20 + (gridWidth * 2), yPosition);
  yPosition += 6;

  // HORAS DE SERVIÇO - Grid horizontal compacto
  const horasServicos = [
    { label: "TORNO G", value: ficha.formData.torno_grande },
    { label: "TORNO P", value: ficha.formData.torno_pequeno },
    { label: "CNC", value: ficha.formData.cnc_tf },
    { label: "FRESA", value: ficha.formData.fresa_furad },
    { label: "PLASMA", value: ficha.formData.plasma_oxicorte },
    { label: "DOBRA", value: ficha.formData.dobra },
    { label: "CALANDRA", value: ficha.formData.calandra },
    { label: "MACARICO", value: ficha.formData.macarico_solda },
  ].filter(h => h.value && parseFloat(h.value) > 0);

  if (horasServicos.length > 0) {
    addSectionTitle('HORAS SERVIÇO');
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    
    horasServicos.slice(0, 8).forEach((hora, index) => {
      const x = margin + 1 + (index % 4) * (gridWidth);
      const y = yPosition + Math.floor(index / 4) * 4;
      doc.text(`${hora.label}: ${hora.value}h`, x, y);
    });
    yPosition += Math.ceil(horasServicos.length / 4) * 4 + 3;
  }

  // TRANSPORTE E CONTROLE na mesma linha
  addSectionTitle('TRANSPORTE/CONTROLE');
  
  // Transporte
  doc.setFont(undefined, 'bold');
  doc.text('Cam.HMC:', margin + 1, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), margin + 22, yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('Pick.HMC:', margin + 1 + gridWidth, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), margin + 22 + gridWidth, yPosition);
  
  // Controle
  doc.setFont(undefined, 'bold');
  doc.text('Orçam:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.num_orcamento || '-').substring(0, 8), margin + 18 + (gridWidth * 2), yPosition);
  
  doc.setFont(undefined, 'bold');
  doc.text('OS:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((ficha.formData.num_os || '-').substring(0, 8), margin + 10 + (gridWidth * 3), yPosition);
  yPosition += 6;

  // INFORMAÇÕES ADICIONAIS - Limitado a 2 linhas
  if (ficha.formData.observacoes && ficha.formData.observacoes.trim()) {
    addSectionTitle('INFO ADICIONAIS');
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    const observacoes = ficha.formData.observacoes.substring(0, 150); // Limitar texto
    const lines = doc.splitTextToSize(observacoes, contentWidth - 4);
    
    lines.slice(0, 2).forEach((line: string) => { // Máximo 2 linhas
      doc.text(line, margin + 1, yPosition);
      yPosition += 4;
    });
    yPosition += 2;
  }

  // RESUMO DOS CÁLCULOS - Uma linha horizontal
  if (ficha.calculos) {
    addSectionTitle('RESUMO CÁLCULOS');
    
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    
    doc.text('H/Peça:', margin + 1, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text((ficha.calculos.horasPorPeca?.toFixed(1) || '0') + 'h', margin + 18, yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Mat/Peça:', margin + 1 + gridWidth, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrency(ficha.calculos.materialPorPeca || 0).substring(0, 12), margin + 22 + gridWidth, yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Total H:', margin + 1 + (gridWidth * 2), yPosition);
    doc.setFont(undefined, 'normal');
    doc.text((ficha.calculos.horasTodasPecas?.toFixed(1) || '0') + 'h', margin + 18 + (gridWidth * 2), yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Total Mat:', margin + 1 + (gridWidth * 3), yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrency(ficha.calculos.materialTodasPecas || 0).substring(0, 12), margin + 22 + (gridWidth * 3), yPosition);
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