import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Clock, CheckCircle2, AlertCircle, Loader2, Calendar, CalendarDays } from "lucide-react";
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
  em_execucao: { label: 'Em Execução', color: 'bg-blue-500', icon: Loader2 },
  concluido: { label: 'Concluído', color: 'bg-green-600', icon: CheckCircle2 },
  pausado: { label: 'Pausado', color: 'bg-yellow-500', icon: AlertCircle },
};

export default function AgendaFuncionario() {
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string | null>(null);
  const [semanaSelecionada, setSemanaSelecionada] = useState<number>(1); // 1-4

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
  const capacidadeSemanal = 45; // ~45h/semana
  const percentualCarga = (cargaTotal / capacidadeMensal) * 100;
  const percentualRealizado = cargaTotal > 0 ? (horasRealizadas / cargaTotal) * 100 : 0;

  // Distribuir processos por semana (baseado na ordem)
  const distribuirPorSemana = () => {
    if (!processosAlocados || processosAlocados.length === 0) {
      return { 1: [], 2: [], 3: [], 4: [] };
    }

    const processosPorSemana: Record<number, ProcessoAlocado[]> = { 1: [], 2: [], 3: [], 4: [] };
    const totalProcessos = processosAlocados.length;
    const processosPorSemanaIdeal = Math.ceil(totalProcessos / 4);

    processosAlocados.forEach((processo, index) => {
      const semana = Math.min(4, Math.floor(index / processosPorSemanaIdeal) + 1);
      processosPorSemana[semana].push(processo);
    });

    return processosPorSemana;
  };

  const processosPorSemana = distribuirPorSemana();

  // Calcular horas por semana
  const horasPorSemana = {
    1: processosPorSemana[1].reduce((acc, p) => acc + p.horas_previstas, 0),
    2: processosPorSemana[2].reduce((acc, p) => acc + p.horas_previstas, 0),
    3: processosPorSemana[3].reduce((acc, p) => acc + p.horas_previstas, 0),
    4: processosPorSemana[4].reduce((acc, p) => acc + p.horas_previstas, 0),
  };

  // Calcular dias da semana (baseado no mês atual)
  const getDiasDaSemana = (numeroSemana: number) => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);

    // Calcular dias de início e fim da semana
    const diaInicio = (numeroSemana - 1) * 7 + 1;
    const diaFim = Math.min(numeroSemana * 7, new Date(ano, mes + 1, 0).getDate());

    return `${diaInicio}-${diaFim}`;
  };

  // Obter dia da semana para cada processo (Segunda a Sexta)
  const getDiaDaSemana = (indexNaSemana: number) => {
    const diasUteis = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    return diasUteis[indexNaSemana % 5];
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Funcionário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">👤 Funcionário</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <Select
            value={funcionarioSelecionado || ''}
            onValueChange={setFuncionarioSelecionado}
            disabled={loadingFuncionarios}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione um funcionário..." />
            </SelectTrigger>
            <SelectContent>
              {funcionarios?.map((func) => (
                <SelectItem key={func.id} value={func.id}>
                  {func.nome} - Turno {func.turno}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      {funcionarioSelecionado && funcionarioAtual && (
        <Tabs defaultValue="mensal" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="mensal">
              <Calendar className="h-4 w-4 mr-2" />
              Visão Mensal
            </TabsTrigger>
            <TabsTrigger value="semanal">
              <CalendarDays className="h-4 w-4 mr-2" />
              Visão Semanal
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VISÃO MENSAL */}
          <TabsContent value="mensal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {funcionarioAtual.nome}
            </CardTitle>
            <CardDescription>
              Turno {funcionarioAtual.turno} • Capacidade: {capacidadeMensal}h/mês
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

            {/* Distribuição por Semana */}
            <Card>
              <CardHeader>
                <CardTitle>📅 Distribuição por Semana</CardTitle>
                <CardDescription>
                  Divisão estimada de processos pelas 4 semanas do mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((semana) => {
                    const horasSemana = horasPorSemana[semana as keyof typeof horasPorSemana];
                    const percentualSemana = (horasSemana / capacidadeSemanal) * 100;
                    const processosSemana = processosPorSemana[semana as keyof typeof processosPorSemana];

                    return (
                      <Card key={semana} className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>Semana {semana}</span>
                            <Badge variant="outline">{processosSemana.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{horasSemana.toFixed(1)}h</div>
                            <div className="text-xs text-muted-foreground">de {capacidadeSemanal}h</div>
                          </div>
                          <Progress
                            value={percentualSemana}
                            className={`h-2 ${
                              percentualSemana >= 90
                                ? 'bg-red-200'
                                : percentualSemana >= 70
                                ? 'bg-yellow-200'
                                : 'bg-green-200'
                            }`}
                          />
                          <div className="text-center text-sm font-medium">
                            {percentualSemana.toFixed(0)}%
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Processos Alocados - Mensal */}
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
          </TabsContent>

          {/* TAB 2: VISÃO SEMANAL */}
          <TabsContent value="semanal" className="space-y-4">
            {/* 3 Cards Compactos Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Selector de Semana */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">📅 Semana</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <Select
                    value={semanaSelecionada.toString()}
                    onValueChange={(value) => setSemanaSelecionada(parseInt(value))}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((semana) => (
                        <SelectItem key={semana} value={semana.toString()}>
                          Semana {semana} (dias {getDiasDaSemana(semana)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Card 2: Métricas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">📊 Métricas</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Total</div>
                      <div className="text-base font-bold">
                        {horasPorSemana[semanaSelecionada as keyof typeof horasPorSemana].toFixed(1)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Capacidade</div>
                      <div className="text-base font-bold">{capacidadeSemanal}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Processos</div>
                      <div className="text-base font-bold">
                        {processosPorSemana[semanaSelecionada as keyof typeof processosPorSemana].length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Carga */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">⚡ Carga da Semana</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {((horasPorSemana[semanaSelecionada as keyof typeof horasPorSemana] / capacidadeSemanal) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Progress
                      value={(horasPorSemana[semanaSelecionada as keyof typeof horasPorSemana] / capacidadeSemanal) * 100}
                      className={`h-2 ${
                        (horasPorSemana[semanaSelecionada as keyof typeof horasPorSemana] / capacidadeSemanal) * 100 >= 90
                          ? 'bg-red-200'
                          : (horasPorSemana[semanaSelecionada as keyof typeof horasPorSemana] / capacidadeSemanal) * 100 >= 70
                          ? 'bg-yellow-200'
                          : 'bg-green-200'
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Processos da Semana Selecionada */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  📋 Processos da Semana {semanaSelecionada} (dias {getDiasDaSemana(semanaSelecionada)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processosPorSemana[semanaSelecionada as keyof typeof processosPorSemana].length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhum processo nesta semana</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center">Dia</TableHead>
                          <TableHead className="w-[80px]">Ordem</TableHead>
                          <TableHead>Processo</TableHead>
                          <TableHead>OS / FTC</TableHead>
                          <TableHead className="text-center">Horas</TableHead>
                          <TableHead className="text-center">Progresso</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processosPorSemana[semanaSelecionada as keyof typeof processosPorSemana].map((processo, index) => {
                          const statusConfig = STATUS_PROCESSO_CONFIG[processo.status as keyof typeof STATUS_PROCESSO_CONFIG] || STATUS_PROCESSO_CONFIG.pendente;
                          const StatusIcon = statusConfig.icon;
                          const percentual = processo.horas_previstas > 0
                            ? (processo.horas_realizadas / processo.horas_previstas) * 100
                            : 0;

                          return (
                            <TableRow key={processo.id}>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{getDiaDaSemana(index)}</Badge>
                              </TableCell>
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
