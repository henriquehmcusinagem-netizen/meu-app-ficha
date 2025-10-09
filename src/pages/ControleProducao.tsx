import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Factory, User, Clock, CheckCircle2, RefreshCw, ArrowLeft, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgendaFuncionario from "@/components/ControleProducao/AgendaFuncionario";

interface OrdemServico {
  id: string;
  numero_os: string;
  numero_ftc: string;
  ficha_id: string;
  status: string;
  data_criacao: string;
}

interface FichaTecnica {
  id: string;
  numero_ftc: string;
  cliente: string;
  nome_peca: string;
  quantidade: string;
}

interface ProcessoSugestao {
  processo: string;
  horas_previstas: number;
  funcionario_sugerido: {
    id: string;
    nome: string;
    turno: string;
    carga_horas: number;
    carga_percentual: number;
  } | null;
  funcionarios_disponiveis: Array<{
    id: string;
    nome: string;
    turno: string;
    carga_horas: number;
    carga_percentual: number;
  }>;
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

export default function ControleProducao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [alocacoes, setAlocacoes] = useState<Record<string, string>>({});

  // Query: Listar OSs aguardando início (materiais já recebidos)
  const { data: ordensServico, isLoading: loadingOS } = useQuery({
    queryKey: ['ordens_servico_aguardando'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('status', 'aguardando_inicio')
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      return data as OrdemServico[];
    },
  });

  // Query: Buscar dados da ficha da OS selecionada
  const { data: ficha } = useQuery({
    queryKey: ['ficha_os', selectedOS?.ficha_id],
    queryFn: async () => {
      if (!selectedOS?.ficha_id) return null;

      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('id, numero_ftc, cliente, nome_peca, quantidade')
        .eq('id', selectedOS.ficha_id)
        .single();

      if (error) throw error;
      return data as FichaTecnica;
    },
    enabled: !!selectedOS?.ficha_id,
  });

  // Query: Obter sugestões de alocação
  const { data: sugestoes, isLoading: loadingSugestoes, refetch: refetchSugestoes } = useQuery({
    queryKey: ['sugestoes_alocacao', selectedOS?.id],
    queryFn: async () => {
      if (!selectedOS?.id) return [];

      const { data, error } = await supabase.rpc('sugerir_alocacao_processos', {
        p_os_id: selectedOS.id,
      });

      if (error) throw error;

      // Inicializar alocações com sugestões
      const alocacoesIniciais: Record<string, string> = {};
      (data as ProcessoSugestao[]).forEach((sug) => {
        if (sug.funcionario_sugerido) {
          alocacoesIniciais[sug.processo] = sug.funcionario_sugerido.id;
        }
      });
      setAlocacoes(alocacoesIniciais);

      return data as ProcessoSugestao[];
    },
    enabled: !!selectedOS?.id,
  });

  // Mutation: Confirmar alocações
  const confirmarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOS || !sugestoes) return;

      // Criar registros em processos_os para cada processo alocado
      const processosParaInserir = sugestoes
        .filter((sug) => alocacoes[sug.processo])
        .map((sug, index) => ({
          os_id: selectedOS.id,
          processo: sug.processo,
          horas_previstas: sug.horas_previstas,
          horas_realizadas: 0,
          status: 'pendente',
          funcionario_id: alocacoes[sug.processo],
          ordem: index + 1,
        }));

      if (processosParaInserir.length === 0) {
        throw new Error('Nenhum processo alocado');
      }

      const { error } = await supabase
        .from('processos_os')
        .insert(processosParaInserir);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens_servico_aguardando'] });
      queryClient.invalidateQueries({ queryKey: ['processos_os'] });
      toast.success('Processos alocados com sucesso!');
      setSelectedOS(null);
      setAlocacoes({});
    },
    onError: (error: any) => {
      toast.error(`Erro ao alocar processos: ${error.message}`);
    },
  });

  const handleSelectOS = (os: OrdemServico) => {
    setSelectedOS(os);
    setAlocacoes({});
  };

  const handleChangeFuncionario = (processo: string, funcionarioId: string) => {
    setAlocacoes((prev) => ({
      ...prev,
      [processo]: funcionarioId,
    }));
  };

  const getCargaBadgeColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-red-600';
    if (percentual >= 70) return 'bg-orange-500';
    if (percentual >= 50) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  if (loadingOS) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Factory className="h-8 w-8 text-cyan-600" />
            Controle de Produção
          </h1>
          <p className="text-muted-foreground">
            Alocar processos produtivos para funcionários e visualizar agenda
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alocar" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="alocar">
            ⚙️ Alocar Processos ({ordensServico?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="agenda">
            📅 Agenda por Funcionário
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Alocar Processos */}
        <TabsContent value="alocar" className="space-y-6">
          {/* Lista de OSs Aguardando Início */}
          {!selectedOS && (
            <Card>
              <CardHeader>
                <CardTitle>Ordens de Serviço - Aguardando Início</CardTitle>
                <CardDescription>
                  Selecione uma OS para alocar processos aos funcionários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!ordensServico || ordensServico.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Factory className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma OS aguardando início</p>
                    <p className="text-sm mt-2">
                      Todas as OSs estão aguardando materiais ou já em produção
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ordensServico.map((os) => (
                      <div
                        key={os.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectOS(os)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg">{os.numero_os}</span>
                            <span className="text-sm text-muted-foreground">
                              FTC: {os.numero_ftc}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Aguardando Início
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Alocar Processos →
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alocação de Processos da OS Selecionada */}
          {selectedOS && (
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-6 w-6" />
                  {selectedOS.numero_os} - Alocar Processos
                </CardTitle>
                <CardDescription className="mt-2">
                  {ficha && (
                    <div className="space-y-1">
                      <div>FTC: <strong>{ficha.numero_ftc}</strong></div>
                      <div>Cliente: <strong>{ficha.cliente}</strong></div>
                      <div>Peça: <strong>{ficha.nome_peca}</strong> | Qtd: <strong>{ficha.quantidade}</strong></div>
                    </div>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedOS(null)}>
                ← Voltar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSugestoes ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Calculando sugestões de alocação...
                </p>
              </div>
            ) : !sugestoes || sugestoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum processo encontrado para esta OS</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[500px] pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead className="text-center">Horas</TableHead>
                        <TableHead>Funcionário Sugerido</TableHead>
                        <TableHead className="text-center">Turno</TableHead>
                        <TableHead className="text-center">Carga</TableHead>
                        <TableHead>Reatribuir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sugestoes.map((sug) => {
                        const funcionarioAtual = sug.funcionarios_disponiveis.find(
                          (f) => f.id === alocacoes[sug.processo]
                        ) || sug.funcionario_sugerido;

                        return (
                          <TableRow key={sug.processo}>
                            <TableCell className="font-medium">
                              {PROCESSO_LABELS[sug.processo] || sug.processo}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {sug.horas_previstas}h
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {funcionarioAtual ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{funcionarioAtual.nome}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  Nenhum funcionário disponível
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {funcionarioAtual ? (
                                <Badge variant={funcionarioAtual.turno === 'A' ? 'default' : 'secondary'} className="text-xs">
                                  {funcionarioAtual.turno || 'A'}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {funcionarioAtual ? (
                                <Badge className={getCargaBadgeColor(funcionarioAtual.carga_percentual)}>
                                  {funcionarioAtual.carga_percentual.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {sug.funcionarios_disponiveis.length > 0 ? (
                                <Select
                                  value={alocacoes[sug.processo] || ''}
                                  onValueChange={(value) => handleChangeFuncionario(sug.processo, value)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Selecionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sug.funcionarios_disponiveis.map((func) => (
                                      <SelectItem key={func.id} value={func.id}>
                                        {func.nome} ({func.carga_percentual.toFixed(0)}%)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Nenhum disponível
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    <p>💡 <strong>Capacidade:</strong> 179h/mês por funcionário (turnos alternados semanalmente)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => refetchSugestoes()}
                      disabled={loadingSugestoes}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingSugestoes ? 'animate-spin' : ''}`} />
                      Recalcular
                    </Button>
                    <Button
                      onClick={() => confirmarMutation.mutate()}
                      disabled={confirmarMutation.isPending || Object.keys(alocacoes).length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar Alocações'}
                    </Button>
                  </div>
                </div>
              </>
            )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Agenda por Funcionário */}
        <TabsContent value="agenda" className="space-y-6">
          <AgendaFuncionario />
        </TabsContent>
      </Tabs>
    </div>
  );
}
