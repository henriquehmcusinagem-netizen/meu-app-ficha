import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Material } from "@/types/ficha-tecnica";
import { formatCurrency } from "@/utils/helpers";

const clienteInternoOptions = [
  "ESTOQUE",
  "FORNECEDOR"
];

interface MaterialItemProps {
  material: Material;
  onUpdate: (field: keyof Material, value: string | number) => void;
  onRemove: () => void;
}

export function MaterialItem({ material, onUpdate, onRemove }: MaterialItemProps) {
  const formatMoneyInput = (value: string): string => {
    const numbers = value.replace(/[^\d.,]/g, '');
    return numbers.replace(',', '.');
  };

  const displayMoneyValue = (value: string): string => {
    return value || '';
  };

  const updateField = (field: keyof Material, value: string) => {
    let processedValue: string | number = value;

    if (field === 'quantidade' || field === 'valor_unitario') {
      processedValue = value === '' ? '' : formatMoneyInput(value);
    }

    onUpdate(field, processedValue);

    if (field === 'quantidade' || field === 'valor_unitario') {
      const quantidade = field === 'quantidade' ? parseFloat(formatMoneyInput(value)) || 0 : parseFloat(String(material.quantidade)) || 0;
      const valorUnitario = field === 'valor_unitario' ? parseFloat(formatMoneyInput(value)) || 0 : parseFloat(String(material.valor_unitario)) || 0;
      const total = (quantidade * valorUnitario).toFixed(2);
      onUpdate('valor_total', total);
    }
  };

  const inputStyle = "h-11 border border-border rounded px-3 text-base transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background text-foreground";

  return (
    <>
      <div className="hidden lg:grid grid-cols-9 gap-2 items-center">
        <div>
          <Input
            type="number"
            value={material.quantidade || ""}
            onChange={(e) => updateField('quantidade', e.target.value)}
            step="0.01"
            min="0"
            placeholder="0"
            className={inputStyle}
            disabled={false}
            readOnly={false}
          />
        </div>

        <div className="col-span-2">
          <Input
            value={material.descricao || ""}
            onChange={(e) => updateField('descricao', e.target.value)}
            placeholder="Descrição do material"
            className={inputStyle}
            disabled={false}
            readOnly={false}
          />
        </div>

        <div>
          <Input
            type="number"
            value={material.valor_unitario || ""}
            onChange={(e) => updateField('valor_unitario', e.target.value)}
            step="0.01"
            min="0"
            placeholder="0.00"
            className={inputStyle}
            disabled={false}
            readOnly={false}
          />
        </div>

        <div>
          <Select value={material.cliente_interno || ""} onValueChange={(value) => updateField('cliente_interno', value)}>
            <SelectTrigger className={inputStyle}>
              <SelectValue placeholder="Estoque/Forn" />
            </SelectTrigger>
            <SelectContent>
              {clienteInternoOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Input
            value={material.fornecedor || ""}
            onChange={(e) => updateField('fornecedor', e.target.value)}
            placeholder="Fornecedor"
            className={inputStyle}
            disabled={false}
            readOnly={false}
          />
        </div>

        <div>
          <Input
            value={material.cliente_interno_tipo || ""}
            onChange={(e) => updateField('cliente_interno_tipo', e.target.value)}
            placeholder="Cliente Interno"
            className={inputStyle}
            disabled={false}
            readOnly={false}
          />
        </div>

        <div>
          <Input
            value={formatCurrency(Number(material.valor_total) || 0)}
            readOnly
            className={`${inputStyle} bg-muted font-medium`}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="h-11 w-11 px-0"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="lg:hidden space-y-2 p-3 border border-border rounded-md bg-card">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">QTD</label>
            <Input
              type="number"
              value={material.quantidade || ""}
              onChange={(e) => updateField('quantidade', e.target.value)}
              step="0.01"
              min="0"
              placeholder="0"
              className={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">MATERIAL</label>
            <Input
              value={material.descricao || ""}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder="Descrição"
              className={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">PREÇO UNIT</label>
            <Input
              type="number"
              value={material.valor_unitario || ""}
              onChange={(e) => updateField('valor_unitario', e.target.value)}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">FORNECEDOR</label>
            <Input
              value={material.fornecedor || ""}
              onChange={(e) => updateField('fornecedor', e.target.value)}
              placeholder="Fornecedor"
              className={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">ESTOQUE</label>
            <Select value={material.cliente_interno || ""} onValueChange={(value) => updateField('cliente_interno', value)}>
              <SelectTrigger className={inputStyle}>
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                {clienteInternoOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">CLIENTE INTERNO</label>
            <Input
              value={material.cliente_interno_tipo || ""}
              onChange={(e) => updateField('cliente_interno_tipo', e.target.value)}
              placeholder="Cliente Interno"
              className={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">TOTAL</label>
            <Input
              value={formatCurrency(Number(material.valor_total) || 0)}
              readOnly
              className={`${inputStyle} bg-muted font-medium`}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="h-11 w-full"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}