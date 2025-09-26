import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './calculations';

export function generateHTMLContent(ficha: FichaSalva): string {
  const formatRadioValue = (value: string | boolean) => {
    if (!value || value === '') return '—';
    if (value === 'sim' || value === true) return '✓ Sim';
    if (value === 'nao' || value === 'não' || value === false) return '✗ Não';
    return String(value);
  };

  const formatHours = (value: string) => {
    if (!value || value === '' || value === '0') return '—';
    return `${value}h`;
  };

  const materiaisComPrecos = ficha.materiais.filter(m =>
    m.descricao && parseFloat(m.valor_total || '0') > 0
  );

  const totalMateriais = materiaisComPrecos.reduce((sum, material) =>
    sum + parseFloat(material.valor_total || '0'), 0
  );

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FTC ${ficha.numeroFTC} - ${ficha.formData.cliente}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #1f2937;
            background: #ffffff;
            max-width: 1120px;
            margin: 10px auto;
            padding: 15px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }

        .header .subtitle {
            color: #6b7280;
            font-size: 18px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        .info-section {
            background: #f9fafb;
            border-radius: 6px;
            padding: 15px;
            border-left: 3px solid #e5e7eb;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }

        .section-title::before {
            content: "";
            width: 3px;
            height: 12px;
            background: #6b7280;
            margin-right: 6px;
            border-radius: 2px;
        }

        .field-group {
            margin-bottom: 8px;
        }

        .field-label {
            font-weight: 500;
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 3px;
        }

        .field-value {
            color: #111827;
            word-wrap: break-word;
            font-size: 16px;
        }

        .materials-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .materials-table th {
            background: #f3f4f6;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            font-size: 15px;
            border-bottom: 1px solid #e5e7eb;
        }

        .materials-table td {
            padding: 10px 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 15px;
        }

        .materials-table tr:hover {
            background: #f9fafb;
        }

        .total-section {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            text-align: right;
        }

        .total-label {
            font-size: 11px;
            color: #075985;
            margin-bottom: 4px;
        }

        .total-value {
            font-size: 22px;
            font-weight: 700;
            color: #0c4a6e;
        }

        .footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
        }

        .radio-options {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 8px;
        }

        .radio-option {
            font-size: 12px;
            color: #374151;
        }

        .info-grid-treatments {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        /* Screen view optimization */
        @media screen {
            .info-grid-compact {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }

            .info-grid-treatments {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }

            .equipment-compact {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                font-size: 11px;
            }

            .equipment-row {
                display: grid;
                grid-template-columns: 1fr 60px;
                gap: 8px;
                padding: 4px 0;
                border-bottom: 1px solid #f3f4f6;
            }
        }

        @media (max-width: 768px) {
            body { margin: 10px; padding: 15px; max-width: 100%; }
            .info-grid, .info-grid-compact, .info-grid-treatments { grid-template-columns: 1fr; gap: 15px; }
            .materials-table { font-size: 11px; }
            .materials-table th, .materials-table td { padding: 8px 6px; }
        }

        @media print {
            @page {
                size: A4;
                margin: 0.4cm;
            }

            body {
                margin: 0;
                padding: 0.3cm;
                font-size: 8px;
                line-height: 1.1;
            }

            .header {
                padding-bottom: 8px;
                margin-bottom: 12px;
            }

            .header h1 { font-size: 14px; margin-bottom: 3px; }
            .header .subtitle { font-size: 9px; }
            .info-grid { gap: 6px; margin-bottom: 10px; }
            .info-section { padding: 6px; }
            .section-title { font-size: 10px; margin-bottom: 4px; }
            .section-title::before { width: 2px; height: 8px; margin-right: 4px; }
            .field-group { margin-bottom: 3px; }
            .field-label { font-size: 7px; margin-bottom: 1px; }
            .field-value { font-size: 8px; }
            .materials-table { font-size: 7px; margin: 8px 0; }
            .materials-table th, .materials-table td { padding: 2px 3px; }
            .total-section { padding: 6px; margin: 8px 0; }
            .total-label { font-size: 8px; margin-bottom: 2px; }
            .total-value { font-size: 12px; }
            .footer { margin-top: 10px; padding-top: 6px; font-size: 7px; }

            /* Compact three-column layout for some sections */
            .info-grid-compact {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 6px;
                margin-bottom: 10px;
            }

            .info-grid-treatments {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 6px;
                margin-bottom: 10px;
            }

            /* Compact two-column layout for equipment table */
            .equipment-compact {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                font-size: 7px;
            }

            .equipment-row {
                display: grid;
                grid-template-columns: 1fr 40px;
                gap: 4px;
                padding: 1px 0;
                border-bottom: 1px solid #f3f4f6;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FICHA TÉCNICA DE COTAÇÃO</h1>
        <div class="subtitle">FTC Nº ${ficha.numeroFTC} • ${ficha.dataCriacao ? new Date(ficha.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <div class="section-title">Dados do Cliente</div>
            <div class="field-group">
                <div class="field-label">Cliente</div>
                <div class="field-value">${ficha.formData.cliente || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Solicitante</div>
                <div class="field-value">${ficha.formData.solicitante || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Contato (Fone/Email)</div>
                <div class="field-value">${ficha.formData.fone_email || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Data da Visita</div>
                <div class="field-value">${ficha.formData.data_visita || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Data de Entrega</div>
                <div class="field-value">${ficha.formData.data_entrega || '—'}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Dados da Peça/Equipamento</div>
            <div class="field-group">
                <div class="field-label">Nome da Peça</div>
                <div class="field-value">${ficha.formData.nome_peca || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Quantidade</div>
                <div class="field-value">${ficha.formData.quantidade || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Serviço</div>
                <div class="field-value">${ficha.formData.servico || ficha.formData.nome_peca || '—'}</div>
            </div>
        </div>
    </div>

    <!-- Execução, Desenho e Materiais -->
    <div class="info-grid-compact">
        <div class="info-section">
            <div class="section-title">Execução</div>
            <div class="field-group">
                <div class="field-label">Execução</div>
                <div class="field-value">${ficha.formData.execucao || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Visita Técnica</div>
                <div class="field-value">${formatRadioValue(ficha.formData.visita_tecnica)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Horas de Visita</div>
                <div class="field-value">${formatHours(ficha.formData.visita_horas)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Peça Amostra</div>
                <div class="field-value">${formatRadioValue(ficha.formData.tem_peca_amostra)}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Desenho e Transporte</div>
            <div class="field-group">
                <div class="field-label">Desenho da Peça</div>
                <div class="field-value">${ficha.formData.desenho_peca || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Desenho Finalizado</div>
                <div class="field-value">${formatRadioValue(ficha.formData.desenho_finalizado)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Transporte HMC</div>
                <div class="field-value">${formatRadioValue(ficha.formData.transporte_caminhao_hmc) !== '—' ? '✓ Caminhão' : ''} ${formatRadioValue(ficha.formData.transporte_pickup_hmc) !== '—' ? '✓ Pickup' : ''}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Transporte Cliente</div>
                <div class="field-value">${formatRadioValue(ficha.formData.transporte_cliente)}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Materiais e Projeto</div>
            <div class="field-group">
                <div class="field-label">Material</div>
                <div class="field-value">${ficha.formData.material || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Dimensões</div>
                <div class="field-value">${ficha.formData.dimensoes || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Projeto Desenvolvido Por</div>
                <div class="field-value">${ficha.formData.projeto_desenvolvido_por || '—'}</div>
            </div>
        </div>
    </div>

    <!-- Tratamentos e Serviços Especiais -->
    <div class="info-grid">
        <div class="info-section">
            <div class="section-title">Tratamentos e Acabamentos</div>
            <div class="field-group">
                <div class="field-label">Pintura</div>
                <div class="field-value">${ficha.formData.pintura || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Cor da Pintura</div>
                <div class="field-value">${ficha.formData.cor_pintura || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Galvanização</div>
                <div class="field-value">${ficha.formData.galvanizacao || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Tratamento Térmico</div>
                <div class="field-value">${ficha.formData.tratamento_termico || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Dureza</div>
                <div class="field-value">${ficha.formData.dureza || '—'}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Serviços Especiais</div>
            <div class="field-group">
                <div class="field-label">Balanceamento Campo</div>
                <div class="field-value">${formatRadioValue(ficha.formData.balanceamento_campo)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Rotação</div>
                <div class="field-value">${ficha.formData.rotacao ? `${ficha.formData.rotacao} RPM` : '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Fornecimento Desenho</div>
                <div class="field-value">${formatRadioValue(ficha.formData.fornecimento_desenho)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Fotos/Relatório</div>
                <div class="field-value">${formatRadioValue(ficha.formData.fotos_relatorio)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Emissão ART</div>
                <div class="field-value">${formatRadioValue(ficha.formData.emissao_art)}</div>
            </div>
        </div>
    </div>

    <!-- Especificações e Terceiros -->
    <div class="info-grid">
        <div class="info-section">
            <div class="section-title">Especificações Técnicas</div>
            <div class="field-group">
                <div class="field-label">Peso Peça Galv.</div>
                <div class="field-value">${ficha.formData.peso_peca_galv || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Peso Peça Trat.</div>
                <div class="field-value">${ficha.formData.peso_peca_trat || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Têmpera/Revenido</div>
                <div class="field-value">${ficha.formData.tempera_reven || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Cementação</div>
                <div class="field-value">${ficha.formData.cementacao || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Teste LP</div>
                <div class="field-value">${formatRadioValue(ficha.formData.teste_lp)}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Documentação e Terceiros</div>
            <div class="field-group">
                <div class="field-label">Relatório Técnico</div>
                <div class="field-value">${formatRadioValue(ficha.formData.relatorio_tecnico)}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Serviços Terceirizados</div>
                <div class="field-value">${ficha.formData.servicos_terceirizados || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Detalhes do Serviço</div>
                <div class="field-value">${ficha.formData.detalhes_servico || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Observações Gerais</div>
                <div class="field-value">${ficha.formData.observacoes_gerais || '—'}</div>
            </div>
        </div>
    </div>

    <!-- Horas de Serviço por Equipamento -->
    <div class="info-section">
        <div class="section-title">Horas de Serviço por Equipamento</div>
        <div class="equipment-compact">
            <div class="equipment-col">
                <div class="equipment-row"><div>Torno Grande</div><div>${formatHours(ficha.formData.torno_grande)}</div></div>
                <div class="equipment-row"><div>Torno Pequeno</div><div>${formatHours(ficha.formData.torno_pequeno)}</div></div>
                <div class="equipment-row"><div>Plasma/Oxicorte</div><div>${formatHours(ficha.formData.plasma_oxicorte)}</div></div>
                <div class="equipment-row"><div>Balanceamento</div><div>${formatHours(ficha.formData.balanceamento)}</div></div>
                <div class="equipment-row"><div>Pintura</div><div>${formatHours(ficha.formData.pintura_horas)}</div></div>
                <div class="equipment-row"><div>Eng. Técnica</div><div>${formatHours(ficha.formData.eng_tec)}</div></div>
            </div>
            <div class="equipment-col">
                <div class="equipment-row"><div>CNC/TF</div><div>${formatHours(ficha.formData.cnc_tf)}</div></div>
                <div class="equipment-row"><div>Fresa/Furad.</div><div>${formatHours(ficha.formData.fresa_furad)}</div></div>
                <div class="equipment-row"><div>Macarico/Solda</div><div>${formatHours(ficha.formData.macarico_solda)}</div></div>
                <div class="equipment-row"><div>Mandrilhamento</div><div>${formatHours(ficha.formData.mandrilhamento)}</div></div>
                <div class="equipment-row"><div>Lavagem/Acab.</div><div>${formatHours(ficha.formData.lavagem_acab)}</div></div>
                <div class="equipment-row"><div>Prog. CAM</div><div>${formatHours(ficha.formData.programacao_cam)}</div></div>
                <div class="equipment-row"><div>Dobra</div><div>${formatHours(ficha.formData.dobra)}</div></div>
                <div class="equipment-row"><div>Calandra</div><div>${formatHours(ficha.formData.calandra)}</div></div>
                <div class="equipment-row"><div>Des./Montg.</div><div>${formatHours(ficha.formData.des_montg)}</div></div>
                <div class="equipment-row"><div>Tratamento</div><div>${formatHours(ficha.formData.tratamento)}</div></div>
                <div class="equipment-row" style="border-top: 2px solid #e5e7eb; margin-top: 4px; padding-top: 4px;"><div><strong>Total Horas</strong></div><div><strong>${ficha.calculos.horasTodasPecas || 0}h</strong></div></div>
            </div>
        </div>
    </div>

    ${materiaisComPrecos.length > 0 ? `
    <div class="info-section">
        <div class="section-title">Materiais Orçados</div>

        <table class="materials-table">
            <thead>
                <tr>
                    <th style="width: 40%">Descrição</th>
                    <th style="width: 15%">Qtd</th>
                    <th style="width: 20%">Valor Unit.</th>
                    <th style="width: 20%">Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${materiaisComPrecos.map(material => `
                <tr>
                    <td>${material.descricao}</td>
                    <td>${material.quantidade}</td>
                    <td>${formatCurrency(parseFloat(material.valor_unitario))}</td>
                    <td><strong>${formatCurrency(parseFloat(material.valor_total))}</strong></td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        ${totalMateriais > 0 ? `
        <div class="total-section">
            <div class="total-label">Total dos Materiais</div>
            <div class="total-value">${formatCurrency(totalMateriais)}</div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <!-- Controle e Resumo -->
    <div class="info-grid">
        <div class="info-section">
            <div class="section-title">Controle do Processo</div>
            <div class="field-group">
                <div class="field-label">Status</div>
                <div class="field-value">${ficha.status ? ficha.status.replace('_', ' ').toUpperCase() : '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Número Orçamento</div>
                <div class="field-value">${ficha.formData.num_orcamento || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Número OS</div>
                <div class="field-value">${ficha.formData.num_os || '—'}</div>
            </div>
            <div class="field-group">
                <div class="field-label">Número NF Remessa</div>
                <div class="field-value">${ficha.formData.num_nf_remessa || '—'}</div>
            </div>
        </div>

        <div class="info-section">
            <div class="section-title">Resumo Financeiro</div>
            <div class="field-group">
                <div class="field-label">Total Horas de Serviço</div>
                <div class="field-value"><strong>${ficha.calculos.horasTodasPecas || 0}h</strong></div>
            </div>
            <div class="field-group">
                <div class="field-label">Total Materiais</div>
                <div class="field-value"><strong>${formatCurrency(ficha.calculos.materialTodasPecas || 0)}</strong></div>
            </div>
            <div class="field-group">
                <div class="field-label">Valor Orçamento</div>
                <div class="field-value">${ficha.formData.valor_orcamento ? formatCurrency(parseFloat(ficha.formData.valor_orcamento)) : '—'}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Documento gerado automaticamente pelo Sistema de Fichas Técnicas HMC</strong></p>
        <p>Data de geração: ${new Date().toLocaleString('pt-BR')} • FTC: ${ficha.numeroFTC}</p>
        ${ficha.dataUltimaEdicao ? `<p>Última edição: ${new Date(ficha.dataUltimaEdicao).toLocaleString('pt-BR')}</p>` : ''}
    </div>
</body>
</html>`;
}

export function downloadHTML(ficha: FichaSalva): void {
  const htmlContent = generateHTMLContent(ficha);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `FTC_${ficha.numeroFTC}_${ficha.formData.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'ficha'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openHTMLInNewWindow(ficha: FichaSalva): void {
  const htmlContent = generateHTMLContent(ficha);
  const newWindow = window.open('', '_blank');

  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
}