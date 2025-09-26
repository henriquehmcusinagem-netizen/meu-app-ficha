import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function exportToHTML(ficha: FichaSalva, isForCommercial: boolean = false) {
  const materiaisPreenchidos = ficha.materiais.filter(m =>
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  const formatRadioValue = (value: string) => value || "—";
  const formatCheckbox = (value: boolean) => value ? "✓" : "—";

  // Status badge baseado no contexto
  const statusInfo = isForCommercial ?
    { label: "AGUARDANDO ORÇAMENTO", color: "#8B5CF6", icon: "📊" } :
    { label: "CONCLUÍDA", color: "#10B981", icon: "✅" };

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FTC ${ficha.numeroFTC} - ${ficha.formData.cliente}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 15px; font-size: 11px; line-height: 1.3; }
        .header { text-align: center; border: 2px solid #000; padding: 8px; margin-bottom: 12px; background: #f8f9fa; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; color: white; margin-left: 10px; }
        .section { border: 1px solid #666; margin-bottom: 8px; padding: 6px; }
        .section-title { font-weight: bold; background: #e9ecef; padding: 3px 6px; margin: -6px -6px 6px -6px; font-size: 11px; }
        .commercial-highlight { background: #fff3cd; border: 2px solid #ffeaa7; margin-bottom: 12px; padding: 8px; }
        .grid { display: grid; gap: 6px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .field { border: 1px solid #ccc; padding: 3px 4px; background: #fafafa; }
        .label { font-weight: bold; font-size: 9px; color: #495057; }
        .value { margin-top: 2px; color: #212529; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10px; }
        th, td { border: 1px solid #666; padding: 3px 4px; }
        th { background: #e9ecef; font-weight: bold; text-align: center; }
        .material-total { background: #d4edda; font-weight: bold; }
        .totals { background: #f8f9fa; border: 2px solid #28a745; padding: 6px; margin-top: 12px; }
        @media print { body { margin: 10px; font-size: 10px; } }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 10px;">Data: ${new Date().toLocaleDateString('pt-BR')}</span>
            <h1 style="margin: 0; font-size: 16px;">FICHA TÉCNICA DE COTAÇÃO</h1>
            <div style="text-align: right;">
                <span style="font-size: 10px;">FTC Nº ${ficha.numeroFTC}</span>
                <span class="status-badge" style="background-color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</span>
            </div>
        </div>
    </div>

    ${isForCommercial ? `
    <div class="commercial-highlight">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 16px;">💰</span>
            <strong>RESUMO PARA ORÇAMENTO</strong>
        </div>
        <div class="grid grid-3">
            <div><strong>Total Materiais:</strong> R$ ${ficha.calculos.materialTodasPecas.toFixed(2)}</div>
            <div><strong>Total Horas:</strong> ${ficha.calculos.horasTodasPecas}h</div>
            <div><strong>Qtd Peças:</strong> ${ficha.formData.quantidade}</div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">DADOS DO CLIENTE</div>
        <div class="grid grid-2">
            <div class="field">
                <div class="label">CLIENTE:</div>
                <div class="value">${ficha.formData.cliente || "—"}</div>
            </div>
            <div class="field">
                <div class="label">SOLICITANTE:</div>
                <div class="value">${ficha.formData.solicitante || "—"}</div>
            </div>
        </div>
        <div class="grid grid-3" style="margin-top: 8px;">
            <div class="field">
                <div class="label">FONE/EMAIL:</div>
                <div class="value">${ficha.formData.fone_email || "—"}</div>
            </div>
            <div class="field">
                <div class="label">DATA VISITA:</div>
                <div class="value">${ficha.formData.data_visita || "—"}</div>
            </div>
            <div class="field">
                <div class="label">DATA ENTREGA:</div>
                <div class="value">${ficha.formData.data_entrega || "—"}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">DADOS DA PEÇA/EQUIPAMENTO</div>
        <div class="grid grid-2">
            <div class="field">
                <div class="label">NOME DA PEÇA/EQUIPAMENTO:</div>
                <div class="value">${ficha.formData.nome_peca || "—"}</div>
            </div>
            <div class="field">
                <div class="label">QUANTIDADE:</div>
                <div class="value">${ficha.formData.quantidade || "1"}</div>
            </div>
        </div>
        <div class="field" style="margin-top: 8px;">
            <div class="label">SERVIÇO A SER REALIZADO:</div>
            <div class="value">${ficha.formData.servico || "—"}</div>
        </div>
    </div>

    ${materiaisPreenchidos.length > 0 ? `
    <div class="section">
        <div class="section-title">MATERIAL PARA COTAÇÃO</div>
        <table>
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Qtd</th>
                    <th>Fornecedor</th>
                    <th>Cliente Int.</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${materiaisPreenchidos.map(material => `
                    <tr>
                        <td>${material.descricao || "—"}</td>
                        <td>${material.quantidade || "—"}</td>
                        <td>${material.fornecedor || "—"}</td>
                        <td>${material.cliente_interno || "—"}</td>
                        <td>${material.valor_unitario ? formatCurrency(Number(material.valor_unitario)) : "—"}</td>
                        <td>${material.valor_total ? formatCurrency(Number(material.valor_total)) : "—"}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">EXECUÇÃO E DETALHES</div>
        <div class="grid grid-4">
            <div class="field">
                <div class="label">EXECUTADO EM:</div>
                <div class="value">
                    HMC: ${ficha.formData.execucao === 'HMC' ? '✓' : '—'} | 
                    Cliente: ${ficha.formData.execucao === 'CLIENTE' ? '✓' : '—'}
                </div>
            </div>
            <div class="field">
                <div class="label">VISITA TÉCNICA:</div>
                <div class="value">
                    Sim: ${ficha.formData.visita_tecnica === 'SIM' ? '✓' : '—'} | 
                    Não: ${ficha.formData.visita_tecnica === 'NAO' ? '✓' : '—'}
                </div>
            </div>
            <div class="field">
                <div class="label">PEÇA AMOSTRA:</div>
                <div class="value">${formatRadioValue(ficha.formData.tem_peca_amostra)}</div>
            </div>
            <div class="field">
                <div class="label">PROJETO POR:</div>
                <div class="value">${formatRadioValue(ficha.formData.projeto_desenvolvido_por)}</div>
            </div>
        </div>
        <div class="grid grid-2" style="margin-top: 8px;">
            <div class="field">
                <div class="label">DESENHO FINALIZADO:</div>
                <div class="value">${formatRadioValue(ficha.formData.desenho_finalizado)}</div>
            </div>
            <div class="field">
                <div class="label">DESENHO:</div>
                <div class="value">${ficha.formData.desenho_peca || "—"}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">TRATAMENTOS</div>
        <div class="grid grid-4">
            <div class="field">
                <div class="label">PINTURA:</div>
                <div class="value">${formatRadioValue(ficha.formData.pintura)}</div>
            </div>
            <div class="field">
                <div class="label">COR:</div>
                <div class="value">${ficha.formData.cor_pintura || "—"}</div>
            </div>
            <div class="field">
                <div class="label">GALVANIZAÇÃO:</div>
                <div class="value">${formatRadioValue(ficha.formData.galvanizacao)}</div>
            </div>
            <div class="field">
                <div class="label">PESO P/ GALV.:</div>
                <div class="value">${ficha.formData.peso_peca_galv || "—"}</div>
            </div>
        </div>
        <div class="grid grid-4" style="margin-top: 8px;">
            <div class="field">
                <div class="label">TRAT. TÉRMICO:</div>
                <div class="value">${formatRadioValue(ficha.formData.tratamento_termico)}</div>
            </div>
            <div class="field">
                <div class="label">TEMPERA/REVEN.:</div>
                <div class="value">${ficha.formData.tempera_reven || "—"}</div>
            </div>
            <div class="field">
                <div class="label">DUREZA:</div>
                <div class="value">${ficha.formData.dureza || "—"}</div>
            </div>
            <div class="field">
                <div class="label">ENSAIO LP:</div>
                <div class="value">${formatRadioValue(ficha.formData.teste_lp)}</div>
            </div>
        </div>
    </div>

    ${horasServicos.length > 0 ? `
    <div class="section">
        <div class="section-title">HORAS DE SERVIÇO</div>
        <div class="grid grid-4">
            ${horasServicos.map(hora => `
                <div class="field">
                    <div class="label">${hora.label}:</div>
                    <div class="value">${hora.value}h</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">TRANSPORTE</div>
        <div class="grid grid-3">
            <div class="field">
                <div class="label">CAMINHÃO HMC:</div>
                <div class="value">${formatCheckbox(ficha.formData.transporte_caminhao_hmc)}</div>
            </div>
            <div class="field">
                <div class="label">PICKUP HMC:</div>
                <div class="value">${formatCheckbox(ficha.formData.transporte_pickup_hmc)}</div>
            </div>
            <div class="field">
                <div class="label">CLIENTE:</div>
                <div class="value">${formatCheckbox(ficha.formData.transporte_cliente)}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">CONTROLE</div>
        <div class="grid grid-3">
            <div class="field">
                <div class="label">Nº ORÇAMENTO:</div>
                <div class="value">${ficha.formData.num_orcamento || "—"}</div>
            </div>
            <div class="field">
                <div class="label">OS:</div>
                <div class="value">${ficha.formData.num_os || "—"}</div>
            </div>
            <div class="field">
                <div class="label">NF:</div>
                <div class="value">${ficha.formData.num_nf_remessa || "—"}</div>
            </div>
        </div>
    </div>


    <div class="totals">
        <div class="section-title">RESUMO DOS CÁLCULOS</div>
        <div class="grid grid-4">
            <div class="field" style="text-align: center;">
                <div class="label">Horas/Peça</div>
                <div class="value">${ficha.calculos.horasPorPeca.toFixed(1)}h</div>
            </div>
            <div class="field" style="text-align: center;">
                <div class="label">Horas Total</div>
                <div class="value">${ficha.calculos.horasTodasPecas.toFixed(1)}h</div>
            </div>
            <div class="field" style="text-align: center;">
                <div class="label">Soma de Materiais</div>
                <div class="value">${formatCurrency(ficha.calculos.materialPorPeca)}</div>
            </div>
            <div class="field" style="text-align: center;">
                <div class="label">Material Total</div>
                <div class="value">${formatCurrency(ficha.calculos.materialTodasPecas)}</div>
            </div>
        </div>
    </div>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'SemCliente'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}