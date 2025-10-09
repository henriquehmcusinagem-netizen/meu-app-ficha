import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MaterialItem } from "@/components/FichaTecnica/MaterialItem";
import { CalculosSummary } from "@/components/FichaTecnica/CalculosSummary";
import { SaveButton } from "@/components/FichaTecnica/SaveButton";
import { FotoUpload } from "@/components/FichaTecnica/FotoUpload";
import DadosClienteForm from "@/components/FichaTecnica/DadosClienteForm";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import { formatCurrency } from "@/utils/helpers";
import { useServiceDescriptionImprovement } from "@/utils/openaiService";
import { generateHTMLContent } from "@/utils/htmlGenerator";
import { Plus, Home, Search, Sparkles, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";

export default function Index() {
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [showImprovedTextModal, setShowImprovedTextModal] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [savedNumeroFTC, setSavedNumeroFTC] = useState<string>('');
  const navigate = useNavigate();
  const { improveWithToast } = useServiceDescriptionImprovement();

  const {
    formData,
    materiais,
    fotos,
    calculos,
    numeroFTC,
    dataAtual,
    updateFormData,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addFoto,
    removeFoto,
    // Save functionality
    fichaId,
    isSaved,
    isModified,
    isSaving,
    salvarFichaTecnica,
    criarNovaFicha,
    fichaCarregada,
    isClone
  } = useFichaTecnica();

  const handleImproveDescription = async () => {
    if (!formData.servico.trim()) {
      return;
    }

    setIsImprovingDescription(true);
    try {
      const improvedTextResult = await improveWithToast(formData.servico);
      setImprovedText(improvedTextResult);
      setShowImprovedTextModal(true);
    } catch (error) {
      logger.error('Erro ao melhorar descritivo do serviço', error);
    } finally {
      setIsImprovingDescription(false);
    }
  };

  // Funções para o modal de texto melhorado
  const handleAcceptImprovedText = () => {
    updateFormData("servico", improvedText);
    setShowImprovedTextModal(false);
    setImprovedText('');
  };

  const handleRejectImprovedText = () => {
    setShowImprovedTextModal(false);
    setImprovedText('');
  };

  // Função para imprimir usando HTML gerado
  const handlePrint = async () => {
    if (!fichaCarregada) {
      logger.warn('Tentativa de impressão sem ficha carregada');
      return;
    }

    try {
      const htmlContent = await generateHTMLContent(fichaCarregada);
      const printWindow = window.open('', '_blank');

      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      logger.error('Erro ao gerar HTML para impressão', error);
    }
  };

  // Função customizada para salvar que captura o numeroFTC real
  const handleSalvarComCaptura = async (status?: string) => {
    const result = await salvarFichaTecnica(status);

    if (result.success && result.numeroFTC) {
      setSavedNumeroFTC(result.numeroFTC);
    }

    return result;
  };

  const sectionStyle = "bg-card rounded-md mb-2 p-3 md:p-4 shadow-sm border border-border";
  const gridStyle = "grid gap-2 md:gap-3";
  const fieldStyle = "flex flex-col";
  const labelStyle = "text-xs font-medium text-muted-foreground mb-0.5 uppercase tracking-wide";
  const inputStyle = "h-11 border border-border rounded px-3 text-base transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background text-foreground";
  const textareaStyle = "min-h-[60px] border border-border rounded px-3 py-2 text-base resize-y transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background text-foreground";

  return (
    <div className="max-w-7xl mx-auto p-2 md:p-4 bg-background min-h-screen">
      {/* Header Ultra-Compacto */}
      <div className="text-center mb-3 p-3 bg-card text-card-foreground rounded-md border border-border shadow-sm">
        <h1 className="text-2xl mb-2 font-bold">🔧 FICHA TÉCNICA DE COTAÇÃO - HMC USINAGEM</h1>
        <div className="text-lg opacity-80">
          FTC Nº: <span className="font-semibold">{numeroFTC.startsWith('DRAFT') ? 'RASCUNHO' : numeroFTC}</span>
          {isSaved && !isModified && !numeroFTC.startsWith('DRAFT') && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">SALVO</span>
          )}
          {(isModified || numeroFTC.startsWith('DRAFT')) && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
              {numeroFTC.startsWith('DRAFT') ? 'NOVO' : 'MODIFICADO'}
            </span>
          )}
        </div>
      </div>

      <form className="space-y-2">
        {/* DADOS DO CLIENTE - Integrado com Cadastros */}
        <DadosClienteForm
          formData={formData}
          updateFormData={updateFormData}
          sectionStyle={sectionStyle}
          gridStyle={gridStyle}
          fieldStyle={fieldStyle}
          labelStyle={labelStyle}
          inputStyle={inputStyle}
        />

        {/* PEÇA - Layout Vertical */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            ⚙️ DADOS DA PEÇA/EQUIPAMENTO
          </div>
          <div className={`${gridStyle} grid-cols-1 md:grid-cols-4 gap-3`}>
            <div className={`${fieldStyle} md:col-span-3`}>
              <label className={labelStyle}>Nome da Peça/Equipamento</label>
              <Textarea
                className={textareaStyle}
                placeholder="Descrição da peça ou equipamento"
                value={formData.nome_peca || ""}
                onChange={(e) => updateFormData("nome_peca", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Quantidade</label>
              <Input
                type="number"
                min="1"
                className={inputStyle}
                value={formData.quantidade || ""}
                onChange={(e) => updateFormData("quantidade", e.target.value)}
              />
            </div>
          </div>
          <div className={`${fieldStyle} mt-3`}>
            <label className={labelStyle}>Serviço a ser Realizado</label>
            <div className="relative">
              <Textarea
                className={textareaStyle}
                placeholder="Descrição detalhada do serviço"
                value={formData.servico || ""}
                onChange={(e) => updateFormData("servico", e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleImproveDescription}
                disabled={!formData.servico?.trim() || isImprovingDescription}
                className="mt-2 h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {isImprovingDescription ? "Processando..." : "🤖 Melhorar com IA"}
              </Button>
            </div>
          </div>

          {/* Upload de Fotos */}
          <div className="mt-3">
            <FotoUpload fotos={fotos} onAddFoto={addFoto} onRemoveFoto={removeFoto} />
          </div>
        </div>

        {/* MATERIAIS - Ultra Compacto */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            📦 MATERIAL PARA COTAÇÃO
          </div>

          {/* Cabeçalho dos campos - responsivo */}
          <div className="hidden lg:grid grid-cols-9 gap-2 items-center p-2 bg-muted rounded text-sm font-semibold mb-1.5 text-muted-foreground">
            <div className="text-center">QTD</div>
            <div className="col-span-2">MATERIAL</div>
            <div className="text-center">PREÇO UNIT</div>
            <div className="text-center">ESTOQUE/FORN</div>
            <div>FORNECEDOR</div>
            <div className="text-center">CLIENTE INT</div>
            <div className="text-center">VALOR TOTAL</div>
            <div></div>
          </div>
          {/* Cabeçalho mobile/tablet */}
          <div className="lg:hidden grid grid-cols-2 md:grid-cols-4 gap-2 items-center p-2 bg-muted rounded text-sm font-semibold mb-1.5 text-muted-foreground">
            <div className="text-center">QTD</div>
            <div>MATERIAL</div>
            <div className="text-center md:block hidden">PREÇO</div>
            <div className="md:block hidden">FORNECEDOR</div>
          </div>

          <div className="space-y-1.5">
            {materiais.map((material, index) => (
              <MaterialItem
                key={material.id}
                material={material}
                onUpdate={(field, value) => updateMaterial(material.id, field, value)}
                onRemove={() => removeMaterial(material.id)}
              />
            ))}
          </div>
          <Button
            type="button"
            onClick={addMaterial}
            size="sm"
            className="mt-2 h-8 px-3 text-sm bg-amber-500 hover:bg-amber-600"
          >
            ➕ Material
          </Button>
        </div>

        {/* 🔩 PEÇAS E AMOSTRAS - Nova Seção */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            🔩 PEÇAS E AMOSTRAS
          </div>

          <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3`}>
            {/* Cliente forneceu peça de amostra? */}
            <div className={fieldStyle}>
              <label className={labelStyle}>Cliente forneceu peça amostra?</label>
              <RadioGroup
                value={formData.tem_peca_amostra || ""}
                onValueChange={(value) => updateFormData("tem_peca_amostra", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="amostra-forneceu-sim" className="h-4 w-4" />
                  <Label htmlFor="amostra-forneceu-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="amostra-forneceu-nao" className="h-4 w-4" />
                  <Label htmlFor="amostra-forneceu-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Peça foi desmontada pelo cliente? */}
            <div className={fieldStyle}>
              <label className={labelStyle}>Peça foi desmontada pelo cliente?</label>
              <RadioGroup
                value={formData.peca_foi_desmontada || ""}
                onValueChange={(value) => updateFormData("peca_foi_desmontada", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="desmontada-sim" className="h-4 w-4" />
                  <Label htmlFor="desmontada-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="desmontada-nao" className="h-4 w-4" />
                  <Label htmlFor="desmontada-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {/* A peça é nova ou usada? */}
            <div className={fieldStyle}>
              <label className={labelStyle}>A peça é nova ou usada?</label>
              <RadioGroup
                value={formData.peca_condicao || ""}
                onValueChange={(value) => updateFormData("peca_condicao", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NOVA" id="condicao-nova" className="h-4 w-4" />
                  <Label htmlFor="condicao-nova" className="text-sm">Nova</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="USADA" id="condicao-usada" className="h-4 w-4" />
                  <Label htmlFor="condicao-usada" className="text-sm">Usada</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Precisa de peça de teste / ensaio? */}
            <div className={fieldStyle}>
              <label className={labelStyle}>Precisa de peça de teste / ensaio?</label>
              <RadioGroup
                value={formData.precisa_peca_teste || ""}
                onValueChange={(value) => updateFormData("precisa_peca_teste", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="teste-sim" className="h-4 w-4" />
                  <Label htmlFor="teste-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="teste-nao" className="h-4 w-4" />
                  <Label htmlFor="teste-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Responsável Técnico - 5º campo no grid */}
            <div className={fieldStyle}>
              <label className={labelStyle}>Responsável Técnico</label>
              <Select
                value={formData.responsavel_tecnico || ""}
                onValueChange={(value) => updateFormData("responsavel_tecnico", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carlos">Carlos</SelectItem>
                  <SelectItem value="Lucas">Lucas</SelectItem>
                  <SelectItem value="Henrique">Henrique</SelectItem>
                  <SelectItem value="Fábio">Fábio</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* EXECUÇÃO - Grid Ultra Denso (6 colunas) */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            🔧 EXECUÇÃO E DETALHES
          </div>
          <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 lg:grid-cols-6`}>
            <div className={fieldStyle}>
              <label className={labelStyle}>Execução</label>
              <RadioGroup
                value={formData.execucao || ""}
                onValueChange={(value) => updateFormData("execucao", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="HMC" id="exec-hmc" className="h-4 w-4" />
                  <Label htmlFor="exec-hmc" className="text-sm">HMC</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="CLIENTE" id="exec-cliente" className="h-4 w-4" />
                  <Label htmlFor="exec-cliente" className="text-sm">Cliente</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Visita Técnica</label>
              <RadioGroup
                value={formData.visita_tecnica || ""}
                onValueChange={(value) => updateFormData("visita_tecnica", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="visita-sim" className="h-4 w-4" />
                  <Label htmlFor="visita-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="visita-nao" className="h-4 w-4" />
                  <Label htmlFor="visita-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Horas Visita</label>
              <Input
                type="number"
                step="0.5"
                placeholder="0"
                className={`${inputStyle} max-w-[80px]`}
                value={formData.visita_horas || ""}
                onChange={(e) => updateFormData("visita_horas", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Projeto por</label>
              <Select
                value={formData.projeto_desenvolvido_por || ""}
                onValueChange={(value) => updateFormData("projeto_desenvolvido_por", value)}
              >
                <SelectTrigger className="h-11 max-w-[140px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HMC">HMC</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="HMC/CLIENTE">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Desenho</label>
              <RadioGroup
                value={formData.desenho_peca || ""}
                onValueChange={(value) => updateFormData("desenho_peca", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="HMC" id="desenho-hmc" className="h-4 w-4" />
                  <Label htmlFor="desenho-hmc" className="text-sm">HMC</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="CLIENTE" id="desenho-cliente" className="h-4 w-4" />
                  <Label htmlFor="desenho-cliente" className="text-sm">Cliente</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Finalizado</label>
              <RadioGroup
                value={formData.desenho_finalizado || ""}
                onValueChange={(value) => updateFormData("desenho_finalizado", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="final-sim" className="h-4 w-4" />
                  <Label htmlFor="final-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="final-nao" className="h-4 w-4" />
                  <Label htmlFor="final-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>🚛 Transporte</label>
              <div className="flex gap-1.5 mt-0.5 flex-wrap">
                <div className="flex items-center space-x-0.5">
                  <Checkbox
                    id="transp-caminhao"
                    checked={formData.transporte_caminhao_hmc}
                    onCheckedChange={(checked) => updateFormData("transporte_caminhao_hmc", checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="transp-caminhao" className="text-xs">Caminhão</Label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox
                    id="transp-pickup"
                    checked={formData.transporte_pickup_hmc}
                    onCheckedChange={(checked) => updateFormData("transporte_pickup_hmc", checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="transp-pickup" className="text-xs">Pickup</Label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox
                    id="transp-cliente"
                    checked={formData.transporte_cliente}
                    onCheckedChange={(checked) => updateFormData("transporte_cliente", checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="transp-cliente" className="text-xs">Cliente</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRATAMENTOS - Grid Ultra Denso (6 colunas) */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            🎨 TRATAMENTOS E ACABAMENTOS
          </div>
          <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 lg:grid-cols-6`}>
            <div className={fieldStyle}>
              <label className={labelStyle}>Pintura</label>
              <RadioGroup
                value={formData.pintura || ""}
                onValueChange={(value) => updateFormData("pintura", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="pintura-sim" className="h-4 w-4" />
                  <Label htmlFor="pintura-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="pintura-nao" className="h-4 w-4" />
                  <Label htmlFor="pintura-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Cor</label>
              <Input
                className={inputStyle}
                placeholder="Cor"
                value={formData.cor_pintura || ""}
                onChange={(e) => updateFormData("cor_pintura", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Galvanização</label>
              <RadioGroup
                value={formData.galvanizacao || ""}
                onValueChange={(value) => updateFormData("galvanizacao", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="galv-sim" className="h-4 w-4" />
                  <Label htmlFor="galv-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="galv-nao" className="h-4 w-4" />
                  <Label htmlFor="galv-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Peso Galv</label>
              <Input
                type="number"
                step="0.1"
                placeholder="kg"
                className={`${inputStyle} max-w-[100px]`}
                value={formData.peso_peca_galv || ""}
                onChange={(e) => updateFormData("peso_peca_galv", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Trat. Térmico</label>
              <RadioGroup
                value={formData.tratamento_termico || ""}
                onValueChange={(value) => updateFormData("tratamento_termico", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="trat-sim" className="h-4 w-4" />
                  <Label htmlFor="trat-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="trat-nao" className="h-4 w-4" />
                  <Label htmlFor="trat-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Peso Trat</label>
              <Input
                type="number"
                step="0.1"
                placeholder="kg"
                className={inputStyle}
                value={formData.peso_peca_trat || ""}
                onChange={(e) => updateFormData("peso_peca_trat", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Tempera/Reven</label>
              <Input
                className={inputStyle}
                placeholder="Especificações"
                value={formData.tempera_reven || ""}
                onChange={(e) => updateFormData("tempera_reven", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Cementação</label>
              <Input
                className={inputStyle}
                placeholder="Especificações"
                value={formData.cementacao || ""}
                onChange={(e) => updateFormData("cementacao", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Dureza</label>
              <Input
                className={`${inputStyle} max-w-[100px]`}
                placeholder="HRC"
                value={formData.dureza || ""}
                onChange={(e) => updateFormData("dureza", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Teste LP</label>
              <RadioGroup
                value={formData.teste_lp || ""}
                onValueChange={(value) => updateFormData("teste_lp", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="lp-sim" className="h-4 w-4" />
                  <Label htmlFor="lp-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="lp-nao" className="h-4 w-4" />
                  <Label htmlFor="lp-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>⚖️ Balanceamento</label>
              <RadioGroup
                value={formData.balanceamento_campo || "NAO"}
                onValueChange={(value) => updateFormData("balanceamento_campo", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="bal-sim" className="h-4 w-4" />
                  <Label htmlFor="bal-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="bal-nao" className="h-4 w-4" />
                  <Label htmlFor="bal-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            {formData.balanceamento_campo === "SIM" && (
              <div className={fieldStyle}>
                <label className={labelStyle}>Rotação (RPM)</label>
                <Input
                  className={inputStyle}
                  placeholder="RPM"
                  value={formData.rotacao || ""}
                  onChange={(e) => updateFormData("rotacao", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* SERVIÇOS ESPECIAIS */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            ⚡ SERVIÇOS ESPECIAIS
          </div>
          <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
            <div className={fieldStyle}>
              <label className={labelStyle}>Fornecimento Desenho</label>
              <RadioGroup
                value={formData.fornecimento_desenho || ""}
                onValueChange={(value) => updateFormData("fornecimento_desenho", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="fornec-sim" className="h-4 w-4" />
                  <Label htmlFor="fornec-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="fornec-nao" className="h-4 w-4" />
                  <Label htmlFor="fornec-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Fotos/Relatório</label>
              <RadioGroup
                value={formData.fotos_relatorio || ""}
                onValueChange={(value) => updateFormData("fotos_relatorio", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="fotos-sim" className="h-4 w-4" />
                  <Label htmlFor="fotos-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="fotos-nao" className="h-4 w-4" />
                  <Label htmlFor="fotos-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Relatório Técnico</label>
              <RadioGroup
                value={formData.relatorio_tecnico || ""}
                onValueChange={(value) => updateFormData("relatorio_tecnico", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="rel-sim" className="h-4 w-4" />
                  <Label htmlFor="rel-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="rel-nao" className="h-4 w-4" />
                  <Label htmlFor="rel-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Emissão ART</label>
              <RadioGroup
                value={formData.emissao_art || ""}
                onValueChange={(value) => updateFormData("emissao_art", value)}
                className="flex gap-2 mt-0.5"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="SIM" id="art-sim" className="h-4 w-4" />
                  <Label htmlFor="art-sim" className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="NAO" id="art-nao" className="h-4 w-4" />
                  <Label htmlFor="art-nao" className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* HORAS DE PRODUÇÃO - Reorganizado em 4 Grupos Lógicos */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            ⏱️ HORAS DE PRODUÇÃO
          </div>

          {/* 🔧 GRUPO 1: TORNOS E USINAGEM (6 campos) */}
          <div className="mb-1.5">
            <div className="text-sm font-medium text-muted-foreground mb-1">🔧 Tornos e Usinagem</div>
            <div className={`${gridStyle} grid-cols-2 md:grid-cols-3 lg:grid-cols-6`}>
              <div className={fieldStyle}>
                <label className={labelStyle}>Torno 1200mm</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.torno_grande || ""}
                  onChange={(e) => updateFormData("torno_grande", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Torno 650mm</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.torno_pequeno || ""}
                  onChange={(e) => updateFormData("torno_pequeno", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Torno CNC</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.torno_cnc || ""}
                  onChange={(e) => updateFormData("torno_cnc", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Centro Usinagem</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.centro_usinagem || ""}
                  onChange={(e) => updateFormData("centro_usinagem", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Fresa</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.fresa || ""}
                  onChange={(e) => updateFormData("fresa", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Furadeira</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.furadeira || ""}
                  onChange={(e) => updateFormData("furadeira", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ⚙️ GRUPO 2: CORTE E CONFORMAÇÃO (7 campos) */}
          <div className="mb-1.5">
            <div className="text-sm font-medium text-muted-foreground mb-1">⚙️ Corte e Conformação</div>
            <div className={`${gridStyle} grid-cols-2 md:grid-cols-4 lg:grid-cols-7`}>
              <div className={fieldStyle}>
                <label className={labelStyle}>Plasma/Oxicorte</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.plasma_oxicorte || ""}
                  onChange={(e) => updateFormData("plasma_oxicorte", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Maçarico</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.macarico || ""}
                  onChange={(e) => updateFormData("macarico", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Solda</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.solda || ""}
                  onChange={(e) => updateFormData("solda", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Serra</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.serra || ""}
                  onChange={(e) => updateFormData("serra", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Dobra</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.dobra || ""}
                  onChange={(e) => updateFormData("dobra", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Calandra</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.calandra || ""}
                  onChange={(e) => updateFormData("calandra", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Caldeiraria</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.caldeiraria || ""}
                  onChange={(e) => updateFormData("caldeiraria", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 🔩 GRUPO 3: MONTAGEM E ESPECIAIS (5 campos) */}
          <div className="mb-1.5">
            <div className="text-sm font-medium text-muted-foreground mb-1">🔩 Montagem e Especiais</div>
            <div className={`${gridStyle} grid-cols-2 md:grid-cols-3 lg:grid-cols-6`}>
              <div className={fieldStyle}>
                <label className={labelStyle}>Desmontagem</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.des_montg || ""}
                  onChange={(e) => updateFormData("des_montg", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Montagem</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.montagem || ""}
                  onChange={(e) => updateFormData("montagem", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Balanceamento</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.balanceamento || ""}
                  onChange={(e) => updateFormData("balanceamento", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Mandrilhamento</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.mandrilhamento || ""}
                  onChange={(e) => updateFormData("mandrilhamento", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Tratamento</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.tratamento || ""}
                  onChange={(e) => updateFormData("tratamento", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ✨ GRUPO 4: ACABAMENTO E ENGENHARIA (6 campos) */}
          <div className="mb-0.5">
            <div className="text-sm font-medium text-muted-foreground mb-1">✨ Acabamento e Engenharia</div>
            <div className={`${gridStyle} grid-cols-2 md:grid-cols-3 lg:grid-cols-6`}>
              <div className={fieldStyle}>
                <label className={labelStyle}>Lavagem</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.lavagem || ""}
                  onChange={(e) => updateFormData("lavagem", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Acabamento</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.acabamento || ""}
                  onChange={(e) => updateFormData("acabamento", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Pintura</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.pintura_horas || ""}
                  onChange={(e) => updateFormData("pintura_horas", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Programação CAM</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.programacao_cam || ""}
                  onChange={(e) => updateFormData("programacao_cam", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Eng/Técnico</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.eng_tec || ""}
                  onChange={(e) => updateFormData("eng_tec", e.target.value)}
                />
              </div>
              <div className={fieldStyle}>
                <label className={labelStyle}>Técnico Horas</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className={`${inputStyle} max-w-[80px]`}
                  value={formData.tecnico_horas || ""}
                  onChange={(e) => updateFormData("tecnico_horas", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OBSERVAÇÕES ADICIONAIS */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            📝 OBSERVAÇÕES ADICIONAIS
          </div>
          <div className={fieldStyle}>
            <Textarea
              className={textareaStyle}
              rows={4}
              placeholder="Insira observações adicionais sobre a ficha técnica..."
              value={formData.observacoes_adicionais || ""}
              onChange={(e) => updateFormData("observacoes_adicionais", e.target.value)}
            />
          </div>
        </div>

        {/* CONTROLE - Ultra Compacto */}
        <div className={sectionStyle}>
          <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
            📋 CONTROLE
          </div>
          <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
            <div className={fieldStyle}>
              <label className={labelStyle}>Nº Orçamento</label>
              <Input
                className={inputStyle}
                placeholder="ORÇ-2024-001"
                value={formData.num_orcamento || ""}
                onChange={(e) => updateFormData("num_orcamento", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Nº O.S</label>
              <Input
                className={inputStyle}
                placeholder="OS-2024-001"
                value={formData.num_os || ""}
                onChange={(e) => updateFormData("num_os", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>Nº DESENHO</label>
              <Input
                className={inputStyle}
                placeholder="DES-2024-001"
                value={formData.num_desenho || ""}
                onChange={(e) => updateFormData("num_desenho", e.target.value)}
              />
            </div>
            <div className={fieldStyle}>
              <label className={labelStyle}>NF Remessa</label>
              <Input
                className={inputStyle}
                placeholder="NF-001"
                value={formData.num_nf_remessa || ""}
                onChange={(e) => updateFormData("num_nf_remessa", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TOTAIS - Usando CalculosSummary correto */}
        <CalculosSummary calculos={calculos} />

        {/* Botão Salvar Ficha */}
        <SaveButton
          isSaved={isSaved}
          isModified={isModified}
          isSaving={isSaving}
          onSave={handleSalvarComCaptura}
          numeroFTC={numeroFTC}
          materiais={materiais}
          formData={formData}
          currentStatus={isClone ? 'rascunho' : (fichaCarregada?.status || 'rascunho')}
          ficha={fichaCarregada || {
            id: fichaId || 'temp-' + Date.now(),
            numeroFTC: numeroFTC,
            formData: formData,
            materiais: materiais,
            fotos: fotos,
            calculos: calculos,
            status: isClone ? 'rascunho' : (fichaCarregada?.status || 'rascunho'),
            fotosCount: fotos.length,
            dataCriacao: fichaCarregada?.dataCriacao || new Date().toISOString(),
            dataUltimaEdicao: new Date().toISOString(),
            resumo: {
              cliente: formData.cliente,
              servico: formData.servico || formData.nome_peca,
              quantidade: formData.quantidade,
              valorTotal: calculos.materialTodasPecas
            }
          }}
        />

        {/* Botões de Navegação - Abaixo do Salvar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          <Button
            type="button"
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2 h-12"
          >
            <Home className="h-4 w-4" />
            Início
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/consultar-fichas')}
            variant="outline"
            className="flex items-center gap-2 h-12"
          >
            <Search className="h-4 w-4" />
            Consultar Fichas
          </Button>
          <Button
            type="button"
            onClick={criarNovaFicha}
            variant="outline"
            className="flex items-center gap-2 h-12"
          >
            <Plus className="h-4 w-4" />
            Nova Ficha
          </Button>
          {fichaCarregada && (
            <Button
              type="button"
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          )}
        </div>



        {/* Modal para exibir o texto melhorado pela IA */}
        <Dialog open={showImprovedTextModal} onOpenChange={setShowImprovedTextModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                🤖 Agente de Escopos Técnicos HMC Usinagem
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{improvedText}</div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleRejectImprovedText}>
                ❌ Rejeitar
              </Button>
              <Button onClick={handleAcceptImprovedText} className="bg-blue-600 hover:bg-blue-700">
                ✅ Aplicar Texto Melhorado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
}