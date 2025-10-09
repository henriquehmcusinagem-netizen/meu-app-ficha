import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Funcionario {
  id: string;
  nome: string;
  turno: string;
  ativo: boolean;
}

interface ProcessoAlocado {
  id: string;
  processo: string;
  horas_previstas: number;
  horas_realizadas: number;
  status: string;
  ordem: number;
  os_id: string;
  ordens_servico: {
    numero_os: string;
    numero_ftc: string;
    status: string;
  };
}

// Mapeamento de nomes técnicos para labels amigáveis
const PROCESSO_LABELS: Record<string, string> = {
  torno_grande: 'Torno 1200mm',
  torno_pequeno: 'Torno 650mm',
  torno_cnc: 'Torno CNC',
  centro_usinagem: 'Centro Usinagem',
  fresa: 'Fresa',
  furadeira: 'Furadeira',
  plasma_oxicorte: 'Plasma/Oxicorte',
  macarico: 'Maçarico',
  solda: 'Solda',
  serra: 'Serra',
  dobra: 'Dobra',
  calandra: 'Calandra',
  caldeiraria: 'Caldeiraria',
  des_montg: 'Desmontagem',
  montagem: 'Montagem',
  balanceamento: 'Balanceamento',
  mandrilhamento: 'Mandrilhamento',
  tratamento: 'Tratamento',
  lavagem: 'Lavagem',
  acabamento: 'Acabamento',
  pintura_horas: 'Pintura',
  programacao_cam: 'Programação CAM',
  eng_tec: 'Eng/Técnico',
  tecnico_horas: 'Técnico Horas',
};

const STATUS_PROCESSO_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-gray-500', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', icon: Loader2 },
  concluido: { label: 'Concluído', color: 'bg-green-600', icon: CheckCircle2 },
  pausado: { label: 'Pausado', color: 'bg-yellow-500', icon: AlertCircle },
};

export default function AgendaFuncionario() {
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string | null>(null);

  // Query: Listar funcionários ativos
  const { data: funcionarios, isLoading: loadingFuncionarios } = useQuery({
    queryKey: ['funcionarios_ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, turno, ativo')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Funcionario[];
    },
  });

  // Query: Buscar processos alocados para o funcionário selecionado
  const { data: processosAlocados, isLoading: loadingProcessos } = useQuery({
    queryKey: ['processos_funcionario', funcionarioSelecionado],
    queryFn: async () => {
      if (!funcionarioSelecionado) return [];

      const { data, error } = await supabase
        .from('processos_os')
        .select(`
          id,
          processo,
          horas_previstas,
          horas_realizadas,
          status,
          ordem,
          os_id,
          ordens_servico:os_id (
            numero_os,
            numero_ftc,
            status
          )
        `)
        .eq('funcionario_id', funcionarioSelecionado)
        .neq('status', 'concluido')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as ProcessoAlocado[];
    },
    enabled: !!funcionarioSelecionado,
  });

  // Calcular carga total
  const funcionarioAtual = funcionarios?.find(f => f.id === funcionarioSelecionado);
  const cargaTotal = processosAlocados?.reduce((acc, p) => acc + p.horas_previstas, 0) || 0;
  const horasRealizadas = processosAlocados?.reduce((acc, p) => acc + p.horas_realizadas, 0) || 0;
  const capacidadeMensal = 179; // 179h/mês para ambos os turnos
  const percentualCarga = (cargaTotal / capacidadeMensal) * 100;
  const percentualRealizado = cargaTotal > 0 ? (horasRealizadas / cargaTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Seletor de Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Funcionário</CardTitle>
          <CardDescription>
            Escolha um funcionário para ver sua agenda e processos alocados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={funcionarioSelecionado || ''}
                onValueChange={setFuncionarioSelecionado}
                disabled={loadingFuncionarios}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário..." />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios?.map((func) => (
                    <SelectItem key={func.id} value={func.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {func.nome} - Turno {func.turno}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Funcionário */}
      {funcionarioSelecionado && funcionarioAtual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {funcionarioAtual.nome}
            </CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={funcionarioAtual.turno === 'A' ? 'default' : 'secondary'}>
                  Turno {funcionarioAtual.turno}
                </Badge>
                <span className="text-sm">Capacidade: {capacidadeMensal}h/mês</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Carga de Trabalho */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Carga de Trabalho Atual</span>
                  <span className="text-muted-foreground">
                    {cargaTotal.toFixed(1)}h / {capacidadeMensal}h ({percentualCarga.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={percentualCarga}
                  className={`h-2 ${
                    percentualCarga >= 90
                      ? 'bg-red-200'
                      : percentualCarga >= 70
                      ? 'bg-yellow-200'
                      : 'bg-green-200'
                  }`}
                />
              </div>

              {/* Progresso Realizado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progresso Realizado</span>
                  <span className="text-muted-foreground">
                    {horasRealizadas.toFixed(1)}h / {cargaTotal.toFixed(1)}h ({percentualRealizado.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={percentualRealizado}
                  className="h-2 bg-blue-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Processos Alocados */}
      {funcionarioSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>Processos Alocados</CardTitle>
            <CardDescription>
              Lista de processos pendentes e em andamento para este funcionário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProcessos ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando processos...</p>
              </div>
            ) : !processosAlocados || processosAlocados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum processo alocado</p>
                <p className="text-sm mt-2">
                  Este funcionário não possui processos pendentes ou em andamento
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Ordem</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>OS / FTC</TableHead>
                      <TableHead className="text-center">Horas</TableHead>
                      <TableHead className="text-center">Progresso</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processosAlocados.map((processo) => {
                      const statusConfig = STATUS_PROCESSO_CONFIG[processo.status as keyof typeof STATUS_PROCESSO_CONFIG] || STATUS_PROCESSO_CONFIG.pendente;
                      const StatusIcon = statusConfig.icon;
                      const percentual = processo.horas_previstas > 0
                        ? (processo.horas_realizadas / processo.horas_previstas) * 100
                        : 0;

                      return (
                        <TableRow key={processo.id}>
                          <TableCell className="text-center">
                            <Badge variant="outline">#{processo.ordem}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {PROCESSO_LABELS[processo.processo] || processo.processo}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="font-medium">{processo.ordens_servico.numero_os}</span>
                              <span className="text-muted-foreground text-xs">
                                FTC: {processo.ordens_servico.numero_ftc}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm">
                              <div className="font-medium">{processo.horas_realizadas}h / {processo.horas_previstas}h</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Progress value={percentual} className="h-2" />
                              <span className="text-xs text-muted-foreground text-center">
                                {percentual.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
