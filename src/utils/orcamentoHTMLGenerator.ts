import { FichaSalva, OrcamentoData } from '@/types/ficha-tecnica';
import { formatCurrency } from './helpers';

/**
 * Escape HTML special characters to prevent XSS
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
 * Escape JavaScript string literals
 */
function escapeJs(str: string | undefined): string {
  if (!str) {
    console.warn('[orcamentoHTMLGenerator] escapeJs() recebeu string vazia ou undefined');
    return '';
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Gera HTML minimalista e profissional para ORÇAMENTO COMERCIAL
 * Este HTML é enviado para o DEPARTAMENTO DE COMPRAS aprovar
 * Contém apenas informações comerciais (preços, prazos, condições)
 * SEM detalhes técnicos de produção (horas, processos, etc)
 */
export async function generateOrcamentoHTML(
  ficha: FichaSalva,
  supabaseUrl: string,
  supabaseAnonKey: string,
  versaoOrcamento: number = 1
): Promise<string> {
  // Validação de parâmetros obrigatórios
  if (!ficha.id) {
    throw new Error('Ficha não possui ID válido');
  }
  if (!ficha.numeroFTC) {
    throw new Error('Ficha não possui número FTC válido');
  }
  if (!supabaseUrl) {
    throw new Error('Supabase URL não fornecida');
  }
  if (!supabaseAnonKey) {
    throw new Error('Supabase Anon Key não fornecida - necessária para sistema de aprovação');
  }

  const orcamento = ficha.formData.dados_orcamento
    ? (typeof ficha.formData.dados_orcamento === 'string'
        ? JSON.parse(ficha.formData.dados_orcamento)
        : ficha.formData.dados_orcamento)
    : null;

  if (!orcamento) {
    throw new Error('Ficha não possui dados de orçamento');
  }

  const orcamentoData = orcamento as OrcamentoData;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento ${ficha.numeroFTC} - HMC Usinagem</title>
  <style>
    /* DESIGN INDUSTRIAL PRETO E BRANCO - ORÇAMENTO PROFISSIONAL */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 0;
    }

    .container {
      max-width: 210mm; /* Largura A4 */
      margin: 20px auto;
      background: #fff;
      border: 2px solid #000;
    }

    .header {
      background: #fff;
      color: #000;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #000;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }

    .header .subtitle {
      font-size: 16px;
      font-weight: 400;
    }

    .content {
      padding: 30px 25px;
    }

    .badge {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }

    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #000;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .info-item {
      background: #fff;
      padding: 12px;
      border: 1px solid #ddd;
    }

    .info-label {
      font-size: 11px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 15px;
      color: #000;
      font-weight: 600;
    }

    .price-highlight {
      background: #f5f5f5;
      border: 3px solid #000;
      color: #000;
      padding: 25px;
      text-align: center;
      margin: 25px 0;
    }

    .price-highlight .label {
      font-size: 13px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .price-highlight .value {
      font-size: 42px;
      font-weight: 700;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border: 1px solid #000;
    }

    thead {
      background: #000;
      color: #fff;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #000;
    }

    td {
      padding: 10px 12px;
      border: 1px solid #ddd;
      font-size: 14px;
    }

    tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .text-right {
      text-align: right;
    }

    .btn-container {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 40px;
      flex-wrap: wrap;
      page-break-inside: avoid;
    }

    .btn {
      padding: 14px 28px;
      border: 2px solid transparent;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .btn-aprovar {
      background: #10b981;
      color: #fff;
      border-color: #059669;
    }

    .btn-aprovar:hover {
      background: #059669;
    }

    .btn-alterar {
      background: #f59e0b;
      color: #fff;
      border-color: #d97706;
    }

    .btn-alterar:hover {
      background: #d97706;
    }

    .btn-rejeitar {
      background: #ef4444;
      color: #fff;
      border-color: #dc2626;
    }

    .btn-rejeitar:hover {
      background: #dc2626;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal.active {
      display: flex;
    }

    .modal-content {
      background: #fff;
      padding: 30px;
      border: 2px solid #000;
      max-width: 500px;
      width: 90%;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #000;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #000;
      font-size: 14px;
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #000;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: 2px solid #000;
      outline-offset: -2px;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-cancel {
      background: #666;
      color: #fff;
      border: 1px solid #000;
    }

    .btn-cancel:hover {
      background: #444;
    }

    .btn-submit {
      background: #000;
      color: #fff;
      border: 1px solid #000;
    }

    .btn-submit:hover {
      background: #333;
    }

    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      color: #000;
      font-size: 12px;
      border-top: 2px solid #000;
    }

    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }

      body {
        background: #fff;
        padding: 0;
        margin: 0;
        color: #000;
      }

      .container {
        border: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
      }

      .header {
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .btn-container,
      .modal {
        display: none !important;
      }

      .section {
        page-break-inside: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      thead {
        display: table-header-group;
        background: #000 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .footer {
        page-break-before: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO -->
    <div class="header">
      <h1>ORÇAMENTO COMERCIAL</h1>
      <div class="subtitle">HMC Usinagem e Caldeiraria</div>
    </div>

    <!-- CONTEÚDO -->
    <div class="content">
      <div class="badge">FTC: ${escapeHtml(ficha.numeroFTC)} • Versão: ${versaoOrcamento}</div>

      <!-- DADOS DO CLIENTE -->
      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <table style="margin-top: 0;">
          <tbody>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Cliente</td>
              <td style="width: 70%;">${escapeHtml(ficha.formData.cliente)}</td>
            </tr>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Solicitante</td>
              <td style="width: 70%;">${escapeHtml(ficha.formData.solicitante || '—')}</td>
            </tr>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Peça / Equipamento</td>
              <td style="width: 70%;">${escapeHtml(ficha.formData.nome_peca)}</td>
            </tr>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Quantidade</td>
              <td style="width: 70%;">${escapeHtml(ficha.formData.quantidade)}</td>
            </tr>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Tipo de Serviço</td>
              <td style="width: 70%;">${escapeHtml(ficha.formData.servico)}</td>
            </tr>
            <tr>
              <td style="width: 30%; font-weight: 600; background: #f5f5f5;">Data de Entrega</td>
              <td style="width: 70%;">${ficha.formData.data_entrega || '—'}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="width: 30%; font-weight: 700; font-size: 16px;">VALOR TOTAL</td>
              <td style="width: 70%; font-weight: 700; font-size: 20px;">${formatCurrency(orcamentoData.precoVendaFinal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ITENS DO ORÇAMENTO -->
      ${orcamentoData.itens && orcamentoData.itens.length > 0 ? `
      <div class="section">
        <div class="section-title">📦 Itens do Orçamento</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Descrição</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Valor Unit.</th>
              <th class="text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${orcamentoData.itens.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.descricao)}</td>
              <td class="text-right">${item.quantidade}</td>
              <td class="text-right">${formatCurrency(item.valorUnitario)}</td>
              <td class="text-right"><strong>${formatCurrency(item.valorTotal)}</strong></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- CONDIÇÕES COMERCIAIS -->
      <div class="section">
        <div class="section-title">📄 Condições Comerciais</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Prazo de Entrega</div>
            <div class="info-value">${orcamentoData.config.prazoEntrega} dias úteis</div>
          </div>
          <div class="info-item">
            <div class="info-label">Validade da Proposta</div>
            <div class="info-value">${orcamentoData.config.validadeProposta} dias</div>
          </div>
          <div class="info-item">
            <div class="info-label">Prazo de Pagamento</div>
            <div class="info-value">${orcamentoData.config.prazoPagamento} dias</div>
          </div>
          <div class="info-item">
            <div class="info-label">Garantia</div>
            <div class="info-value">${orcamentoData.config.garantia} dias</div>
          </div>
          <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Condições de Pagamento</div>
            <div class="info-value">${escapeHtml(orcamentoData.config.condicoesPagamento || '—')}</div>
          </div>
        </div>
      </div>

      <!-- BOTÕES DE APROVAÇÃO -->
      <div class="section">
        <div class="section-title">Aprovação do Orçamento</div>
        <p style="text-align: center; color: #666; margin-bottom: 25px;">
          Por favor, indique sua decisão sobre este orçamento:
        </p>
        <div class="btn-container">
          <button class="btn btn-aprovar" onclick="openModal('aprovar')">
            ✅ Aprovar Orçamento
          </button>
          <button class="btn btn-alterar" onclick="openModal('alterar')">
            🔄 Solicitar Alterações
          </button>
          <button class="btn btn-rejeitar" onclick="openModal('rejeitar')">
            ❌ Rejeitar Orçamento
          </button>
        </div>
      </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer">
      <strong>HMC Usinagem e Caldeiraria</strong><br>
      Este orçamento foi gerado automaticamente pelo sistema de Fichas Técnicas HMC
    </div>
  </div>

  <!-- MODAIS DE APROVAÇÃO -->
  ${gerarModaisAprovacao(ficha.numeroFTC, ficha.id, supabaseUrl, supabaseAnonKey, versaoOrcamento)}

  <!-- SCRIPTS -->
  ${gerarScripts(ficha.numeroFTC, ficha.id, supabaseUrl, supabaseAnonKey, versaoOrcamento)}
</body>
</html>`;
}

/**
 * Gera os modais de aprovação/alteração/rejeição
 */
function gerarModaisAprovacao(
  numeroFTC: string,
  fichaId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  versaoOrcamento: number
): string {
  return `
  <!-- Modal Aprovar -->
  <div class="modal" id="modal-aprovar">
    <div class="modal-content">
      <div class="modal-title">✅ Aprovar Orçamento</div>
      <form id="form-aprovar">
        <div class="form-group">
          <label class="form-label">Nome do Responsável *</label>
          <input type="text" class="form-input" name="responsavel" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" name="email" required>
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input type="tel" class="form-input" name="telefone">
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" name="observacoes"></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('aprovar')">Cancelar</button>
          <button type="submit" class="btn btn-submit">Confirmar Aprovação</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Alterar -->
  <div class="modal" id="modal-alterar">
    <div class="modal-content">
      <div class="modal-title">🔄 Solicitar Alterações</div>
      <form id="form-alterar">
        <div class="form-group">
          <label class="form-label">Nome do Responsável *</label>
          <input type="text" class="form-input" name="responsavel" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" name="email" required>
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input type="tel" class="form-input" name="telefone">
        </div>
        <div class="form-group">
          <label class="form-label">Alterações Solicitadas *</label>
          <textarea class="form-textarea" name="observacoes" required placeholder="Descreva as alterações que você gostaria de ver neste orçamento..."></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('alterar')">Cancelar</button>
          <button type="submit" class="btn btn-submit">Enviar Solicitação</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Rejeitar -->
  <div class="modal" id="modal-rejeitar">
    <div class="modal-content">
      <div class="modal-title">❌ Rejeitar Orçamento</div>
      <form id="form-rejeitar">
        <div class="form-group">
          <label class="form-label">Nome do Responsável *</label>
          <input type="text" class="form-input" name="responsavel" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" name="email" required>
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input type="tel" class="form-input" name="telefone">
        </div>
        <div class="form-group">
          <label class="form-label">Motivo da Rejeição *</label>
          <textarea class="form-textarea" name="observacoes" required placeholder="Por favor, explique o motivo da rejeição..."></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" onclick="closeModal('rejeitar')">Cancelar</button>
          <button type="submit" class="btn btn-submit">Confirmar Rejeição</button>
        </div>
      </form>
    </div>
  </div>
  `;
}

/**
 * Gera os scripts JavaScript para funcionalidade dos modais e submissão
 */
function gerarScripts(
  numeroFTC: string,
  fichaId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  versaoOrcamento: number
): string {
  return `
  <script>
    // Configuração e validação
    const SUPABASE_URL = '${escapeJs(supabaseUrl)}';
    const SUPABASE_ANON_KEY = '${escapeJs(supabaseAnonKey)}';
    const NUMERO_FTC = '${escapeJs(numeroFTC)}';
    const FICHA_ID = '${escapeJs(fichaId)}';
    const VERSAO_ORCAMENTO = ${versaoOrcamento};

    // Validar configurações críticas
    if (!SUPABASE_ANON_KEY) {
      console.error('ERRO CRÍTICO: SUPABASE_ANON_KEY não definida - sistema de aprovação não funcionará!');
    }

    // Funções de controle de modais (expostas globalmente para onclick)
    window.openModal = function(tipo) {
      const modal = document.getElementById('modal-' + tipo);
      if (modal) {
        modal.classList.add('active');
      } else {
        console.error('Modal não encontrado: modal-' + tipo);
      }
    };

    window.closeModal = function(tipo) {
      const modal = document.getElementById('modal-' + tipo);
      if (modal) {
        modal.classList.remove('active');
      }
    };

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Submissão dos formulários
    ['aprovar', 'alterar', 'rejeitar'].forEach(tipo => {
      document.getElementById('form-' + tipo).addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
          ficha_id: FICHA_ID,
          numero_ftc: NUMERO_FTC,
          tipo: tipo,
          responsavel: formData.get('responsavel'),
          email: formData.get('email'),
          telefone: formData.get('telefone') || null,
          observacoes: formData.get('observacoes') || null,
          versao_orcamento: VERSAO_ORCAMENTO,
          ip_address: null, // Pode ser populado via backend se necessário
          user_agent: navigator.userAgent
        };

        try {
          const response = await fetch(SUPABASE_URL + '/rest/v1/aprovacoes_orcamento_cliente', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            alert('✅ Sua resposta foi registrada com sucesso! Obrigado.');
            closeModal(tipo);
            e.target.reset();
          } else {
            const error = await response.text();
            console.error('Erro ao enviar:', error);
            alert('❌ Erro ao enviar sua resposta. Por favor, tente novamente.');
          }
        } catch (error) {
          console.error('Erro:', error);
          alert('❌ Erro ao enviar sua resposta. Por favor, tente novamente.');
        }
      });
    });
  </script>
  `;
}
