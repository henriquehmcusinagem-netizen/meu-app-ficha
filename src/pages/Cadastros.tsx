import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { ClientesTab } from "@/components/Cadastros/ClientesTab";
import { FuncionariosTab } from "@/components/Cadastros/FuncionariosTab";
import { UsuariosTab } from "@/components/Cadastros/UsuariosTab";

export default function Cadastros() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("clientes");

  // Queries de contagem
  const { data: clientesCount } = useQuery({
    queryKey: ['clientes-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: funcionariosCount } = useQuery({
    queryKey: ['funcionarios-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('funcionarios')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: usuariosCount } = useQuery({
    queryKey: ['auth-usuarios-count'],
    queryFn: async () => {
      // Obter token de autenticação
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        return 0;
      }

      const token = sessionData.session.access_token;

      // Chamar Edge Function list-users
      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error || !data || !data.users) {
        return 0;
      }

      return data.users.length;
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-amber-600" />
            Cadastros
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes, funcionários e permissões
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clientes">
            👥 Clientes ({clientesCount || 0})
          </TabsTrigger>
          <TabsTrigger value="funcionarios">
            🔧 Funcionários ({funcionariosCount || 0})
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            🔐 Usuários ({usuariosCount || 0})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CLIENTES + CONTATOS */}
        <TabsContent value="clientes" className="space-y-4">
          <ClientesTab />
        </TabsContent>

        {/* ABA 2: FUNCIONÁRIOS */}
        <TabsContent value="funcionarios" className="space-y-4">
          <FuncionariosTab />
        </TabsContent>

        {/* ABA 3: USUÁRIOS/PERMISSÕES */}
        <TabsContent value="usuarios" className="space-y-4">
          <UsuariosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
