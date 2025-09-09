import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Configurações para A4 (210mm x 297mm) com margens de 10mm
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 10; // 1cm de margem
  const contentWidth = pageWidth - 2 * margin; // 190mm úteis
  const contentHeight = pageHeight - 2 * margin; // 277mm úteis
  let yPosition = margin;
  
  // Configurações de fonte para máxima legibilidade em espaço compacto
  const titleFontSize = 9;
  const sectionFontSize = 7;
  const fieldFontSize = 6;
  const lineHeight = 4;
  const sectionSpacing = 6;
  
  // Funções auxiliares para formatação
  const formatRadioValue = (value: string) => {
    if (value === 'sim') return 'Sim';
    if (value === 'nao' || value === 'não') return 'Não';
    return value || '_____';
  };

  const formatCheckbox = (value: string | boolean) => {
    if (value === true || value === 'true' || value === 'sim') return '☑';
    if (value === false || value === 'false' || value === 'nao' || value === 'não') return '☐';
    return '☐';
  };

  const formatField = (value: string | undefined | null) => {
    return value && value.trim() ? value : '________________________';
  };

  // Função para título de seção
  const addSectionTitle = (title: string) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 2, yPosition + 3.5);
    yPosition += sectionSpacing;
  };

  // Função para adicionar campo em coluna específica
  const addField = (label: string, value: string, x: number, bold: boolean = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fieldFontSize);
    doc.text(`${label}:`, x, yPosition);
    
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(value, x + labelWidth, yPosition);
  };

  // CABEÇALHO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFontSize);
  doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, margin + 5, { align: 'center' });
  
  // Data e FTC
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dataFormatada}`, margin, margin + 10);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, pageWidth - margin - 40, margin + 10);
  
  yPosition = margin + 16;

  // DADOS DO CLIENTE (2 colunas)
  addSectionTitle('DADOS DO CLIENTE');
  
  const col1Width = contentWidth / 2;
  const col2Start = margin + col1Width;
  
  // Linha 1
  addField('Cliente', formatField(ficha.formData.cliente), margin + 2, false);
  addField('Solicitante', formatField(ficha.formData.solicitante), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 2
  addField('Fone/Email', formatField(ficha.formData.fone_email), margin + 2, false);
  addField('Data Visita', formatField(ficha.formData.data_visita), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 3
  addField('Data Entrega', formatField(ficha.formData.data_entrega), margin + 2, false);
  yPosition += sectionSpacing;

  // DADOS DA PEÇA/EQUIPAMENTO (2 colunas)
  addSectionTitle('DADOS DA PEÇA/EQUIPAMENTO');
  
  // Linha 1
  addField('Nome da Peça', formatField(ficha.formData.nome_peca), margin + 2, false);
  addField('Quantidade', formatField(ficha.formData.quantidade), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 2
  addField('Serviço', formatField(ficha.formData.servico), margin + 2, false);
  yPosition += sectionSpacing;

  // MATERIAL PARA COTAÇÃO (Tabela compacta)
  addSectionTitle('MATERIAL PARA COTAÇÃO');
  
  // Sempre mostrar pelo menos 3 linhas da tabela
  const materiaisParaExibir = [];
  const materiaisFiltrados = ficha.materiais?.filter(m => 
    m.descricao || (m.quantidade && parseFloat(m.quantidade) > 0) || (m.valor_unitario && parseFloat(m.valor_unitario) > 0)
  ) || [];
  
  // Adicionar materiais existentes
  materiaisParaExibir.push(...materiaisFiltrados);
  
  // Completar com linhas vazias até 3 linhas
  while (materiaisParaExibir.length < 3) {
    materiaisParaExibir.push({
      id: materiaisParaExibir.length,
      descricao: '',
      quantidade: '',
      unidade: '',
      valor_unitario: '',
      fornecedor: '',
      cliente_interno: '',
      valor_total: ''
    });
  }
  
  // Cabeçalho da tabela
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  
  const colWidths = [38, 12, 10, 20, 25, 20, 18]; // Total: 143mm
  let xPos = margin + 2;
  
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
  
  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  materiaisParaExibir.slice(0, 3).forEach(material => {
    xPos = margin + 2;
    
    doc.text(formatField(material.descricao).substring(0, 20), xPos, yPosition);
    xPos += colWidths[0];
    doc.text(formatField(material.quantidade), xPos, yPosition);
    xPos += colWidths[1];
    doc.text(formatField(material.unidade), xPos, yPosition);
    xPos += colWidths[2];
    
    const valorUnit = material.valor_unitario && parseFloat(material.valor_unitario) > 0 
      ? formatCurrency(parseFloat(material.valor_unitario)).substring(0, 8) 
      : '________';
    doc.text(valorUnit, xPos, yPosition);
    xPos += colWidths[3];
    
    doc.text(formatField(material.fornecedor).substring(0, 12), xPos, yPosition);
    xPos += colWidths[4];
    doc.text(formatField(material.cliente_interno).substring(0, 10), xPos, yPosition);
    xPos += colWidths[5];
    
    const total = material.valor_total && parseFloat(material.valor_total) > 0 
      ? formatCurrency(parseFloat(material.valor_total)).substring(0, 8) 
      : '________';
    doc.text(total, xPos, yPosition);
    
    yPosition += 4;
  });
  yPosition += 2;

  // EXECUÇÃO E DETALHES (Grid 4 colunas)
  addSectionTitle('EXECUÇÃO E DETALHES');
  
  const gridWidth = contentWidth / 4;
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  doc.text('Execução:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.execucao), margin + 18, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Visita Técnica:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.visita_tecnica), margin + 25 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Horas Visita:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.visita_horas), margin + 22 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Amostra:', margin + 2 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra), margin + 18 + (gridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('Projeto Por:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.projeto_desenvolvido_por), margin + 20, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Desenho Peça:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_peca), margin + 25 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Des. Finalizado:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado), margin + 28 + (gridWidth * 2), yPosition);
  yPosition += sectionSpacing;

  // TRANSPORTE (1 linha)
  addSectionTitle('TRANSPORTE');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Caminhão HMC:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), margin + 28, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Pickup HMC:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), margin + 25 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_cliente), margin + 16 + (gridWidth * 2), yPosition);
  yPosition += sectionSpacing;

  // TRATAMENTOS E ACABAMENTOS (2 linhas x 4 colunas)
  addSectionTitle('TRATAMENTOS E ACABAMENTOS');
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Pintura:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura), margin + 16, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cor Pintura:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cor_pintura), margin + 22 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Galvanização:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.galvanizacao), margin + 25 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Galv:', margin + 2 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_galv), margin + 20 + (gridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('Trat. Térmico:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico), margin + 25, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Trat:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_trat), margin + 18 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Tempera/Rev:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.tempera_reven), margin + 24 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cementação:', margin + 2 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cementacao), margin + 22 + (gridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 3
  doc.setFont('helvetica', 'bold');
  doc.text('Dureza:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.dureza), margin + 14, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Teste LP:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.teste_lp), margin + 18 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Bal. Campo:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.balanceamento_campo), margin + 22 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Rotação:', margin + 2 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.rotacao), margin + 16 + (gridWidth * 3), yPosition);
  yPosition += sectionSpacing;

  // SERVIÇOS ADICIONAIS (2 linhas x 4 colunas)
  addSectionTitle('SERVIÇOS ADICIONAIS');
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Forn. Desenho:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fornecimento_desenho), margin + 25, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fotos Relatório:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fotos_relatorio), margin + 28 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Rel. Técnico:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.relatorio_tecnico), margin + 22 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Emissão ART:', margin + 2 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.emissao_art), margin + 22 + (gridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('Serv. Terceirizados:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.servicos_terceirizados), margin + 35, yPosition);
  yPosition += sectionSpacing;

  // HORAS DE SERVIÇO (Grid compacto)
  addSectionTitle('HORAS DE SERVIÇO');
  
  const horasServicos = [
    { label: "Material por Peça", value: ficha.formData.material_por_peca },
    { label: "Material Todas Peças", value: ficha.formData.material_todas_pecas },
    { label: "Horas por Peça", value: ficha.formData.horas_por_peca },
    { label: "Horas Todas Peças", value: ficha.formData.horas_todas_pecas },
    { label: "Torno Grande", value: ficha.formData.torno_grande },
    { label: "Torno Pequeno", value: ficha.formData.torno_pequeno },
    { label: "CNC TF", value: ficha.formData.cnc_tf },
    { label: "Fresa/Furad", value: ficha.formData.fresa_furad },
    { label: "Plasma/Oxicorte", value: ficha.formData.plasma_oxicorte },
    { label: "Dobra", value: ficha.formData.dobra },
    { label: "Calandra", value: ficha.formData.calandra },
    { label: "Maçarico/Solda", value: ficha.formData.macarico_solda },
    { label: "Des/Mont", value: ficha.formData.des_montg },
    { label: "Balanceamento", value: ficha.formData.balanceamento },
    { label: "Mandrilhamento", value: ficha.formData.mandrilhamento },
    { label: "Tratamento", value: ficha.formData.tratamento },
    { label: "Pintura Horas", value: ficha.formData.pintura_horas },
    { label: "Lavagem/Acab", value: ficha.formData.lavagem_acab },
    { label: "Programação CAM", value: ficha.formData.programacao_cam },
    { label: "Eng/Téc", value: ficha.formData.eng_tec }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  
  let row = 0;
  horasServicos.forEach((hora, index) => {
    const col = index % 4;
    const x = margin + 2 + col * (gridWidth);
    const y = yPosition + row * 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${hora.label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${hora.label}: `);
    doc.text(formatField(hora.value), x + labelWidth, y);
    
    if (col === 3) row++;
  });
  yPosition += Math.ceil(horasServicos.length / 4) * 4 + 2;

  // CONTROLE
  addSectionTitle('CONTROLE');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº Orçamento:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_orcamento), margin + 25, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº OS:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_os), margin + 12 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº NF Remessa:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_nf_remessa), margin + 28 + (gridWidth * 2), yPosition);
  yPosition += sectionSpacing;


  // RESUMO DOS CÁLCULOS (1 linha)
  addSectionTitle('RESUMO DOS CÁLCULOS');
  
  if (ficha.calculos) {
    doc.setFont('helvetica', 'bold');
    doc.text('Horas/Peça:', margin + 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ficha.calculos.horasPorPeca?.toFixed(2) || '0'}h`, margin + 22, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Mat/Peça:', margin + 2 + gridWidth, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(ficha.calculos.materialPorPeca || 0), margin + 18 + gridWidth, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Horas:', margin + 2 + (gridWidth * 2), yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ficha.calculos.horasTodasPecas?.toFixed(2) || '0'}h`, margin + 22 + (gridWidth * 2), yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Material:', margin + 2 + (gridWidth * 3), yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(ficha.calculos.materialTodasPecas || 0), margin + 28 + (gridWidth * 3), yPosition);
  } else {
    // Campos vazios para preenchimento
    doc.setFont('helvetica', 'bold');
    doc.text('Horas/Peça: ______', margin + 2, yPosition);
    doc.text('Mat/Peça: ______', margin + 2 + gridWidth, yPosition);
    doc.text('Total Horas: ______', margin + 2 + (gridWidth * 2), yPosition);
    doc.text('Total Material: ______', margin + 2 + (gridWidth * 3), yPosition);
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