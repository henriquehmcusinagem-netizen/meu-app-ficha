import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDF(ficha: FichaSalva) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA TÉCNICA DE COTAÇÃO - FTC', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.text(`Nº ${ficha.numeroFTC}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Data: ${ficha.dataCriacao}`, 20, yPosition);
  yPosition += 15;

  // Cliente section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${ficha.formData.cliente || '—'}`, 20, yPosition);
  doc.text(`Solicitante: ${ficha.formData.solicitante || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Fone/Email: ${ficha.formData.fone_email || '—'}`, 20, yPosition);
  doc.text(`Data Visita: ${ficha.formData.data_visita || '—'}`, 110, yPosition);
  yPosition += 10;

  // Peça/Equipamento section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA PEÇA/EQUIPAMENTO', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome da Peça: ${ficha.formData.nome_peca || '—'}`, 20, yPosition);
  doc.text(`Quantidade: ${ficha.formData.quantidade || '1'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Serviço: ${ficha.formData.servico || '—'}`, 20, yPosition);
  yPosition += 15;

  // Materials section
  const materiaisPreenchidos = ficha.materiais.filter(m => 
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  if (materiaisPreenchidos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MATERIAL PARA COTAÇÃO', 20, yPosition);
    yPosition += 8;

    // Materials table
    const tableStartY = yPosition;
    const colWidths = [50, 20, 30, 25, 25, 25];
    const headers = ['Descrição', 'Qtd', 'Fornecedor', 'Cliente Int.', 'Valor Unit.', 'Valor Total'];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = 20;
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    materiaisPreenchidos.slice(0, 8).forEach(material => {
      xPos = 20;
      const values = [
        material.descricao || '—',
        material.quantidade || '—',
        material.fornecedor || '—',
        material.cliente_interno || '—',
        material.valor_unitario ? formatCurrency(Number(material.valor_unitario)) : '—',
        material.valor_total ? formatCurrency(Number(material.valor_total)) : '—'
      ];
      
      values.forEach((value, index) => {
        doc.text(String(value).substring(0, 15), xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 5;
    });
    yPosition += 10;
  }

  // Service Hours
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('HORAS DE SERVIÇO', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const horasServicos = [
    { label: 'Torno Grande', value: ficha.formData.torno_grande },
    { label: 'Torno Pequeno', value: ficha.formData.torno_pequeno },
    { label: 'CNC', value: ficha.formData.cnc_tf },
    { label: 'Fresa', value: ficha.formData.fresa_furad },
    { label: 'Solda', value: ficha.formData.macarico_solda },
    { label: 'Pintura', value: ficha.formData.pintura_horas }
  ].filter(h => parseFloat(h.value || '0') > 0);

  let col = 0;
  horasServicos.forEach(hora => {
    const x = 20 + (col * 60);
    const y = yPosition + Math.floor(col / 3) * 6;
    doc.text(`${hora.label}: ${hora.value}h`, x, y);
    col++;
  });
  yPosition += Math.ceil(horasServicos.length / 3) * 6 + 10;

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DOS CÁLCULOS', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Horas por Peça: ${ficha.calculos.horasPorPeca.toFixed(1)}h`, 20, yPosition);
  doc.text(`Horas Total: ${ficha.calculos.horasTodasPecas.toFixed(1)}h`, 110, yPosition);
  yPosition += 6;
  doc.text(`Material por Peça: ${formatCurrency(ficha.calculos.materialPorPeca)}`, 20, yPosition);
  doc.text(`Material Total: ${formatCurrency(ficha.calculos.materialTodasPecas)}`, 110, yPosition);

  // Generate filename and save
  const filename = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'SemCliente'}.pdf`;
  doc.save(filename);
}