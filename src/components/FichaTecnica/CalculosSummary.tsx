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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Materiais</p>
            <p className="text-lg font-bold">{formatCurrency(calculos.totalMateriais)}</p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Mecânico</p>
            <p className="text-lg font-bold">{formatCurrency(calculos.totalMecanico)}</p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Soldador</p>
            <p className="text-lg font-bold">{formatCurrency(calculos.totalSoldador)}</p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Horas</p>
            <p className="text-lg font-bold">{formatCurrency(calculos.totalHoras)}</p>
          </div>

          <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
            <p className="text-sm mb-1">TOTAL GERAL</p>
            <p className="text-xl font-bold">{formatCurrency(calculos.totalGeral)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}