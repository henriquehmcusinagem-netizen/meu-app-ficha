import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generateHTMLContent(ficha: FichaSalva): string {
  const materiaisPreenchidos = ficha.materiais.filter(m => 
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  const formatRadioValue = (value: string) => value || "—";
  const formatCheckbox = (value: boolean) => value ? "✓" : "—";

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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha Técnica FTC ${ficha.numeroFTC}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { text-align: center; border: 2px solid black; padding: 10px; margin-bottom: 15px; }
        .section { border: 1px solid #333; margin-bottom: 10px; padding: 8px; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 4px; margin: -8px -8px 8px -8px; }
        .grid { display: grid; gap: 8px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .field { border: 1px solid #ccc; padding: 4px; }
        .label { font-weight: bold; font-size: 10px; }
        .value { margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { border: 1px solid #333; padding: 4px; font-size: 10px; }
        th { background: #f0f0f0; font-weight: bold; }
        .totals { background: #f0f0f0; border: 2px solid #333; padding: 8px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Data: ${ficha.dataCriacao}</span>
            <h1 style="margin: 0;">FICHA TÉCNICA DE COTAÇÃO - FTC</h1>
            <span>Nº ${ficha.numeroFTC}</span>
        </div>
    </div>

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
                <div class="label">Material/Peça</div>
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
}