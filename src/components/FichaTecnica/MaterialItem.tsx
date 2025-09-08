import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { VoiceRecognition } from "./VoiceRecognition";
import { Material } from "@/types/ficha-tecnica";

interface MaterialItemProps {
  material: Material;
  onUpdate: (id: number, field: keyof Material, value: string | number) => void;
  onRemove: (id: number) => void;
}

export function MaterialItem({ material, onUpdate, onRemove }: MaterialItemProps) {
  const unidades = [
    "UN", "KG", "M", "M²", "M³", "L", "PC", "CJ", "MT", "CM", 
    "MM", "G", "TON", "HR", "MIN", "PAR", "DZ", "FD", "GL", "LT"
  ];

  return (
    <div className="grid grid-cols-8 gap-2 items-center min-w-[800px] py-2 border-b">
      <div className="text-center font-medium">{material.item}</div>
      
      <Input
        type="number"
        value={material.quantidade}
        onChange={(e) => onUpdate(material.id, 'quantidade', e.target.value)}
        placeholder="Qtd"
        className="text-center"
      />
      
      <Select 
        value={material.unidade} 
        onValueChange={(value) => onUpdate(material.id, 'unidade', value)}
      >
        <SelectTrigger className="text-xs">
          <SelectValue placeholder="Unid." />
        </SelectTrigger>
        <SelectContent>
          {unidades.map((unidade) => (
            <SelectItem key={unidade} value={unidade}>
              {unidade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex gap-1">
        <Input
          value={material.descricao}
          onChange={(e) => onUpdate(material.id, 'descricao', e.target.value)}
          placeholder="Descrição do material"
        />
        <VoiceRecognition fieldId={`material-${material.id}`} />
      </div>
      
      <Input
        type="number"
        step="0.01"
        value={material.valorUnitario}
        onChange={(e) => onUpdate(material.id, 'valorUnitario', e.target.value)}
        placeholder="0,00"
        className="text-right"
      />
      
      <div className="text-right font-medium">
        R$ {parseFloat(material.total || '0').toFixed(2)}
      </div>
      
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(material.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}