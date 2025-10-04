import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormData } from "@/types/ficha-tecnica";
import { Sparkles } from "lucide-react";

interface DadosPecaFormProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  sectionStyle: string;
  gridStyle: string;
  fieldStyle: string;
  labelStyle: string;
  inputStyle: string;
  textareaStyle: string;
  onImproveDescription: () => void;
  isImprovingDescription: boolean;
}

const DadosPecaForm = memo(({
  formData,
  updateFormData,
  sectionStyle,
  gridStyle,
  fieldStyle,
  labelStyle,
  inputStyle,
  textareaStyle,
  onImproveDescription,
  isImprovingDescription
}: DadosPecaFormProps) => {
  return (
    <div className={sectionStyle}>
      <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
        🔧 DADOS DA PEÇA/EQUIPAMENTO
      </div>

      <div className={`${gridStyle} grid-cols-1 md:grid-cols-2`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Nome da Peça</label>
          <Input
            className={inputStyle}
            placeholder="Nome/descrição da peça"
            value={formData.nome_peca}
            onChange={(e) => updateFormData("nome_peca", e.target.value)}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Quantidade</label>
          <Input
            className={inputStyle}
            type="number"
            min="1"
            placeholder="Quantidade de peças"
            value={formData.quantidade}
            onChange={(e) => updateFormData("quantidade", e.target.value)}
          />
        </div>
      </div>

      <div className={`${fieldStyle} mt-3`}>
        <div className="flex items-center gap-2 mb-1">
          <label className={labelStyle}>Descrição do Serviço/Equipamento</label>
          <Button
            type="button"
            onClick={onImproveDescription}
            disabled={isImprovingDescription || !formData.servico.trim()}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            {isImprovingDescription ? (
              "Melhorando..."
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Melhorar IA
              </>
            )}
          </Button>
        </div>
        <Textarea
          className={textareaStyle}
          placeholder="Descreva detalhadamente o serviço ou equipamento..."
          value={formData.servico}
          onChange={(e) => updateFormData("servico", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
});

DadosPecaForm.displayName = 'DadosPecaForm';

export default DadosPecaForm;