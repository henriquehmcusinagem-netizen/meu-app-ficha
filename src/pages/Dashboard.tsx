import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Sistema de Fichas Técnicas
          </h1>
          <p className="text-muted-foreground text-lg">Gerencie suas fichas técnicas</p>
        </div>


        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Nova Ficha Técnica Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/30" onClick={() => navigate('/nova-ficha')}>
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
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-secondary/30" onClick={() => navigate('/consultar-fichas')}>
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

          {/* Gestão de Usuários Module */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-accent/30" onClick={() => navigate('/admin/usuarios')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-accent to-accent/80 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl text-accent-foreground">Gestão de Usuários</CardTitle>
              <p className="text-muted-foreground">
                Gerenciar usuários do sistema
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                Adicionar, editar e gerenciar usuários
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}