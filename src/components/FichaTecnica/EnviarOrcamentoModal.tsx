import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Mail, User, Send, Plus, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FichaSalva, OrcamentoData } from '@/types/ficha-tecnica';
import { supabase } from '@/integrations/supabase/client';
import { carregarFotosFicha } from '@/utils/supabaseStorage';
import { generateHTMLWithApproval } from '@/utils/htmlGenerator';
import { generateOrcamentoHTML } from '@/utils/orcamentoHTMLGenerator';
import { getAppBaseUrl } from '@/utils/helpers';

interface Contato {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
}

interface EnviarOrcamentoModalProps {
  open: boolean;
  onClose: () => void;
  onEnviar?: (dadosEnvio: any) => void;
  orcamento: OrcamentoData | null;
  fichaTecnica: FichaSalva;
}

export const EnviarOrcamentoModal: React.FC<EnviarOrcamentoModalProps> = ({
  open,
  onClose,
  onEnviar,
  orcamento,
  fichaTecnica
}) => {
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [activeTab, setActiveTab] = useState('contatos');
  const [contatosAdicionais, setContatosAdicionais] = useState<Contato[]>([]);
  const [mostrarFormNovoContato, setMostrarFormNovoContato] = useState(false);
  const [novoContato, setNovoContato] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const { toast } = useToast();

  // Resetar estado quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setEnviando(false);
      setActiveTab('contatos');

      // Pré-selecionar contato principal da FTC
      const contatosPrincipal = [];
      if (fichaTecnica?.formData?.fone_email) {
        contatosPrincipal.push('auto-detected');
      }
      setContatosSelecionados(contatosPrincipal);

      // Gerar assunto e mensagem automáticos
      const numeroFTC = fichaTecnica?.numeroFTC || 'N/A';
      const nomeCliente = fichaTecnica?.formData?.cliente || 'Cliente';
      const solicitante = fichaTecnica?.formData?.solicitante || nomeCliente;

      setAssunto(`Orçamento FTC ${numeroFTC} - ${fichaTecnica?.formData?.nome_peca || 'Serviço'}`);

      setMensagem(`Prezado(a) ${solicitante},

Segue em anexo o orçamento solicitado conforme especificações técnicas fornecidas.

📋 FTC: ${numeroFTC}
👤 Solicitante: ${solicitante}
🔧 Serviço: ${fichaTecnica?.formData?.nome_peca || 'Conforme especificação'}
⏰ Prazo: ${orcamento?.config?.prazoEntrega || 'A definir'} dias úteis
✅ Validade: ${orcamento?.config?.validadeProposta || 30} dias

📋 FICHA TÉCNICA COM APROVAÇÃO
Incluímos a ficha técnica completa com botões de aprovação direta. Você pode aprovar, solicitar alterações ou rejeitar diretamente pelo link enviado.

⚡ APROVAÇÃO RÁPIDA
Clique nos botões de aprovação incluídos no link para agilizar o processo.

Ficamos à disposição para esclarecimentos.

Atenciosamente,
Equipe HMC Usinagem`);
    }
  }, [open, orcamento, fichaTecnica]);

  // Contatos disponíveis (auto-detectado + adicionais manuais)
  const contatosDisponiveisComAuto = useMemo(() => {
    const contatosBase: Contato[] = [];

    // Adicionar contato auto-detectado da FTC
    if (fichaTecnica?.formData?.fone_email) {
      contatosBase.push({
        id: 'auto-detected',
        nome: fichaTecnica.formData.solicitante || fichaTecnica.formData.cliente || 'Contato Principal',
        email: fichaTecnica.formData.fone_email,
        telefone: '',
        cargo: 'Solicitante',
        departamento: 'Auto-detectado'
      });
    }

    // Adicionar contatos manuais
    contatosBase.push(...contatosAdicionais);

    return contatosBase;
  }, [fichaTecnica, contatosAdicionais]);

  const handleContatoToggle = useCallback((contatoId: string) => {
    setContatosSelecionados(prev => {
      const newSelection = prev.includes(contatoId)
        ? prev.filter(id => id !== contatoId)
        : [...prev, contatoId];
      return newSelection;
    });
  }, []);

  const handleAdicionarContato = useCallback(() => {
    if (!novoContato.nome || !novoContato.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const novoId = `manual-${Date.now()}`;
    const contato: Contato = {
      id: novoId,
      nome: novoContato.nome,
      email: novoContato.email,
      telefone: novoContato.telefone,
      cargo: 'Adicionado manualmente',
      departamento: 'Manual'
    };

    setContatosAdicionais(prev => [...prev, contato]);
    setContatosSelecionados(prev => [...prev, novoId]);
    setNovoContato({ nome: '', email: '', telefone: '' });
    setMostrarFormNovoContato(false);

    toast({
      title: "Contato adicionado",
      description: "Contato adicionado com sucesso"
    });
  }, [novoContato, toast]);

  const handleRemoverContatoManual = useCallback((contatoId: string) => {
    setContatosAdicionais(prev => prev.filter(c => c.id !== contatoId));
    setContatosSelecionados(prev => prev.filter(id => id !== contatoId));
  }, []);

  const handleEnviar = useCallback(async () => {
    if (contatosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um contato",
        variant: "destructive"
      });
      return;
    }

    setEnviando(true);

    try {
      // 1. Preparar contatos selecionados
      const contatosParaEnvio = contatosSelecionados.map(id =>
        contatosDisponiveisComAuto.find(c => c.id === id)
      ).filter(Boolean);

      const emailsDestino = contatosParaEnvio.map(c => c?.email).filter(Boolean);

      if (emailsDestino.length === 0) {
        throw new Error('Nenhum email válido encontrado nos contatos selecionados');
      }

      // 2. Salvar orçamento no banco
      toast({
        title: "Salvando orçamento...",
        description: "Atualizando banco de dados..."
      });

      const orcamentoJSON = JSON.stringify(orcamento);

      const { error: updateError } = await supabase
        .from('fichas_tecnicas')
        .update({
          dados_orcamento: orcamentoJSON,
          status: 'orcamento_enviado_cliente'
        })
        .eq('id', fichaTecnica.id);

      if (updateError) throw updateError;

      // 3. Carregar fotos
      toast({
        title: "Carregando fotos...",
        description: "Preparando ficha técnica..."
      });

      const fotos = await carregarFotosFicha(fichaTecnica.id);
      const fichaComFotos: FichaSalva = {
        ...fichaTecnica,
        fotos,
        formData: {
          ...fichaTecnica.formData,
          dados_orcamento: orcamentoJSON
        }
      };

      // 4. Gerar 2 HTMLs: Técnico (para Engenharia) e Orçamento (para Compras)
      toast({
        title: "Gerando HTMLs...",
        description: "Criando ficha técnica e orçamento com sistema de aprovação..."
      });

      const timestamp = Date.now();

      // 4a. HTML Técnico (para ENGENHARIA aprovar)
      const htmlTecnico = await generateHTMLWithApproval({
        ficha: fichaComFotos,
        versaoFTC: fichaTecnica.versao_ftc_atual || 1,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      });

      // 4b. HTML Orçamento (para COMPRAS aprovar)
      let htmlOrcamento;
      try {
        htmlOrcamento = await generateOrcamentoHTML(
          fichaComFotos,
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          fichaTecnica.versao_orcamento_atual || 1
        );
      } catch (orcError) {
        console.error('Erro ao gerar HTML de orçamento:', orcError);
        throw new Error(`Falha ao gerar HTML de orçamento: ${orcError instanceof Error ? orcError.message : 'Erro desconhecido'}`);
      }

      // 5. Upload de AMBOS os HTMLs
      toast({
        title: "Fazendo upload...",
        description: "Salvando HTMLs no storage..."
      });

      const fileNameTecnico = `ftc-tecnica-${fichaTecnica.numeroFTC}-${timestamp}.html`;
      const fileNameOrcamento = `ftc-orcamento-${fichaTecnica.numeroFTC}-${timestamp}.html`;
      const filePathTecnico = `temp/${fileNameTecnico}`;
      const filePathOrcamento = `temp/${fileNameOrcamento}`;

      const htmlBlobTecnico = new Blob([htmlTecnico], { type: 'text/html;charset=utf-8' });
      const htmlBlobOrcamento = new Blob([htmlOrcamento], { type: 'text/html;charset=utf-8' });

      // Upload HTML Técnico
      const { error: uploadErrorTecnico } = await supabase.storage
        .from('ficha-fotos')
        .upload(filePathTecnico, htmlBlobTecnico, {
          contentType: 'text/html',
          upsert: true
        });

      if (uploadErrorTecnico) throw uploadErrorTecnico;

      // Upload HTML Orçamento
      const { error: uploadErrorOrcamento } = await supabase.storage
        .from('ficha-fotos')
        .upload(filePathOrcamento, htmlBlobOrcamento, {
          contentType: 'text/html',
          upsert: true
        });

      if (uploadErrorOrcamento) throw uploadErrorOrcamento;

      const viewerUrlTecnico = `${getAppBaseUrl()}/view-html/${encodeURIComponent(filePathTecnico)}`;
      const viewerUrlOrcamento = `${getAppBaseUrl()}/view-html/${encodeURIComponent(filePathOrcamento)}`;

      // 6. Enviar WhatsApp com AMBOS os links
      const msgWhatsApp = `🔧 *Orçamento FTC ${fichaTecnica.numeroFTC}*\n\n` +
        `📋 Cliente: ${fichaTecnica.formData.cliente}\n` +
        `⚙️ Serviço: ${fichaTecnica.formData.nome_peca}\n` +
        `💰 Valor: R$ ${orcamento?.precoVendaFinal.toFixed(2)}\n\n` +
        `📄 *Aprovações Separadas:*\n\n` +
        `🔧 *FICHA TÉCNICA* (Engenharia):\n${viewerUrlTecnico}\n\n` +
        `💰 *ORÇAMENTO COMERCIAL* (Compras):\n${viewerUrlOrcamento}\n\n` +
        `✅ Cada departamento pode aprovar sua parte diretamente!`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msgWhatsApp)}`, '_blank');

      // 7. Enviar Email (Outlook) com AMBOS os links
      const emailBody = mensagem +
        `\n\n📄 LINKS PARA VISUALIZAÇÃO E APROVAÇÃO:\n\n` +
        `🔧 FICHA TÉCNICA (Aprovação: Engenharia):\n${viewerUrlTecnico}\n\n` +
        `💰 ORÇAMENTO COMERCIAL (Aprovação: Compras):\n${viewerUrlOrcamento}\n\n` +
        `Cada departamento pode aprovar sua parte de forma independente.`;

      window.location.href = `mailto:${emailsDestino.join(',')}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(emailBody)}`;

      // 8. Callback de sucesso
      if (onEnviar) {
        onEnviar({
          contatos: contatosParaEnvio,
          orcamento,
          fichaTecnica: fichaComFotos,
          link: viewerUrlTecnico, // Link principal (ficha técnica)
          dataEnvio: new Date().toISOString()
        });
      }

      toast({
        title: "✅ Orçamento enviado com sucesso!",
        description: `Email e WhatsApp preparados. 2 HTMLs gerados (Técnico + Orçamento)`
      });

      onClose();
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast({
        title: "❌ Erro ao enviar orçamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  }, [contatosSelecionados, orcamento, fichaTecnica, mensagem, assunto, onEnviar, onClose, contatosDisponiveisComAuto, toast]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 border">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>
            <div>
              <h2 className="text-xl font-semibold">Enviar Orçamento</h2>
              <p className="text-sm text-gray-500 font-normal">
                FTC {fichaTecnica?.numeroFTC || 'N/A'} - {fichaTecnica?.formData?.cliente || 'Cliente N/A'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Navegação por abas */}
        <div className="border-b bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('contatos')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'contatos'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Contatos ({contatosSelecionados.length})
            </button>
            <button
              onClick={() => setActiveTab('mensagem')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mensagem'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Mensagem
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] p-6">
          {/* Aba Contatos */}
          {activeTab === 'contatos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Selecionar Contatos</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarFormNovoContato(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Adicionar Contato
                  </Button>
                  <Badge variant="outline">
                    {contatosSelecionados.length} selecionado(s)
                  </Badge>
                </div>
              </div>

              {/* Lista de contatos */}
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg">
                {contatosDisponiveisComAuto.map((contato) => {
                  const isSelected = contatosSelecionados.includes(contato.id);
                  const isAutoDetected = contato.id === 'auto-detected';

                  return (
                    <div
                      key={contato.id}
                      className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleContatoToggle(contato.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {contato.nome}
                            </div>
                            {isAutoDetected && (
                              <Badge variant="secondary" className="text-xs">
                                Auto-detectado
                              </Badge>
                            )}
                            {isSelected && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                ✓ Selecionado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{contato.email}</span>
                            </div>
                            {contato.telefone && (
                              <div className="flex items-center gap-2 mt-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{contato.telefone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {contato.id.startsWith('manual-') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverContatoManual(contato.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleContatoToggle(contato.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {contatosDisponiveisComAuto.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum contato encontrado</p>
                    <p className="text-sm">Adicione um contato abaixo</p>
                  </div>
                )}
              </div>

              {/* Formulário para adicionar novo contato */}
              {mostrarFormNovoContato && (
                <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-blue-900">
                      Adicionar Novo Contato
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrarFormNovoContato(false);
                        setNovoContato({ nome: '', email: '', telefone: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome *
                      </label>
                      <Input
                        value={novoContato.nome}
                        onChange={(e) => setNovoContato(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome do contato"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={novoContato.email}
                        onChange={(e) => setNovoContato(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@empresa.com"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp
                      </label>
                      <Input
                        value={novoContato.telefone}
                        onChange={(e) => setNovoContato(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAdicionarContato}
                      disabled={!novoContato.nome || !novoContato.email}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Contato
                    </Button>
                    <p className="text-xs text-gray-600">
                      * Nome e email são obrigatórios
                    </p>
                  </div>
                </div>
              )}

              {/* Informações sobre envio */}
              {contatosSelecionados.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Como funciona o envio:</h4>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>Email: Link da ficha técnica com aprovação direta (Outlook)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" />
                      <span>WhatsApp: Mensagem com link para aprovação</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba Mensagem */}
          {activeTab === 'mensagem' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Personalizar Mensagem</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto do Email
                    </label>
                    <Input
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Assunto do email..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem Personalizada
                    </label>
                    <Textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      rows={12}
                      placeholder="Digite sua mensagem personalizada..."
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta mensagem será incluída no email junto com o link de aprovação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            {activeTab !== 'contatos' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('contatos')}
                className="text-xs"
              >
                ← Voltar aos Contatos
              </Button>
            )}

            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose} disabled={enviando}>
                Cancelar
              </Button>

              {activeTab === 'contatos' && contatosSelecionados.length > 0 && (
                <Button
                  onClick={() => setActiveTab('mensagem')}
                  variant="outline"
                >
                  Próximo: Mensagem →
                </Button>
              )}

              {/* Botão de Envio */}
              {contatosSelecionados.length > 0 && (
                <Button
                  onClick={handleEnviar}
                  disabled={enviando || !assunto.trim() || !mensagem.trim()}
                  className="min-w-[140px] bg-green-600 hover:bg-green-700"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar por Email & WhatsApp
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
