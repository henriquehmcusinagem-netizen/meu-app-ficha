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
 * Gera HTML do orçamento com layout EXATO do modelo ftc-orcamento-undefined-1759840232300.html
 * - Logo HMC no canto esquerdo
 * - Layout 3 colunas nos dados do cliente
 * - Cabeçalho da tabela PRETO (fundo preto, texto branco)
 * - Botões de aprovação no final
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

  // Extrair dados do cliente
  const clienteNome = ficha.formData.cliente || '';
  const solicitante = ficha.formData.solicitante || '';
  const telefone = ficha.formData.contato || '';

  // Data atual formatada
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento N. ${ficha.numeroFTC} - HMC</title>
  <style>
    /* MODELO ORÇAMENTO HMC - COM LOGO E LAYOUT 3 COLUNAS */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 20px;
    }

    .container {
      max-width: 210mm; /* A4 */
      margin: 0 auto;
      border: 3px solid #000;
      background: #fff;
    }

    /* CABEÇALHO - COM LOGO */
    .header {
      display: grid;
      grid-template-columns: 200px 1fr 250px;
      border-bottom: 3px solid #000;
      min-height: 140px;
      align-items: center;
    }

    .header-logo {
      padding: 20px;
      border-right: 2px solid #000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .logo-text {
      font-size: 48px;
      font-weight: 900;
      letter-spacing: -2px;
      line-height: 0.9;
      color: #000;
    }

    .logo-subtitle {
      font-size: 14px;
      font-weight: 400;
      margin-top: 2px;
      color: #000;
    }

    .header-center {
      padding: 15px 20px;
      text-align: center;
    }

    .company-name {
      font-size: 13pt;
      font-weight: bold;
      line-height: 1.3;
      margin-bottom: 5px;
    }

    .company-address {
      font-size: 9pt;
      line-height: 1.4;
      margin-bottom: 3px;
    }

    .company-contacts {
      font-size: 9pt;
      line-height: 1.4;
    }

    .header-right {
      padding: 15px 20px;
      text-align: right;
      border-left: 2px solid #000;
    }

    .page-number {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 8px;
    }

    .doc-info {
      font-size: 10pt;
      line-height: 1.6;
    }

    .doc-info strong {
      font-weight: bold;
    }

    /* DADOS DO CLIENTE - GRID 3 COLUNAS */
    .client-section {
      border-bottom: 2px solid #000;
    }

    .client-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      font-size: 9pt;
    }

    .client-item {
      padding: 8px 12px;
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      display: flex;
      align-items: center;
    }

    .client-item:nth-child(3n) {
      border-right: none;
    }

    .client-label {
      font-weight: bold;
      margin-right: 6px;
    }

    .client-value {
      flex: 1;
    }

    /* TABELA DE ITENS - CABEÇALHO PRETO */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .items-table thead {
      background: #000;
      color: #fff;
    }

    .items-table thead th {
      padding: 12px 8px;
      text-align: left;
      font-weight: bold;
      border-right: 1px solid #fff;
    }

    .items-table thead th:last-child {
      border-right: none;
    }

    .items-table tbody td {
      padding: 10px 8px;
      border: 1px solid #000;
      vertical-align: top;
    }

    .items-table .text-center {
      text-align: center;
    }

    .items-table .text-right {
      text-align: right;
    }

    .total-row {
      background: #f5f5f5;
    }

    .total-row td {
      font-weight: bold;
      padding: 12px 8px;
    }

    /* CONDIÇÕES COMERCIAIS */
    .commercial-conditions {
      padding: 20px;
      border-bottom: 2px solid #000;
      font-size: 10pt;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .condition-item {
      display: flex;
      align-items: baseline;
    }

    .condition-label {
      font-weight: bold;
      margin-right: 6px;
    }

    /* OBSERVAÇÃO */
    .observation-section {
      padding: 20px;
      border-bottom: 2px solid #000;
    }

    .observation-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 11pt;
    }

    .signature {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #000;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    /* INFORMAÇÕES PÓS-APROVAÇÃO */
    .post-approval-section {
      padding: 20px;
      border-bottom: 2px solid #000;
      font-size: 9pt;
      line-height: 1.6;
    }

    .post-approval-section h3 {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 10px;
      margin-top: 15px;
    }

    .post-approval-section h3:first-child {
      margin-top: 0;
    }

    .post-approval-section ul {
      margin-left: 20px;
      margin-top: 8px;
    }

    .post-approval-section li {
      margin-bottom: 8px;
    }

    /* SEÇÃO DE APROVAÇÃO */
    .approval-section {
      padding: 30px 20px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      text-align: center;
    }

    .approval-title {
      font-size: 16pt;
      font-weight: bold;
      color: #065f46;
      margin-bottom: 10px;
    }

    .approval-subtitle {
      font-size: 10pt;
      color: #047857;
      margin-bottom: 25px;
    }

    .btn-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      max-width: 800px;
      margin: 0 auto;
    }

    .btn {
      padding: 15px 25px;
      font-size: 13pt;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
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

    /* FOOTER */
    .footer {
      padding: 15px 20px;
      text-align: center;
      font-size: 8pt;
      color: #666;
      border-top: 2px solid #000;
    }

    /* MODAL DE APROVAÇÃO */
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

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 11pt;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
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

    /* IMPRESSÃO */
    @media print {
      body {
        padding: 0;
      }
      .container {
        border: none;
        max-width: 100%;
      }
      .btn-container {
        display: none;
      }
      .approval-section {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO COM LOGO -->
    <div class="header">
      <div class="header-logo">
        <div class="logo-text">HMC</div>
        <div class="logo-subtitle">usinagem</div>
      </div>

      <div class="header-center">
        <div class="company-name">HMC MANUTENÇÃO E COMERCIO EIRELI - ME</div>
        <div class="company-address">AV SAO FRANCISCO - CENTRO<br>SANTOS - 11013-202</div>
        <div class="company-contacts">
          FONE/FAX: 3223 3975 - (13) 97413 1051<br>
          CNPJ: 28.899.738/0001-51 - I.E.: 633.777.835.112<br>
          E-mail: contato@hmcusinagem.com.br
        </div>
      </div>

      <div class="header-right">
        <div class="page-number">Página: 1</div>
        <div class="doc-info">
          <strong>Data:</strong><br>${dataFormatada}<br>
          <strong>Orçamento N.:</strong><br>${ficha.numeroFTC}
        </div>
      </div>
    </div>

    <!-- DADOS DO CLIENTE - 2x2 SIMPLIFICADO -->
    <div class="client-section">
      <div class="client-grid">
        <div class="client-item" style="grid-column: span 3;">
          <span class="client-label">CLIENTE:</span>
          <span class="client-value">${escapeHtml(clienteNome)}</span>
        </div>
        <div class="client-item" style="grid-column: span 3;">
          <span class="client-label">CNPJ:</span>
          <span class="client-value">${escapeHtml(ficha.formData.cnpj || '—')}</span>
        </div>

        <div class="client-item" style="grid-column: span 3;">
          <span class="client-label">SOLICITANTE:</span>
          <span class="client-value">${escapeHtml(solicitante || '—')}</span>
        </div>
        <div class="client-item" style="grid-column: span 3;">
          <span class="client-label">FONE/EMAIL:</span>
          <span class="client-value">${escapeHtml(telefone || '—')}</span>
        </div>
      </div>
    </div>

    <br>

    <!-- TABELA DE ITENS - CABEÇALHO PRETO -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 8%;">ITEM</th>
          <th class="text-center" style="width: 12%;">QUANTIDADE</th>
          <th style="width: 57%;">DESCRIÇÃO</th>
          <th class="text-right" style="width: 11%;">VL.UNITÁRIO</th>
          <th class="text-right" style="width: 12%;">VL.TOTAL COM IPI</th>
        </tr>
      </thead>
      <tbody>
        ${orcamentoData.itens?.map((item: any, index: number) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="text-center">${item.quantidade || 0}</td>
          <td>${escapeHtml(item.descricao || '')}</td>
          <td class="text-right">${formatCurrency(item.valorUnitario || 0)}</td>
          <td class="text-right">${formatCurrency(item.valorTotal || 0)}</td>
        </tr>
        `).join('') || ''}
        <tr class="total-row">
          <td colspan="4" class="text-right">TOTAL:</td>
          <td class="text-right">${formatCurrency(orcamentoData.precoVendaFinal || 0)}</td>
        </tr>
      </tbody>
    </table>

    <!-- CONDIÇÕES COMERCIAIS -->
    <div class="commercial-conditions">
      <div class="condition-item">
        <span class="condition-label">VALIDADE DA PROPOSTA:</span>
        <span>${orcamentoData.config?.validadeProposta || '30'} dias</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">PRAZO DE ENTREGA:</span>
        <span>${orcamentoData.config?.prazoEntrega || '10'} DIAS</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">CONDIÇÃO DE PAGAMENTO:</span>
        <span>${orcamentoData.config?.condicoesPagamento || '28 dias'}</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">TIPO DO FRETE:</span>
        <span>${orcamentoData.config?.tipoFrete || 'CIF'}</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">GARANTIA:</span>
        <span>${orcamentoData.config?.garantia || '90'} dias</span>
      </div>
    </div>

    <!-- ASSINATURA -->
    <div class="observation-section">
      <div>Atenciosamente</div>
      <div class="signature">
        HENRIQUE - contato@hmcusinagem.com.br
      </div>
    </div>

    <!-- OBSERVAÇÕES -->
    <div class="post-approval-section">
      <h3>OBSERVAÇÕES</h3>
      <ul>
        <li>Para iniciação dos serviços / fabricação é necessário o envio do pedido de compras ou link de aprovação. (não será aceito de forma verbal)</li>
        <li>Em caso de cadastro não aprovado, só será iniciado o processo após a confirmação do pagamento pelo nosso financeiro (enviar comprovante para financeiro@hmcusinagem.com.br)</li>
        <li>O prazo de entrega será contado a partir do dia seguinte da confirmação do pedido.</li>
        <li>O prazo é expresso em dias uteis.</li>
        <li>Em caso de aprovação Emergencial será acrescentado adicional de urgência / adicional 50% aos Sábados / adicional 100% aos domingos e feriados. (será feito a avaliação conforme a necessidade)</li>
        <li>A HMC não aceitará cancelamento de pedido após a sua confirmação, por ser um processo de fabricação sob encomenda de peças feitas especificamente para cada.</li>
        <li>Não nos responsabilizamos por prejuízos em produtos fabricados sob encomenda e de acordo com desenho e instruções de clientes, sendo de inteira responsabilidade do cliente</li>
      </ul>
    </div>

    <!-- SEÇÃO DE APROVAÇÃO -->
    <div class="approval-section">
      <div class="approval-title">✅ SISTEMA DE APROVAÇÃO DO ORÇAMENTO</div>
      <div class="approval-subtitle">Por favor, indique sua decisão sobre este orçamento clicando em uma das opções abaixo:</div>
      <div class="btn-container">
        <button class="btn btn-aprovar" data-tipo="aprovar">✅ APROVAR ORÇAMENTO</button>
        <button class="btn btn-alterar" data-tipo="alterar">🔄 SOLICITAR ALTERAÇÕES</button>
        <button class="btn btn-rejeitar" data-tipo="rejeitar">❌ REJEITAR ORÇAMENTO</button>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <strong>HMC Usinagem e Caldeiraria</strong>
    </div>
  </div>

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
            <li>Possuo autorização e competência legal para aprovar este orçamento em nome da empresa contratante;</li>
            <li>Estou ciente de que esta aprovação gera compromisso financeiro e comercial entre as partes;</li>
            <li>Confirmo que todos os dados, especificações e valores apresentados estão corretos;</li>
            <li>Aceito as condições comerciais propostas (prazo de entrega, forma de pagamento, garantia e validade);</li>
            <li>Compreendo que mesmo havendo processo de compras posterior, esta aprovação confirma a intenção comercial;</li>
            <li>Assumo total responsabilidade por esta aprovação perante minha organização.</li>
          </ol>
          <p><strong>Esta aprovação será considerada como aceite formal do orçamento apresentado pela H M C - MANUTENÇÃO E SERVICOS LTDA.</strong></p>
        </div>

        <div class="checkbox-container">
          <input type="checkbox" id="checkboxAceite" />
          <label for="checkboxAceite">
            Declaro que li, entendi e aceito integralmente os termos de responsabilidade acima, confirmando minha autorização para aprovação deste orçamento.
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
          ⚠️ ATENÇÃO: Ao confirmar, você está formalizando a aprovação deste orçamento sob sua responsabilidade.
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
        <h2>🔄 Solicitar Alterações no Orçamento</h2>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 20px; line-height: 1.6;">
          Use este formulário para solicitar alterações ou esclarecimentos sobre o orçamento apresentado.
          Nossa equipe comercial entrará em contato com você em breve.
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
          <textarea id="textareaAlteracoes" rows="6" placeholder="Exemplo: Gostaria de alterar a quantidade de peças, prazo de entrega, forma de pagamento, etc."
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
        <h2>❌ Rejeitar Orçamento</h2>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 20px; line-height: 1.6; color: #991b1b; font-weight: bold;">
          ⚠️ Atenção: Esta ação informará que o orçamento não foi aceito.
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

  <script>
    // Sistema de aprovação com modais
    const supabaseUrl = '${escapeJs(supabaseUrl)}';
    const supabaseAnonKey = '${escapeJs(supabaseAnonKey)}';
    const fichaId = '${escapeJs(ficha.id)}';
    const numeroFTC = '${escapeJs(ficha.numeroFTC)}';
    const versaoFTC = ${versaoOrcamento};

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
        inputNome.value = '';
        inputEmail.value = '';
        inputTelefone.value = '';
        btnConfirmarAprovar.disabled = true;
      } else if (tipo === 'alterar') {
        modalAtivo = modalAlterar;
        inputNomeAlterar.value = '';
        inputEmailAlterar.value = '';
        inputTelefoneAlterar.value = '';
        textareaAlteracoes.value = '';
        btnConfirmarAlterar.disabled = true;
      } else if (tipo === 'rejeitar') {
        modalAtivo = modalRejeitar;
        inputNomeRejeitar.value = '';
        inputEmailRejeitar.value = '';
        inputTelefoneRejeitar.value = '';
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

    // Event listeners nos botões
    document.addEventListener('DOMContentLoaded', function() {
      const botoes = document.querySelectorAll('.btn[data-tipo]');
      botoes.forEach(btn => {
        btn.addEventListener('click', function() {
          const tipo = this.getAttribute('data-tipo');
          abrirModalAprovacao(tipo);
        });
      });

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
          // IDs: aprovar -> inputNome, inputEmail, inputTelefone
          // IDs: alterar -> inputNomeAlterar, inputEmailAlterar, inputTelefoneAlterar
          // IDs: rejeitar -> inputNomeRejeitar, inputEmailRejeitar, inputTelefoneRejeitar
          const tipos = [
            { sufixo: '', ids: { nome: 'inputNome', email: 'inputEmail', telefone: 'inputTelefone' } },
            { sufixo: 'Alterar', ids: { nome: 'inputNomeAlterar', email: 'inputEmailAlterar', telefone: 'inputTelefoneAlterar' } },
            { sufixo: 'Rejeitar', ids: { nome: 'inputNomeRejeitar', email: 'inputEmailRejeitar', telefone: 'inputTelefoneRejeitar' } }
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

      // Executar função de pré-preenchimento
      // Se a página já está carregada, executa imediatamente
      // Senão, espera o DOMContentLoaded
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        preencherCamposComToken();
      }
    });
  </script>
</body>
</html>`;
}
