import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useFichaTecnica } from "@/hooks/useFichaTecnica";
import { MaterialItem } from "@/components/FichaTecnica/MaterialItem";
import { FotoUpload } from "@/components/FichaTecnica/FotoUpload";
import { VoiceRecognition } from "@/components/FichaTecnica/VoiceRecognition";
import { CalculosSummary } from "@/components/FichaTecnica/CalculosSummary";
import { ActionButtons } from "@/components/FichaTecnica/ActionButtons";

export default function Index() {
  const {
    formData,
    updateFormData,
    materiais,
    addMaterial,
    updateMaterial,
    removeMaterial,
    fotos,
    addFoto,
    removeFoto,
    calculos,
    numeroFTC,
    dataAtual
  } = useFichaTecnica();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center bg-primary text-primary-foreground">
            <CardTitle className="text-2xl font-bold">FICHA TÉCNICA DE COTAÇÃO (FTC)</CardTitle>
            <div className="flex justify-between text-sm mt-2">
              <span>Nº {numeroFTC}</span>
              <span>{dataAtual}</span>
            </div>
          </CardHeader>
        </Card>

        {/* Dados da Obra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              DADOS DA OBRA
              <VoiceRecognition fieldId="cliente" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <div className="flex gap-2">
                <Select onValueChange={(value) => updateFormData('cliente', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREFEITURA MUNICIPAL DE PETROLÂNDIA">PREFEITURA MUNICIPAL DE PETROLÂNDIA</SelectItem>
                    <SelectItem value="PREFEITURA MUNICIPAL DE TACARATU">PREFEITURA MUNICIPAL DE TACARATU</SelectItem>
                    <SelectItem value="PREFEITURA MUNICIPAL DE JATOBÁ">PREFEITURA MUNICIPAL DE JATOBÁ</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => updateFormData('cliente', e.target.value)}
                  placeholder="Ou digite o nome do cliente"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obra">Obra</Label>
              <div className="flex gap-2">
                <Input
                  id="obra"
                  value={formData.obra}
                  onChange={(e) => updateFormData('obra', e.target.value)}
                  placeholder="Nome da obra"
                />
                <VoiceRecognition fieldId="obra" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <div className="flex gap-2">
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => updateFormData('endereco', e.target.value)}
                  placeholder="Endereço da obra"
                />
                <VoiceRecognition fieldId="endereco" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <div className="flex gap-2">
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => updateFormData('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                />
                <VoiceRecognition fieldId="responsavel" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => updateFormData('telefone', e.target.value)}
                placeholder="Telefone de contato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="E-mail de contato"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados da Peça/Equipamento */}
        <Card>
          <CardHeader>
            <CardTitle>DADOS DA PEÇA/EQUIPAMENTO</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento</Label>
              <div className="flex gap-2">
                <Input
                  id="equipamento"
                  value={formData.equipamento}
                  onChange={(e) => updateFormData('equipamento', e.target.value)}
                  placeholder="Tipo de equipamento"
                />
                <VoiceRecognition fieldId="equipamento" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => updateFormData('modelo', e.target.value)}
                placeholder="Modelo do equipamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => updateFormData('marca', e.target.value)}
                placeholder="Marca do equipamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Nº de Série</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => updateFormData('numeroSerie', e.target.value)}
                placeholder="Número de série"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                value={formData.ano}
                onChange={(e) => updateFormData('ano', e.target.value)}
                placeholder="Ano de fabricação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horimetro">Horímetro</Label>
              <Input
                id="horimetro"
                value={formData.horimetro}
                onChange={(e) => updateFormData('horimetro', e.target.value)}
                placeholder="Horas de uso"
              />
            </div>
          </CardContent>
        </Card>

        {/* Material para Cotação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>MATERIAL PARA COTAÇÃO</CardTitle>
            <Button onClick={addMaterial} variant="outline" size="sm">
              + Adicionar Material
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-2 text-sm font-medium mb-2 min-w-[800px]">
                <div>Item</div>
                <div>Qtd.</div>
                <div>Unid.</div>
                <div>Descrição</div>
                <div>Valor Unit.</div>
                <div>Total</div>
                <div>Ações</div>
              </div>
              {materiais.map((material) => (
                <MaterialItem
                  key={material.id}
                  material={material}
                  onUpdate={updateMaterial}
                  onRemove={removeMaterial}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Execução e Detalhes */}
        <Card>
          <CardHeader>
            <CardTitle>EXECUÇÃO E DETALHES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servico">Serviço</Label>
              <div className="flex gap-2">
                <Textarea
                  id="servico"
                  value={formData.servico}
                  onChange={(e) => updateFormData('servico', e.target.value)}
                  placeholder="Descrição do serviço a ser executado"
                  rows={3}
                />
                <VoiceRecognition fieldId="servico" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <div className="flex gap-2">
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => updateFormData('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={3}
                />
                <VoiceRecognition fieldId="observacoes" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tratamentos e Acabamentos */}
        <Card>
          <CardHeader>
            <CardTitle>TRATAMENTOS E ACABAMENTOS</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solda">Solda</Label>
              <Input
                id="solda"
                value={formData.solda}
                onChange={(e) => updateFormData('solda', e.target.value)}
                placeholder="Tipo de solda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pintura">Pintura</Label>
              <Input
                id="pintura"
                value={formData.pintura}
                onChange={(e) => updateFormData('pintura', e.target.value)}
                placeholder="Tipo de pintura"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usinagem">Usinagem</Label>
              <Input
                id="usinagem"
                value={formData.usinagem}
                onChange={(e) => updateFormData('usinagem', e.target.value)}
                placeholder="Tipo de usinagem"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outros">Outros</Label>
              <Input
                id="outros"
                value={formData.outros}
                onChange={(e) => updateFormData('outros', e.target.value)}
                placeholder="Outros tratamentos"
              />
            </div>
          </CardContent>
        </Card>

        {/* Horas de Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>HORAS DE SERVIÇO</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horasMecanico">Horas Mecânico</Label>
              <Input
                id="horasMecanico"
                type="number"
                value={formData.horasMecanico}
                onChange={(e) => updateFormData('horasMecanico', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorHoraMecanico">Valor/Hora Mecânico</Label>
              <Input
                id="valorHoraMecanico"
                type="number"
                step="0.01"
                value={formData.valorHoraMecanico}
                onChange={(e) => updateFormData('valorHoraMecanico', e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horasSoldador">Horas Soldador</Label>
              <Input
                id="horasSoldador"
                type="number"
                value={formData.horasSoldador}
                onChange={(e) => updateFormData('horasSoldador', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorHoraSoldador">Valor/Hora Soldador</Label>
              <Input
                id="valorHoraSoldador"
                type="number"
                step="0.01"
                value={formData.valorHoraSoldador}
                onChange={(e) => updateFormData('valorHoraSoldador', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <FotoUpload fotos={fotos} onAddFoto={addFoto} onRemoveFoto={removeFoto} />

        {/* Cálculos e Resumo */}
        <CalculosSummary calculos={calculos} />

        {/* Botões de Ação */}
        <ActionButtons formData={formData} materiais={materiais} fotos={fotos} />
      </div>
    </div>
  );
}