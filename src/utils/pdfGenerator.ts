import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDFBlob(ficha: FichaSalva): Blob {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Configurações otimizadas para A4 (210mm x 297mm) - layout super compacto
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 8; // Margem reduzida para 8mm
  const contentWidth = pageWidth - 2 * margin; // 194mm úteis
  const contentHeight = pageHeight - 2 * margin; // 281mm úteis
  let yPosition = margin;
  
  // Configurações de fonte ultra compactas para caber tudo em A4
  const titleFontSize = 8;
  const sectionFontSize = 6;
  const fieldFontSize = 5.5;
  const lineHeight = 3.2;
  const sectionSpacing = 4;
  
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

  // Função para título de seção - mais compacta
  const addSectionTitle = (title: string) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(sectionFontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 1, yPosition + 3);
    yPosition += 4.5;
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

  // CABEÇALHO - mais compacto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFontSize);
  doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, margin + 4, { align: 'center' });
  
  // Data e FTC
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${dataFormatada}`, margin, margin + 8);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, pageWidth - margin - 35, margin + 8);
  
  yPosition = margin + 12;

  // DADOS DO CLIENTE (2 colunas) - layout otimizado
  addSectionTitle('DADOS DO CLIENTE');
  
  const col1Width = contentWidth / 2;
  const col2Start = margin + col1Width;
  
  // Linha 1
  addField('Cliente', formatField(ficha.formData.cliente), margin + 1, false);
  addField('Solicitante', formatField(ficha.formData.solicitante), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 2
  addField('Fone/Email', formatField(ficha.formData.fone_email), margin + 1, false);
  addField('Data Visita', formatField(ficha.formData.data_visita), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 3
  addField('Data Entrega', formatField(ficha.formData.data_entrega), margin + 1, false);
  yPosition += 2;

  // DADOS DA PEÇA/EQUIPAMENTO (2 colunas) - layout otimizado
  addSectionTitle('DADOS DA PEÇA/EQUIPAMENTO');
  
  // Linha 1
  addField('Nome da Peça', formatField(ficha.formData.nome_peca), margin + 1, false);
  addField('Quantidade', formatField(ficha.formData.quantidade), col2Start, false);
  yPosition += lineHeight;
  
  // Linha 2
  addField('Serviço', formatField(ficha.formData.servico), margin + 1, false);
  yPosition += 2;

  // MATERIAL PARA COTAÇÃO (Tabela ultra compacta) - SEMPRE 5 LINHAS
  addSectionTitle('MATERIAL PARA COTAÇÃO');
  
  // Sempre exibir 5 linhas para garantir espaço para preenchimento
  const materiaisParaExibir = [];
  const materiaisFiltrados = ficha.materiais?.filter(m => 
    m.descricao || (m.quantidade && parseFloat(m.quantidade) > 0) || (m.valor_unitario && parseFloat(m.valor_unitario) > 0)
  ) || [];
  
  // Adicionar materiais existentes
  materiaisParaExibir.push(...materiaisFiltrados);
  
  // Completar com linhas vazias até 5 linhas
  while (materiaisParaExibir.length < 5) {
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
  
  // Cabeçalho da tabela - ultra compacto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  
  const colWidths = [35, 10, 8, 18, 22, 18, 16]; // Total: 127mm - mais compacto
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
  yPosition += 3;
  
  // Linhas da tabela - 5 linhas garantidas
  doc.setFont('helvetica', 'normal');
  materiaisParaExibir.slice(0, 5).forEach(material => {
    xPos = margin + 1;
    
    doc.text(formatField(material.descricao).substring(0, 18), xPos, yPosition);
    xPos += colWidths[0];
    doc.text(formatField(material.quantidade), xPos, yPosition);
    xPos += colWidths[1];
    doc.text(formatField(material.unidade), xPos, yPosition);
    xPos += colWidths[2];
    
    const valorUnit = material.valor_unitario && parseFloat(material.valor_unitario) > 0 
      ? formatCurrency(parseFloat(material.valor_unitario)).substring(0, 7) 
      : '______';
    doc.text(valorUnit, xPos, yPosition);
    xPos += colWidths[3];
    
    doc.text(formatField(material.fornecedor).substring(0, 11), xPos, yPosition);
    xPos += colWidths[4];
    doc.text(formatField(material.cliente_interno).substring(0, 9), xPos, yPosition);
    xPos += colWidths[5];
    
    const total = material.valor_total && parseFloat(material.valor_total) > 0 
      ? formatCurrency(parseFloat(material.valor_total)).substring(0, 7) 
      : '______';
    doc.text(total, xPos, yPosition);
    
    yPosition += 3;
  });
  yPosition += 1;

  // EXECUÇÃO E DETALHES (Grid 5 colunas para aproveitar melhor o espaço)
  addSectionTitle('EXECUÇÃO E DETALHES');
  
  const gridWidth = contentWidth / 5;
  
  // Linha 1 - 5 campos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldFontSize);
  doc.text('Execução:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.execucao), margin + 15, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Visita Téc:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.visita_tecnica), margin + 18 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Hrs Visita:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.visita_horas), margin + 16 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Amostra:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tem_peca_amostra), margin + 14 + (gridWidth * 3), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Proj Por:', margin + 1 + (gridWidth * 4), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.projeto_desenvolvido_por), margin + 13 + (gridWidth * 4), yPosition);
  yPosition += lineHeight;
  
  // Linha 2 - 2 campos (removendo campos inexistentes)
  doc.setFont('helvetica', 'bold');
  doc.text('Des Peça:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_peca), margin + 15, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Des Final:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.desenho_finalizado), margin + 16 + gridWidth, yPosition);
  yPosition += 2;

  // TRANSPORTE (1 linha compacta)
  addSectionTitle('TRANSPORTE');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cam HMC:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_caminhao_hmc), margin + 16, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Pick HMC:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_pickup_hmc), margin + 16 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCheckbox(ficha.formData.transporte_cliente), margin + 12 + (gridWidth * 2), yPosition);
  yPosition += 2;

  // TRATAMENTOS E ACABAMENTOS (Grid 5x3 - ultra compacto)
  addSectionTitle('TRATAMENTOS E ACABAMENTOS');
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Pintura:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.pintura), margin + 12, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cor:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cor_pintura), margin + 8 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Galvaniz:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.galvanizacao), margin + 15 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Galv:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_galv), margin + 16 + (gridWidth * 3), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Trat Térm:', margin + 1 + (gridWidth * 4), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.tratamento_termico), margin + 16 + (gridWidth * 4), yPosition);
  yPosition += lineHeight;
  
  // Linha 2
  doc.setFont('helvetica', 'bold');
  doc.text('Peso Trat:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.peso_peca_trat), margin + 15, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Temp/Rev:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.tempera_reven), margin + 15 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cementação:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.cementacao), margin + 18 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Dureza:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.dureza), margin + 11 + (gridWidth * 3), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Teste LP:', margin + 1 + (gridWidth * 4), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.teste_lp), margin + 13 + (gridWidth * 4), yPosition);
  yPosition += lineHeight;
  
  // Linha 3
  doc.setFont('helvetica', 'bold');
  doc.text('Bal Campo:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.balanceamento_campo), margin + 16, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Rotação:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.rotacao), margin + 13 + gridWidth, yPosition);
  yPosition += 2;

  // SERVIÇOS ADICIONAIS (Grid 5 colunas - super compacto)
  addSectionTitle('SERVIÇOS ADICIONAIS');
  
  // Linha 1
  doc.setFont('helvetica', 'bold');
  doc.text('Forn Des:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fornecimento_desenho), margin + 14, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fotos Rel:', margin + 1 + gridWidth, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.fotos_relatorio), margin + 14 + gridWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Rel Téc:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.relatorio_tecnico), margin + 12 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ART:', margin + 1 + (gridWidth * 3), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatRadioValue(ficha.formData.emissao_art), margin + 8 + (gridWidth * 3), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Terceiriz:', margin + 1 + (gridWidth * 4), yPosition);
  doc.setFont('helvetica', 'normal');
  const terceirizados = formatField(ficha.formData.servicos_terceirizados);
  doc.text(terceirizados.length > 8 ? terceirizados.substring(0, 8) + '...' : terceirizados, margin + 15 + (gridWidth * 4), yPosition);
  yPosition += 2;

  // HORAS DE SERVIÇO (Grid 5x4 - TODOS OS CAMPOS)
  addSectionTitle('HORAS DE SERVIÇO');
  
  const horasServicos = [
    { label: "Mat/Peça", value: ficha.formData.material_por_peca },
    { label: "Mat Total", value: ficha.formData.material_todas_pecas },
    { label: "Hrs/Peça", value: ficha.formData.horas_por_peca },
    { label: "Hrs Total", value: ficha.formData.horas_todas_pecas },
    { label: "Torno G", value: ficha.formData.torno_grande },
    { label: "Torno P", value: ficha.formData.torno_pequeno },
    { label: "CNC TF", value: ficha.formData.cnc_tf },
    { label: "Fresa/Fur", value: ficha.formData.fresa_furad },
    { label: "Plasma/Ox", value: ficha.formData.plasma_oxicorte },
    { label: "Dobra", value: ficha.formData.dobra },
    { label: "Calandra", value: ficha.formData.calandra },
    { label: "Maçar/Sol", value: ficha.formData.macarico_solda },
    { label: "Des/Mont", value: ficha.formData.des_montg },
    { label: "Balance", value: ficha.formData.balanceamento },
    { label: "Mandrilh", value: ficha.formData.mandrilhamento },
    { label: "Tratamt", value: ficha.formData.tratamento },
    { label: "Pint Hrs", value: ficha.formData.pintura_horas },
    { label: "Lav/Acab", value: ficha.formData.lavagem_acab },
    { label: "Prog CAM", value: ficha.formData.programacao_cam },
    { label: "Eng/Téc", value: ficha.formData.eng_tec }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldFontSize);
  
  let row = 0;
  horasServicos.forEach((hora, index) => {
    const col = index % 5;
    const x = margin + 1 + col * (gridWidth);
    const y = yPosition + row * 3;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${hora.label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${hora.label}: `);
    doc.text(formatField(hora.value), x + labelWidth, y);
    
    if (col === 4) row++;
  });
  yPosition += Math.ceil(horasServicos.length / 5) * 3 + 2;

  // CONTROLE (3 campos em linha)
  addSectionTitle('CONTROLE');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº Orçamento:', margin + 1, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_orcamento), margin + 20, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº OS:', margin + 1 + (gridWidth * 2), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_os), margin + 10 + (gridWidth * 2), yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nº NF Remessa:', margin + 1 + (gridWidth * 3.5), yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatField(ficha.formData.num_nf_remessa), margin + 23 + (gridWidth * 3.5), yPosition);
  yPosition += 2;


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