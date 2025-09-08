import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Plus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { carregarFichasSalvas } from "@/utils/supabaseStorage";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFichas: 0,
    fichasHoje: 0,
    valorTotalCotacoes: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const fichas = await carregarFichasSalvas();
        const hoje = new Date().toDateString();
        const fichasHoje = fichas.filter(f => 
          new Date(f.dataCriacao).toDateString() === hoje
        ).length;
        const valorTotal = fichas.reduce((sum, f) => sum + f.resumo.valorTotal, 0);

        setStats({
          totalFichas: fichas.length,
          fichasHoje,
          valorTotalCotacoes: valorTotal,
        });
      } catch (error) {
        console.log('Erro ao carregar estatísticas:', error);
      }
    };

    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Sistema de Fichas Técnicas
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie suas cotações e fichas técnicas
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Fichas</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalFichas}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fichas Hoje</CardTitle>
              <Plus className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.fichasHoje}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(stats.valorTotalCotacoes)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nova Ficha Técnica Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-primary to-primary/80 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-primary">Nova Ficha Técnica</CardTitle>
              <p className="text-muted-foreground">
                Criar uma nova ficha técnica de cotação
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Preencha dados do cliente, materiais e serviços
              </div>
            </CardContent>
          </Card>

          {/* Consultar Fichas Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-secondary/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-secondary to-secondary/80 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-secondary">Consultar Fichas</CardTitle>
              <p className="text-muted-foreground">
                Visualizar, editar e gerenciar fichas existentes
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Busque, filtre e gerencie suas fichas salvas
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}