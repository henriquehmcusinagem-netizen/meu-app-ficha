import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Configurações otimizadas para A4 (210mm x 297mm) - layout confortável para leitura e preenchimento
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12; // Margem confortável para impressão
  const contentWidth = pageWidth - 2 * margin; // 186mm úteis
  const contentHeight = pageHeight - 2 * margin; // 273mm úteis
  let yPosition = margin;
  
  // Configurações de fonte otimizadas para legibilidade e preenchimento manual
  const titleFontSize = 12;
  const sectionFontSize = 8;
  const fieldFontSize = 7;
  const lineHeight = 4.5;
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
    return value && value.trim() ? value : '_________________________________';
  };

  // Função para título de seção - espaçamento melhorado
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

  // CABEÇALHO - melhor espaçamento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFontSize);
  doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, margin + 6, { align: 'center' });
  
  // Data e FTC
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dataFormatada}`, margin, margin + 12);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, pageWidth - margin - 40, margin + 12);
  
  yPosition = margin + 18;

  // DADOS DO CLIENTE (2 colunas bem espaçadas)
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
  yPosition += 3;

  // DADOS DA PEÇA/EQUIPAMENTO (2 colunas bem espaçadas)
  addSectionTitle('DADOS DA PEÇA/EQUIPAMENTO');
  
  // Linha 1
  addField('Nome da Peça', formatField(ficha.formData.nome_peca), margin + 2, false);
  addField('Quantidade', formatField(ficha.formData.quantidade), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 2
  addField('Serviço', formatField(ficha.formData.servico), margin + 2, false);
  yPosition += 3;

  // MATERIAL PARA COTAÇÃO (Tabela com melhor espaçamento) - SEMPRE 4 LINHAS
  addSectionTitle('MATERIAL PARA COTAÇÃO');
  
  // Sempre exibir 4 linhas para garantir espaço para preenchimento confortável
  const materiaisParaExibir = [];
  const materiaisFiltrados = ficha.materiais?.filter(m => 
    m.descricao || (m.quantidade && parseFloat(m.quantidade) > 0) || (m.valor_unitario && parseFloat(m.valor_unitario) > 0)
  ) || [];
  
  // Adicionar materiais existentes
  materiaisParaExibir.push(...materiaisFiltrados);
  
  // Completar com linhas vazias até 4 linhas
  while (materiaisParaExibir.length < 4) {
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
  
  // Cabeçalho da tabela - com melhor espaçamento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  
  const colWidths = [45, 12, 10, 22, 28, 22, 20]; // Total: 159mm - mais espaçoso
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
  
  // Linhas da tabela - 4 linhas com altura maior
  doc.setFont('helvetica', 'normal');
  materiaisParaExibir.slice(0, 4).forEach(material => {
    xPos = margin + 2;
    
    doc.text(formatField(material.descricao).substring(0, 22), xPos, yPosition);
    xPos += colWidths[0];
    doc.text(formatField(material.quantidade), xPos, yPosition);
    xPos += colWidths[1];
    doc.text(formatField(material.unidade), xPos, yPosition);
    xPos += colWidths[2];
    
    const valorUnit = material.valor_unitario && parseFloat(material.valor_unitario) > 0 
      ? formatCurrency(parseFloat(material.valor_unitario)).substring(0, 10) 
      : '__________';
    doc.text(valorUnit, xPos, yPosition);
    xPos += colWidths[3];
    
    doc.text(formatField(material.fornecedor).substring(0, 14), xPos, yPosition);
    xPos += colWidths[4];
    doc.text(formatField(material.cliente_interno).substring(0, 12), xPos, yPosition);
    xPos += colWidths[5];
    
    const total = material.valor_total && parseFloat(material.valor_total) > 0 
      ? formatCurrency(parseFloat(material.valor_total)).substring(0, 10) 
      : '__________';
    doc.text(total, xPos, yPosition);
    
    yPosition += 4;
  });
  yPosition += 2;

  // EXECUÇÃO E DETALHES (Grid 3 colunas para melhor legibilidade)
  addSectionTitle('EXECUÇÃO E DETALHES');
  
  const gridWidth = contentWidth / 3;
  
  // Linha 1 - 3 campos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  doc.text('Execução:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.execucao), margin + 18, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Visita Técnica:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.visita_tecnica), margin + 22 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Horas Visita:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.visita_horas), margin + 20 + (gridWidth * 2), yPosition);
  yPosition += lineHeight;
  
  // Linha 2 - 3 campos
  doc.setFont('helvetica', 'bold');
  doc.text('Amostra:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra), margin + 16, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Projeto Por:', margin + 2 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.projeto_desenvolvido_por), margin + 18 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Desenho Peça:', margin + 2 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_peca), margin + 22 + (gridWidth * 2), yPosition);
  yPosition += lineHeight;
  
  // Linha 3 - 1 campo
  doc.setFont('helvetica', 'bold');
  doc.text('Desenho Finalizado:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado), margin + 26, yPosition);
  yPosition += 3;

  // TRANSPORTE (1 linha mais espaçada)
  addSectionTitle('TRANSPORTE');
  
  const transportGridWidth = contentWidth / 3;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Caminhão HMC:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), margin + 22, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Pickup HMC:', margin + 2 + transportGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');  
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), margin + 18 + transportGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin + 2 + (transportGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_cliente), margin + 12 + (transportGridWidth * 2), yPosition);
  yPosition += 3;

  // TRATAMENTOS E ACABAMENTOS (Grid 4x4 - melhor espaçamento)
  addSectionTitle('TRATAMENTOS E ACABAMENTOS');
  
  const treatGridWidth = contentWidth / 4;
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Pintura:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura), margin + 14, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cor:', margin + 2 + treatGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cor_pintura), margin + 10 + treatGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Galvanização:', margin + 2 + (treatGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.galvanizacao), margin + 18 + (treatGridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Galv:', margin + 2 + (treatGridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_galv), margin + 16 + (treatGridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('Trat Térmico:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico), margin + 18, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Trat:', margin + 2 + treatGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_trat), margin + 16 + treatGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Têmpera/Rev:', margin + 2 + (treatGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.tempera_reven), margin + 18 + (treatGridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cementação:', margin + 2 + (treatGridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cementacao), margin + 18 + (treatGridWidth * 3), yPosition);
  yPosition += lineHeight;
  
  // Linha 3
  doc.setFont('helvetica', 'bold');
  doc.text('Dureza:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.dureza), margin + 12, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Teste LP:', margin + 2 + treatGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.teste_lp), margin + 14 + treatGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Bal Campo:', margin + 2 + (treatGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.balanceamento_campo), margin + 16 + (treatGridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Rotação:', margin + 2 + (treatGridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.rotacao), margin + 13 + (treatGridWidth * 3), yPosition);
  yPosition += 3;

  // SERVIÇOS ADICIONAIS (Grid 3 colunas - melhor legibilidade)
  addSectionTitle('SERVIÇOS ADICIONAIS');
  
  const serviceGridWidth = contentWidth / 3;
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Forn Desenho:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fornecimento_desenho), margin + 20, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fotos Relatório:', margin + 2 + serviceGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fotos_relatorio), margin + 22 + serviceGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Téc:', margin + 2 + (serviceGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.relatorio_tecnico), margin + 20 + (serviceGridWidth * 2), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('ART:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.emissao_art), margin + 8, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Terceirizados:', margin + 2 + serviceGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  const terceirizados = formatField(ficha.formData.servicos_terceirizados);
  doc.text(terceirizados.length > 15 ? terceirizados.substring(0, 15) + '...' : terceirizados, margin + 18 + serviceGridWidth, yPosition);
  yPosition += 3;

  // HORAS DE SERVIÇO (Grid 4x5 - TODOS OS CAMPOS, melhor legibilidade)
  addSectionTitle('HORAS DE SERVIÇO');
  
  const horasServicos = [
    { label: "Material/Peça", value: ficha.formData.material_por_peca },
    { label: "Material Total", value: ficha.formData.material_todas_pecas },
    { label: "Horas/Peça", value: ficha.formData.horas_por_peca },
    { label: "Horas Total", value: ficha.formData.horas_todas_pecas },
    { label: "Torno Grande", value: ficha.formData.torno_grande },
    { label: "Torno Pequeno", value: ficha.formData.torno_pequeno },
    { label: "CNC TF", value: ficha.formData.cnc_tf },
    { label: "Fresa/Furadeira", value: ficha.formData.fresa_furad },
    { label: "Plasma/Oxicorte", value: ficha.formData.plasma_oxicorte },
    { label: "Dobra", value: ficha.formData.dobra },
    { label: "Calandra", value: ficha.formData.calandra },
    { label: "Maçarico/Solda", value: ficha.formData.macarico_solda },
    { label: "Des/Montagem", value: ficha.formData.des_montg },
    { label: "Balanceamento", value: ficha.formData.balanceamento },
    { label: "Mandrilhamento", value: ficha.formData.mandrilhamento },
    { label: "Tratamento", value: ficha.formData.tratamento },
    { label: "Pintura Horas", value: ficha.formData.pintura_horas },
    { label: "Lavagem/Acab", value: ficha.formData.lavagem_acab },
    { label: "Programação CAM", value: ficha.formData.programacao_cam },
    { label: "Eng/Técnico", value: ficha.formData.eng_tec }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  
  const horasGridWidth = contentWidth / 4;
  let row = 0;
  horasServicos.forEach((hora, index) => {
    const col = index % 4;
    const x = margin + 2 + col * horasGridWidth;
    const y = yPosition + row * 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${hora.label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${hora.label}: `);
    doc.text(formatField(hora.value), x + labelWidth, y);
    
    if (col === 3) row++;
  });
  yPosition += Math.ceil(horasServicos.length / 4) * 4 + 3;

  // CONTROLE (3 campos em linha com melhor espaçamento)
  addSectionTitle('CONTROLE');
  
  const controlGridWidth = contentWidth / 3;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº Orçamento:', margin + 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_orcamento), margin + 22, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº OS:', margin + 2 + controlGridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_os), margin + 12 + controlGridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº NF Remessa:', margin + 2 + (controlGridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_nf_remessa), margin + 24 + (controlGridWidth * 2), yPosition);
  yPosition += 3;


  // RESUMO DOS CÁLCULOS (4 campos em linha)
  addSectionTitle('RESUMO DOS CÁLCULOS');
  
  if (ficha.calculos) {
    doc.setFont('helvetica', 'bold');
    doc.text('Horas/Peça:', margin + 1, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ficha.calculos.horasPorPeca?.toFixed(2) || '0'}h`, margin + 17, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Mat/Peça:', margin + 1 + gridWidth, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(ficha.calculos.materialPorPeca || 0), margin + 13 + gridWidth, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tot Horas:', margin + 1 + (gridWidth * 2), yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ficha.calculos.horasTodasPecas?.toFixed(2) || '0'}h`, margin + 15 + (gridWidth * 2), yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tot Material:', margin + 1 + (gridWidth * 3), yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(ficha.calculos.materialTodasPecas || 0), margin + 18 + (gridWidth * 3), yPosition);
  } else {
    // Campos vazios para preenchimento
    doc.setFont('helvetica', 'bold');
    doc.text('Horas/Peça: ______', margin + 1, yPosition);
    doc.text('Mat/Peça: ______', margin + 1 + gridWidth, yPosition);
    doc.text('Tot Horas: ______', margin + 1 + (gridWidth * 2), yPosition);
    doc.text('Tot Material: ______', margin + 1 + (gridWidth * 3), yPosition);
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