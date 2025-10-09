import { FichaSalva, OrcamentoData } from '@/types/ficha-tecnica';
import { formatCurrency } from './helpers';
import { getPhotosWithUrls, getPhotoGalleryCSS } from './photoHelpers';

/**
 * Escape HTML special characters to prevent XSS and syntax errors
 * @param str - String to escape
 * @returns Escaped string safe for HTML attributes
 */
function escapeHtml(str: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '\n': '&#10;',
    '\r': '&#13;'
  };
  return str.replace(/[&<>"'\n\r]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Escape JavaScript string literals (for use inside JS strings)
 * @param str - String to escape
 * @returns Escaped string safe for JavaScript strings
 */
function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generates HTML section for budget/quote data (client-facing version)
 * Shows only commercial information, no internal cost breakdown
 * @param orcamento - Budget data object
 * @returns HTML string for budget section
 */
function generateBudgetSectionHTML(orcamento: OrcamentoData): string {
  return `
    <!-- SEÇÃO DE ORÇAMENTO -->
    <div class="section-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7;">
      <div class="section-title" style="color: #0369a1;">💰 ORÇAMENTO COMERCIAL</div>

      <!-- Valor Total Destacado -->
      <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Valor Total do Orçamento</div>
        <div style="font-size: 36px; font-weight: 700; color: #0369a1;">
          ${formatCurrency(orcamento.precoVendaFinal)}
        </div>
      </div>

      <!-- Informações Comerciais -->
      <div class="field-grid">
        <div class="field">
          <div class="field-label">Prazo de Entrega</div>
          <div class="field-value">${orcamento.config.prazoEntrega} dias úteis</div>
        </div>
        <div class="field">
          <div class="field-label">Validade da Proposta</div>
          <div class="field-value">${orcamento.config.validadeProposta} dias</div>
        </div>
        <div class="field">
          <div class="field-label">Prazo de Pagamento</div>
          <div class="field-value">${orcamento.config.prazoPagamento} dias</div>
        </div>
        <div class="field">
          <div class="field-label">Garantia</div>
          <div class="field-value">${orcamento.config.garantia} dias</div>
        </div>
        <div class="field" style="grid-column: 1 / -1;">
          <div class="field-label">Condições de Pagamento</div>
          <div class="field-value">${orcamento.config.condicoesPagamento || '—'}</div>
        </div>
      </div>

      ${orcamento.itens && orcamento.itens.length > 0 ? `
      <!-- Itens do Orçamento -->
      <div style="margin-top: 20px;">
        <h4 style="margin-bottom: 15px; color: #0369a1; font-weight: 600;">📋 Itens do Orçamento</h4>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #0284c7; color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Descrição</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Qtd</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Valor Unit.</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${orcamento.itens.map((item, index) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;">${index + 1}</td>
                  <td style="padding: 10px;">${item.descricao}</td>
                  <td style="padding: 10px; text-align: right;">${item.quantidade}</td>
                  <td style="padding: 10px; text-align: right;">${formatCurrency(item.valorUnitario)}</td>
                  <td style="padding: 10px; text-align: right; font-weight: 600;">${formatCurrency(item.valorTotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates HTML with EXACT layout from FichaTecnicaForm
 * Optimized for printing in max 2 pages
 * @param ficha - Technical specification data
 * @param orcamento - Optional budget/quote data to include in HTML
 */
export async function generateCompactHTMLContent(ficha: FichaSalva, orcamento?: OrcamentoData | null): Promise<string> {
  // Load photos with signed URLs
  console.log('🔍 DEBUG - Fotos da ficha:', {
    totalFotos: ficha.fotos?.length || 0,
    fotos: ficha.fotos
  });

  const photosWithUrls = await getPhotosWithUrls(ficha.fotos || []);

  console.log('🔍 DEBUG - Fotos com URLs:', {
    totalComURL: photosWithUrls.length,
    urls: photosWithUrls.map(f => ({ name: f.name, hasUrl: !!f.url }))
  });

  const photoGalleryCSS = getPhotoGalleryCSS();

  const formatRadio = (value: any): string => {
    if (!value || value === '') return '—';
    const str = String(value).toUpperCase();
    if (str === 'SIM' || str === 'TRUE') return '✓ SIM';
    if (str === 'NAO' || str === 'NÃO' || str === 'FALSE') return '✗ NÃO';
    return String(value).toUpperCase();
  };

  const formatHours = (value: any): string => {
    if (!value || value === '' || value === '0') return '0h';

    // Se o valor não é um número (ex: "NAO", "SIM"), formata como radio
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) {
      return formatRadio(value);
    }

    return `${value}h`;
  };

  const formatValue = (value: any): string => {
    if (!value || value === '') return '—';
    return String(value).toUpperCase();
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
    return `<span style="color: ${color}; font-weight: 600;">${icon} ${priority.toUpperCase()}</span>`;
  };

  const formatDate = (value: any): string => {
    if (!value || value === '') return '—';
    const dateStr = String(value);

    // Se já está no formato DD/MM/YYYY, retorna como está
    if (dateStr.includes('/')) return dateStr;

    // Se está no formato YYYY-MM-DD, converte para DD/MM/YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  };

  const materiaisComPrecos = (ficha.materiais || []).filter(m =>
    m.descricao && parseFloat(m.valor_total || '0') > 0
  );

  // Photo gallery HTML
  const photoGalleryHTML = `
    <div class="section-card">
      <div class="section-title">📸 FOTOS DO PROJETO (${photosWithUrls.length})</div>
      ${photosWithUrls.length > 0 ? `
        <div class="photo-grid">
          ${photosWithUrls.map((foto, index) => `
            <div class="photo-item" onclick="openPhotoModal(${index})">
              <img src="${foto.url}" alt="${escapeHtml(foto.name)}" loading="lazy">
              <div class="photo-name">${escapeHtml(foto.name)}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 20px; color: #999; font-style: italic;">
          Nenhuma foto anexada a esta ficha
        </div>
      `}
    </div>

    ${photosWithUrls.length > 0 ? `
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
            <img src="${foto.url}" alt="${escapeHtml(foto.name)}">
            <div class="modal-photo-info">
              <div class="modal-photo-name">${escapeHtml(foto.name)}</div>
              <div class="modal-photo-actions">
                <button onclick="downloadModalPhoto('${escapeJs(foto.url)}', '${escapeJs(foto.name)}')" class="modal-btn">
                  📥 Baixar
                </button>
                <button onclick="printModalPhoto('${escapeJs(foto.url)}', '${escapeJs(foto.name)}')" class="modal-btn">
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
    ` : ''}
  `;

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
            padding: 20px;
            font-size: 10pt;
        }

        .container {
            max-width: 210mm; /* A4 width */
            margin: 0 auto;
            border: 3px solid #000;
            background: #fff;
        }

        .header {
            text-align: center;
            padding: 8px;
            background: #fff;
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
            padding: 6px;
            margin-bottom: 4px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 3px;
            margin-bottom: 4px;
        }

        .field-grid {
            display: grid;
            gap: 3px;
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
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 2px;
            min-height: 20px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
        }

        .field-value.highlight {
            font-weight: 600;
            background: #fff;
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
            background: #000;
            color: #fff;
            padding: 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #000;
        }

        .materials-table td {
            padding: 3px 4px;
            border: 1px solid #000;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 300px;
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
            word-wrap: break-word;
            overflow-wrap: break-word;
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
                padding: 0;
                font-size: 9pt;
            }

            .container {
                border: none;
                max-width: 100%;
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
    <div class="container">
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

        <!-- Linha 1: Cliente e CNPJ -->
        <div class="field-grid grid-3" style="margin-bottom: 4px;">
            <div class="field" style="grid-column: span 2;">
                <div class="field-label">Cliente</div>
                <div class="field-value highlight">${formatValue(ficha.formData.cliente)}</div>
            </div>
            <div class="field">
                <div class="field-label">CNPJ</div>
                <div class="field-value">${formatValue(ficha.formData.cnpj)}</div>
            </div>
        </div>

        <!-- Linha 2: Solicitante, Telefone e Email (lado a lado) -->
        <div class="field-grid grid-3" style="margin-bottom: 4px;">
            <div class="field">
                <div class="field-label">Solicitante</div>
                <div class="field-value">${formatValue(ficha.formData.solicitante)}</div>
            </div>
            <div class="field">
                <div class="field-label">Telefone</div>
                <div class="field-value">${formatValue(ficha.formData.telefone || ficha.formData.fone_email)}</div>
            </div>
            <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value">${formatValue(ficha.formData.email)}</div>
            </div>
        </div>

        <!-- Linha 3: Prioridade e Datas -->
        <div class="field-grid grid-3">
            <div class="field">
                <div class="field-label">Prioridade</div>
                <div class="field-value">${formatPriority(ficha.formData.prioridade)}</div>
            </div>
            <div class="field">
                <div class="field-label">Data Visita</div>
                <div class="field-value">${formatDate(ficha.formData.data_visita)}</div>
            </div>
            <div class="field">
                <div class="field-label">Data Entrega</div>
                <div class="field-value">${formatDate(ficha.formData.data_entrega)}</div>
            </div>
        </div>
    </div>

    <!-- PEÇA/EQUIPAMENTO -->
    <div class="section-card">
        <div class="section-title">⚙️ DADOS DA PEÇA/EQUIPAMENTO</div>
        <div class="field-grid grid-3">
            <div class="field" style="grid-column: span 2;">
                <div class="field-label">Nome da Peça/Equipamento</div>
                <div class="field-value highlight">${formatValue(ficha.formData.nome_peca)}</div>
            </div>
            <div class="field">
                <div class="field-label">Quantidade</div>
                <div class="field-value">${formatValue(ficha.formData.quantidade)}</div>
            </div>
            <div class="field" style="grid-column: span 3;">
                <div class="field-label">Serviço a ser Realizado</div>
                <div class="field-value">${formatValue(ficha.formData.servico)}</div>
            </div>
        </div>
    </div>

    <!-- 🔩 PEÇAS E AMOSTRAS -->
    <div class="section-card">
        <div class="section-title">🔩 PEÇAS E AMOSTRAS</div>
        <div class="field-grid grid-3">
            <div class="field">
                <div class="field-label">Cliente forneceu peça amostra</div>
                <div class="field-value">${formatRadio(ficha.formData.tem_peca_amostra)}</div>
            </div>
            <div class="field">
                <div class="field-label">Peça foi desmontada</div>
                <div class="field-value">${formatRadio(ficha.formData.peca_foi_desmontada)}</div>
            </div>
            <div class="field">
                <div class="field-label">A peça é nova ou usada?</div>
                <div class="field-value">${formatValue(ficha.formData.peca_condicao) || 'Nova'}</div>
            </div>
            <div class="field">
                <div class="field-label">Precisa peça de teste</div>
                <div class="field-value">${formatRadio(ficha.formData.precisa_peca_teste)}</div>
            </div>
            <div class="field" style="grid-column: span 2;">
                <div class="field-label">Responsável Técnico</div>
                <div class="field-value" style="font-weight: 600; color: #3b82f6;">${formatValue(ficha.formData.responsavel_tecnico)}</div>
            </div>
        </div>
    </div>

    ${photoGalleryHTML}

    <!-- MATERIAIS -->
    ${materiaisComPrecos.length > 0 ? `
    <div class="section-card">
        <div class="section-title">📦 MATERIAIS USADOS NA DEMANDA</div>
        <table class="materials-table">
            <thead>
                <tr>
                    <th style="width: 15%;">QTD</th>
                    <th style="width: 85%;">MATERIAL</th>
                </tr>
            </thead>
            <tbody>
                ${materiaisComPrecos.map(m => `
                    <tr>
                        <td>${formatValue(m.quantidade)}</td>
                        <td>${formatValue(m.descricao)}</td>
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
                <div class="field-label">Projeto por</div>
                <div class="field-value">${formatValue(ficha.formData.projeto_desenvolvido_por)}</div>
            </div>
            <div class="field">
                <div class="field-label">Desenho</div>
                <div class="field-value">${formatValue(ficha.formData.desenho_peca)}</div>
            </div>
            <div class="field">
                <div class="field-label">Finalizado</div>
                <div class="field-value">${formatRadio(ficha.formData.desenho_finalizado)}</div>
            </div>
        </div>
        <div class="field-grid grid-3" style="margin-top: 4px;">
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
                <div class="field-label">Cor</div>
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
                <div class="field-label">Tempera/Reven</div>
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
        <div style="margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #666; margin-bottom: 4px; padding-bottom: 1px; border-bottom: 1px solid #e0e0e0;">🔧 Tornos e Usinagem</div>
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
        <div style="margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #666; margin-bottom: 4px; padding-bottom: 1px; border-bottom: 1px solid #e0e0e0;">⚙️ Corte e Conformação</div>
            <div class="hours-grid">
                <div class="hour-item"><span class="hour-label">Plasma/Oxicorte:</span><span class="hour-value">${formatHours(ficha.formData.plasma_oxicorte)}</span></div>
                <div class="hour-item"><span class="hour-label">Maçarico:</span><span class="hour-value">${formatHours(ficha.formData.macarico)}</span></div>
                <div class="hour-item"><span class="hour-label">Solda:</span><span class="hour-value">${(() => {
                  const val = ficha.formData.solda;
                  if (!val || val === '') return '0h';
                  const num = parseFloat(String(val));
                  return isNaN(num) ? '0h' : `${val}h`;
                })()}</span></div>
                <div class="hour-item"><span class="hour-label">Serra:</span><span class="hour-value">${formatHours(ficha.formData.serra)}</span></div>
                <div class="hour-item"><span class="hour-label">Dobra:</span><span class="hour-value">${formatHours(ficha.formData.dobra)}</span></div>
                <div class="hour-item"><span class="hour-label">Calandra:</span><span class="hour-value">${formatHours(ficha.formData.calandra)}</span></div>
                <div class="hour-item"><span class="hour-label">Caldeiraria:</span><span class="hour-value">${formatHours(ficha.formData.caldeiraria)}</span></div>
            </div>
        </div>

        <!-- 🔩 GRUPO 3: MONTAGEM E ESPECIAIS -->
        <div style="margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #666; margin-bottom: 4px; padding-bottom: 1px; border-bottom: 1px solid #e0e0e0;">🔩 Montagem e Especiais</div>
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

        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Foto</title>';
        html += '<style>*{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh}';
        html += 'img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body>';
        html += '<img src="' + url + '" onload="window.print()"></body></html>';
        printWindow.document.write(html);
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
    </div>
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

/**
 * Gera os 3 modais de aprovação (aprovar, alterar, rejeitar)
 */
function gerarModaisAprovacao(numeroFTC: string, fichaId: string, supabaseUrl: string, supabaseAnonKey: string, versaoFTC?: number): string {
  return `
    <!-- Modal Aprovar -->
    <div id="modal-aprovar" class="approval-modal">
      <div class="modal-content-approval">
        <button class="modal-close" onclick="fecharModal('aprovar')">&times;</button>

        <!-- Termo de Responsabilidade -->
        <div class="termo-responsabilidade">
          <h3>⚖️ Termo de Responsabilidade - Aprovação</h3>
          <div class="termo-texto">
            <p>Ao aprovar esta ficha técnica, você declara que:</p>
            <ul>
              <li>✅ Revisou todos os dados técnicos e especificações apresentadas</li>
              <li>✅ Confirma que as informações estão corretas e completas</li>
              <li>✅ Autoriza o prosseguimento conforme especificado</li>
              <li>✅ Assume responsabilidade pela aprovação técnica/comercial</li>
            </ul>
            <p class="termo-aviso"><strong>⚠️ IMPORTANTE:</strong> Esta aprovação será registrada com seus dados (nome, email, data/hora, IP) e não poderá ser desfeita.</p>
          </div>
          <div class="form-group-checkbox">
            <input type="checkbox" id="checkbox-aprovar" required>
            <label for="checkbox-aprovar">
              <strong>Li e concordo com o termo de responsabilidade acima. Autorizo a aprovação desta ficha.</strong>
            </label>
          </div>
        </div>

        <div id="form-aprovar">
          <h2 class="modal-title">✅ Aprovar Ficha Técnica</h2>
          <form id="form-aprovacao-aprovar" onsubmit="submitAprovacao(event, 'aprovar')">
            <div class="form-group">
              <label class="form-label">Nome do Responsável *</label>
              <input type="text" class="form-input" id="responsavel-aprovar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-input" id="email-aprovar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input type="tel" class="form-input" id="telefone-aprovar" placeholder="(XX) XXXXX-XXXX">
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea class="form-input" id="observacoes-aprovar"></textarea>
            </div>
            <button type="submit" class="btn-submit btn-submit-aprovar">✅ Confirmar Aprovação</button>
          </form>
        </div>
        <div id="success-aprovar" class="success-message" style="display: none;">
          <h3>✅ Ficha Aprovada!</h3>
          <p>Sua aprovação foi registrada com sucesso. Obrigado!</p>
        </div>
      </div>
    </div>

    <!-- Modal Alterar -->
    <div id="modal-alterar" class="approval-modal">
      <div class="modal-content-approval">
        <button class="modal-close" onclick="fecharModal('alterar')">&times;</button>

        <!-- Termo de Responsabilidade -->
        <div class="termo-responsabilidade">
          <h3>⚖️ Termo de Responsabilidade - Solicitação de Alterações</h3>
          <div class="termo-texto">
            <p>Ao solicitar alterações, você declara que:</p>
            <ul>
              <li>📝 Revisou a ficha e identificou pontos que necessitam modificação</li>
              <li>📝 As alterações solicitadas são necessárias e fundamentadas</li>
              <li>📝 Fornecerá informações claras sobre as mudanças necessárias</li>
              <li>📝 Compromete-se a revisar a ficha após as alterações serem feitas</li>
            </ul>
            <p class="termo-aviso"><strong>⚠️ ATENÇÃO:</strong> Solicitações de alteração podem impactar prazos de entrega. Esta solicitação será registrada e rastreada.</p>
          </div>
          <div class="form-group-checkbox">
            <input type="checkbox" id="checkbox-alterar" required>
            <label for="checkbox-alterar">
              <strong>Li e concordo. Solicito as alterações descritas abaixo.</strong>
            </label>
          </div>
        </div>

        <div id="form-alterar">
          <h2 class="modal-title">🔄 Solicitar Alterações</h2>
          <form id="form-aprovacao-alterar" onsubmit="submitAprovacao(event, 'alterar')">
            <div class="form-group">
              <label class="form-label">Nome do Responsável *</label>
              <input type="text" class="form-input" id="responsavel-alterar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-input" id="email-alterar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input type="tel" class="form-input" id="telefone-alterar" placeholder="(XX) XXXXX-XXXX">
            </div>
            <div class="form-group">
              <label class="form-label">Alterações Solicitadas *</label>
              <textarea class="form-input" id="observacoes-alterar" required placeholder="Descreva as alterações necessárias..."></textarea>
            </div>
            <button type="submit" class="btn-submit btn-submit-alterar">🔄 Enviar Solicitação</button>
          </form>
        </div>
        <div id="success-alterar" class="success-message" style="display: none;">
          <h3>🔄 Alterações Solicitadas!</h3>
          <p>Sua solicitação foi registrada. Entraremos em contato em breve!</p>
        </div>
      </div>
    </div>

    <!-- Modal Rejeitar -->
    <div id="modal-rejeitar" class="approval-modal">
      <div class="modal-content-approval">
        <button class="modal-close" onclick="fecharModal('rejeitar')">&times;</button>

        <!-- Termo de Responsabilidade -->
        <div class="termo-responsabilidade termo-rejeitar">
          <h3>⚖️ Termo de Responsabilidade - Rejeição</h3>
          <div class="termo-texto">
            <p>Ao rejeitar esta ficha técnica, você declara que:</p>
            <ul>
              <li>❌ Revisou a ficha e identificou inviabilidades técnicas ou comerciais</li>
              <li>❌ A rejeição é fundamentada em critérios objetivos</li>
              <li>❌ Fornecerá justificativa clara e detalhada</li>
              <li>❌ Entende que a rejeição encerrará este processo de cotação</li>
            </ul>
            <p class="termo-aviso"><strong>⚠️ ATENÇÃO:</strong> A rejeição é uma decisão final e irreversível. Esta ação será registrada e notificará toda a equipe comercial.</p>
          </div>
          <div class="form-group-checkbox">
            <input type="checkbox" id="checkbox-rejeitar" required>
            <label for="checkbox-rejeitar">
              <strong>Li e concordo. Confirmo a rejeição desta ficha técnica.</strong>
            </label>
          </div>
        </div>

        <div id="form-rejeitar">
          <h2 class="modal-title">❌ Rejeitar Ficha Técnica</h2>
          <form id="form-aprovacao-rejeitar" onsubmit="submitAprovacao(event, 'rejeitar')">
            <div class="form-group">
              <label class="form-label">Nome do Responsável *</label>
              <input type="text" class="form-input" id="responsavel-rejeitar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-input" id="email-rejeitar" required>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input type="tel" class="form-input" id="telefone-rejeitar" placeholder="(XX) XXXXX-XXXX">
            </div>
            <div class="form-group">
              <label class="form-label">Motivo da Rejeição *</label>
              <textarea class="form-input" id="observacoes-rejeitar" required placeholder="Por favor, explique o motivo da rejeição..."></textarea>
            </div>
            <button type="submit" class="btn-submit btn-submit-rejeitar">❌ Confirmar Rejeição</button>
          </form>
        </div>
        <div id="success-rejeitar" class="success-message" style="display: none;">
          <h3>❌ Ficha Rejeitada</h3>
          <p>Sua resposta foi registrada. Entraremos em contato em breve!</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera os scripts JavaScript para o sistema de aprovação
 */
function gerarScriptsAprovacao(numeroFTC: string, fichaId: string, supabaseUrl: string, supabaseAnonKey: string, versaoFTC?: number): string {
  // Usar string normal ao invés de template literal para evitar conflito de interpolação
  return `
  <script>
    // Validação de status da ficha
    window.validarStatusFicha = async function() {
      console.log('🔍 Validando status da ficha...');

      try {
        const response = await fetch(
          '${supabaseUrl}' + '/rest/v1/fichas_tecnicas?id=eq.' + '${fichaId}' + '&select=status,versao_ftc_atual',
          {
            method: 'GET',
            headers: {
              'apikey': '${supabaseAnonKey}',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('❌ Erro ao consultar status da ficha');
          return false;
        }

        const fichas = await response.json();

        if (!fichas || fichas.length === 0) {
          console.error('❌ Ficha não encontrada');
          return false;
        }

        const ficha = fichas[0];
        const statusValidos = ['orcamento_enviado_cliente', 'aguardando_orcamento_comercial'];

        console.log('📋 Status atual:', ficha.status);
        console.log('📦 Versão FTC atual:', ficha.versao_ftc_atual);
        console.log('📦 Versão desta FTC:', ${versaoFTC !== undefined ? versaoFTC : 'null'});

        // Validar status
        if (!statusValidos.includes(ficha.status)) {
          console.warn('⚠️ Ficha não está em status válido');
          alert(
            '⚠️ FICHA TÉCNICA DESATUALIZADA\\n\\n' +
            'Esta ficha técnica foi estornada ou modificada.\\n\\n' +
            'Por favor, entre em contato conosco para obter uma versão atualizada.\\n\\n' +
            'Contato: contato@hmcusinagem.com.br'
          );
          return false;
        }

        // Validar versão FTC
        if (${versaoFTC !== undefined ? 'true' : 'false'}) {
          if (ficha.versao_ftc_atual !== ${versaoFTC || 0}) {
            console.warn('⚠️ Versão FTC desatualizada');
            alert(
              '⚠️ FICHA TÉCNICA DESATUALIZADA\\n\\n' +
              'Esta é uma versão antiga da ficha técnica.\\n' +
              'Uma versão mais recente foi gerada.\\n\\n' +
              'Por favor, solicite a versão atualizada.\\n\\n' +
              'Contato: contato@hmcusinagem.com.br'
            );
            return false;
          }
        }

        console.log('✅ Status e versão válidos');
        return true;
      } catch (error) {
        console.error('❌ Erro ao validar status:', error);
        alert(
          '⚠️ ERRO DE CONEXÃO\\n\\n' +
          'Não foi possível validar o status desta ficha técnica.\\n\\n' +
          'Por favor, tente novamente mais tarde ou entre em contato conosco.'
        );
        return false;
      }
    };

    // Abrir modal
    window.abrirModalAprovacao = async function(tipo) {
      console.log('🔵 Abrindo modal:', tipo);

      // Tentar validar status, mas não bloquear se falhar
      try {
        const statusValido = await window.validarStatusFicha();
        if (statusValido) {
          console.log('✅ Status válido, abrindo modal...');
        } else {
          console.warn('⚠️ Validação de status falhou, mas modal será aberto mesmo assim');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao validar status, mas modal será aberto mesmo assim:', error);
      }

      // Abrir modal independentemente da validação
      const modal = document.getElementById('modal-' + tipo);
      if (modal) {
        modal.style.display = 'block';
      }
    };

    // Fechar modal
    window.fecharModal = function(tipo) {
      const modal = document.getElementById('modal-' + tipo);
      if (modal) {
        modal.style.display = 'none';
      }
    };

    // Fechar ao clicar fora
    window.onclick = function(event) {
      if (event.target.classList.contains('approval-modal')) {
        event.target.style.display = 'none';
      }
    };

    // Submit aprovação
    window.submitAprovacao = async function(event, tipo) {
      event.preventDefault();

      // VALIDAÇÃO DO CHECKBOX
      const checkbox = document.getElementById('checkbox-' + tipo);
      if (!checkbox || !checkbox.checked) {
        alert('⚠️ ATENÇÃO\\n\\nVocê deve ler e concordar com o termo de responsabilidade para prosseguir.\\n\\nPor favor, marque a caixa de confirmação.');
        return;
      }

      // Confirmação adicional para rejeição
      if (tipo === 'rejeitar') {
        const confirma = confirm(
          '⚠️ CONFIRMAÇÃO FINAL\\n\\n' +
          'Você tem certeza que deseja REJEITAR esta ficha técnica?\\n\\n' +
          'Esta ação é irreversível e encerrará o processo.\\n\\n' +
          'Clique em OK para confirmar a rejeição.'
        );
        if (!confirma) return;
      }

      const responsavel = document.getElementById('responsavel-' + tipo).value;
      const email = document.getElementById('email-' + tipo).value;
      const telefone = document.getElementById('telefone-' + tipo).value || null;
      const observacoes = document.getElementById('observacoes-' + tipo).value || null;

      try {
        // Enviar para Supabase (tabela aprovacoes_ftc_cliente)
        const response = await fetch(
          '${supabaseUrl}' + '/rest/v1/aprovacoes_ftc_cliente',
          {
            method: 'POST',
            headers: {
              'apikey': '${supabaseAnonKey}',
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              ficha_id: '${fichaId}',
              numero_ftc: '${numeroFTC}',
              tipo: tipo,
              responsavel: responsavel,
              email: email,
              telefone: telefone,
              observacoes: observacoes,
              versao_ftc: ${versaoFTC || 0},
              ip_address: null,
              user_agent: navigator.userAgent
            })
          }
        );

        if (response.ok) {
          // Esconder formulário, mostrar sucesso
          document.getElementById('form-' + tipo).style.display = 'none';
          document.getElementById('success-' + tipo).style.display = 'block';

          // Fechar modal após 3 segundos
          setTimeout(() => {
            fecharModal(tipo);
            // Resetar para próxima vez
            setTimeout(() => {
              document.getElementById('form-' + tipo).style.display = 'block';
              document.getElementById('success-' + tipo).style.display = 'none';
              document.getElementById('form-aprovacao-' + tipo).reset();
            }, 500);
          }, 3000);
        } else {
          const errorData = await response.json();
          console.error('Erro ao enviar aprovação:', errorData);
          alert('Erro ao enviar aprovação. Por favor, tente novamente ou entre em contato conosco.');
        }
      } catch (error) {
        console.error('Erro ao enviar aprovação:', error);
        alert('Erro ao enviar aprovação. Por favor, verifique sua conexão e tente novamente.');
      }
    };

    // Event listeners nos botões
    document.addEventListener('DOMContentLoaded', function() {
      const botoesAprovacao = document.querySelectorAll('.btn[data-tipo]');
      console.log('🔘 Botões de aprovação encontrados:', botoesAprovacao.length);

      botoesAprovacao.forEach(btn => {
        const tipo = btn.getAttribute('data-tipo');
        console.log('✅ Adicionando listener para botão:', tipo);

        btn.addEventListener('click', function() {
          console.log('🖱️ Botão clicado:', tipo);
          abrirModalAprovacao(tipo);
        });
      });

      // 📝 Ler parâmetros URL diretos (nome, email, telefone) e pré-preencher campos
      function preencherCamposComURL() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const nome = urlParams.get('nome');
          const email = urlParams.get('email');
          const telefone = urlParams.get('telefone');

          // Se não há parâmetros URL, retorna
          if (!nome && !email && !telefone) {
            console.log('ℹ️ Nenhum parâmetro de contato na URL');
            return false; // Indica que não preencheu via URL
          }

          console.log('📧 Parâmetros de contato detectados na URL:', { nome, email, telefone });

          // Preencher campos de TODOS os 3 modais
          const tipos = ['aprovar', 'alterar', 'rejeitar'];
          tipos.forEach(tipo => {
            const inputNome = document.getElementById(\`responsavel-\${tipo}\`);
            const inputEmail = document.getElementById(\`email-\${tipo}\`);
            const inputTelefone = document.getElementById(\`telefone-\${tipo}\`);

            if (inputNome && nome) {
              inputNome.value = decodeURIComponent(nome);
            }

            if (inputEmail && email) {
              inputEmail.value = decodeURIComponent(email);
            }

            if (inputTelefone && telefone) {
              inputTelefone.value = decodeURIComponent(telefone);
            }
          });

          console.log('✅ Campos pré-preenchidos com parâmetros URL!');
          return true; // Indica que preencheu via URL
        } catch (error) {
          console.error('❌ Erro ao processar parâmetros URL:', error);
          return false;
        }
      }

      // 🔑 Ler token da URL e pré-preencher campos
      async function preencherCamposComToken() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');

          if (!token) {
            console.log('ℹ️ Nenhum token fornecido na URL');
            return;
          }

          console.log('🔑 Token detectado:', token);

          // Buscar dados do token no Supabase
          const response = await fetch(\`${supabaseUrl}/rest/v1/aprovacao_tokens?token=eq.\${token}&select=*\`, {
            headers: {
              'apikey': '${supabaseAnonKey}',
              'Authorization': 'Bearer ${supabaseAnonKey}'
            }
          });

          if (!response.ok) {
            console.error('❌ Erro ao buscar token:', response.statusText);
            return;
          }

          const tokens = await response.json();

          if (!tokens || tokens.length === 0) {
            console.warn('⚠️ Token não encontrado ou inválido');
            return;
          }

          const tokenData = tokens[0];

          // Verificar se o token já foi usado
          if (tokenData.usado) {
            console.warn('⚠️ Token já foi utilizado');
            alert('Este link de aprovação já foi utilizado. Entre em contato com o fornecedor caso precise fazer alterações.');
            return;
          }

          // Verificar se o token está expirado
          const expiraEm = new Date(tokenData.expira_em);
          if (expiraEm < new Date()) {
            console.warn('⚠️ Token expirado');
            alert('Este link de aprovação expirou. Entre em contato com o fornecedor para receber um novo link.');
            return;
          }

          console.log('✅ Token válido! Pré-preenchendo campos...');

          // Pré-preencher campos de TODOS os 3 modais
          const tipos = ['aprovar', 'alterar', 'rejeitar'];
          tipos.forEach(tipo => {
            const inputNome = document.getElementById(\`responsavel-\${tipo}\`);
            const inputEmail = document.getElementById(\`email-\${tipo}\`);
            const inputTelefone = document.getElementById(\`telefone-\${tipo}\`);

            if (inputNome && tokenData.contato_nome) {
              inputNome.value = tokenData.contato_nome;
              inputNome.setAttribute('readonly', 'readonly');
              inputNome.style.backgroundColor = '#f0fdf4';
            }

            if (inputEmail && tokenData.contato_email) {
              inputEmail.value = tokenData.contato_email;
              inputEmail.setAttribute('readonly', 'readonly');
              inputEmail.style.backgroundColor = '#f0fdf4';
            }

            if (inputTelefone && tokenData.contato_telefone) {
              inputTelefone.value = tokenData.contato_telefone;
              inputTelefone.setAttribute('readonly', 'readonly');
              inputTelefone.style.backgroundColor = '#f0fdf4';
            }
          });

          // Mostrar mensagem de sucesso
          const header = document.querySelector('h1');
          if (header) {
            const badge = document.createElement('div');
            badge.style.cssText = 'background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; margin-top: 12px; display: inline-block;';
            badge.textContent = \`✅ Bem-vindo(a), \${tokenData.contato_nome}! Seus dados foram pré-preenchidos.\`;
            header.insertAdjacentElement('afterend', badge);
          }

          console.log('✅ Campos pré-preenchidos com sucesso!');

        } catch (error) {
          console.error('❌ Erro ao processar token:', error);
        }
      }

      // Executar funções de pré-preenchimento
      // Prioridade: URL parameters > Token
      const preenchidoComURL = preencherCamposComURL();

      // Se não preencheu com URL, tentar com token
      if (!preenchidoComURL) {
        preencherCamposComToken();
      }
    });
  </script>
  `;
}

/**
 * Interface para dados necessários ao sistema de aprovação
 */
interface ApprovalSystemData {
  ficha: FichaSalva;
  versaoFTC?: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Gera HTML com sistema de aprovação integrado
 * Usa o mesmo layout compacto do botão "Imprimir" + sistema de aprovação no final
 */
export async function generateHTMLWithApproval(dados: ApprovalSystemData): Promise<string> {
  const { ficha, versaoFTC, supabaseUrl, supabaseAnonKey } = dados;

  // 1. Parsear dados do orçamento se existirem
  let orcamento: OrcamentoData | null = null;
  if (ficha.formData?.dados_orcamento) {
    try {
      orcamento = typeof ficha.formData.dados_orcamento === 'string'
        ? JSON.parse(ficha.formData.dados_orcamento)
        : ficha.formData.dados_orcamento;
    } catch (error) {
      console.error('Erro ao parsear dados_orcamento:', error);
    }
  }

  // 2. Gerar HTML compacto base com orçamento (se houver)
  let htmlBase = await generateCompactHTMLContent(ficha, orcamento);

  // 2. Injetar CSS adicional para modais de aprovação (antes de </style>)
  const approvalCSS = `
    /* ========== ESTILOS DE APROVAÇÃO ========== */
    .approval-section {
      margin-top: 40px;
      padding: 30px;
      background: #fff;
      border-radius: 12px;
      border: 2px solid #10b981;
    }

    .approval-title {
      font-size: 20px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 20px;
      text-align: center;
    }

    .btn-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .btn {
      padding: 15px 25px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .btn-aprovar {
      background: #10b981;
      color: white;
    }

    .btn-aprovar:hover {
      background: #059669;
    }

    .btn-alterar {
      background: #f59e0b;
      color: white;
    }

    .btn-alterar:hover {
      background: #d97706;
    }

    .btn-rejeitar {
      background: #ef4444;
      color: white;
    }

    .btn-rejeitar:hover {
      background: #dc2626;
    }

    /* Modais de aprovação */
    .approval-modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
    }

    .modal-content-approval {
      background: white;
      margin: 2% auto;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      max-height: 95vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      position: relative;
    }

    .modal-close {
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 28px;
      font-weight: bold;
      color: #999;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 1;
      line-height: 1;
      padding: 0;
      width: 30px;
      height: 30px;
    }

    .modal-close:hover {
      color: #333;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #111827;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: inherit;
    }

    .form-input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    textarea.form-input {
      min-height: 100px;
      resize: vertical;
    }

    .btn-submit {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-submit-aprovar {
      background: #10b981;
      color: white;
    }

    .btn-submit-aprovar:hover {
      background: #059669;
    }

    .btn-submit-alterar {
      background: #f59e0b;
      color: white;
    }

    .btn-submit-alterar:hover {
      background: #d97706;
    }

    .btn-submit-rejeitar {
      background: #ef4444;
      color: white;
    }

    .btn-submit-rejeitar:hover {
      background: #dc2626;
    }

    .success-message {
      background: #d1fae5;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    /* Estilos do Termo de Responsabilidade */
    .termo-responsabilidade {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 2px solid #dee2e6;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .termo-responsabilidade h3 {
      color: #495057;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .termo-texto {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
    }

    .termo-texto p {
      margin-bottom: 12px;
      line-height: 1.6;
      color: #495057;
    }

    .termo-texto ul {
      margin-left: 24px;
      margin-bottom: 16px;
    }

    .termo-texto li {
      margin-bottom: 10px;
      line-height: 1.7;
      color: #212529;
    }

    .termo-aviso {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin-top: 16px;
      border-radius: 4px;
    }

    .termo-rejeitar {
      border-color: #dc3545;
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
    }

    .form-group-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 2px solid #0d6efd;
      cursor: pointer;
      transition: all 0.2s;
    }

    .form-group-checkbox:hover {
      background: #f8f9fa;
      border-color: #0a58ca;
    }

    .form-group-checkbox input[type="checkbox"] {
      width: 22px;
      height: 22px;
      margin-top: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .form-group-checkbox label {
      flex: 1;
      cursor: pointer;
      user-select: none;
      line-height: 1.6;
      color: #212529;
    }

    .success-message h3 {
      color: #065f46;
      font-size: 20px;
      margin-bottom: 10px;
    }

    .success-message p {
      color: #047857;
    }

    @media (max-width: 768px) {
      .btn-container {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      .approval-section {
        display: none !important;
      }
    }
  `;

  htmlBase = htmlBase.replace('</style>', approvalCSS + '\n    </style>');

  // 3. Adicionar seção de aprovação (antes de </body>)
  const approvalSection = `
    <!-- SISTEMA DE APROVAÇÃO -->
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <div class="approval-section">
        <div class="approval-title">
          ✅ APROVAÇÃO DA FICHA TÉCNICA
        </div>
        <p style="text-align: center; color: #065f46; margin-bottom: 20px;">
          Por favor, revise a ficha técnica acima e indique sua aprovação:
        </p>
        <div class="btn-container">
          <button class="btn btn-aprovar" data-tipo="aprovar">
            ✅ Aprovar Ficha
          </button>
          <button class="btn btn-alterar" data-tipo="alterar">
            🔄 Solicitar Alterações
          </button>
          <button class="btn btn-rejeitar" data-tipo="rejeitar">
            ❌ Rejeitar Ficha
          </button>
        </div>
      </div>
    </div>

    <!-- MODAIS DE APROVAÇÃO -->
  ` + gerarModaisAprovacao(ficha.numeroFTC, ficha.id, supabaseUrl, supabaseAnonKey, versaoFTC) + `

    <!-- SCRIPTS DE APROVAÇÃO -->
  ` + gerarScriptsAprovacao(ficha.numeroFTC, ficha.id, supabaseUrl, supabaseAnonKey, versaoFTC);

  // Substituir ÚLTIMA ocorrência de </body> (não a primeira que pode estar em strings JS)
  const lastBodyIndex = htmlBase.lastIndexOf('</body>');
  if (lastBodyIndex !== -1) {
    htmlBase = htmlBase.substring(0, lastBodyIndex) + approvalSection + '\n' + htmlBase.substring(lastBodyIndex);
  }

  return htmlBase;
}
