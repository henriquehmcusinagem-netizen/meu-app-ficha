import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputWithVoice } from "@/components/ui/input-with-voice";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Material } from "@/types/ficha-tecnica";

interface MaterialItemProps {
  material: Material;
  onUpdate: (id: number, field: keyof Material, value: string | number) => void;
  onRemove: (id: number) => void;
}

export function MaterialItem({ material, onUpdate, onRemove }: MaterialItemProps) {
  const updateField = (field: keyof Material, value: string) => {
    let processedValue: string | number = value;
    
    if (field === 'quantidade' || field === 'valor_unitario') {
      processedValue = value === '' ? '' : value;
    }
    
    onUpdate(material.id, field, processedValue);
    
    // Auto-calculate total
    if (field === 'quantidade' || field === 'valor_unitario') {
      const quantidade = field === 'quantidade' ? parseFloat(value) || 0 : parseFloat(material.quantidade) || 0;
      const valorUnitario = field === 'valor_unitario' ? parseFloat(value) || 0 : parseFloat(material.valor_unitario) || 0;
      const total = (quantidade * valorUnitario).toFixed(2);
      onUpdate(material.id, 'valor_total', total);
    }
  };

  return (
    <Card className="p-4 bg-muted/30 border border-muted-foreground/20">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <Label className="text-xs font-bold">MATERIAL</Label>
          <InputWithVoice
            value={material.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            onVoiceResult={(text) => updateField('descricao', text)}
            placeholder="Descrição do material"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">QTD</Label>
          <Input
            type="number"
            value={material.quantidade}
            onChange={(e) => updateField('quantidade', e.target.value)}
            step="0.01"
            min="0"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">PREÇO UNIT</Label>
          <Input
            type="number"
            value={material.valor_unitario}
            onChange={(e) => updateField('valor_unitario', e.target.value)}
            step="0.01"
            min="0"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">FORNECEDOR</Label>
          <InputWithVoice
            value={material.fornecedor}
            onChange={(e) => updateField('fornecedor', e.target.value)}
            onVoiceResult={(text) => updateField('fornecedor', text)}
            placeholder="Fornecedor"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">CLIENTE INTERNO</Label>
          <InputWithVoice
            value={material.cliente_interno}
            onChange={(e) => updateField('cliente_interno', e.target.value)}
            onVoiceResult={(text) => updateField('cliente_interno', text)}
            placeholder="Cliente interno"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">VALOR TOTAL</Label>
          <Input
            value={`R$ ${material.valor_total}`}
            readOnly
            className="bg-muted font-medium text-sm border-2"
          />
        </div>
        
        <div className="flex items-end">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(material.id)}
            className="px-3"
          >
            ✕
          </Button>
        </div>
      </div>
    </Card>
  );
}