import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './helpers';
import { getPhotosWithUrls, generatePhotoGalleryHTML, getPhotoGalleryCSS } from './photoHelpers';

export async function generateHTMLContent(ficha: FichaSalva): Promise<string> {
  // Load photos with signed URLs
  const photosWithUrls = await getPhotosWithUrls(ficha.fotos || []);
  const photoGalleryHTML = generatePhotoGalleryHTML(photosWithUrls);
  const photoGalleryCSS = getPhotoGalleryCSS();

  return generateHTMLContentSync(ficha, photoGalleryHTML, photoGalleryCSS);
}

export function generateHTMLContentSync(ficha: FichaSalva, photoGalleryHTML: string = '', photoGalleryCSS: string = ''): string {
  const formatRadioValue = (value: string | boolean) => {
    if (!value || value === '') return '—';
    const stringValue = String(value).toLowerCase();
    if (stringValue === 'sim' || stringValue === 'true') return '✓ Sim';
    if (stringValue === 'nao' || stringValue === 'não' || stringValue === 'false') return '✗ Não';
    return String(value);
  };

  const formatHours = (value: string) => {
    if (!value || value === '' || value === '0') return '—';
    return `${value}h`;
  };

  const formatValue = (value: any) => {
    if (!value || value === '') return '—';
    return String(value);
  };

  const materiaisComPrecos = ficha.materiais.filter(m =>
    m.descricao && parseFloat(m.valor_total || '0') > 0
  );

  const totalMateriais = materiaisComPrecos.reduce((sum, material) =>
    sum + parseFloat(material.valor_total || '0'), 0
  );

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FTC ${ficha.numeroFTC} - ${ficha.formData.cliente}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.4;
            color: #000000;
            background: #ffffff;
            max-width: 900px;
            margin: 0 auto;
            padding: 16px;
        }

        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #e1e5e9;
            margin-bottom: 24px;
        }

        .header h1 {
            font-size: 1.75rem;
            font-weight: 300;
            color: #000000;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
        }

        .header .subtitle {
            color: #000000;
            font-size: 0.95rem;
            font-weight: 400;
        }

        .section {
            margin-bottom: 32px;
        }

        .section-title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #000000;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #ecf0f1;
            position: relative;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 40px;
            height: 1px;
            background: #3498db;
        }

        .field-row {
            display: flex;
            padding: 6px 0;
            border-bottom: 1px solid #f8f9fa;
            align-items: center;
        }

        .field-row:hover {
            background: #f8f9fa;
        }

        .field-label {
            flex: 0 0 160px;
            font-size: 0.85rem;
            font-weight: 500;
            color: #000000;
            margin-right: 16px;
        }

        .field-value {
            flex: 1;
            font-size: 0.9rem;
            color: #000000;
            word-wrap: break-word;
        }

        .horizontal-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 8px;
        }

        .horizontal-field {
            display: flex;
            align-items: center;
            flex: 0 0 auto;
            min-width: 180px;
        }

        .horizontal-field .field-label {
            flex: 0 0 auto;
            margin-right: 8px;
            font-size: 0.8rem;
            min-width: 80px;
            color: #000000;
        }

        .horizontal-field .field-value {
            flex: 1;
            font-size: 0.85rem;
            color: #000000;
        }

        .field-value.empty {
            color: #bdc3c7;
            font-style: italic;
        }

        .section-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .section-fields .field-row {
            flex: 1 1 calc(50% - 4px);
            min-width: 200px;
            margin-bottom: 0;
            border-bottom: none;
            padding: 4px 8px;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .section-fields .field-row .field-label {
            flex: 0 0 auto;
            font-size: 0.75rem;
            margin-right: 8px;
            min-width: 80px;
            color: #000000;
        }

        .section-fields .field-row .field-value {
            font-size: 0.8rem;
            color: #000000;
        }

        .hours-section-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .hours-section-fields .field-row {
            flex: 1 1 calc(25% - 4.5px);
            min-width: 150px;
            margin-bottom: 0;
            border-bottom: none;
            padding: 4px 8px;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .hours-section-fields .field-row .field-label {
            flex: 0 0 auto;
            font-size: 0.7rem;
            margin-right: 6px;
            min-width: 60px;
            color: #000000;
        }

        .hours-section-fields .field-row .field-value {
            font-size: 0.75rem;
            color: #000000;
        }

        .field-value.highlight {
            font-weight: 600;
            color: #000000;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 24px;
        }

        .three-column {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
        }

        .hours-container {
            background: #f8f9fa;
            border-radius: 4px;
            padding: 16px;
            margin-top: 8px;
        }

        .hours-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px;
        }

        .hour-line {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            border-radius: 3px;
            background: white;
            border-left: 2px solid #3498db;
        }

        .hour-label {
            font-size: 0.8rem;
            color: #000000;
        }

        .hour-value {
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
        }

        .materials-section {
            background: white;
            border-radius: 4px;
            border: 1px solid #ecf0f1;
            overflow: hidden;
        }

        .materials-table {
            width: 100%;
            border-collapse: collapse;
        }

        .materials-table th {
            background: #f1f2f6;
            padding: 8px 12px;
            text-align: left;
            font-weight: 500;
            color: #000000;
            font-size: 0.8rem;
            border-bottom: 1px solid #ddd;
        }

        .materials-table td {
            padding: 6px 12px;
            font-size: 0.8rem;
            color: #000000;
            border-bottom: 1px solid #f8f9fa;
        }

        .materials-table tr:nth-child(even) {
            background: #fdfdfd;
        }

        .summary-section {
            background: #f8f9fa;
            color: #000000;
            border-radius: 4px;
            padding: 20px;
            margin-top: 24px;
            border: 1px solid #dee2e6;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-top: 12px;
        }

        .summary-item {
            text-align: center;
            padding: 12px;
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }

        .summary-label {
            font-size: 0.75rem;
            color: #000000;
            margin-bottom: 4px;
        }

        .summary-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            background: #e8f5e8;
            color: #2d8632;
        }

        .radio-inline {
            display: inline-flex;
            gap: 12px;
        }

        .radio-option {
            font-size: 0.8rem;
            padding: 2px 6px;
            border-radius: 3px;
            background: #f8f9fa;
            color: #000000;
        }

        .radio-option.active {
            background: #d4edda;
            color: #000000;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e1e5e9;
            color: #000000;
            font-size: 0.8rem;
        }

        @media (max-width: 640px) {
            .two-column, .three-column {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .horizontal-fields {
                flex-direction: column;
                gap: 8px;
            }

            .horizontal-field {
                min-width: 100%;
                flex-direction: column;
                align-items: flex-start;
            }

            .horizontal-field .field-label {
                margin-right: 0;
                margin-bottom: 4px;
                min-width: auto;
            }

            .hours-section-fields {
                flex-direction: column;
                gap: 8px;
            }

            .hours-section-fields .field-row {
                min-width: 100%;
                flex: 1 1 100%;
            }
        }

        @media (min-width: 641px) {
            .two-column {
                grid-template-columns: 1fr 1fr;
                gap: 32px;
            }
        }

            .field-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }

            .field-label {
                flex: none;
                margin-right: 0;
            }

            .hours-grid {
                grid-template-columns: 1fr;
            }
        }

        @media print {
            body {
                background: white;
                padding: 0;
                max-width: none;
                color: #000000 !important;
            }

            .summary-section {
                background: #f5f5f5 !important;
                color: #000000 !important;
            }

            .summary-item {
                background: #ffffff !important;
                color: #000000 !important;
            }

            * {
                color: #000000 !important;
            }

            .section {
                page-break-inside: avoid;
            }
        }

        ${photoGalleryCSS}
    </style>
</head>
<body>
    <div class="header">
        <h1>FICHA TÉCNICA DE COTAÇÃO</h1>
        <div class="subtitle">FTC Nº ${ficha.numeroFTC} • ${new Date(ficha.dataCriacao).toLocaleDateString('pt-BR')}</div>
    </div>

    <!-- Dados do Cliente -->
    <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="horizontal-fields">
            <div class="horizontal-field">
                <div class="field-label">Cliente</div>
                <div class="field-value highlight">${formatValue(ficha.formData.cliente)}</div>
            </div>
            <div class="horizontal-field">
                <div class="field-label">Solicitante</div>
                <div class="field-value">${formatValue(ficha.formData.solicitante)}</div>
            </div>
            <div class="horizontal-field">
                <div class="field-label">Fone/Email</div>
                <div class="field-value">${formatValue(ficha.formData.fone_email)}</div>
            </div>
            <div class="horizontal-field">
                <div class="field-label">Data Visita</div>
                <div class="field-value">${formatValue(ficha.formData.data_visita)}</div>
            </div>
            <div class="horizontal-field">
                <div class="field-label">Data Entrega</div>
                <div class="field-value">${formatValue(ficha.formData.data_entrega)}</div>
            </div>
        </div>
    </div>

    <!-- Peça/Equipamento -->
    <div class="section">
        <div class="section-title">Peça/Equipamento</div>
        <div class="horizontal-fields">
            <div class="horizontal-field">
                <div class="field-label">Nome da Peça</div>
                <div class="field-value highlight">${formatValue(ficha.formData.nome_peca)}</div>
            </div>
            <div class="horizontal-field">
                <div class="field-label">Quantidade</div>
                <div class="field-value">${formatValue(ficha.formData.quantidade)}</div>
            </div>
        </div>
        <div class="field-row">
            <div class="field-label">Serviço</div>
            <div class="field-value">${formatValue(ficha.formData.servico)}</div>
        </div>
    </div>

    <div class="three-column">
        <!-- Execução -->
        <div class="section">
            <div class="section-title">Execução</div>
            <div class="section-fields">
                <div class="field-row">
                    <div class="field-label">Executado em</div>
                    <div class="field-value">
                        <div class="radio-inline">
                            <span class="radio-option ${ficha.formData.execucao === 'HMC' ? 'active' : ''}">HMC</span>
                            <span class="radio-option ${ficha.formData.execucao === 'CLIENTE' ? 'active' : ''}">Cliente</span>
                        </div>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field-label">Visita Técnica</div>
                    <div class="field-value">
                        <div class="radio-inline">
                            <span class="radio-option ${ficha.formData.visita_tecnica === 'SIM' ? 'active' : ''}">Sim</span>
                            <span class="radio-option ${ficha.formData.visita_tecnica === 'NAO' ? 'active' : ''}">Não</span>
                        </div>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field-label">Horas Visita</div>
                    <div class="field-value">${formatHours(ficha.formData.visita_horas)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Peça Amostra</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.tem_peca_amostra)}</div>
                </div>
            </div>
        </div>

        <!-- Projeto e Desenho -->
        <div class="section">
            <div class="section-title">Projeto e Desenho</div>
            <div class="section-fields">
                <div class="field-row">
                    <div class="field-label">Projeto por</div>
                    <div class="field-value">${formatValue(ficha.formData.projeto_desenvolvido_por)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Desenho Peça</div>
                    <div class="field-value">${formatValue(ficha.formData.desenho_peca)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Finalizado</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.desenho_finalizado)}</div>
                </div>
            </div>
        </div>

        <!-- Transporte -->
        <div class="section">
            <div class="section-title">Transporte</div>
            <div class="section-fields">
                <div class="field-row">
                    <div class="field-label">Caminhão HMC</div>
                    <div class="field-value">${ficha.formData.transporte_caminhao_hmc ? '✓' : '✗'}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Pickup HMC</div>
                    <div class="field-value">${ficha.formData.transporte_pickup_hmc ? '✓' : '✗'}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Cliente</div>
                    <div class="field-value">${ficha.formData.transporte_cliente ? '✓' : '✗'}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="two-column">
        <!-- Tratamentos -->
        <div class="section">
            <div class="section-title">Tratamentos</div>
            <div class="section-fields">
                <div class="field-row">
                    <div class="field-label">Pintura</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.pintura)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Cor Pintura</div>
                    <div class="field-value">${formatValue(ficha.formData.cor_pintura)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Galvanização</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.galvanizacao)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Peso Galv.</div>
                    <div class="field-value">${formatValue(ficha.formData.peso_peca_galv)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Trat. Térmico</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.tratamento_termico)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Peso Trat.</div>
                    <div class="field-value">${formatValue(ficha.formData.peso_peca_trat)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Têmpera/Rev.</div>
                    <div class="field-value">${formatValue(ficha.formData.tempera_reven)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Cementação</div>
                    <div class="field-value">${formatValue(ficha.formData.cementacao)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Dureza</div>
                    <div class="field-value">${formatValue(ficha.formData.dureza)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Teste LP</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.teste_lp)}</div>
                </div>
            </div>
        </div>

        <!-- Serviços Especiais -->
        <div class="section">
            <div class="section-title">Serviços Especiais</div>
            <div class="section-fields">
                <div class="field-row">
                    <div class="field-label">Balanc. Campo</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.balanceamento_campo)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Rotação</div>
                    <div class="field-value">${ficha.formData.rotacao ? `${ficha.formData.rotacao} RPM` : '—'}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Fornec. Desenho</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.fornecimento_desenho)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Fotos/Relatório</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.fotos_relatorio)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Rel. Técnico</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.relatorio_tecnico)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Emissão ART</div>
                    <div class="field-value">${formatRadioValue(ficha.formData.emissao_art)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Serv. Terc.</div>
                    <div class="field-value">${formatValue(ficha.formData.servicos_terceirizados)}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Horas de Serviço -->
    <div class="section">
        <div class="section-title">Horas de Serviço por Equipamento</div>
        <div class="hours-section-fields">
            <div class="field-row">
                <div class="field-label">Torno Grande</div>
                <div class="field-value">${formatHours(ficha.formData.torno_grande)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Torno Pequeno</div>
                <div class="field-value">${formatHours(ficha.formData.torno_pequeno)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">CNC/TF</div>
                <div class="field-value">${formatHours(ficha.formData.cnc_tf)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Fresa/Furad</div>
                <div class="field-value">${formatHours(ficha.formData.fresa_furad)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Plasma/Oxicorte</div>
                <div class="field-value">${formatHours(ficha.formData.plasma_oxicorte)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Dobra</div>
                <div class="field-value">${formatHours(ficha.formData.dobra)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Calandra</div>
                <div class="field-value">${formatHours(ficha.formData.calandra)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Maçarico/Solda</div>
                <div class="field-value">${formatHours(ficha.formData.macarico_solda)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Des/Montagem</div>
                <div class="field-value">${formatHours(ficha.formData.des_montg)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Balanceamento</div>
                <div class="field-value">${formatHours(ficha.formData.balanceamento)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Mandrilhamento</div>
                <div class="field-value">${formatHours(ficha.formData.mandrilhamento)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Tratamento</div>
                <div class="field-value">${formatHours(ficha.formData.tratamento)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Pintura</div>
                <div class="field-value">${formatHours(ficha.formData.pintura_horas)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Lavagem/Acab</div>
                <div class="field-value">${formatHours(ficha.formData.lavagem_acab)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Prog. CAM</div>
                <div class="field-value">${formatHours(ficha.formData.programacao_cam)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Eng. Técnica</div>
                <div class="field-value">${formatHours(ficha.formData.eng_tec)}</div>
            </div>
        </div>
    </div>

    ${materiaisComPrecos.length > 0 ? `
    <!-- Materiais -->
    <div class="section">
        <div class="section-title">Materiais para Cotação</div>
        <div class="materials-section">
            <table class="materials-table">
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
                    ${materiaisComPrecos.map(material => `
                    <tr>
                        <td>${material.descricao}</td>
                        <td>${material.quantidade}</td>
                        <td>${material.fornecedor || '—'}</td>
                        <td>${material.cliente_interno || '—'}</td>
                        <td>${material.valor_unitario ? formatCurrency(parseFloat(material.valor_unitario)) : '—'}</td>
                        <td><strong>${formatCurrency(parseFloat(material.valor_total))}</strong></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${photoGalleryHTML}

    <!-- Controle -->
    <div class="section">
        <div class="section-title">Controle do Processo</div>
        <div class="three-column">
            <div class="field-row">
                <div class="field-label">Nº Orçamento</div>
                <div class="field-value">${formatValue(ficha.formData.num_orcamento)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Nº OS</div>
                <div class="field-value">${formatValue(ficha.formData.num_os)}</div>
            </div>
            <div class="field-row">
                <div class="field-label">Nº NF Remessa</div>
                <div class="field-value">${formatValue(ficha.formData.num_nf_remessa)}</div>
            </div>
        </div>
        <div class="field-row">
            <div class="field-label">Status</div>
            <div class="field-value"><span class="status-badge">${ficha.status ? ficha.status.replace('_', ' ').toUpperCase() : '—'}</span></div>
        </div>
    </div>

    <!-- Resumo -->
    <div class="summary-section">
        <div class="section-title" style="color: white; border-bottom-color: rgba(255,255,255,0.3);">Resumo dos Cálculos</div>
        <div class="summary-grid summary-grid-2">
            <div class="summary-item">
                <div class="summary-label">Horas Total</div>
                <div class="summary-value">${ficha.calculos.horasTodasPecas.toFixed(1)}h</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Material Total</div>
                <div class="summary-value">${formatCurrency(ficha.calculos.materialTodasPecas)}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Sistema de Fichas Técnicas HMC</strong></p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')} • FTC: ${ficha.numeroFTC}</p>
        ${ficha.dataUltimaEdicao ? `<p>Editado: ${new Date(ficha.dataUltimaEdicao).toLocaleString('pt-BR')}</p>` : ''}
    </div>
</body>
</html>`;
}

export async function downloadHTML(ficha: FichaSalva): Promise<void> {
  const htmlContent = await generateHTMLContent(ficha);
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

export async function openHTMLInNewWindow(ficha: FichaSalva): Promise<void> {
  const htmlContent = await generateHTMLContent(ficha);
  const newWindow = window.open('', '_blank');

  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
}