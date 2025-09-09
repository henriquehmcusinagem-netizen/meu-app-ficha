import { FormData, Material, Foto, Calculos } from "@/types/ficha-tecnica";
import { formatCurrency } from "@/utils/calculations";

interface PrintLayoutProps {
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];
  calculos: Calculos;
  numeroFTC: string;
  dataAtual: string;
}

export function PrintLayout({ 
  formData, 
  materiais, 
  fotos, 
  calculos, 
  numeroFTC, 
  dataAtual 
}: PrintLayoutProps) {
  // Filter materials with data
  const materiaisPreenchidos = materiais.filter(m => 
    m.descricao.trim() || Number(m.quantidade) > 0 || Number(m.valor_unitario) > 0
  );

  // Helper to display radio value
  const formatRadioValue = (value: string) => value || "—";
  
  // Helper to display checkbox as X or —
  const formatCheckbox = (value: boolean) => value ? "✓" : "—";

  return (
    <div className="print-layout hidden print:block print-container">
      {/* Header */}
      <div className="print-header">
        <div className="header-info">
          <span>Data: {dataAtual}</span>
          <h1>FICHA TÉCNICA DE COTAÇÃO - FTC</h1>
          <span>Nº {numeroFTC}</span>
        </div>
      </div>

      {/* Cliente Data */}
      <div className="print-section">
        <div className="print-title">DADOS DO CLIENTE</div>
        <div className="print-grid print-grid-2">
          <div className="print-field">
            <div className="print-label">CLIENTE:</div>
            <div className="print-value">{formData.cliente || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">SOLICITANTE:</div>
            <div className="print-value">{formData.solicitante || "—"}</div>
          </div>
        </div>
        <div className="print-grid print-grid-3">
          <div className="print-field">
            <div className="print-label">FONE/EMAIL:</div>
            <div className="print-value">{formData.fone_email || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">DATA VISITA:</div>
            <div className="print-value">{formData.data_visita || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">DATA ENTREGA:</div>
            <div className="print-value">{formData.data_entrega || "—"}</div>
          </div>
        </div>
      </div>

      {/* Peça/Equipamento */}
      <div className="print-section">
        <div className="print-title">DADOS DA PEÇA/EQUIPAMENTO</div>
        <div className="print-grid print-grid-2">
          <div className="print-field">
            <div className="print-label">NOME DA PEÇA/EQUIPAMENTO:</div>
            <div className="print-value">{formData.nome_peca || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">QUANTIDADE:</div>
            <div className="print-value">{formData.quantidade || "1"}</div>
          </div>
        </div>
        <div className="print-field">
          <div className="print-label">SERVIÇO A SER REALIZADO:</div>
          <div className="print-value">{formData.servico || "—"}</div>
        </div>
      </div>

      {/* Materials */}
      {materiaisPreenchidos.length > 0 && (
        <div className="print-section">
          <div className="print-title">MATERIAL PARA COTAÇÃO</div>
          <table className="print-table">
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
              {materiaisPreenchidos.slice(0, 6).map(material => (
                <tr key={material.id}>
                  <td>{material.descricao || "—"}</td>
                  <td>{material.quantidade || "—"}</td>
                  <td>{material.fornecedor || "—"}</td>
                  <td>{material.cliente_interno || "—"}</td>
                  <td>{material.valor_unitario ? formatCurrency(Number(material.valor_unitario)) : "—"}</td>
                  <td>{material.valor_total ? formatCurrency(Number(material.valor_total)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Execução */}
      <div className="print-section">
        <div className="print-title">EXECUÇÃO E DETALHES</div>
        <div className="print-grid print-grid-4">
          <div className="print-field">
            <div className="print-label">EXECUTADO EM:</div>
            <div className="print-value print-radio-group">
              <span className="print-radio-item">HMC: {formData.execucao === 'HMC' ? '✓' : '—'}</span>
              <span className="print-radio-item">Cliente: {formData.execucao === 'CLIENTE' ? '✓' : '—'}</span>
            </div>
          </div>
          <div className="print-field">
            <div className="print-label">VISITA TÉCNICA:</div>
            <div className="print-value print-radio-group">
              <span className="print-radio-item">Sim: {formData.visita_tecnica === 'SIM' ? '✓' : '—'}</span>
              <span className="print-radio-item">Não: {formData.visita_tecnica === 'NAO' ? '✓' : '—'}</span>
            </div>
          </div>
          <div className="print-field">
            <div className="print-label">HORAS VISITA:</div>
            <div className="print-value">{formData.visita_horas || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">PEÇA AMOSTRA:</div>
            <div className="print-value">{formatRadioValue(formData.tem_peca_amostra)}</div>
          </div>
        </div>
        <div className="print-grid print-grid-3">
          <div className="print-field">
            <div className="print-label">PROJETO POR:</div>
            <div className="print-value">{formatRadioValue(formData.projeto_desenvolvido_por)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">DESENHO:</div>
            <div className="print-value">{formatRadioValue(formData.desenho_peca)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">FINALIZADO:</div>
            <div className="print-value">{formatRadioValue(formData.desenho_finalizado)}</div>
          </div>
        </div>
      </div>

      {/* Treatments */}
      <div className="print-section">
        <div className="print-title">TRATAMENTOS</div>
        <div className="print-grid print-grid-4">
          <div className="print-field">
            <div className="print-label">PINTURA:</div>
            <div className="print-value">{formatRadioValue(formData.pintura)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">COR:</div>
            <div className="print-value">{formData.cor_pintura || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">GALVANIZAÇÃO:</div>
            <div className="print-value">{formatRadioValue(formData.galvanizacao)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">TRAT. TÉRMICO:</div>
            <div className="print-value">{formatRadioValue(formData.tratamento_termico)}</div>
          </div>
        </div>
      </div>

      {/* Service Hours */}
      <div className="print-section">
        <div className="print-title">HORAS DE SERVIÇO</div>
        <div className="print-grid print-grid-8">
          {[
            { label: "TORNO G", value: formData.torno_grande },
            { label: "TORNO P", value: formData.torno_pequeno },
            { label: "CNC", value: formData.cnc_tf },
            { label: "FRESA", value: formData.fresa_furad },
            { label: "SOLDA", value: formData.macarico_solda },
            { label: "PINTURA", value: formData.pintura_horas },
            { label: "PLASMA", value: formData.plasma_oxicorte },
            { label: "DOBRA", value: formData.dobra },
            { label: "ENG/TEC", value: formData.eng_tec },
            { label: "TRAT.", value: formData.tratamento }
          ].filter(h => parseFloat(h.value || "0") > 0).map(hour => (
            <div key={hour.label} className="print-field">
              <div className="print-label">{hour.label}:</div>
              <div className="print-value">{hour.value}h</div>
            </div>
          ))}
        </div>
      </div>


      {/* Transport */}
      <div className="print-section">
        <div className="print-title">TRANSPORTE</div>
        <div className="print-grid print-grid-3">
          <div className="print-field">
            <div className="print-label">CAMINHÃO HMC:</div>
            <div className="print-value">{formatCheckbox(formData.transporte_caminhao_hmc)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">PICKUP HMC:</div>
            <div className="print-value">{formatCheckbox(formData.transporte_pickup_hmc)}</div>
          </div>
          <div className="print-field">
            <div className="print-label">CLIENTE:</div>
            <div className="print-value">{formatCheckbox(formData.transporte_cliente)}</div>
          </div>
        </div>
      </div>

      {/* Control */}
      <div className="print-section">
        <div className="print-title">CONTROLE</div>
        <div className="print-grid print-grid-3">
          <div className="print-field">
            <div className="print-label">Nº ORÇAMENTO:</div>
            <div className="print-value">{formData.num_orcamento || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">OS:</div>
            <div className="print-value">{formData.num_os || "—"}</div>
          </div>
          <div className="print-field">
            <div className="print-label">NF:</div>
            <div className="print-value">{formData.num_nf_remessa || "—"}</div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="print-totals">
        <div className="print-title">RESUMO DOS CÁLCULOS</div>
        <div className="print-grid print-grid-4">
          <div className="total-item">
            <div className="print-label">Horas/Peça</div>
            <div className="print-value">{calculos.horasPorPeca.toFixed(1)}h</div>
          </div>
          <div className="total-item">
            <div className="print-label">Horas Total</div>
            <div className="print-value">{calculos.horasTodasPecas.toFixed(1)}h</div>
          </div>
          <div className="total-item">
            <div className="print-label">Material/Peça</div>
            <div className="print-value">{formatCurrency(calculos.materialPorPeca)}</div>
          </div>
          <div className="total-item">
            <div className="print-label">Material Total</div>
            <div className="print-value">{formatCurrency(calculos.materialTodasPecas)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}