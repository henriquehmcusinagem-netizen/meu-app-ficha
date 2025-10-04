import { FichaSalva } from '@/types/ficha-tecnica';
import { formatCurrency } from './helpers';
import { getPhotosWithUrls, getPhotoGalleryCSS } from './photoHelpers';

/**
 * Generates HTML with EXACT layout from FichaTecnicaForm
 * Optimized for printing in max 2 pages
 */
export async function generateCompactHTMLContent(ficha: FichaSalva): Promise<string> {
  // Load photos with signed URLs
  const photosWithUrls = await getPhotosWithUrls(ficha.fotos || []);
  const photoGalleryCSS = getPhotoGalleryCSS();

  const formatRadio = (value: any): string => {
    if (!value || value === '') return '—';
    const str = String(value).toUpperCase();
    if (str === 'SIM' || str === 'TRUE') return '✓ Sim';
    if (str === 'NAO' || str === 'NÃO' || str === 'FALSE') return '✗ Não';
    return String(value);
  };

  const formatHours = (value: any): string => {
    if (!value || value === '' || value === '0') return '0h';
    return `${value}h`;
  };

  const formatValue = (value: any): string => {
    if (!value || value === '') return '—';
    return String(value);
  };

  const formatPriority = (value: any): string => {
    if (!value || value === '') return '—';
    const priority = String(value);
    const colors: { [key: string]: string } = {
      'Baixa': '#10b981',      // green
      'Normal': '#3b82f6',     // blue
      'Alta': '#f59e0b',       // orange
      'Emergência': '#ef4444'  // red
    };
    const color = colors[priority] || '#6b7280';
    const icons: { [key: string]: string } = {
      'Baixa': '↓',
      'Normal': '→',
      'Alta': '↑',
      'Emergência': '⚠️'
    };
    const icon = icons[priority] || '';
    return `<span style="color: ${color}; font-weight: 600;">${icon} ${priority}</span>`;
  };

  const materiaisComPrecos = ficha.materiais.filter(m =>
    m.descricao && parseFloat(m.valor_total || '0') > 0
  );

  // Photo gallery HTML
  const photoGalleryHTML = photosWithUrls.length > 0 ? `
    <div class="section-card">
      <div class="section-title">📸 FOTOS DO PROJETO (${photosWithUrls.length})</div>
      <div class="photo-grid">
        ${photosWithUrls.map((foto, index) => `
          <div class="photo-item" onclick="openPhotoModal(${index})">
            <img src="${foto.url}" alt="${foto.name}" loading="lazy">
            <div class="photo-name">${foto.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Modal de Fotos -->
    <div id="photoModal" class="photo-modal" onclick="closePhotoModalOnBackdrop(event)">
      <button class="modal-close" onclick="closePhotoModal()">&times;</button>

      ${photosWithUrls.length > 1 ? `
        <button class="modal-nav modal-nav-prev" onclick="changePhoto(-1)">‹</button>
        <button class="modal-nav modal-nav-next" onclick="changePhoto(1)">›</button>
      ` : ''}

      <div class="modal-content">
        ${photosWithUrls.map((foto, index) => `
          <div class="modal-photo" id="modal-photo-${index}" style="display: ${index === 0 ? 'flex' : 'none'};">
            <img src="${foto.url}" alt="${foto.name}">
            <div class="modal-photo-info">
              <div class="modal-photo-name">${foto.name}</div>
              <div class="modal-photo-actions">
                <button onclick="downloadModalPhoto('${foto.url}', '${foto.name}')" class="modal-btn">
                  📥 Baixar
                </button>
                <button onclick="printModalPhoto('${foto.url}', '${foto.name}')" class="modal-btn">
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${photosWithUrls.length > 1 ? `
        <div class="modal-counter">
          <span id="currentPhotoIndex">1</span> / ${photosWithUrls.length}
        </div>
      ` : ''}
    </div>
  ` : '';

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.3;
            color: #000;
            background: #fff;
            padding: 8mm;
            font-size: 10pt;
        }

        .header {
            text-align: center;
            padding: 8px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .header .subtitle {
            font-size: 12pt;
            font-weight: 600;
        }

        .header .status-badge {
            display: inline-block;
            padding: 2px 8px;
            margin-left: 8px;
            border-radius: 10px;
            font-size: 8pt;
            background: #d4edda;
            color: #155724;
        }

        .section-card {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 6px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        .field-grid {
            display: grid;
            gap: 4px;
        }

        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .grid-6 { grid-template-columns: repeat(6, 1fr); }

        .field {
            display: flex;
            flex-direction: column;
        }

        .field-label {
            font-size: 7pt;
            font-weight: 600;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }

        .field-value {
            font-size: 9pt;
            color: #000;
            padding: 3px 4px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 2px;
            min-height: 20px;
        }

        .field-value.highlight {
            font-weight: 600;
            background: #e7f1ff;
            border-color: #b6d4fe;
        }

        /* Materials Table */
        .materials-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-top: 4px;
        }

        .materials-table th {
            background: #e9ecef;
            padding: 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #dee2e6;
        }

        .materials-table td {
            padding: 3px 4px;
            border: 1px solid #dee2e6;
        }

        .materials-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        /* Hours Grid - Super Compact */
        .hours-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
            font-size: 8pt;
        }

        .hour-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 4px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 2px;
        }

        .hour-label {
            font-weight: 600;
            color: #495057;
        }

        .hour-value {
            font-weight: 700;
            color: #000;
        }

        /* Summary Box */
        .summary-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-top: 6px;
        }

        .summary-item {
            background: #0d6efd;
            color: white;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
        }

        .summary-label {
            font-size: 8pt;
            opacity: 0.9;
            margin-bottom: 2px;
        }

        .summary-value {
            font-size: 14pt;
            font-weight: 700;
        }

        /* Photo Grid */
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-top: 6px;
        }

        .photo-item {
            aspect-ratio: 1;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            position: relative;
            background: #f8f9fa;
        }

        .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .photo-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .photo-name {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            color: white;
            font-size: 7pt;
            padding: 4px 2px 2px;
            text-align: center;
        }

        ${photoGalleryCSS}

        @media print {
            body {
                padding: 5mm;
                font-size: 9pt;
            }

            .header {
                background: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .section-card {
                border: 1px solid #ccc !important;
                page-break-inside: avoid;
                margin-bottom: 4px;
            }

            .field-value {
                background: #f5f5f5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .summary-item {
                background: #333 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .photo-modal {
                display: none !important;
            }

            .photo-grid {
                grid-template-columns: repeat(3, 1fr);
            }

            @page {
                size: A4;
                margin: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 FICHA TÉCNICA DE COTAÇÃO - HMC USINAGEM</h1>
        <div class="subtitle">
            FTC Nº ${ficha.numeroFTC}
            <span class="status-badge">SALVO</span>
        </div>
    </div>

    <!-- DADOS DO CLIENTE -->
    <div class="section-card">
        <div class="section-title">👤 DADOS DO CLIENTE</div>
        <div class="field-grid grid-4">
            <div class="field" style="grid-column: span 2;">
                <div class="field-label">Cliente</div>
                <div class="field-value highlight">${formatValue(ficha.formData.cliente)}</div>
            </div>
            <div class="field">
                <div class="field-label">Solicitante</div>
                <div class="field-value">${formatValue(ficha.formData.solicitante)}</div>
            </div>
            <div class="field">
                <div class="field-label">Fone/Email</div>
                <div class="field-value">${formatValue(ficha.formData.fone_email)}</div>
            </div>
            <div class="field">
                <div class="field-label">Data Visita</div>
                <div class="field-value">${formatValue(ficha.formData.data_visita)}</div>
            </div>
            <div class="field">
                <div class="field-label">Data Entrega</div>
                <div class="field-value">${formatValue(ficha.formData.data_entrega)}</div>
            </div>
            <div class="field">
                <div class="field-label">Prioridade</div>
                <div class="field-value">${formatPriority(ficha.formData.prioridade)}</div>
            </div>
        </div>
    </div>

    <!-- PEÇA/EQUIPAMENTO -->
    <div class="section-card">
        <div class="section-title">⚙️ DADOS DA PEÇA/EQUIPAMENTO</div>
        <div class="field-grid grid-4">
            <div class="field" style="grid-column: span 3;">
                <div class="field-label">Nome da Peça/Equipamento</div>
                <div class="field-value highlight">${formatValue(ficha.formData.nome_peca)}</div>
            </div>
            <div class="field">
                <div class="field-label">Quantidade</div>
                <div class="field-value">${formatValue(ficha.formData.quantidade)}</div>
            </div>
        </div>
        <div class="field" style="margin-top: 4px;">
            <div class="field-label">Serviço a ser Realizado</div>
            <div class="field-value">${formatValue(ficha.formData.servico)}</div>
        </div>
    </div>

    <!-- 🔩 PEÇAS E AMOSTRAS -->
    <div class="section-card">
        <div class="section-title">🔩 PEÇAS E AMOSTRAS</div>
        <div class="field-grid grid-4">
            <div class="field">
                <div class="field-label">Cliente forneceu peça amostra</div>
                <div class="field-value">${formatRadio(ficha.formData.tem_peca_amostra)}</div>
            </div>
            <div class="field">
                <div class="field-label">Peça foi desmontada</div>
                <div class="field-value">${formatRadio(ficha.formData.peca_foi_desmontada)}</div>
            </div>
            <div class="field">
                <div class="field-label">Condição da peça</div>
                <div class="field-value">${formatValue(ficha.formData.peca_condicao) || 'Nova'}</div>
            </div>
            <div class="field">
                <div class="field-label">Precisa peça de teste</div>
                <div class="field-value">${formatRadio(ficha.formData.precisa_peca_teste)}</div>
            </div>
        </div>
        <div class="field" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <div class="field-label">Responsável Técnico</div>
            <div class="field-value" style="font-weight: 600; color: #3b82f6;">${formatValue(ficha.formData.responsavel_tecnico)}</div>
        </div>
    </div>

    ${photoGalleryHTML}

    <!-- MATERIAIS -->
    ${materiaisComPrecos.length > 0 ? `
    <div class="section-card">
        <div class="section-title">📦 MATERIAL PARA COTAÇÃO</div>
        <table class="materials-table">
            <thead>
                <tr>
                    <th style="width: 8%;">QTD</th>
                    <th style="width: 30%;">MATERIAL</th>
                    <th style="width: 12%;">PREÇO UNIT</th>
                    <th style="width: 20%;">FORNECEDOR</th>
                    <th style="width: 15%;">CLIENTE INT</th>
                    <th style="width: 15%;">VALOR TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${materiaisComPrecos.map(m => `
                    <tr>
                        <td>${m.quantidade}</td>
                        <td>${m.descricao}</td>
                        <td>${m.valor_unitario ? formatCurrency(parseFloat(m.valor_unitario)) : '—'}</td>
                        <td>${m.fornecedor || '—'}</td>
                        <td>${m.cliente_interno || '—'}</td>
                        <td><strong>${formatCurrency(parseFloat(m.valor_total))}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <!-- EXECUÇÃO E DETALHES -->
    <div class="section-card">
        <div class="section-title">🔧 EXECUÇÃO E DETALHES</div>
        <div class="field-grid grid-6">
            <div class="field">
                <div class="field-label">Execução</div>
                <div class="field-value">${formatValue(ficha.formData.execucao)}</div>
            </div>
            <div class="field">
                <div class="field-label">Visita Técnica</div>
                <div class="field-value">${formatRadio(ficha.formData.visita_tecnica)}</div>
            </div>
            <div class="field">
                <div class="field-label">Horas Visita</div>
                <div class="field-value">${formatHours(ficha.formData.visita_horas)}</div>
            </div>
            <div class="field">
                <div class="field-label">Peça Amostra</div>
                <div class="field-value">${formatRadio(ficha.formData.tem_peca_amostra)}</div>
            </div>
            <div class="field">
                <div class="field-label">Projeto por</div>
                <div class="field-value">${formatValue(ficha.formData.projeto_desenvolvido_por)}</div>
            </div>
            <div class="field">
                <div class="field-label">Desenho</div>
                <div class="field-value">${formatValue(ficha.formData.desenho_peca)}</div>
            </div>
        </div>
        <div class="field-grid grid-3" style="margin-top: 4px;">
            <div class="field">
                <div class="field-label">Finalizado</div>
                <div class="field-value">${formatRadio(ficha.formData.desenho_finalizado)}</div>
            </div>
            <div class="field">
                <div class="field-label">🚛 Transporte</div>
                <div class="field-value">
                    ${ficha.formData.transporte_caminhao_hmc ? '✓ Caminhão ' : ''}
                    ${ficha.formData.transporte_pickup_hmc ? '✓ Pickup ' : ''}
                    ${ficha.formData.transporte_cliente ? '✓ Cliente' : ''}
                </div>
            </div>
        </div>
    </div>

    <!-- TRATAMENTOS E ACABAMENTOS -->
    <div class="section-card">
        <div class="section-title">🎨 TRATAMENTOS E ACABAMENTOS</div>
        <div class="field-grid grid-3">
            <div class="field">
                <div class="field-label">Pintura</div>
                <div class="field-value">${formatRadio(ficha.formData.pintura)}</div>
            </div>
            <div class="field">
                <div class="field-label">Cor Pintura</div>
                <div class="field-value">${formatValue(ficha.formData.cor_pintura)}</div>
            </div>
            <div class="field">
                <div class="field-label">Galvanização</div>
                <div class="field-value">${formatRadio(ficha.formData.galvanizacao)}</div>
            </div>
            <div class="field">
                <div class="field-label">Peso Galv</div>
                <div class="field-value">${formatValue(ficha.formData.peso_peca_galv)}</div>
            </div>
            <div class="field">
                <div class="field-label">Trat. Térmico</div>
                <div class="field-value">${formatRadio(ficha.formData.tratamento_termico)}</div>
            </div>
            <div class="field">
                <div class="field-label">Peso Trat</div>
                <div class="field-value">${formatValue(ficha.formData.peso_peca_trat)}</div>
            </div>
            <div class="field">
                <div class="field-label">Têmpera/Rev</div>
                <div class="field-value">${formatValue(ficha.formData.tempera_reven)}</div>
            </div>
            <div class="field">
                <div class="field-label">Cementação</div>
                <div class="field-value">${formatValue(ficha.formData.cementacao)}</div>
            </div>
            <div class="field">
                <div class="field-label">Dureza</div>
                <div class="field-value">${formatValue(ficha.formData.dureza)}</div>
            </div>
            <div class="field">
                <div class="field-label">Teste LP</div>
                <div class="field-value">${formatRadio(ficha.formData.teste_lp)}</div>
            </div>
            <div class="field">
                <div class="field-label">⚖️ Balanceamento</div>
                <div class="field-value">${formatRadio(ficha.formData.balanceamento_campo)}</div>
            </div>
            ${ficha.formData.balanceamento_campo === 'SIM' ? `
            <div class="field">
                <div class="field-label">Rotação (RPM)</div>
                <div class="field-value">${formatValue(ficha.formData.rotacao)}</div>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- SERVIÇOS ESPECIAIS -->
    <div class="section-card">
        <div class="section-title">⚡ SERVIÇOS ESPECIAIS</div>
        <div class="field-grid grid-2">
            <div class="field">
                <div class="field-label">Fornecimento Desenho</div>
                <div class="field-value">${formatRadio(ficha.formData.fornecimento_desenho)}</div>
            </div>
            <div class="field">
                <div class="field-label">Fotos/Relatório</div>
                <div class="field-value">${formatRadio(ficha.formData.fotos_relatorio)}</div>
            </div>
            <div class="field">
                <div class="field-label">Relatório Técnico</div>
                <div class="field-value">${formatRadio(ficha.formData.relatorio_tecnico)}</div>
            </div>
            <div class="field">
                <div class="field-label">Emissão ART</div>
                <div class="field-value">${formatRadio(ficha.formData.emissao_art)}</div>
            </div>
        </div>
    </div>

    <!-- HORAS DE PRODUÇÃO - 4 Grupos Reorganizados -->
    <div class="section-card">
        <div class="section-title">⏱️ HORAS DE PRODUÇÃO</div>

        <!-- 🔧 GRUPO 1: TORNOS E USINAGEM -->
        <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #e0e0e0;">🔧 Tornos e Usinagem</div>
            <div class="hours-grid">
                <div class="hour-item"><span class="hour-label">Torno 1200mm:</span><span class="hour-value">${formatHours(ficha.formData.torno_grande)}</span></div>
                <div class="hour-item"><span class="hour-label">Torno 650mm:</span><span class="hour-value">${formatHours(ficha.formData.torno_pequeno)}</span></div>
                <div class="hour-item"><span class="hour-label">Torno CNC:</span><span class="hour-value">${formatHours(ficha.formData.torno_cnc)}</span></div>
                <div class="hour-item"><span class="hour-label">Centro Usinagem:</span><span class="hour-value">${formatHours(ficha.formData.centro_usinagem)}</span></div>
                <div class="hour-item"><span class="hour-label">Fresa:</span><span class="hour-value">${formatHours(ficha.formData.fresa)}</span></div>
                <div class="hour-item"><span class="hour-label">Furadeira:</span><span class="hour-value">${formatHours(ficha.formData.furadeira)}</span></div>
            </div>
        </div>

        <!-- ⚙️ GRUPO 2: CORTE E CONFORMAÇÃO -->
        <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #e0e0e0;">⚙️ Corte e Conformação</div>
            <div class="hours-grid">
                <div class="hour-item"><span class="hour-label">Plasma/Oxicorte:</span><span class="hour-value">${formatHours(ficha.formData.plasma_oxicorte)}</span></div>
                <div class="hour-item"><span class="hour-label">Maçarico:</span><span class="hour-value">${formatHours(ficha.formData.macarico)}</span></div>
                <div class="hour-item"><span class="hour-label">Solda:</span><span class="hour-value">${formatHours(ficha.formData.solda)}</span></div>
                <div class="hour-item"><span class="hour-label">Serra:</span><span class="hour-value">${formatHours(ficha.formData.serra)}</span></div>
                <div class="hour-item"><span class="hour-label">Dobra:</span><span class="hour-value">${formatHours(ficha.formData.dobra)}</span></div>
                <div class="hour-item"><span class="hour-label">Calandra:</span><span class="hour-value">${formatHours(ficha.formData.calandra)}</span></div>
                <div class="hour-item"><span class="hour-label">Caldeiraria:</span><span class="hour-value">${formatHours(ficha.formData.caldeiraria)}</span></div>
            </div>
        </div>

        <!-- 🔩 GRUPO 3: MONTAGEM E ESPECIAIS -->
        <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #e0e0e0;">🔩 Montagem e Especiais</div>
            <div class="hours-grid">
                <div class="hour-item"><span class="hour-label">Desmontagem:</span><span class="hour-value">${formatHours(ficha.formData.des_montg)}</span></div>
                <div class="hour-item"><span class="hour-label">Montagem:</span><span class="hour-value">${formatHours(ficha.formData.montagem)}</span></div>
                <div class="hour-item"><span class="hour-label">Balanceamento:</span><span class="hour-value">${formatHours(ficha.formData.balanceamento)}</span></div>
                <div class="hour-item"><span class="hour-label">Mandrilhamento:</span><span class="hour-value">${formatHours(ficha.formData.mandrilhamento)}</span></div>
                <div class="hour-item"><span class="hour-label">Tratamento:</span><span class="hour-value">${formatHours(ficha.formData.tratamento)}</span></div>
            </div>
        </div>

        <!-- ✨ GRUPO 4: ACABAMENTO E ENGENHARIA -->
        <div>
            <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #e0e0e0;">✨ Acabamento e Engenharia</div>
            <div class="hours-grid">
                <div class="hour-item"><span class="hour-label">Lavagem:</span><span class="hour-value">${formatHours(ficha.formData.lavagem)}</span></div>
                <div class="hour-item"><span class="hour-label">Acabamento:</span><span class="hour-value">${formatHours(ficha.formData.acabamento)}</span></div>
                <div class="hour-item"><span class="hour-label">Pintura:</span><span class="hour-value">${formatHours(ficha.formData.pintura_horas)}</span></div>
                <div class="hour-item"><span class="hour-label">Programação CAM:</span><span class="hour-value">${formatHours(ficha.formData.programacao_cam)}</span></div>
                <div class="hour-item"><span class="hour-label">Eng/Técnico:</span><span class="hour-value">${formatHours(ficha.formData.eng_tec)}</span></div>
                <div class="hour-item"><span class="hour-label">Técnico Horas:</span><span class="hour-value">${formatHours(ficha.formData.tecnico_horas)}</span></div>
            </div>
        </div>
    </div>

    ${ficha.formData.observacoes_adicionais && ficha.formData.observacoes_adicionais.trim() !== '' ? `
    <!-- OBSERVAÇÕES ADICIONAIS -->
    <div class="section-card">
        <div class="section-title">📝 OBSERVAÇÕES ADICIONAIS</div>
        <div class="field-full">
            <div class="field-value" style="white-space: pre-wrap; line-height: 1.6;">${formatValue(ficha.formData.observacoes_adicionais)}</div>
        </div>
    </div>
    ` : ''}

    <!-- CONTROLE -->
    <div class="section-card">
        <div class="section-title">📋 CONTROLE DO PROCESSO</div>
        <div class="field-grid grid-4">
            <div class="field">
                <div class="field-label">Nº Orçamento</div>
                <div class="field-value">${formatValue(ficha.formData.num_orcamento)}</div>
            </div>
            <div class="field">
                <div class="field-label">Nº OS</div>
                <div class="field-value">${formatValue(ficha.formData.num_os)}</div>
            </div>
            <div class="field">
                <div class="field-label">Nº DESENHO</div>
                <div class="field-value">${formatValue(ficha.formData.num_desenho)}</div>
            </div>
            <div class="field">
                <div class="field-label">Nº NF Remessa</div>
                <div class="field-value">${formatValue(ficha.formData.num_nf_remessa)}</div>
            </div>
            <div class="field">
                <div class="field-label">Status</div>
                <div class="field-value">${ficha.status ? ficha.status.replace('_', ' ').toUpperCase() : '—'}</div>
            </div>
        </div>
    </div>

    <!-- RESUMO -->
    <div class="section-card">
        <div class="section-title">💰 RESUMO DOS CÁLCULOS</div>
        <div class="summary-box">
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

    <script>
      let currentPhotoIndex = 0;
      const totalPhotos = ${photosWithUrls.length};

      function openPhotoModal(index) {
        currentPhotoIndex = index;
        showPhoto(currentPhotoIndex);
        document.getElementById('photoModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closePhotoModal() {
        document.getElementById('photoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
      }

      function closePhotoModalOnBackdrop(event) {
        if (event.target.id === 'photoModal') closePhotoModal();
      }

      function changePhoto(direction) {
        currentPhotoIndex = (currentPhotoIndex + direction + totalPhotos) % totalPhotos;
        showPhoto(currentPhotoIndex);
      }

      function showPhoto(index) {
        document.querySelectorAll('.modal-photo').forEach((photo, i) => {
          photo.style.display = i === index ? 'flex' : 'none';
        });
        const counterElement = document.getElementById('currentPhotoIndex');
        if (counterElement) counterElement.textContent = index + 1;
      }

      function downloadModalPhoto(url, filename) {
        fetch(url)
          .then(r => r.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          });
      }

      function printModalPhoto(url, photoName) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(\`
          <!DOCTYPE html>
          <html><head><title>Imprimir - \${photoName}</title>
          <style>* { margin: 0; padding: 0; } body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; object-fit: contain; }</style>
          </head><body><img src="\${url}" alt="\${photoName}" onload="window.print();"></body></html>
        \`);
        printWindow.document.close();
      }

      document.addEventListener('keydown', function(event) {
        const modal = document.getElementById('photoModal');
        if (modal && modal.style.display === 'flex') {
          if (event.key === 'Escape') closePhotoModal();
          else if (event.key === 'ArrowLeft') changePhoto(-1);
          else if (event.key === 'ArrowRight') changePhoto(1);
        }
      });
    </script>
</body>
</html>`;
}

// Update main function to use compact version
export async function generateHTMLContent(ficha: FichaSalva): Promise<string> {
  return generateCompactHTMLContent(ficha);
}

export async function downloadHTML(ficha: FichaSalva): Promise<void> {
  const htmlContent = await generateCompactHTMLContent(ficha);
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
  const htmlContent = await generateCompactHTMLContent(ficha);
  const newWindow = window.open('', '_blank');

  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
}
