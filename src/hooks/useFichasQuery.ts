import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FichaSalva } from '@/types/ficha-tecnica';
import { carregarFichasSalvas, excluirFicha, carregarFicha } from '@/utils/supabaseStorage';
import { useToast } from '@/hooks/use-toast';

const FICHAS_QUERY_KEY = ['fichas'];
const FICHA_QUERY_KEY = (id: string) => ['ficha', id];

export function useFichasQuery() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para listar todas as fichas
  const fichasQuery = useQuery({
    queryKey: FICHAS_QUERY_KEY,
    queryFn: carregarFichasSalvas,
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Mutation para excluir ficha
  const deleteMutation = useMutation({
    mutationFn: excluirFicha,
    onSuccess: () => {
      // Invalidar cache das fichas
      queryClient.invalidateQueries({ queryKey: FICHAS_QUERY_KEY });
      toast({
        title: "Sucesso",
        description: "Ficha excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir ficha.",
        variant: "destructive",
      });
    }
  });

  // Função para invalidar cache após salvar
  const invalidateFichas = () => {
    queryClient.invalidateQueries({ queryKey: FICHAS_QUERY_KEY });
  };

  return {
    fichas: fichasQuery.data || [],
    isLoading: fichasQuery.isLoading,
    isError: fichasQuery.isError,
    error: fichasQuery.error,
    refetch: fichasQuery.refetch,
    deleteFicha: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    invalidateFichas,
  };
}

export function useFichaQuery(id: string | null) {
  return useQuery({
    queryKey: FICHA_QUERY_KEY(id || ''),
    queryFn: () => id ? carregarFicha(id) : null,
    enabled: !!id,
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}