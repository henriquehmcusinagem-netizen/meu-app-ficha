import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputWithVoice } from "@/components/ui/input-with-voice";
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { MaterialItem } from "@/components/FichaTecnica/MaterialItem";
import { CalculosSummary } from "@/components/FichaTecnica/CalculosSummary";
import { FichasList } from "@/components/FichaTecnica/FichasList";
import { SaveButton } from "@/components/FichaTecnica/SaveButton";
import { PostSaveActionsModal } from "@/components/FichaTecnica/PostSaveActionsModal";
import { PrintLayout } from "@/components/FichaTecnica/PrintLayout";
import { FotoUpload } from "@/components/FichaTecnica/FotoUpload";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import { clientesPredefinidos } from "@/types/ficha-tecnica";
import { formatCurrency } from "@/utils/calculations";
import { Calendar, FileText, Settings, Calculator, Plus, Home, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Index() {
  const [showActionsModal, setShowActionsModal] = useState(false);
  const navigate = useNavigate();

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
    fichaCarregada
  } = useFichaTecnica();


  return (
    <div className="space-y-3">
        {/* Header - Compacto */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="pb-2 pt-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Data: {dataAtual}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-primary">
                    Nº FTC: {numeroFTC.startsWith('DRAFT') ? 'RASCUNHO' : numeroFTC}
                  </div>
                  {isSaved && !isModified && !numeroFTC.startsWith('DRAFT') && <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 rounded-full">
                      SALVO
                    </span>}
                  {(isModified || numeroFTC.startsWith('DRAFT')) && <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 rounded-full">
                      {numeroFTC.startsWith('DRAFT') ? 'NOVO' : 'MODIFICADO'}
                    </span>}
                </div>
              </div>
              <CardTitle className="text-base md:text-xl text-center">
                FICHA TÉCNICA DE COTAÇÃO - FTC
              </CardTitle>
              <div className="w-20"></div>
            </div>
          </CardHeader>
        </Card>


        <form className="space-y-3">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                DADOS DO CLIENTE
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <Label htmlFor="cliente" className="text-sm">CLIENTE:</Label>
                  <div className="flex gap-2">
                    <Select value={formData.cliente} onValueChange={value => {
                    if (value && value !== "manual") {
                      updateFormData("cliente", value);
                    }
                  }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="🖊️ Digitar manualmente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">🖊️ Digitar manualmente</SelectItem>
                        {[...clientesPredefinidos].sort((a, b) => a.localeCompare(b)).map(cliente => <SelectItem key={cliente} value={cliente}>
                            {cliente}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <InputWithVoice value={formData.cliente} onChange={e => updateFormData("cliente", e.target.value)} onVoiceResult={text => updateFormData("cliente", text)} placeholder="Digite o nome do cliente" className="flex-2" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="solicitante" className="text-sm">SOLICITANTE:</Label>
                  <InputWithVoice value={formData.solicitante} onChange={e => updateFormData("solicitante", e.target.value)} onVoiceResult={text => updateFormData("solicitante", text)} className="h-9" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fone_email" className="text-sm">FONE/EMAIL:</Label>
                  <InputWithVoice value={formData.fone_email} onChange={e => updateFormData("fone_email", e.target.value)} onVoiceResult={text => updateFormData("fone_email", text)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="data_visita" className="text-sm">DATA DA VISITA:</Label>
                  <Input type="date" value={formData.data_visita} onChange={e => updateFormData("data_visita", e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="data_entrega" className="text-sm">ENTREGAR PEÇA OU SERVIÇO NO DIA:</Label>
                  <Input type="date" value={formData.data_entrega} onChange={e => updateFormData("data_entrega", e.target.value)} className="border-2 border-primary h-9" required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Peça/Equipamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">DADOS DA PEÇA/EQUIPAMENTO</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <Label htmlFor="nome_peca" className="text-sm">NOME DA PEÇA / EQUIPAMENTO:</Label>
                  <TextareaWithVoice value={formData.nome_peca} onChange={e => updateFormData("nome_peca", e.target.value)} onVoiceResult={text => updateFormData("nome_peca", text)} rows={2} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quantidade" className="text-sm">QUANTIDADE:</Label>
                  <Input type="number" value={formData.quantidade} onChange={e => updateFormData("quantidade", e.target.value)} min="1" className="h-9" />
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <Label htmlFor="servico" className="text-sm">SERVIÇO A SER REALIZADO:</Label>
                <TextareaWithVoice value={formData.servico} onChange={e => updateFormData("servico", e.target.value)} onVoiceResult={text => updateFormData("servico", text)} rows={3} className="text-sm" />
              </div>

              <FotoUpload fotos={fotos} onAddFoto={addFoto} onRemoveFoto={removeFoto} />
            </CardContent>
          </Card>

          {/* Material para Cotação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MATERIAL PARA COTAÇÃO</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {materiais.map(material => <MaterialItem key={material.id} material={material} onUpdate={updateMaterial} onRemove={removeMaterial} />)}
              </div>

              <Button type="button" onClick={addMaterial} className="mt-3 bg-gradient-to-r from-info to-info/80 h-9 text-sm">
                ➕ Adicionar Material
              </Button>
            </CardContent>
          </Card>

          {/* Execução e Detalhes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">EXECUÇÃO E DETALHES</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Primeira linha: SERÁ EXECUTADO EM, VISITA TÉCNICA, HORAS VISITA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-sm">SERÁ EXECUTADO EM:</Label>
                  <RadioGroup value={formData.execucao} onValueChange={value => updateFormData("execucao", value)} className="flex gap-3">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="HMC" id="exec_hmc" />
                      <Label htmlFor="exec_hmc" className="text-sm">HMC</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="CLIENTE" id="exec_cliente" />
                      <Label htmlFor="exec_cliente" className="text-sm">CLIENTE</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">VISITA TÉCNICA:</Label>
                  <RadioGroup value={formData.visita_tecnica} onValueChange={value => updateFormData("visita_tecnica", value)} className="flex gap-3">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="SIM" id="visita_sim" />
                      <Label htmlFor="visita_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="NAO" id="visita_nao" />
                      <Label htmlFor="visita_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="visita_horas" className="text-sm">HORAS VISITA:</Label>
                  <Input id="visita_horas" type="number" value={formData.visita_horas} onChange={e => updateFormData("visita_horas", e.target.value)} step="0.5" className="h-9" />
                </div>
              </div>

              {/* Segunda linha: TEM PEÇA DE AMOSTRA, PROJETO DESENVOLVIDO POR, DESENHO DA PEÇA, FINALIZADO */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-sm">TEM PEÇA DE AMOSTRA:</Label>
                  <RadioGroup value={formData.tem_peca_amostra} onValueChange={value => updateFormData("tem_peca_amostra", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="amostra_sim" />
                      <Label htmlFor="amostra_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="amostra_nao" />
                      <Label htmlFor="amostra_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">PROJETO DESENVOLVIDO POR:</Label>
                  <RadioGroup value={formData.projeto_desenvolvido_por} onValueChange={value => updateFormData("projeto_desenvolvido_por", value)} className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="HMC" id="projeto_hmc" />
                      <Label htmlFor="projeto_hmc" className="text-sm">HMC</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CLIENTE" id="projeto_cliente" />
                      <Label htmlFor="projeto_cliente" className="text-sm">CLIENTE</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="HMC/CLIENTE" id="projeto_ambos" />
                      <Label htmlFor="projeto_ambos" className="text-sm">HMC/CLIENTE</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">DESENHO DA PEÇA:</Label>
                  <RadioGroup value={formData.desenho_peca} onValueChange={value => updateFormData("desenho_peca", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="HMC" id="desenho_hmc" />
                      <Label htmlFor="desenho_hmc" className="text-sm">HMC</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CLIENTE" id="desenho_cliente" />
                      <Label htmlFor="desenho_cliente" className="text-sm">CLIENTE</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">FINALIZADO:</Label>
                  <RadioGroup value={formData.desenho_finalizado} onValueChange={value => updateFormData("desenho_finalizado", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="finalizado_sim" />
                      <Label htmlFor="finalizado_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="finalizado_nao" />
                      <Label htmlFor="finalizado_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Terceira linha: TRANSPORTE COLETA / ENTREGA */}
              <div className="mb-3">
                <Label className="text-sm font-medium">TRANSPORTE COLETA / ENTREGA:</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="transporte_caminhao" checked={formData.transporte_caminhao_hmc} onCheckedChange={checked => updateFormData("transporte_caminhao_hmc", checked as boolean)} />
                    <Label htmlFor="transporte_caminhao" className="text-sm">CAMINHÃO HMC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="transporte_pickup" checked={formData.transporte_pickup_hmc} onCheckedChange={checked => updateFormData("transporte_pickup_hmc", checked as boolean)} />
                    <Label htmlFor="transporte_pickup" className="text-sm">PICKUP HMC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="transporte_cliente" checked={formData.transporte_cliente} onCheckedChange={checked => updateFormData("transporte_cliente", checked as boolean)} />
                    <Label htmlFor="transporte_cliente" className="text-sm">CLIENTE</Label>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Tratamentos e Acabamentos */}
          <Card>
            <CardHeader>
              <CardTitle>TRATAMENTOS E ACABAMENTOS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm">PINTURA:</Label>
                  <RadioGroup value={formData.pintura} onValueChange={value => updateFormData("pintura", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="pintura_sim" />
                      <Label htmlFor="pintura_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="pintura_nao" />
                      <Label htmlFor="pintura_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cor_pintura" className="text-sm">COR:</Label>
                  <InputWithVoice value={formData.cor_pintura} onChange={e => updateFormData("cor_pintura", e.target.value)} onVoiceResult={text => updateFormData("cor_pintura", text)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">GALVANIZAÇÃO:</Label>
                  <RadioGroup value={formData.galvanizacao} onValueChange={value => updateFormData("galvanizacao", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="galv_sim" />
                      <Label htmlFor="galv_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="galv_nao" />
                      <Label htmlFor="galv_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="peso_peca_galv" className="text-sm">PESO PÇ (Galv):</Label>
                  <Input type="number" value={formData.peso_peca_galv} onChange={e => updateFormData("peso_peca_galv", e.target.value)} step="0.1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm">TRATAMENTO TÉRMICO:</Label>
                  <RadioGroup value={formData.tratamento_termico} onValueChange={value => updateFormData("tratamento_termico", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="trat_term_sim" />
                      <Label htmlFor="trat_term_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="trat_term_nao" />
                      <Label htmlFor="trat_term_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="peso_peca_trat" className="text-sm">PESO PÇ (Trat):</Label>
                  <Input type="number" value={formData.peso_peca_trat} onChange={e => updateFormData("peso_peca_trat", e.target.value)} step="0.1" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tempera_reven" className="text-sm">TEMPERA / REVEN:</Label>
                  <InputWithVoice value={formData.tempera_reven} onChange={e => updateFormData("tempera_reven", e.target.value)} onVoiceResult={text => updateFormData("tempera_reven", text)} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cementacao" className="text-sm">CEMENTAÇÃO:</Label>
                  <InputWithVoice value={formData.cementacao} onChange={e => updateFormData("cementacao", e.target.value)} onVoiceResult={text => updateFormData("cementacao", text)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="dureza" className="text-sm">DUREZA:</Label>
                  <InputWithVoice value={formData.dureza} onChange={e => updateFormData("dureza", e.target.value)} onVoiceResult={text => updateFormData("dureza", text)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">TESTE DE LP:</Label>
                  <RadioGroup value={formData.teste_lp} onValueChange={value => updateFormData("teste_lp", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="teste_lp_sim" />
                      <Label htmlFor="teste_lp_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="teste_lp_nao" />
                      <Label htmlFor="teste_lp_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="balanceamento_campo" className="text-sm">BALANCEAMENTO:</Label>
                  <InputWithVoice value={formData.balanceamento_campo} onChange={e => updateFormData("balanceamento_campo", e.target.value)} onVoiceResult={text => updateFormData("balanceamento_campo", text)} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rotacao" className="text-sm">ROTAÇÃO:</Label>
                  <InputWithVoice value={formData.rotacao} onChange={e => updateFormData("rotacao", e.target.value)} onVoiceResult={text => updateFormData("rotacao", text)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm">FORNECIMENTO DE DESENHO:</Label>
                  <RadioGroup value={formData.fornecimento_desenho} onValueChange={value => updateFormData("fornecimento_desenho", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="forn_desenho_sim" />
                      <Label htmlFor="forn_desenho_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="forn_desenho_nao" />
                      <Label htmlFor="forn_desenho_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">FOTOS PARA RELATÓRIO:</Label>
                  <RadioGroup value={formData.fotos_relatorio} onValueChange={value => updateFormData("fotos_relatorio", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="fotos_sim" />
                      <Label htmlFor="fotos_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="fotos_nao" />
                      <Label htmlFor="fotos_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">RELATÓRIO TÉCNICO:</Label>
                  <RadioGroup value={formData.relatorio_tecnico} onValueChange={value => updateFormData("relatorio_tecnico", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="relatorio_sim" />
                      <Label htmlFor="relatorio_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="relatorio_nao" />
                      <Label htmlFor="relatorio_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">EMISSÃO DE ART:</Label>
                  <RadioGroup value={formData.emissao_art} onValueChange={value => updateFormData("emissao_art", value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIM" id="art_sim" />
                      <Label htmlFor="art_sim" className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NAO" id="art_nao" />
                      <Label htmlFor="art_nao" className="text-sm">NÃO</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="servicos_terceirizados" className="text-sm">SERVIÇOS TERCEIRIZADOS:</Label>
                <TextareaWithVoice value={formData.servicos_terceirizados} onChange={e => updateFormData("servicos_terceirizados", e.target.value)} onVoiceResult={text => updateFormData("servicos_terceirizados", text)} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Horas de Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                PRÉVIA DE HORAS PARA REALIZAR O SERVIÇO / PEÇA
              </CardTitle>
            </CardHeader>
            <CardContent>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="torno_grande" className="text-sm">TORNO GRANDE:</Label>
                  <Input type="number" value={formData.torno_grande} onChange={e => updateFormData("torno_grande", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="torno_pequeno" className="text-sm">TORNO PEQUENO:</Label>
                  <Input type="number" value={formData.torno_pequeno} onChange={e => updateFormData("torno_pequeno", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cnc_tf" className="text-sm">CNC T/F:</Label>
                  <Input type="number" value={formData.cnc_tf} onChange={e => updateFormData("cnc_tf", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fresa_furad" className="text-sm">FRESA/FURAD:</Label>
                  <Input type="number" value={formData.fresa_furad} onChange={e => updateFormData("fresa_furad", e.target.value)} step="0.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="plasma_oxicorte" className="text-sm">PLASMA/OXICORTE:</Label>
                  <Input type="number" value={formData.plasma_oxicorte} onChange={e => updateFormData("plasma_oxicorte", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dobra" className="text-sm">DOBRA:</Label>
                  <Input type="number" value={formData.dobra} onChange={e => updateFormData("dobra", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="calandra" className="text-sm">CALANDRA:</Label>
                  <Input type="number" value={formData.calandra} onChange={e => updateFormData("calandra", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="macarico_solda" className="text-sm">MAÇARICO/SOLDA:</Label>
                  <Input type="number" value={formData.macarico_solda} onChange={e => updateFormData("macarico_solda", e.target.value)} step="0.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="des_montg" className="text-sm">DES/MONTG:</Label>
                  <Input type="number" value={formData.des_montg} onChange={e => updateFormData("des_montg", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="balanceamento" className="text-sm">BALANCEAMENTO:</Label>
                  <Input type="number" value={formData.balanceamento} onChange={e => updateFormData("balanceamento", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mandrilhamento" className="text-sm">MANDRILHAMENTO CAMPO:</Label>
                  <Input type="number" value={formData.mandrilhamento} onChange={e => updateFormData("mandrilhamento", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tratamento" className="text-sm">TRATAMENTO:</Label>
                  <Input type="number" value={formData.tratamento} onChange={e => updateFormData("tratamento", e.target.value)} step="0.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="pintura_horas" className="text-sm">PINTURA:</Label>
                  <Input type="number" value={formData.pintura_horas} onChange={e => updateFormData("pintura_horas", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lavagem_acab" className="text-sm">LAVAGEM/ACAB:</Label>
                  <Input type="number" value={formData.lavagem_acab} onChange={e => updateFormData("lavagem_acab", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="programacao_cam" className="text-sm">PROGRAMAÇÃO CAM:</Label>
                  <Input type="number" value={formData.programacao_cam} onChange={e => updateFormData("programacao_cam", e.target.value)} step="0.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="eng_tec" className="text-sm">ENG / TEC:</Label>
                  <Input type="number" value={formData.eng_tec} onChange={e => updateFormData("eng_tec", e.target.value)} step="0.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controle */}
          <Card>
            <CardHeader>
              <CardTitle>CONTROLE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <Label htmlFor="num_orcamento" className="text-sm">Nº do orçamento:</Label>
                  <InputWithVoice value={formData.num_orcamento} onChange={e => updateFormData("num_orcamento", e.target.value)} onVoiceResult={text => updateFormData("num_orcamento", text)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="num_os" className="text-sm">Nº da O.S:</Label>
                  <InputWithVoice value={formData.num_os} onChange={e => updateFormData("num_os", e.target.value)} onVoiceResult={text => updateFormData("num_os", text)} placeholder="Número da Ordem de Serviço" className="border-2 border-success bg-success/5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="num_nf_remessa" className="text-sm">Nº da NF DE REMESSA DO CLIENTE:</Label>
                  <InputWithVoice value={formData.num_nf_remessa} onChange={e => updateFormData("num_nf_remessa", e.target.value)} onVoiceResult={text => updateFormData("num_nf_remessa", text)} />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Resumo dos Totais */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Calculator className="h-5 w-5" />
                RESUMO DOS TOTAIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-background border border-primary/20">
                  <CardContent className="pt-3 text-center">
                    <div className="text-sm text-muted-foreground mb-1">HORAS POR PEÇA</div>
                    <div className="text-base font-bold text-primary">
                      {calculos.horasPorPeca.toFixed(1)} h
                    </div>
                  </CardContent>
                </Card>

                

                <Card className="bg-background border border-primary/20">
                  <CardContent className="pt-3 text-center">
                    <div className="text-sm text-muted-foreground mb-1">MATERIAL POR PEÇA</div>
                    <div className="text-base font-bold text-primary">
                      {formatCurrency(calculos.materialPorPeca)}
                    </div>
                  </CardContent>
                </Card>

                
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar Ficha */}
          <SaveButton
            isSaved={isSaved}
            isModified={isModified}
            isSaving={isSaving}
            onSave={salvarFichaTecnica}
            onSaveSuccess={() => setShowActionsModal(true)}
            materiais={materiais}
            formData={formData}
            numeroFTC={numeroFTC}
            ficha={fichaCarregada}
            currentStatus={fichaCarregada?.status}
          />

        {/* Botões de Acesso Rápido */}
        <Card className="mt-6">
          <CardContent className="pt-3">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>

              <Button type="button" variant="outline" onClick={() => navigate('/consultar-fichas')} className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700 dark:bg-green-950/20 dark:hover:bg-green-950/30 dark:border-green-800 dark:text-green-300">
                <Search className="h-4 w-4" />
                Consultar Fichas
              </Button>

              <Button type="button" variant="outline" onClick={() => {
                if (isModified) {
                  const confirm = window.confirm("Há alterações não salvas. Deseja continuar e criar uma nova ficha?");
                  if (!confirm) return;
                }
                criarNovaFicha();
              }} className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300">
                <Plus className="h-4 w-4" />
                Nova Ficha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Post-Save Actions Modal */}
        <PostSaveActionsModal
          open={showActionsModal}
          onOpenChange={setShowActionsModal}
          formData={formData}
          materiais={materiais}
          fotos={fotos}
          numeroFTC={numeroFTC}
          dataAtual={dataAtual}
        />

        {/* Print Layout - Hidden on screen, visible only when printing */}
        <PrintLayout formData={formData} materiais={materiais} fotos={fotos} calculos={calculos} numeroFTC={numeroFTC} dataAtual={dataAtual} />
      </form>
    </div>
  );
}