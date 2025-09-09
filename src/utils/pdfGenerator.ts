import jsPDF from 'jspdf';
import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generatePDF(ficha: FichaSalva) {
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
  checkPageBreak(30);
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
  yPosition += 6;
  doc.text(`Data Entrega: ${ficha.formData.data_entrega || '—'}`, 20, yPosition);
  yPosition += 10;

  // Peça/Equipamento section
  checkPageBreak(35);
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
  yPosition += 6;
  doc.text(`Material Base: ${ficha.formData.material_base || '—'}`, 20, yPosition);
  doc.text(`Dimensões: ${ficha.formData.dimensoes || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Tolerância: ${ficha.formData.tolerancia || '—'}`, 20, yPosition);
  doc.text(`Acabamento: ${ficha.formData.acabamento_superficie || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Norma Aplicável: ${ficha.formData.norma_aplicavel || '—'}`, 20, yPosition);
  doc.text(`Certificação: ${ficha.formData.certificacao || '—'}`, 110, yPosition);
  yPosition += 15;

  // Materials section
  const materiaisPreenchidos = ficha.materiais.filter(m => 
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  if (materiaisPreenchidos.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MATERIAL PARA COTAÇÃO', 20, yPosition);
    yPosition += 8;

    // Materials table
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
    materiaisPreenchidos.forEach(material => {
      checkPageBreak(10);
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

  // Execução section
  checkPageBreak(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUÇÃO E DETALHES', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Executado em: HMC: ${ficha.formData.execucao === 'HMC' ? '✓' : '—'} | Cliente: ${ficha.formData.execucao === 'CLIENTE' ? '✓' : '—'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Visita Técnica: Sim: ${ficha.formData.visita_tecnica === 'SIM' ? '✓' : '—'} | Não: ${ficha.formData.visita_tecnica === 'NAO' ? '✓' : '—'}`, 20, yPosition);
  doc.text(`Peça Amostra: ${formatRadioValue(ficha.formData.tem_peca_amostra)}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Projeto por: ${formatRadioValue(ficha.formData.projeto_desenvolvido_por)}`, 20, yPosition);
  doc.text(`Desenho Finalizado: ${formatRadioValue(ficha.formData.desenho_finalizado)}`, 110, yPosition);
  yPosition += 15;

  // Tratamentos section
  checkPageBreak(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRATAMENTOS', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pintura: ${formatRadioValue(ficha.formData.pintura)}`, 20, yPosition);
  doc.text(`Cor: ${ficha.formData.cor_pintura || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Galvanização: ${formatRadioValue(ficha.formData.galvanizacao)}`, 20, yPosition);
  doc.text(`Peso p/ Galv.: ${ficha.formData.peso_peca_galv || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Trat. Térmico: ${formatRadioValue(ficha.formData.tratamento_termico)}`, 20, yPosition);
  doc.text(`Tempera/Reven.: ${ficha.formData.tempera_reven || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`Dureza: ${ficha.formData.dureza || '—'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Ensaio LP: ${formatRadioValue(ficha.formData.teste_lp)}`, 20, yPosition);
  yPosition += 15;

  // Service Hours
  checkPageBreak(50);
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
    { label: 'Fresa/Furad.', value: ficha.formData.fresa_furad },
    { label: 'Plasma/Oxicorte', value: ficha.formData.plasma_oxicorte },
    { label: 'Dobra', value: ficha.formData.dobra },
    { label: 'Calandra', value: ficha.formData.calandra },
    { label: 'Macarico/Solda', value: ficha.formData.macarico_solda },
    { label: 'Des/Mont.', value: ficha.formData.des_montg },
    { label: 'Balanceamento', value: ficha.formData.balanceamento },
    { label: 'Mandrilhamento', value: ficha.formData.mandrilhamento },
    { label: 'Tratamento', value: ficha.formData.tratamento },
    { label: 'Pintura', value: ficha.formData.pintura_horas },
    { label: 'Lavagem/Acab.', value: ficha.formData.lavagem_acab },
    { label: 'Prog. CAM', value: ficha.formData.programacao_cam },
    { label: 'Eng/Tec', value: ficha.formData.eng_tec }
  ].filter(h => parseFloat(h.value || '0') > 0);

  let col = 0;
  horasServicos.forEach(hora => {
    const x = 20 + (col % 3) * 60;
    const y = yPosition + Math.floor(col / 3) * 6;
    checkPageBreak(10);
    doc.text(`${hora.label}: ${hora.value}h`, x, y);
    col++;
  });
  yPosition += Math.ceil(horasServicos.length / 3) * 6 + 15;

  // Transport section
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSPORTE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Caminhão HMC: ${formatCheckbox(ficha.formData.transporte_caminhao_hmc)}`, 20, yPosition);
  doc.text(`Pickup HMC: ${formatCheckbox(ficha.formData.transporte_pickup_hmc)}`, 80, yPosition);
  doc.text(`Cliente: ${formatCheckbox(ficha.formData.transporte_cliente)}`, 140, yPosition);
  yPosition += 15;

  // Control section
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROLE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº Orçamento: ${ficha.formData.num_orcamento || '—'}`, 20, yPosition);
  doc.text(`OS: ${ficha.formData.num_os || '—'}`, 110, yPosition);
  yPosition += 6;
  doc.text(`NF: ${ficha.formData.num_nf_remessa || '—'}`, 20, yPosition);
  yPosition += 15;

  // Additional fields
  if (ficha.formData.observacoes || ficha.formData.condicoes_especiais || ficha.formData.descricao_geral) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES ADICIONAIS', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (ficha.formData.observacoes) {
      doc.text(`Observações: ${ficha.formData.observacoes}`, 20, yPosition);
      yPosition += 6;
    }
    if (ficha.formData.condicoes_especiais) {
      doc.text(`Condições Especiais: ${ficha.formData.condicoes_especiais}`, 20, yPosition);
      yPosition += 6;
    }
    if (ficha.formData.descricao_geral) {
      doc.text(`Descrição Geral: ${ficha.formData.descricao_geral}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 10;
  }

  // Summary
  checkPageBreak(30);
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