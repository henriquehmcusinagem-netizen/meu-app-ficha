import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormData, clientesPredefinidos } from "@/types/ficha-tecnica";

interface DadosClienteFormProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  sectionStyle: string;
  gridStyle: string;
  fieldStyle: string;
  labelStyle: string;
  inputStyle: string;
}

const DadosClienteForm = memo(({
  formData,
  updateFormData,
  sectionStyle,
  gridStyle,
  fieldStyle,
  labelStyle,
  inputStyle
}: DadosClienteFormProps) => {
  return (
    <div className={sectionStyle}>
      <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
        👤 DADOS DO CLIENTE
      </div>

      {/* Primeira linha: Cliente (com mais espaço para input manual), Solicitante, Fone/Email */}
      <div className={`${gridStyle} grid-cols-1 md:grid-cols-3`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Cliente</label>
          <div className="flex gap-1">
            <Select value={formData.cliente_predefinido || ""} onValueChange={(value) => {
              updateFormData("cliente_predefinido", value);
              if (value === "manual") {
                updateFormData("cliente", "");
              } else if (value) {
                updateFormData("cliente", value);
              }
            }}>
              <SelectTrigger className="w-[100px] h-11">
                <SelectValue placeholder="🖊️ " />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">🖊️ Digitar manualmente</SelectItem>
                {clientesPredefinidos.filter(cliente => cliente && cliente.trim()).map((cliente) => (
                  <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className={`${inputStyle} flex-1 min-w-[200px]`}
              placeholder="Nome do cliente"
              value={formData.cliente}
              onChange={(e) => updateFormData("cliente", e.target.value)}
              disabled={formData.cliente_predefinido && formData.cliente_predefinido !== "manual"}
            />
          </div>
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Solicitante</label>
          <Input
            className={inputStyle}
            placeholder="Nome do solicitante"
            value={formData.solicitante}
            onChange={(e) => updateFormData("solicitante", e.target.value)}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Fone/Email</label>
          <Input
            className={inputStyle}
            placeholder="Telefone ou e-mail"
            value={formData.fone_email}
            onChange={(e) => updateFormData("fone_email", e.target.value)}
          />
        </div>
      </div>

      {/* Segunda linha: Datas */}
      <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 mt-3`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Data da Visita</label>
          <Input
            className={inputStyle}
            type="date"
            value={formData.data_visita}
            onChange={(e) => updateFormData("data_visita", e.target.value)}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Data de Entrega</label>
          <Input
            className={inputStyle}
            type="date"
            value={formData.data_entrega}
            onChange={(e) => updateFormData("data_entrega", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

DadosClienteForm.displayName = 'DadosClienteForm';

export default DadosClienteForm;