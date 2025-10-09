import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AprovacoesTableProps {
  tipo?: 'ftc' | 'orcamento';
}

export function AprovacoesTable({ tipo = 'ftc' }: AprovacoesTableProps) {
  const tabela = tipo === 'ftc' ? 'aprovacoes_ftc_cliente' : 'aprovacoes_orcamento_cliente';

  const { data: aprovacoes, isLoading, error } = useQuery({
    queryKey: ['aprovacoes', tabela],
    queryFn: async () => {
      // Determinar qual coluna de data usar baseado na tabela
      const colunaData = tipo === 'orcamento' ? 'criado_em' : 'created_at';

      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .order(colunaData, { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const getBadge = (tipo: string) => {
    switch(tipo) {
      case 'aprovar':
        return <Badge className="bg-green-600 hover:bg-green-700">✅ Aprovado</Badge>;
      case 'alterar':
        return <Badge className="bg-orange-600 hover:bg-orange-700">🔄 Alteração</Badge>;
      case 'rejeitar':
        return <Badge className="bg-red-600 hover:bg-red-700">❌ Rejeitado</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando aprovações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>❌ Erro ao carregar aprovações</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!aprovacoes || aprovacoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>📭 Nenhuma aprovação registrada ainda</p>
        <p className="text-sm mt-2">As aprovações dos clientes aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">FTC</TableHead>
            <TableHead className="w-[120px]">Tipo</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-[130px]">Telefone</TableHead>
            <TableHead className="max-w-xs">Observações</TableHead>
            <TableHead className="w-[150px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aprovacoes.map((aprov) => (
            <TableRow key={aprov.id}>
              <TableCell className="font-bold text-primary">
                {aprov.numero_ftc}
              </TableCell>
              <TableCell>
                {getBadge(aprov.tipo)}
              </TableCell>
              <TableCell className="font-medium">
                {aprov.responsavel}
              </TableCell>
              <TableCell className="text-sm">
                {aprov.email}
              </TableCell>
              <TableCell className="text-sm">
                {aprov.telefone || '-'}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={aprov.observacoes || ''}>
                  {aprov.observacoes || '-'}
                </div>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {format(new Date(aprov.created_at || aprov.criado_em), 'dd/MM/yyyy HH:mm')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
