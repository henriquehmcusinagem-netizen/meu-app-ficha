import { Badge } from "@/components/ui/badge";
import { Check, Circle, ChevronRight } from "lucide-react";
import { StatusFicha } from "@/types/ficha-tecnica";

interface WorkflowStage {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'rascunho',
    label: 'Rascunho',
    description: 'Ficha em elaboração',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  {
    id: 'aguardando_cotacao_compras',
    label: 'Ag. Cotação',
    description: 'Compras cotando materiais',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'aguardando_orcamento_comercial',
    label: 'Ag. Orçamento',
    description: 'Comercial preparando orçamento',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'orcamento_enviado_cliente',
    label: 'Enviado',
    description: 'Aguardando resposta do cliente',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'orcamento_aprovado_cliente',
    label: 'Aprovado',
    description: 'Cliente aprovou orçamento',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  {
    id: 'em_compras',
    label: 'Em Compras',
    description: 'Comprando materiais',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  },
  {
    id: 'em_producao',
    label: 'Em Produção',
    description: 'Manufaturando peça',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'finalizada',
    label: 'Finalizada',
    description: 'Processo concluído',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  }
];

interface WorkflowBreadcrumbProps {
  currentStage: string;
  variant?: 'default' | 'compact';
}

export default function WorkflowBreadcrumb({ currentStage, variant = 'default' }: WorkflowBreadcrumbProps) {
  const currentIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === currentStage);

  const getStageStatus = (index: number): 'completed' | 'current' | 'pending' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  if (variant === 'compact') {
    // Versão compacta: apenas badges horizontais
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {WORKFLOW_STAGES.map((stage, index) => {
          const status = getStageStatus(index);

          return (
            <div key={stage.id} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Badge
                variant={status === 'current' ? 'default' : 'outline'}
                className={`
                  ${status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' : ''}
                  ${status === 'current' ? stage.bgColor + ' ' + stage.color + ' border-current' : ''}
                  ${status === 'pending' ? 'bg-gray-50 text-gray-400 border-gray-200' : ''}
                  flex items-center gap-1 text-xs px-2 py-1
                `}
              >
                {status === 'completed' && <Check className="h-3 w-3" />}
                {status === 'current' && <Circle className="h-3 w-3 fill-current" />}
                {stage.label}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  }

  // Versão padrão: cards com descrições
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {WORKFLOW_STAGES.map((stage, index) => {
          const status = getStageStatus(index);

          return (
            <div key={stage.id} className="relative">
              {/* Linha conectora (apenas desktop) */}
              {index < WORKFLOW_STAGES.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-border z-0">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ width: status === 'completed' ? '100%' : '0%' }}
                  />
                </div>
              )}

              {/* Card do estágio */}
              <div
                className={`
                  relative z-10 p-3 rounded-lg border-2 transition-all duration-300
                  ${status === 'completed' ? 'bg-green-50 border-green-500' : ''}
                  ${status === 'current' ? stage.bgColor + ' border-current shadow-lg scale-105' : ''}
                  ${status === 'pending' ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
                `}
              >
                {/* Ícone de status */}
                <div className="flex items-center justify-center mb-2">
                  {status === 'completed' && (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                  {status === 'current' && (
                    <div className={`w-8 h-8 rounded-full ${stage.bgColor} border-2 ${stage.color.replace('text-', 'border-')} flex items-center justify-center`}>
                      <Circle className={`h-4 w-4 ${stage.color} fill-current`} />
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                      <Circle className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <div className={`
                    text-sm font-semibold mb-1
                    ${status === 'completed' ? 'text-green-700' : ''}
                    ${status === 'current' ? stage.color : ''}
                    ${status === 'pending' ? 'text-gray-400' : ''}
                  `}>
                    {stage.label}
                  </div>
                  <div className={`
                    text-xs
                    ${status === 'pending' ? 'text-gray-400' : 'text-muted-foreground'}
                  `}>
                    {stage.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
