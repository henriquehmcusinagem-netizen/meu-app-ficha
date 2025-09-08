import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { VoiceRecognition } from "./VoiceRecognition";
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
          <div className="flex gap-2">
            <Input
              value={material.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder="Descrição do material"
              className="text-sm"
            />
            <VoiceRecognition 
              fieldId={`descricao-${material.id}`}
              onResult={(text) => updateField('descricao', text)} 
            />
          </div>
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
          <Input
            value={material.fornecedor}
            onChange={(e) => updateField('fornecedor', e.target.value)}
            placeholder="Fornecedor"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">CLIENTE INTERNO</Label>
          <Input
            value={material.cliente_interno}
            onChange={(e) => updateField('cliente_interno', e.target.value)}
            placeholder="Cliente interno"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">VALOR TOTAL</Label>
          <div className="flex gap-2">
            <Input
              value={`R$ ${material.valor_total}`}
              readOnly
              className="bg-muted font-medium text-sm border-2"
            />
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
      </div>
    </Card>
  );
}