import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { Calculos } from "@/types/ficha-tecnica";
import { formatCurrency } from "@/utils/calculations";

interface CalculosSummaryProps {
  calculos: Calculos;
}

export function CalculosSummary({ calculos }: CalculosSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          RESUMO DOS CÁLCULOS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Horas por Peça</p>
            <p className="text-lg font-bold">{calculos.horasPorPeca.toFixed(1)} h</p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Horas Todas as Peças</p>
            <p className="text-lg font-bold">{calculos.horasTodasPecas.toFixed(1)} h</p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Material por Peça</p>
            <p className="text-lg font-bold">{formatCurrency(calculos.materialPorPeca)}</p>
          </div>

          <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
            <p className="text-sm mb-1">Material Todas as Peças</p>
            <p className="text-xl font-bold">{formatCurrency(calculos.materialTodasPecas)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}