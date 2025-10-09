import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  PlayCircle,
  PauseCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OSCardProps {
  os: any;
}

// Mapeamento de status com cores e ícones
const STATUS_CONFIG = {
  aguardando_materiais: {
    label: 'Aguardando Materiais',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Package,
  },
  aguardando_inicio: {
    label: 'Aguardando Início',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Clock,
  },
  em_producao: {
    label: 'Em Produção',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: PlayCircle,
  },
  pausada: {
    label: 'Pausada',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: PauseCircle,
  },
  concluida: {
    label: 'Concluída',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
};

// Mapeamento de nomes de processos para exibição
const PROCESSO_LABELS: Record<string, string> = {
  torno_grande: 'Torno Grande',
  torno_pequeno: 'Torno Pequeno',
  torno_cnc: 'Torno CNC',
  cnc_tf: 'CNC TF',
  centro_usinagem: 'Centro de Usinagem',
  fresa: 'Fresa',
  fresa_furad: 'Fresa/Furadeira',
  furadeira: 'Furadeira',
  plasma_oxicorte: 'Plasma/Oxicorte',
  dobra: 'Dobra',
  calandra: 'Calandra',
  macarico: 'Maçarico',
  macarico_solda: 'Maçarico/Solda',
  serra: 'Serra',
  caldeiraria: 'Caldeiraria',
  des_montg: 'Desmontagem/Montagem',
  montagem: 'Montagem',
  balanceamento: 'Balanceamento',
  mandrilhamento: 'Mandrilhamento',
  tratamento: 'Tratamento Térmico',
  pintura_horas: 'Pintura',
  lavagem: 'Lavagem',
  lavagem_acab: 'Lavagem/Acabamento',
  acabamento: 'Acabamento',
  programacao_cam: 'Programação CAM',
  eng_tec: 'Engenharia Técnica',
  tecnico_horas: 'Técnico',
};

export function OSCard({ os }: OSCardProps) {
  const [showProcessos, setShowProcessos] = useState(false);

  // Buscar processos da OS
  const { data: processos = [] } = useQuery({
    queryKey: ['processos-os', os.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos_os')
        .select('*')
        .eq('os_id', os.id)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar ficha técnica associada
  const { data: ficha } = useQuery({
    queryKey: ['ficha-os', os.ficha_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('cliente, nome_peca, quantidade')
        .eq('id', os.ficha_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!os.ficha_id,
  });

  const statusConfig = STATUS_CONFIG[os.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.aguardando_materiais;
  const StatusIcon = statusConfig.icon;

  // Calcular estatísticas de processos
  const totalProcessos = processos.length;
  const processosConcluidos = processos.filter((p: any) => p.status === 'concluido').length;
  const processosEmExecucao = processos.filter((p: any) => p.status === 'em_execucao').length;
  const horasTotaisPrevistas = processos.reduce((sum: number, p: any) => sum + (parseFloat(p.horas_previstas) || 0), 0);
  const horasTotaisRealizadas = processos.reduce((sum: number, p: any) => sum + (parseFloat(p.horas_realizadas) || 0), 0);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {os.numero_os}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-semibold">FTC:</span> {os.numero_ftc}
            </CardDescription>
            {ficha && (
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><span className="font-semibold">Cliente:</span> {ficha.cliente}</p>
                <p><span className="font-semibold">Peça:</span> {ficha.nome_peca}</p>
                <p><span className="font-semibold">Qtd:</span> {ficha.quantidade}</p>
              </div>
            )}
          </div>
          <Badge variant="outline" className={cn('flex items-center gap-1.5', statusConfig.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Informações de Datas */}
          <div className="bg-muted p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Criada em</p>
                <p className="font-medium">{formatDate(os.data_criacao)}</p>
              </div>
              {os.data_inicio && (
                <div>
                  <p className="text-xs text-muted-foreground">Iniciada em</p>
                  <p className="font-medium">{formatDate(os.data_inicio)}</p>
                </div>
              )}
              {os.data_conclusao && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Concluída em</p>
                  <p className="font-medium">{formatDate(os.data_conclusao)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas de Processos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalProcessos}</p>
              <p className="text-xs text-muted-foreground">Processos</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{processosConcluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{processosEmExecucao}</p>
              <p className="text-xs text-muted-foreground">Em Execução</p>
            </div>
          </div>

          {/* Horas Previstas vs Realizadas */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">⏱️ Horas</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Previstas</p>
                <p className="font-bold text-purple-700 dark:text-purple-400">{horasTotaisPrevistas.toFixed(2)}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Realizadas</p>
                <p className="font-bold text-purple-700 dark:text-purple-400">{horasTotaisRealizadas.toFixed(2)}h</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {os.observacoes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">📝 Observações</p>
              <p className="text-sm text-muted-foreground">{os.observacoes}</p>
            </div>
          )}

          {/* Botão para expandir processos */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowProcessos(!showProcessos)}
          >
            {showProcessos ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Ocultar Processos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver Processos ({totalProcessos})
              </>
            )}
          </Button>

          {/* Lista de Processos (expandível) */}
          {showProcessos && processos.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold mb-2">Processos da OS:</p>
              {processos.map((processo: any) => (
                <div
                  key={processo.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border',
                    processo.status === 'concluido' && 'bg-green-50 dark:bg-green-900/20 border-green-300',
                    processo.status === 'em_execucao' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
                    processo.status === 'pausado' && 'bg-orange-50 dark:bg-orange-900/20 border-orange-300',
                    processo.status === 'pendente' && 'bg-gray-50 dark:bg-gray-800/50 border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{processo.ordem}</span>
                    <span className="text-sm font-medium">
                      {PROCESSO_LABELS[processo.processo] || processo.processo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {processo.horas_realizadas}h / {processo.horas_previstas}h
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {processo.status === 'pendente' && '⏳ Pendente'}
                      {processo.status === 'em_execucao' && '▶️ Em Execução'}
                      {processo.status === 'concluido' && '✅ Concluído'}
                      {processo.status === 'pausado' && '⏸️ Pausado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
