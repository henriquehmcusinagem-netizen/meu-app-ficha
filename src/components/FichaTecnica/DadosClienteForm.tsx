import React, { memo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormData } from "@/types/ficha-tecnica";

interface Cliente {
  id: string;
  nome_razao_social: string;
  cnpj: string | null;
}

interface Contato {
  id: string;
  nome: string;
  celular: string | null;
  email: string | null;
  principal: boolean;
}

interface DadosClienteFormProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  sectionStyle: string;
  gridStyle: string;
  fieldStyle: string;
  labelStyle: string;
  inputStyle: string;
}

const DadosClienteForm = memo(({
  formData,
  updateFormData,
  sectionStyle,
  gridStyle,
  fieldStyle,
  labelStyle,
  inputStyle
}: DadosClienteFormProps) => {
  const [modoManual, setModoManual] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);

  // Query para buscar clientes ativos
  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome_razao_social, cnpj')
        .eq('ativo', true)
        .order('nome_razao_social');

      if (error) throw error;
      return data as Cliente[];
    },
  });

  // Query para buscar contatos do cliente selecionado
  const { data: contatos, isLoading: loadingContatos } = useQuery({
    queryKey: ['contatos-cliente', clienteSelecionadoId],
    queryFn: async () => {
      if (!clienteSelecionadoId) return [];

      const { data, error } = await supabase
        .from('contatos_cliente')
        .select('*')
        .eq('cliente_id', clienteSelecionadoId)
        .order('principal', { ascending: false })
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Contato[];
    },
    enabled: !!clienteSelecionadoId && !modoManual,
  });

  // Auto-selecionar cliente se tiver cliente_id no formData (modo edição)
  useEffect(() => {
    if (formData.cliente_id && !clienteSelecionadoId && !modoManual) {
      setClienteSelecionadoId(formData.cliente_id);
    }
  }, [formData.cliente_id, clienteSelecionadoId, modoManual]);

  // Handler quando seleciona um cliente do dropdown
  const handleClienteChange = (clienteId: string) => {
    if (clienteId === 'manual') {
      // Modo manual - permitir digitação livre
      setModoManual(true);
      setClienteSelecionadoId(null);
      updateFormData('cliente_id', '');
      updateFormData('contato_id', '');
      updateFormData('cliente', '');
      updateFormData('cnpj', '');
      updateFormData('telefone', '');
      updateFormData('email', '');
    } else {
      // Modo integrado - buscar dados do cliente cadastrado
      setModoManual(false);
      const cliente = clientes?.find(c => c.id === clienteId);
      if (cliente) {
        setClienteSelecionadoId(cliente.id);
        updateFormData('cliente_id', cliente.id);
        updateFormData('cliente', cliente.nome_razao_social);
        updateFormData('cnpj', cliente.cnpj || '');
        // Limpar contato anterior
        updateFormData('contato_id', '');
        updateFormData('telefone', '');
        updateFormData('email', '');
      }
    }
  };

  // Handler quando seleciona um contato do dropdown
  const handleContatoChange = (contatoId: string) => {
    const contato = contatos?.find(c => c.id === contatoId);
    if (contato) {
      updateFormData('contato_id', contato.id);
      updateFormData('telefone', contato.celular || '');
      updateFormData('email', contato.email || '');
      // Atualizar fone_email para compatibilidade
      updateFormData('fone_email', contato.celular || contato.email || '');
    }
  };

  return (
    <div className={sectionStyle}>
      <div className="text-base font-semibold mb-3 text-foreground border-b border-border pb-1">
        👤 DADOS DO CLIENTE
      </div>

      {/* Linha 1: Cliente e CNPJ */}
      <div className={`${gridStyle} grid-cols-1 md:grid-cols-2`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Cliente *</label>
          <div className="flex gap-2">
            <Select
              value={modoManual ? 'manual' : (clienteSelecionadoId || "")}
              onValueChange={handleClienteChange}
              disabled={loadingClientes}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">🖊️ Digitar manualmente</SelectItem>
                {clientes?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome_razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modoManual && (
            <Input
              className={`${inputStyle} mt-2`}
              placeholder="Digite o nome do cliente"
              value={formData.cliente}
              onChange={(e) => updateFormData("cliente", e.target.value)}
            />
          )}
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>CNPJ</label>
          <Input
            className={inputStyle}
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={(e) => updateFormData("cnpj", e.target.value)}
            disabled={!modoManual && !!clienteSelecionadoId}
          />
        </div>
      </div>

      {/* Linha 2: Solicitante, Telefone e Email (3 colunas) */}
      <div className={`${gridStyle} grid-cols-1 md:grid-cols-3 mt-3`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Solicitante *</label>
          <Input
            className={inputStyle}
            placeholder="Nome do solicitante na empresa cliente"
            value={formData.solicitante}
            onChange={(e) => updateFormData("solicitante", e.target.value)}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Telefone *</label>
          <Input
            className={inputStyle}
            placeholder="(00) 00000-0000"
            value={formData.telefone}
            onChange={(e) => {
              updateFormData("telefone", e.target.value);
              // Atualizar fone_email para compatibilidade
              if (!formData.email) {
                updateFormData("fone_email", e.target.value);
              }
            }}
            disabled={!modoManual && !!formData.contato_id}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Email *</label>
          <Input
            className={inputStyle}
            type="email"
            placeholder="contato@empresa.com"
            value={formData.email}
            onChange={(e) => {
              updateFormData("email", e.target.value);
              // Atualizar fone_email para compatibilidade
              if (!formData.telefone) {
                updateFormData("fone_email", e.target.value);
              }
            }}
            disabled={!modoManual && !!formData.contato_id}
          />
        </div>
      </div>

      {/* Linha 3: Dropdown de Contatos (só aparece se cliente integrado for selecionado) */}
      {!modoManual && clienteSelecionadoId && (
        <div className={`${gridStyle} grid-cols-1 mt-3`}>
          <div className={fieldStyle}>
            <label className={labelStyle}>Selecionar Contato</label>
            <Select
              value={formData.contato_id || ""}
              onValueChange={handleContatoChange}
              disabled={loadingContatos}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder={
                  loadingContatos
                    ? "Carregando contatos..."
                    : contatos && contatos.length > 0
                      ? "Selecione um contato"
                      : "Nenhum contato cadastrado"
                } />
              </SelectTrigger>
              <SelectContent>
                {contatos?.map((contato) => (
                  <SelectItem key={contato.id} value={contato.id}>
                    {contato.principal && "⭐ "}
                    {contato.nome}
                    {contato.celular && ` - ${contato.celular}`}
                    {contato.email && ` - ${contato.email}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contatos && contatos.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                💡 Este cliente não possui contatos cadastrados. Preencha manualmente abaixo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Linha 5: Datas */}
      <div className={`${gridStyle} grid-cols-1 md:grid-cols-2 mt-3`}>
        <div className={fieldStyle}>
          <label className={labelStyle}>Data da Visita</label>
          <Input
            className={inputStyle}
            type="date"
            value={formData.data_visita}
            onChange={(e) => updateFormData("data_visita", e.target.value)}
          />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Data de Entrega</label>
          <Input
            className={inputStyle}
            type="date"
            value={formData.data_entrega}
            onChange={(e) => updateFormData("data_entrega", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

DadosClienteForm.displayName = 'DadosClienteForm';

export default DadosClienteForm;
