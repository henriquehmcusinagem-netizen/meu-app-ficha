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

        /* RESPONSIVO PARA CELULAR */
        @media (max-width: 768px) {
            body {
                padding: 10px;
                font-size: 9pt;
            }

            .container {
                border: 2px solid #000;
            }

            .header h1 {
                font-size: 14pt;
            }

            .header .subtitle {
                font-size: 10pt;
            }

            /* Grids responsivos */
            .grid-2, .grid-3, .grid-4, .grid-6 {
                grid-template-columns: 1fr !important;
            }

            .field {
                grid-column: span 1 !important;
            }

            /* Horas de produção - 2 colunas no celular */
            .hours-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 4px;
                font-size: 7pt;
            }

            .hour-item {
                padding: 3px 4px;
                flex-direction: column;
                align-items: flex-start;
            }

            .hour-label {
                font-size: 7pt;
                margin-bottom: 2px;
            }

            .hour-value {
                font-size: 8pt;
            }

            /* Tabela de materiais */
            .materials-table {
                font-size: 7pt;
            }

            .materials-table th,
            .materials-table td {
                padding: 4px 3px;
            }

            /* Photo grid - 2 colunas no celular */
            .photo-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
            }

            /* Seção de aprovação */
            .approval-section {
                padding: 20px 15px;
            }

            .btn-container {
                grid-template-columns: 1fr !important;
                gap: 10px;
            }

            .btn {
                padding: 12px 20px;
                font-size: 14px;
            }
        }

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
 * Estrutura padronizada com modal-overlay (padrão Orçamento)
 */
function gerarModaisAprovacao(numeroFTC: string, fichaId: string, supabaseUrl: string, supabaseAnonKey: string, versaoFTC?: number): string {
  return `
    <!-- MODAL DE APROVAÇÃO -->
    <div id="modalAprovacao" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✅ Termo de Responsabilidade e Aprovação</h2>
        </div>
        <div class="modal-body">
          <div class="termo-responsabilidade">
            <h3>DECLARO QUE:</h3>
            <ol>
              <li>Revisou todos os dados técnicos e especificações apresentadas nesta ficha;</li>
              <li>Confirma que as informações estão corretas e completas para a execução dos serviços;</li>
              <li>Autoriza o prosseguimento dos trabalhos conforme especificado;</li>
              <li>Assume responsabilidade pela aprovação técnica e/ou comercial desta ficha;</li>
              <li>Compreende que esta aprovação confirma a intenção de prosseguir com o trabalho especificado;</li>
              <li>Está ciente de que esta aprovação será registrada e rastreada para fins de auditoria.</li>
            </ol>
            <p><strong>Esta aprovação será considerada como aceite formal das especificações técnicas apresentadas pela HMC Usinagem.</strong></p>
          </div>

          <div class="checkbox-container">
            <input type="checkbox" id="checkboxAceite" />
            <label for="checkboxAceite">
              Declaro que li, entendi e aceito integralmente os termos de responsabilidade acima, confirmando minha autorização para aprovação desta ficha técnica.
            </label>
          </div>

          <div class="form-group">
            <label for="inputNome">Nome Completo *</label>
            <input type="text" id="inputNome" placeholder="Digite seu nome completo" required />
          </div>

          <div class="form-group">
            <label for="inputEmail">E-mail *</label>
            <input type="email" id="inputEmail" placeholder="seuemail@empresa.com" required />
          </div>

          <div class="form-group">
            <label for="inputTelefone">Telefone *</label>
            <input type="tel" id="inputTelefone" placeholder="(00) 00000-0000" required />
          </div>

          <div class="termo-footer">
            ⚠️ ATENÇÃO: Ao confirmar, você está formalizando a aprovação desta ficha técnica sob sua responsabilidade.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancelar" onclick="fecharModal()">❌ Cancelar</button>
          <button type="button" class="btn-confirmar" id="btnConfirmarAprovacao" disabled onclick="confirmarAcao()">
            ✅ Confirmar Aprovação
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE SOLICITAR ALTERAÇÕES -->
    <div id="modalAlterar" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          <h2>🔄 Solicitar Alterações na Ficha Técnica</h2>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 20px; line-height: 1.6;">
            Use este formulário para solicitar alterações ou esclarecimentos sobre a ficha técnica apresentada.
            Nossa equipe entrará em contato com você em breve.
          </p>

          <div class="form-group">
            <label for="inputNomeAlterar">Nome Completo *</label>
            <input type="text" id="inputNomeAlterar" placeholder="Digite seu nome completo" required />
          </div>

          <div class="form-group">
            <label for="inputEmailAlterar">E-mail *</label>
            <input type="email" id="inputEmailAlterar" placeholder="seuemail@empresa.com" required />
          </div>

          <div class="form-group">
            <label for="inputTelefoneAlterar">Telefone *</label>
            <input type="tel" id="inputTelefoneAlterar" placeholder="(00) 00000-0000" required />
          </div>

          <div class="form-group">
            <label for="textareaAlteracoes">Descreva as alterações desejadas *</label>
            <textarea id="textareaAlteracoes" rows="6" placeholder="Exemplo: Alterar quantidade de peças, especificações técnicas, prazo de entrega, etc."
              style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 11pt; resize: vertical;" required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancelar" onclick="fecharModal()">❌ Cancelar</button>
          <button type="button" class="btn-confirmar" id="btnConfirmarAlterar" disabled onclick="confirmarAcao()"
            style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            🔄 Enviar Solicitação
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE REJEITAR -->
    <div id="modalRejeitar" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <h2>❌ Rejeitar Ficha Técnica</h2>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 20px; line-height: 1.6; color: #991b1b; font-weight: bold;">
            ⚠️ Atenção: Esta ação informará que a ficha técnica não foi aceita.
          </p>

          <div class="form-group">
            <label for="inputNomeRejeitar">Nome Completo *</label>
            <input type="text" id="inputNomeRejeitar" placeholder="Digite seu nome completo" required />
          </div>

          <div class="form-group">
            <label for="inputEmailRejeitar">E-mail *</label>
            <input type="email" id="inputEmailRejeitar" placeholder="seuemail@empresa.com" required />
          </div>

          <div class="form-group">
            <label for="inputTelefoneRejeitar">Telefone *</label>
            <input type="tel" id="inputTelefoneRejeitar" placeholder="(00) 00000-0000" required />
          </div>

          <div class="form-group">
            <label for="textareaMotivo">Motivo da rejeição (opcional)</label>
            <textarea id="textareaMotivo" rows="4" placeholder="Se desejar, informe o motivo da rejeição..."
              style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 11pt; resize: vertical;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancelar" onclick="fecharModal()">Voltar</button>
          <button type="button" class="btn-confirmar" id="btnConfirmarRejeitar" disabled onclick="confirmarAcao()"
            style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            ❌ Confirmar Rejeição
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera os scripts JavaScript para o sistema de aprovação
 */
function gerarScriptsAprovacao(numeroFTC: string, fichaId: string, supabaseUrl: string, supabaseAnonKey: string, versaoFTC?: number): string {
  return `
  <script>
    // Sistema de aprovação com modais - PADRÃO ORÇAMENTO
    const supabaseUrl = '${escapeJs(supabaseUrl)}';
    const supabaseAnonKey = '${escapeJs(supabaseAnonKey)}';
    const fichaId = '${escapeJs(fichaId)}';
    const numeroFTC = '${escapeJs(numeroFTC)}';
    const versaoFTC = ${versaoFTC !== undefined ? versaoFTC : 'null'};

    // Elementos do DOM - Modal Aprovar
    const modalAprovar = document.getElementById('modalAprovacao');
    const checkboxAceite = document.getElementById('checkboxAceite');
    const btnConfirmarAprovar = document.getElementById('btnConfirmarAprovacao');
    const inputNome = document.getElementById('inputNome');
    const inputEmail = document.getElementById('inputEmail');
    const inputTelefone = document.getElementById('inputTelefone');

    // Elementos do DOM - Modal Alterar
    const modalAlterar = document.getElementById('modalAlterar');
    const btnConfirmarAlterar = document.getElementById('btnConfirmarAlterar');
    const inputNomeAlterar = document.getElementById('inputNomeAlterar');
    const inputEmailAlterar = document.getElementById('inputEmailAlterar');
    const inputTelefoneAlterar = document.getElementById('inputTelefoneAlterar');
    const textareaAlteracoes = document.getElementById('textareaAlteracoes');

    // Elementos do DOM - Modal Rejeitar
    const modalRejeitar = document.getElementById('modalRejeitar');
    const btnConfirmarRejeitar = document.getElementById('btnConfirmarRejeitar');
    const inputNomeRejeitar = document.getElementById('inputNomeRejeitar');
    const inputEmailRejeitar = document.getElementById('inputEmailRejeitar');
    const inputTelefoneRejeitar = document.getElementById('inputTelefoneRejeitar');
    const textareaMotivo = document.getElementById('textareaMotivo');

    let modalAtivo = null;
    let tipoAtual = null;

    // Função para abrir modal
    function abrirModalAprovacao(tipo) {
      tipoAtual = tipo;

      if (tipo === 'aprovar') {
        modalAtivo = modalAprovar;
        checkboxAceite.checked = false;
        // ✅ NÃO limpar campos se já estiverem pré-preenchidos (readonly)
        if (!inputNome.readOnly) inputNome.value = '';
        if (!inputEmail.readOnly) inputEmail.value = '';
        if (!inputTelefone.readOnly) inputTelefone.value = '';
        btnConfirmarAprovar.disabled = true;
      } else if (tipo === 'alterar') {
        modalAtivo = modalAlterar;
        // ✅ NÃO limpar campos se já estiverem pré-preenchidos (readonly)
        if (!inputNomeAlterar.readOnly) inputNomeAlterar.value = '';
        if (!inputEmailAlterar.readOnly) inputEmailAlterar.value = '';
        if (!inputTelefoneAlterar.readOnly) inputTelefoneAlterar.value = '';
        textareaAlteracoes.value = '';
        btnConfirmarAlterar.disabled = true;
      } else if (tipo === 'rejeitar') {
        modalAtivo = modalRejeitar;
        // ✅ NÃO limpar campos se já estiverem pré-preenchidos (readonly)
        if (!inputNomeRejeitar.readOnly) inputNomeRejeitar.value = '';
        if (!inputEmailRejeitar.readOnly) inputEmailRejeitar.value = '';
        if (!inputTelefoneRejeitar.readOnly) inputTelefoneRejeitar.value = '';
        textareaMotivo.value = '';
        btnConfirmarRejeitar.disabled = true;
      }

      modalAtivo.classList.add('active');
    }

    // Função para fechar modal
    function fecharModal() {
      if (modalAtivo) {
        modalAtivo.classList.remove('active');
        modalAtivo = null;
        tipoAtual = null;
      }
    }

    // Fechar modal ao clicar fora
    [modalAprovar, modalAlterar, modalRejeitar].forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          fecharModal();
        }
      });
    });

    // Validação Modal Aprovar
    function validarAprovar() {
      const aceite = checkboxAceite.checked;
      const nome = inputNome.value.trim();
      const email = inputEmail.value.trim();
      const telefone = inputTelefone.value.trim();
      btnConfirmarAprovar.disabled = !(aceite && nome && email && telefone);
    }

    // Validação Modal Alterar
    function validarAlterar() {
      const nome = inputNomeAlterar.value.trim();
      const email = inputEmailAlterar.value.trim();
      const telefone = inputTelefoneAlterar.value.trim();
      const alteracoes = textareaAlteracoes.value.trim();
      btnConfirmarAlterar.disabled = !(nome && email && telefone && alteracoes);
    }

    // Validação Modal Rejeitar
    function validarRejeitar() {
      const nome = inputNomeRejeitar.value.trim();
      const email = inputEmailRejeitar.value.trim();
      const telefone = inputTelefoneRejeitar.value.trim();
      btnConfirmarRejeitar.disabled = !(nome && email && telefone);
    }

    // Event listeners
    checkboxAceite.addEventListener('change', validarAprovar);
    inputNome.addEventListener('input', validarAprovar);
    inputEmail.addEventListener('input', validarAprovar);
    inputTelefone.addEventListener('input', validarAprovar);

    inputNomeAlterar.addEventListener('input', validarAlterar);
    inputEmailAlterar.addEventListener('input', validarAlterar);
    inputTelefoneAlterar.addEventListener('input', validarAlterar);
    textareaAlteracoes.addEventListener('input', validarAlterar);

    inputNomeRejeitar.addEventListener('input', validarRejeitar);
    inputEmailRejeitar.addEventListener('input', validarRejeitar);
    inputTelefoneRejeitar.addEventListener('input', validarRejeitar);

    // Função confirmar ação
    async function confirmarAcao() {
      let nome, email, telefone, observacoes = '';
      let btnAtivo;

      if (tipoAtual === 'aprovar') {
        nome = inputNome.value.trim();
        email = inputEmail.value.trim();
        telefone = inputTelefone.value.trim();
        btnAtivo = btnConfirmarAprovar;
      } else if (tipoAtual === 'alterar') {
        nome = inputNomeAlterar.value.trim();
        email = inputEmailAlterar.value.trim();
        telefone = inputTelefoneAlterar.value.trim();
        observacoes = textareaAlteracoes.value.trim();
        btnAtivo = btnConfirmarAlterar;
      } else if (tipoAtual === 'rejeitar') {
        nome = inputNomeRejeitar.value.trim();
        email = inputEmailRejeitar.value.trim();
        telefone = inputTelefoneRejeitar.value.trim();
        observacoes = textareaMotivo.value.trim() || 'Sem motivo informado';
        btnAtivo = btnConfirmarRejeitar;
      }

      btnAtivo.disabled = true;
      const textoOriginal = btnAtivo.textContent;
      btnAtivo.textContent = '⏳ Processando...';

      await enviarAprovacao(tipoAtual, nome, email, telefone, observacoes);

      btnAtivo.textContent = textoOriginal;
    }

    // Função para enviar aprovação
    async function enviarAprovacao(tipo, responsavel, email, telefone, observacoes) {

      try {
        const response = await fetch(supabaseUrl + '/rest/v1/aprovacoes_ftc_cliente', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': 'Bearer ' + supabaseAnonKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            ficha_id: fichaId,
            numero_ftc: numeroFTC,
            tipo: tipo,
            responsavel: responsavel,
            email: email,
            telefone: telefone,
            observacoes: observacoes || null,
            versao_ftc: versaoFTC
          })
        });

        if (response.ok) {
          alert('✅ Sua resposta foi registrada com sucesso! Obrigado.');
          window.location.reload();
        } else {
          const errorData = await response.json();
          console.error('Erro ao enviar aprovação:', errorData);
          alert('Erro ao enviar aprovação. Por favor, tente novamente ou entre em contato conosco.');
        }
      } catch (error) {
        console.error('Erro ao enviar aprovação:', error);
        alert('Erro ao enviar aprovação. Por favor, verifique sua conexão e tente novamente.');
      }
    }

    // Verificar se já existe aprovação e ocultar botões
    async function verificarAprovacaoExistente() {
      try {
        console.log('🔍 Verificando aprovações existentes para FTC:', numeroFTC);

        const response = await fetch(
          supabaseUrl + '/rest/v1/aprovacoes_ftc_cliente?ficha_id=eq.' + fichaId,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('❌ Erro ao verificar aprovações');
          return;
        }

        const aprovacoes = await response.json();

        if (aprovacoes && aprovacoes.length > 0) {
          console.log('✅ Já existe(m) aprovação(ões):', aprovacoes.length);

          // Ocultar seção de aprovação
          const approvalSection = document.querySelector('.approval-section');
          if (approvalSection) {
            approvalSection.style.display = 'none';
          }

          // Mostrar mensagem de que já foi respondido
          const container = document.querySelector('.container');
          if (container) {
            const badge = document.createElement('div');
            badge.style.cssText = 'background: #10b981; color: white; padding: 16px 24px; border-radius: 8px; font-size: 14px; margin: 20px; text-align: center; border: 2px solid #059669;';
            badge.innerHTML = '✅ <strong>Esta ficha técnica já recebeu resposta.</strong> Não é possível enviar nova aprovação.';
            container.appendChild(badge);
          }
        } else {
          console.log('ℹ️ Nenhuma aprovação encontrada. Botões disponíveis.');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar aprovações:', error);
      }
    }

    // Event listeners nos botões
    document.addEventListener('DOMContentLoaded', function() {
      // Verificar se já existe aprovação antes de habilitar botões
      verificarAprovacaoExistente();

      const botoes = document.querySelectorAll('.btn[data-tipo]');
      botoes.forEach(btn => {
        btn.addEventListener('click', function() {
          const tipo = this.getAttribute('data-tipo');
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
            return false;
          }

          console.log('📧 Parâmetros de contato detectados na URL:', { nome, email, telefone });

          // Preencher campos de TODOS os 3 modais
          const tipos = [
            { ids: { nome: 'inputNome', email: 'inputEmail', telefone: 'inputTelefone' } },
            { ids: { nome: 'inputNomeAlterar', email: 'inputEmailAlterar', telefone: 'inputTelefoneAlterar' } },
            { ids: { nome: 'inputNomeRejeitar', email: 'inputEmailRejeitar', telefone: 'inputTelefoneRejeitar' } }
          ];

          tipos.forEach(({ ids }) => {
            const inputNome = document.getElementById(ids.nome);
            const inputEmail = document.getElementById(ids.email);
            const inputTelefone = document.getElementById(ids.telefone);

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
          return true;
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
          const response = await fetch(supabaseUrl + '/rest/v1/aprovacao_tokens?token=eq.' + token + '&select=*', {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': 'Bearer ' + supabaseAnonKey
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
          const tipos = [
            { ids: { nome: 'inputNome', email: 'inputEmail', telefone: 'inputTelefone' } },
            { ids: { nome: 'inputNomeAlterar', email: 'inputEmailAlterar', telefone: 'inputTelefoneAlterar' } },
            { ids: { nome: 'inputNomeRejeitar', email: 'inputEmailRejeitar', telefone: 'inputTelefoneRejeitar' } }
          ];

          tipos.forEach(({ ids }) => {
            const inputNome = document.getElementById(ids.nome);
            const inputEmail = document.getElementById(ids.email);
            const inputTelefone = document.getElementById(ids.telefone);

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
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-radius: 12px;
      text-align: center;
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-alterar {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .btn-rejeitar {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    /* MODAL DE APROVAÇÃO - Padrão Orçamento */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 700px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px 12px 0 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20pt;
    }

    .modal-body {
      padding: 30px;
    }

    .termo-responsabilidade {
      background: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }

    .termo-responsabilidade h3 {
      margin-top: 0;
      color: #1f2937;
      font-size: 14pt;
    }

    .termo-responsabilidade ol {
      margin: 15px 0;
      padding-left: 20px;
    }

    .termo-responsabilidade li {
      margin: 10px 0;
      line-height: 1.6;
      color: #374151;
    }

    .termo-footer {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
      color: #92400e;
      text-align: center;
    }

    .checkbox-container {
      display: flex;
      align-items: start;
      gap: 12px;
      margin: 20px 0;
      padding: 15px;
      background: #ecfdf5;
      border-radius: 8px;
      border: 2px solid #10b981;
    }

    .checkbox-container input[type="checkbox"] {
      width: 24px;
      height: 24px;
      cursor: pointer;
      margin-top: 2px;
    }

    .checkbox-container label {
      flex: 1;
      cursor: pointer;
      line-height: 1.6;
      color: #1f2937;
      font-weight: 500;
    }

    .form-group {
      margin: 15px 0;
    }

    .form-group label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
      color: #374151;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 11pt;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #10b981;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      padding: 20px 30px;
      background: #f9fafb;
      border-radius: 0 0 12px 12px;
    }

    .modal-footer button {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 12pt;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modal-footer button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancelar {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-cancelar:hover:not(:disabled) {
      background: #d1d5db;
    }

    .btn-confirmar {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-confirmar:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    @media (max-width: 768px) {
      .btn-container {
        grid-template-columns: 1fr;
      }

      .modal-content {
        width: 95%;
        margin: 5% auto;
      }

      .modal-header h2 {
        font-size: 16pt;
      }

      .modal-body {
        padding: 20px;
      }

      .form-group input,
      .form-group textarea {
        font-size: 10pt;
      }

      .modal-footer {
        flex-direction: column;
        padding: 15px 20px;
      }

      .modal-footer button {
        width: 100%;
        font-size: 11pt;
      }
    }

    @media print {
      .approval-section {
        display: none !important;
      }

      .modal-overlay {
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
