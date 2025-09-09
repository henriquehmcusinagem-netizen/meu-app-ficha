import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

// Import autotable and extend jsPDF
let autoTable: any;
try {
  autoTable = require('jspdf-autotable');
} catch (e) {
  console.warn('jspdf-autotable not available, falling back to manual table');
}

// Declaração de tipos para o plugin autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable?: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
    getNumberOfPages: () => number;
  }
}

export async function generatePDFBlob(ficha: FichaSalva): Promise<Blob> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Configurações gerais
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  
  // Cores do tema
  const primaryColor = [34, 56, 178] as const; // Azul primário
  const secondaryColor = [245, 245, 245] as const; // Cinza claro para backgrounds
  const textColor = [33, 37, 41] as const; // Texto principal
  const mutedColor = [108, 117, 125] as const; // Texto secundário
  
  // Configurações de fonte
  doc.setFont('helvetica');
  
  // Funções auxiliares
  const formatRadioValue = (value: string) => {
    if (!value) return '—';
    if (value === 'sim') return '✓ Sim';
    if (value === 'nao' || value === 'não') return '✗ Não';
    return value;
  };

  const formatCheckbox = (value: boolean) => {
    return value ? '✓' : '✗';
  };

  const formatField = (value: string | undefined | null) => {
    return value && value.trim() ? value : '—';
  };

  // Função para adicionar quebra de página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Função para desenhar seção com título
  const drawSection = (title: string, height: number = 8) => {
    checkPageBreak(height + 10);
    
    // Fundo do título
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(margin, yPosition, contentWidth, height, 'F');
    
    // Borda
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, contentWidth, height, 'S');
    
    // Texto do título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, margin + 3, yPosition + 5.5);
    
    yPosition += height + 5;
    
    // Reset cores
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
  };

  // CABEÇALHO COM LOGO E INFORMAÇÕES
  const drawHeader = () => {
    // Fundo do cabeçalho
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPosition, contentWidth, 25, 'F');
    
    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FICHA TÉCNICA DE COTAÇÃO', pageWidth / 2, yPosition + 10, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.text(`FTC Nº ${ficha.numeroFTC}`, pageWidth / 2, yPosition + 17, { align: 'center' });
    
    // Data
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dataFormatada = ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${dataFormatada}`, margin + 3, yPosition + 22);
    
    // Status
    const statusText = ficha.status === 'finalizada' ? 'FINALIZADA' : 'RASCUNHO';
    const statusColor = ficha.status === 'finalizada' ? [40, 167, 69] : [255, 193, 7];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(pageWidth - margin - 30, yPosition + 18, 28, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(statusText, pageWidth - margin - 16, yPosition + 22, { align: 'center' });
    
    yPosition += 30;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  };

  // DADOS DO CLIENTE
  const drawClientData = () => {
    drawSection('DADOS DO CLIENTE');
    
    // Primeira linha: Cliente e Solicitante
    const firstRow = [
      { label: 'Cliente', value: ficha.formData.cliente, width: contentWidth * 0.48 },
      { label: 'Solicitante', value: ficha.formData.solicitante, width: contentWidth * 0.48 }
    ];
    
    let xPos = margin;
    firstRow.forEach((field) => {
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`${field.label}:`, xPos, yPosition);
      
      // Value
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const text = doc.splitTextToSize(formatField(field.value), field.width - 5);
      doc.text(text, xPos, yPosition + 4);
      
      xPos += field.width + 8;
    });
    
    yPosition += 12;
    
    // Segunda linha: Contato, Data Visita e Data Entrega
    const secondRow = [
      { label: 'Contato', value: ficha.formData.fone_email, width: contentWidth * 0.4 },
      { label: 'Data Visita', value: ficha.formData.data_visita, width: contentWidth * 0.25 },
      { label: 'Data Entrega', value: ficha.formData.data_entrega, width: contentWidth * 0.25, highlight: true }
    ];
    
    xPos = margin;
    secondRow.forEach((field) => {
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`${field.label}:`, xPos, yPosition);
      
      // Value
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      if (field.highlight) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(formatField(field.value), xPos, yPosition + 4);
      
      xPos += field.width + 10;
    });
    
    yPosition += 15;
  };

  // DADOS DA PEÇA/EQUIPAMENTO
  const drawEquipmentData = () => {
    drawSection('DADOS DA PEÇA/EQUIPAMENTO');
    
    // Nome da peça e quantidade
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Nome da Peça:', margin, yPosition);
    doc.text('Quantidade:', margin + contentWidth * 0.7, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(formatField(ficha.formData.nome_peca), margin, yPosition + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatField(ficha.formData.quantidade), margin + contentWidth * 0.7, yPosition + 4);
    
    yPosition += 10;
    
    // Serviço
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Serviço a ser realizado:', margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const servicoLines = doc.splitTextToSize(formatField(ficha.formData.servico), contentWidth - 10);
    doc.text(servicoLines, margin, yPosition + 4);
    
    yPosition += 4 + (servicoLines.length * 4) + 5;
  };

  // MATERIAIS - Com fallback manual se autoTable não funcionar
  const drawMaterials = () => {
    const materiaisPreenchidos = ficha.materiais.filter(m => 
      m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
    );
    
    if (materiaisPreenchidos.length > 0) {
      drawSection('MATERIAL PARA COTAÇÃO');
      
      const tableData = materiaisPreenchidos.map(material => [
        material.descricao || '—',
        material.quantidade || '—',
        material.unidade || 'UN',
        material.fornecedor || '—',
        material.cliente_interno || '—',
        material.valor_unitario ? formatCurrency(Number(material.valor_unitario)) : '—',
        material.valor_total ? formatCurrency(Number(material.valor_total)) : '—'
      ]);
      
      const totalMaterial = materiaisPreenchidos.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
      
      // Tentar usar autoTable se disponível
      if (doc.autoTable && typeof doc.autoTable === 'function') {
        try {
          doc.autoTable({
            startY: yPosition,
            head: [['Descrição', 'Qtd', 'Un', 'Fornecedor', 'Cliente Int.', 'Valor Unit.', 'Valor Total']],
            body: tableData,
            foot: [['', '', '', '', '', 'TOTAL:', formatCurrency(totalMaterial)]],
            theme: 'grid',
            headStyles: {
              fillColor: primaryColor,
              fontSize: 9,
              fontStyle: 'bold'
            },
            footStyles: {
              fillColor: secondaryColor,
              textColor: textColor,
              fontSize: 10,
              fontStyle: 'bold'
            },
            styles: {
              fontSize: 9,
              cellPadding: 2
            },
            columnStyles: {
              0: { cellWidth: 42 },
              1: { cellWidth: 15, halign: 'center' },
              2: { cellWidth: 12, halign: 'center' },
              3: { cellWidth: 30 },
              4: { cellWidth: 25 },
              5: { cellWidth: 28, halign: 'right' },
              6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: margin, right: margin }
          });
          
          yPosition = (doc.lastAutoTable?.finalY || yPosition) + 5;
        } catch (error) {
          console.warn('AutoTable failed, using manual table:', error);
          drawMaterialsManually();
        }
      } else {
        drawMaterialsManually();
      }
      
      // Função para desenhar tabela manualmente
      function drawMaterialsManually() {
        const rowHeight = 6;
        const headerHeight = 8;
        const colWidths = [42, 15, 12, 30, 25, 28, 28];
        const headers = ['Descrição', 'Qtd', 'Un', 'Fornecedor', 'Cliente Int.', 'Valor Unit.', 'Valor Total'];
        let currentY = yPosition;
        
        // Cabeçalho
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        
        let xPos = margin + 2;
        headers.forEach((header, i) => {
          doc.text(header, xPos, currentY + 5.5);
          xPos += colWidths[i];
        });
        
        currentY += headerHeight;
        
        // Linhas de dados
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        tableData.forEach((row, rowIndex) => {
          if (rowIndex % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
          }
          
          xPos = margin + 2;
          row.forEach((cell, cellIndex) => {
            const cellText = String(cell).substring(0, 20);
            if (cellIndex >= 5) { // Valores monetários
              doc.text(cellText, xPos + colWidths[cellIndex] - 2, currentY + 4, { align: 'right' });
            } else if (cellIndex >= 1 && cellIndex <= 2) { // Qtd e Un
              doc.text(cellText, xPos + colWidths[cellIndex] / 2, currentY + 4, { align: 'center' });
            } else {
              doc.text(cellText, xPos, currentY + 4);
            }
            xPos += colWidths[cellIndex];
          });
          
          currentY += rowHeight;
        });
        
        // Total
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text('TOTAL:', margin + contentWidth - 50, currentY + 5.5);
        doc.text(formatCurrency(totalMaterial), margin + contentWidth - 2, currentY + 5.5, { align: 'right' });
        
        yPosition = currentY + headerHeight + 5;
      }
    }
  };

  // EXECUÇÃO E DETALHES
  const drawExecutionDetails = () => {
    drawSection('EXECUÇÃO E DETALHES');
    
    const details = [
      { label: 'Execução', value: formatRadioValue(ficha.formData.execucao) },
      { label: 'Visita Técnica', value: formatRadioValue(ficha.formData.visita_tecnica) },
      { label: 'Horas Visita', value: formatField(ficha.formData.visita_horas) },
      { label: 'Peça Amostra', value: formatRadioValue(ficha.formData.tem_peca_amostra) },
      { label: 'Projeto por', value: formatField(ficha.formData.projeto_desenvolvido_por) },
      { label: 'Desenho', value: formatField(ficha.formData.desenho_peca) },
      { label: 'Finalizado', value: formatRadioValue(ficha.formData.desenho_finalizado) }
    ];
    
    const colWidth = contentWidth / 3;
    let xPos = margin;
    let row = 0;
    
    details.forEach((detail, index) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`${detail.label}:`, xPos, yPosition + row * 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const text = doc.splitTextToSize(detail.value, colWidth - 5);
      doc.text(text, xPos, yPosition + row * 10 + 4);
      
      xPos += colWidth;
      if ((index + 1) % 3 === 0) {
        row++;
        xPos = margin;
      }
    });
    
    yPosition += (Math.ceil(details.length / 3) * 10) + 8;
  };

  // TRANSPORTE
  const drawTransport = () => {
    drawSection('TRANSPORTE', 7);
    
    const transportOptions = [
      { label: 'Caminhão', value: ficha.formData.transporte_caminhao_hmc },
      { label: 'Pickup', value: ficha.formData.transporte_pickup_hmc },
      { label: 'Cliente', value: ficha.formData.transporte_cliente }
    ];
    
    const colWidth = contentWidth / 3;
    let xPos = margin;
    
    transportOptions.forEach((option) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Checkbox with consistent formatting - gray for labels, black for values
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]); // Gray for labels
      const checkmark = formatCheckbox(option.value);
      doc.text(`${option.label}:`, xPos, yPosition);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]); // Black for values
      if (option.value) {
        doc.setFont('helvetica', 'bold');
      }
      doc.text(checkmark, xPos + 30, yPosition);
      xPos += colWidth - 5;
    });
    
    yPosition += 10;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  };

  // HORAS DE SERVIÇO
  const drawServiceHours = () => {
    const horasServicos = [
      { label: 'Torno Grande', value: ficha.formData.torno_grande },
      { label: 'Torno Pequeno', value: ficha.formData.torno_pequeno },
      { label: 'CNC T/F', value: ficha.formData.cnc_tf },
      { label: 'Fresa/Furad.', value: ficha.formData.fresa_furad },
      { label: 'Plasma/Oxicorte', value: ficha.formData.plasma_oxicorte },
      { label: 'Dobra', value: ficha.formData.dobra },
      { label: 'Calandra', value: ficha.formData.calandra },
      { label: 'Maçarico/Solda', value: ficha.formData.macarico_solda },
      { label: 'Des/Montagem', value: ficha.formData.des_montg },
      { label: 'Balanceamento', value: ficha.formData.balanceamento },
      { label: 'Mandrilhamento', value: ficha.formData.mandrilhamento },
      { label: 'Tratamento', value: ficha.formData.tratamento },
      { label: 'Pintura', value: ficha.formData.pintura_horas },
      { label: 'Lavagem/Acab.', value: ficha.formData.lavagem_acab },
      { label: 'Prog. CAM', value: ficha.formData.programacao_cam },
      { label: 'Eng/Técnico', value: ficha.formData.eng_tec }
    ].filter(h => parseFloat(h.value || '0') > 0);
    
    if (horasServicos.length > 0) {
      drawSection('HORAS DE SERVIÇO');
      
      const colWidth = contentWidth / 4;
      let xPos = margin;
      let row = 0;
      
      horasServicos.forEach((hora, index) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]); // Gray for labels
        doc.text(`${hora.label}:`, xPos, yPosition + row * 8);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]); // Black for values
        doc.text(`${hora.value}h`, xPos + 28, yPosition + row * 8);
        
        xPos += colWidth;
        if ((index + 1) % 4 === 0) {
          row++;
          xPos = margin;
        }
      });
      
      yPosition += (Math.ceil(horasServicos.length / 4) * 8) + 8;
    }
  };

  // RESUMO DOS CÁLCULOS
  const drawSummary = () => {
    checkPageBreak(35);
    
    // Fundo destacado
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(margin, yPosition, contentWidth, 30, 'F');
    
    // Borda
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, contentWidth, 30, 'S');
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('RESUMO DOS CÁLCULOS', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    // Grid de valores
    const summaryData = [
      { label: 'HORAS/PEÇA', value: `${ficha.calculos.horasPorPeca.toFixed(1)}h` },
      { label: 'HORAS TOTAL', value: `${ficha.calculos.horasTodasPecas.toFixed(1)}h` },
      { label: 'MATERIAL/PEÇA', value: formatCurrency(ficha.calculos.materialPorPeca) },
      { label: 'MATERIAL TOTAL', value: formatCurrency(ficha.calculos.materialTodasPecas), highlight: true }
    ];
    
    const boxWidth = (contentWidth - 15) / 4;
    let xPos = margin + 2;
    
    summaryData.forEach((item) => {
      // Box
      if (item.highlight) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(xPos, yPosition + 10, boxWidth, 15, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(xPos, yPosition + 10, boxWidth, 15, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPosition + 10, boxWidth, 15, 'S');
      }
      
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (item.highlight) {
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      }
      doc.text(item.label, xPos + boxWidth / 2, yPosition + 14, { align: 'center' });
      
      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      if (item.highlight) {
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      }
      doc.text(item.value, xPos + boxWidth / 2, yPosition + 21, { align: 'center' });
      
      xPos += boxWidth + 3.5;
    });
    
    yPosition += 35;
  };

  // FOTOS (se houver)
  const drawPhotos = async () => {
    const fotosComPreview = ficha.fotos.filter(f => f.preview);
    
    if (fotosComPreview.length > 0) {
      drawSection('REGISTRO FOTOGRÁFICO');
      
      const photoSize = 40; // 40mm x 40mm
      const photosPerRow = 4;
      const spacing = (contentWidth - (photosPerRow * photoSize)) / (photosPerRow - 1);
      
      for (let i = 0; i < fotosComPreview.length; i += photosPerRow) {
        checkPageBreak(photoSize + 15);
        
        const rowPhotos = fotosComPreview.slice(i, i + photosPerRow);
        let xPos = margin;
        
        for (const foto of rowPhotos) {
          if (foto.preview) {
            try {
              // Adicionar imagem
              doc.addImage(foto.preview, 'JPEG', xPos, yPosition, photoSize, photoSize);
              
              // Borda da foto
              doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.setLineWidth(0.3);
              doc.rect(xPos, yPosition, photoSize, photoSize, 'S');
              
              // Nome da foto
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
              const photoName = foto.name.length > 15 ? foto.name.substring(0, 12) + '...' : foto.name;
              doc.text(photoName, xPos + photoSize / 2, yPosition + photoSize + 3, { align: 'center' });
            } catch (error) {
              console.error('Erro ao adicionar foto ao PDF:', error);
              
              // Placeholder para foto com erro
              doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
              doc.rect(xPos, yPosition, photoSize, photoSize, 'F');
              doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
              doc.setFontSize(8);
              doc.text('Foto indisponível', xPos + photoSize / 2, yPosition + photoSize / 2, { align: 'center' });
            }
          }
          
          xPos += photoSize + spacing;
        }
        
        yPosition += photoSize + 10;
      }
    }
  };

  // RODAPÉ
  const drawFooter = () => {
    const footerY = pageHeight - 10;
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    
    // Linha separadora
    doc.setDrawColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setLineWidth(0.1);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Texto do rodapé
    doc.text('Sistema de Fichas Técnicas - HMC', margin, footerY);
    doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // GERAR O PDF
  drawHeader();
  drawClientData();
  drawEquipmentData();
  drawMaterials();
  drawExecutionDetails();
  drawTransport();
  drawServiceHours();
  
  // Tratamentos e Acabamentos
  const tratamentos = [
    { label: 'Pintura', value: ficha.formData.pintura, extra: ficha.formData.cor_pintura },
    { label: 'Galvanização', value: ficha.formData.galvanizacao, extra: ficha.formData.peso_peca_galv },
    { label: 'Tratamento Térmico', value: ficha.formData.tratamento_termico, extra: ficha.formData.tempera_reven },
    { label: 'Teste LP', value: ficha.formData.teste_lp },
    { label: 'Balanceamento', value: ficha.formData.balanceamento_campo },
    { label: 'Rotação', value: ficha.formData.rotacao },
    { label: 'Fornecimento de Desenho', value: ficha.formData.fornecimento_desenho },
    { label: 'Fotos no Relatório', value: ficha.formData.fotos_relatorio },
    { label: 'Relatório Técnico', value: ficha.formData.relatorio_tecnico },
    { label: 'Emissão de ART', value: ficha.formData.emissao_art },
    { label: 'Cementação', value: ficha.formData.cementacao },
    { label: 'Dureza', value: ficha.formData.dureza },
    { label: 'Serviços Terceirizados', value: ficha.formData.servicos_terceirizados }
  ];
  
  // Show all treatments that have a value (both SIM and NÃO)
  const treatmentsToShow = tratamentos.filter(t => t.value && t.value !== '');
  
  if (treatmentsToShow.length > 0) {
    drawSection('TRATAMENTOS E ACABAMENTOS');
    
    let row = 0;
    const itemsPerRow = 3;
    const columnWidth = (pageWidth - 2 * margin) / itemsPerRow;
    
    treatmentsToShow.forEach((trat, index) => {
      const col = index % itemsPerRow;
      const currentRow = Math.floor(index / itemsPerRow);
      const xPos = margin + col * columnWidth;
      const yPos = yPosition + currentRow * 6;
      
      // Use formatRadioValue to show "✓ Sim" or "✗ Não"
      const formattedValue = formatRadioValue(trat.value);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // Labels in gray, values in black (consistent formatting)
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]); // Gray for labels
      doc.text(`${trat.label}:`, xPos, yPos);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]); // Black for values
      doc.text(formattedValue, xPos + 30, yPos);
      
      // Show extra info only for selected treatments (SIM)
      if (trat.extra && trat.value === 'sim') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`${trat.extra}`, xPos + 5, yPos + 3);
      }
      
      row = Math.max(row, currentRow);
    });
    
    yPosition += (row + 1) * 6 + 5;
  }
  
  // Controle
  if (ficha.formData.num_orcamento || ficha.formData.num_os || ficha.formData.num_nf_remessa) {
    drawSection('CONTROLE', 7);
    
    const controles = [
      { label: 'Orçamento', value: ficha.formData.num_orcamento },
      { label: 'OS', value: ficha.formData.num_os },
      { label: 'NF Remessa', value: ficha.formData.num_nf_remessa }
    ].filter(c => c.value);
    
    const colWidth = contentWidth / controles.length;
    let xPos = margin;
    
    controles.forEach((ctrl) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`${ctrl.label}:`, xPos, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(ctrl.value, xPos + 20, yPosition);
      
      xPos += colWidth;
    });
    
    yPosition += 8;
  }
  
  drawSummary();
  await drawPhotos();
  drawFooter();
  
  // Adicionar metadados ao PDF
  doc.setProperties({
    title: `Ficha Técnica FTC ${ficha.numeroFTC}`,
    subject: `Cliente: ${ficha.formData.cliente}`,
    author: 'Sistema HMC',
    keywords: `FTC, ${ficha.numeroFTC}, ${ficha.formData.cliente}`,
    creator: 'Sistema de Fichas Técnicas'
  });
  
  return doc.output('blob');
}

export async function generatePDF(ficha: FichaSalva) {
  try {
    const blob = await generatePDFBlob(ficha);
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