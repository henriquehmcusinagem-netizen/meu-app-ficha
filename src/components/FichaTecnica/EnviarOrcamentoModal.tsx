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
  const [tipoEnvio, setTipoEnvio] = useState<'ambos' | 'orcamento' | 'ficha'>('ambos');
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
      setTipoEnvio('ambos');

      // Pré-selecionar contato principal da FTC
      const contatosPrincipal = [];
      if (fichaTecnica?.formData?.telefone || fichaTecnica?.formData?.email || fichaTecnica?.formData?.fone_email) {
        contatosPrincipal.push('auto-detected');
      }
      setContatosSelecionados(contatosPrincipal);
    }
  }, [open, fichaTecnica]);

  // Contatos disponíveis (auto-detectado + adicionais manuais)
  const contatosDisponiveisComAuto = useMemo(() => {
    const contatosBase: Contato[] = [];

    // Adicionar contato auto-detectado da FTC
    if (fichaTecnica?.formData?.telefone || fichaTecnica?.formData?.email || fichaTecnica?.formData?.fone_email) {
      const telefone = fichaTecnica.formData.telefone || '';
      const email = fichaTecnica.formData.email || '';

      // Fallback para compatibilidade com fichas antigas
      const foneEmail = fichaTecnica.formData.fone_email || '';
      const isTelefone = /[\(\)\-\+]/.test(foneEmail) || /^\d/.test(foneEmail);

      contatosBase.push({
        id: 'auto-detected',
        nome: fichaTecnica.formData.solicitante || fichaTecnica.formData.cliente || 'Contato Principal',
        email: email || (isTelefone ? '' : foneEmail),
        telefone: telefone || (isTelefone ? foneEmail : ''),
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

      if (contatosParaEnvio.length === 0) {
        throw new Error('Nenhum contato selecionado');
      }

      // 2. Salvar orçamento no banco
      toast({
        title: "Salvando orçamento...",
        description: "Atualizando banco de dados..."
      });

      const orcamentoJSON = JSON.stringify(orcamento);

      // Calcular a nova versão do orçamento ANTES do update
      const novaVersaoOrcamento = (fichaTecnica.versao_orcamento_atual || 0) + 1;

      const { error: updateError } = await supabase
        .from('fichas_tecnicas')
        .update({
          dados_orcamento: orcamentoJSON,
          status: 'orcamento_enviado_cliente',
          versao_orcamento_atual: novaVersaoOrcamento
        })
        .eq('id', fichaTecnica.id);

      if (updateError) throw updateError;

      // 2.5. Gerar tokens únicos para cada contato
      toast({
        title: "Gerando tokens de aprovação...",
        description: "Criando links personalizados para cada contato..."
      });

      const tokensMap = new Map<string, string>(); // contactId -> token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias

      for (const contato of contatosParaEnvio) {
        if (!contato) continue;

        const token = crypto.randomUUID();

        const { error: tokenError } = await supabase
          .from('aprovacao_tokens')
          .insert({
            token,
            ficha_id: fichaTecnica.id,
            tipo: 'orcamento',
            contato_nome: contato.nome,
            contato_email: contato.email,
            contato_telefone: contato.telefone || null,
            contato_cargo: contato.cargo || null,
            expira_em: expiresAt.toISOString()
          });

        if (tokenError) {
          console.error(`Erro ao criar token para ${contato.nome}:`, tokenError);
          throw new Error(`Falha ao criar token de aprovação para ${contato.nome}`);
        }

        tokensMap.set(contato.id, token);
      }

      // 3. Carregar fotos
      toast({
        title: "Carregando fotos...",
        description: "Preparando ficha técnica..."
      });

      const fotos = await carregarFotosFicha(fichaTecnica.id);
      const numeroFTC = fichaTecnica.numeroFTC || fichaTecnica.numero_ftc || 'SEM-NUMERO';
      const fichaComFotos: FichaSalva = {
        ...fichaTecnica,
        numeroFTC: numeroFTC,
        numero_ftc: numeroFTC,
        fotos,
        formData: {
          ...fichaTecnica.formData,
          dados_orcamento: orcamentoJSON
        }
      };

      // 4. Gerar HTMLs conforme seleção do usuário
      const geraTecnico = tipoEnvio === 'ambos' || tipoEnvio === 'ficha';
      const geraOrcamento = tipoEnvio === 'ambos' || tipoEnvio === 'orcamento';

      toast({
        title: "Gerando HTMLs...",
        description: geraTecnico && geraOrcamento
          ? "Criando ficha técnica e orçamento..."
          : geraTecnico
            ? "Criando ficha técnica..."
            : "Criando orçamento..."
      });

      const timestamp = Date.now();
      let htmlTecnico, htmlOrcamento, filePathTecnico, filePathOrcamento;

      // 4a. HTML Técnico (se selecionado)
      if (geraTecnico) {
        htmlTecnico = await generateHTMLWithApproval({
          ficha: fichaComFotos,
          versaoFTC: fichaTecnica.versao_ftc_atual || 1,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        });
      }

      // 4b. HTML Orçamento (se selecionado)
      if (geraOrcamento) {
        try {
          htmlOrcamento = await generateOrcamentoHTML(
            fichaComFotos,
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            novaVersaoOrcamento
          );
        } catch (orcError) {
          console.error('Erro ao gerar HTML de orçamento:', orcError);
          throw new Error(`Falha ao gerar HTML de orçamento: ${orcError instanceof Error ? orcError.message : JSON.stringify(orcError)}`);
        }
      }

      // 5. Upload dos HTMLs selecionados
      toast({
        title: "Fazendo upload...",
        description: "Salvando HTMLs no storage..."
      });

      // Upload HTML Técnico (se gerado)
      if (geraTecnico && htmlTecnico) {
        const fileNameTecnico = `ftc-tecnica-${numeroFTC}-${timestamp}.html`;
        filePathTecnico = `temp/${fileNameTecnico}`;
        const htmlBlobTecnico = new Blob([htmlTecnico], { type: 'text/html;charset=utf-8' });

        const { error: uploadErrorTecnico } = await supabase.storage
          .from('ficha-fotos')
          .upload(filePathTecnico, htmlBlobTecnico, {
            contentType: 'text/html',
            upsert: true
          });

        if (uploadErrorTecnico) throw uploadErrorTecnico;
      }

      // Upload HTML Orçamento (se gerado)
      if (geraOrcamento && htmlOrcamento) {
        const fileNameOrcamento = `ftc-orcamento-${numeroFTC}-${timestamp}.html`;
        filePathOrcamento = `temp/${fileNameOrcamento}`;
        const htmlBlobOrcamento = new Blob([htmlOrcamento], { type: 'text/html;charset=utf-8' });

        const { error: uploadErrorOrcamento } = await supabase.storage
          .from('ficha-fotos')
          .upload(filePathOrcamento, htmlBlobOrcamento, {
            contentType: 'text/html',
            upsert: true
          });

        if (uploadErrorOrcamento) throw uploadErrorOrcamento;
      }

      const baseUrlTecnico = filePathTecnico ? `${getAppBaseUrl()}/view-html/${encodeURIComponent(filePathTecnico)}` : null;
      const baseUrlOrcamento = filePathOrcamento ? `${getAppBaseUrl()}/view-html/${encodeURIComponent(filePathOrcamento)}` : null;

      // 6. Gerar links personalizados para cada contato
      const linksPersonalizados = contatosParaEnvio.map(contato => {
        if (!contato) return null;
        const token = tokensMap.get(contato.id);
        if (!token) return null;

        return {
          contato: contato.nome,
          email: contato.email,
          urlTecnico: baseUrlTecnico ? `${baseUrlTecnico}?token=${token}` : null,
          urlOrcamento: baseUrlOrcamento ? `${baseUrlOrcamento}?token=${token}` : null
        };
      }).filter(Boolean);

      // 7. Preparar textos comuns
      const primeiroLink = linksPersonalizados[0];
      const nomeCliente = fichaTecnica?.formData?.cliente || 'Cliente';
      const solicitante = fichaTecnica?.formData?.solicitante || nomeCliente;
      const servico = fichaTecnica?.formData?.nome_peca || 'Conforme especificação';
      const prazo = orcamento?.config?.prazoEntrega || 'A definir';
      const validade = orcamento?.config?.validadeProposta || 30;

      // 8. Preparar assunto do email
      const assunto = `Orçamento FTC ${numeroFTC} - ${servico}`;

      // 9. Preparar corpo do email conforme tipo selecionado
      let linksEmail = '';
      if (tipoEnvio === 'ambos') {
        linksEmail = `📄 LINKS PARA VISUALIZAÇÃO E APROVAÇÃO:\n\n` +
          `🔧 FICHA TÉCNICA:\n${primeiroLink?.urlTecnico}\n\n` +
          `💰 ORÇAMENTO:\n${primeiroLink?.urlOrcamento}\n\n`;
      } else if (tipoEnvio === 'orcamento') {
        linksEmail = `📄 LINK PARA VISUALIZAÇÃO E APROVAÇÃO:\n\n` +
          `💰 ORÇAMENTO:\n${primeiroLink?.urlOrcamento}\n\n`;
      } else if (tipoEnvio === 'ficha') {
        linksEmail = `📄 LINK PARA VISUALIZAÇÃO E APROVAÇÃO:\n\n` +
          `🔧 FICHA TÉCNICA:\n${primeiroLink?.urlTecnico}\n\n`;
      }

      let emailBody = `Prezado(a) ${solicitante},\n\n` +
        `Segue em anexo o orçamento solicitado conforme especificações técnicas fornecidas.\n\n` +
        `📋 FTC: ${numeroFTC}\n` +
        `👤 Solicitante: ${solicitante}\n` +
        `🔧 Serviço: ${servico}\n` +
        `⏰ Prazo: ${prazo} dias úteis\n` +
        `✅ Validade: ${validade} dias\n\n` +
        linksEmail +
        `Ficamos à disposição para esclarecimentos.\n\n` +
        `Atenciosamente,\nEquipe HMC Usinagem`;

      // 10. Toast de sucesso ANTES de abrir janelas
      toast({
        title: "✅ Orçamento enviado com sucesso!",
        description: `Abrindo Email e WhatsApp...`
      });

      // 11. Callback de sucesso
      if (onEnviar) {
        onEnviar({
          contatos: contatosParaEnvio,
          orcamento,
          fichaTecnica: fichaComFotos,
          link: primeiroLink?.urlTecnico || primeiroLink?.urlOrcamento || baseUrlTecnico || baseUrlOrcamento || '',
          dataEnvio: new Date().toISOString(),
          tokensGerados: linksPersonalizados
        });
      }

      // 12. Abrir Outlook (PRIMEIRO)
      if (emailsDestino.length > 0) {
        const mailtoLink = `mailto:${emailsDestino.join(',')}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(emailBody)}`;
        console.log('🔍 Abrindo Outlook:', mailtoLink.substring(0, 100) + '...');
        window.location.href = mailtoLink;
      }

      // 13. Preparar mensagem WhatsApp conforme tipo selecionado
      let linksWhatsApp = '';
      if (tipoEnvio === 'ambos') {
        linksWhatsApp = `📄 *LINKS PARA VISUALIZAÇÃO E APROVAÇÃO:*\n\n` +
          `🔧 *FICHA TÉCNICA:*\n${primeiroLink?.urlTecnico}\n\n` +
          `💰 *ORÇAMENTO:*\n${primeiroLink?.urlOrcamento}`;
      } else if (tipoEnvio === 'orcamento') {
        linksWhatsApp = `📄 *LINK PARA VISUALIZAÇÃO E APROVAÇÃO:*\n\n` +
          `💰 *ORÇAMENTO:*\n${primeiroLink?.urlOrcamento}`;
      } else if (tipoEnvio === 'ficha') {
        linksWhatsApp = `📄 *LINK PARA VISUALIZAÇÃO E APROVAÇÃO:*\n\n` +
          `🔧 *FICHA TÉCNICA:*\n${primeiroLink?.urlTecnico}`;
      }

      // 14. Abrir WhatsApp (DEPOIS com delay)
      setTimeout(() => {
        let msgWhatsApp = `📋 *FTC: ${numeroFTC}*\n` +
          `👤 Solicitante: ${solicitante}\n` +
          `🔧 Serviço: ${servico}\n` +
          `⏰ Prazo: ${prazo} dias úteis\n` +
          `✅ Validade: ${validade} dias\n\n` +
          linksWhatsApp;

        console.log('🔍 Abrindo WhatsApp:', msgWhatsApp.substring(0, 100) + '...');
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msgWhatsApp)}`, '_blank');
      }, 300);

      // 13. Fechar modal APÓS delay para não cancelar navegação
      setTimeout(() => {
        onClose();
      }, 500);
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
  }, [contatosSelecionados, orcamento, fichaTecnica, tipoEnvio, onEnviar, onClose, contatosDisponiveisComAuto, toast]);

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

        {/* Header com contador */}
        <div className="border-b bg-gray-50 px-6 py-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Contatos ({contatosSelecionados.length})
            </span>
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

              {/* Opções de envio */}
              {contatosSelecionados.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-medium text-gray-900 mb-3">📤 O que deseja enviar?</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="tipoEnvio"
                        value="ambos"
                        checked={tipoEnvio === 'ambos'}
                        onChange={(e) => setTipoEnvio(e.target.value as 'ambos' | 'orcamento' | 'ficha')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Orçamento + Ficha Técnica</div>
                        <div className="text-xs text-gray-500">Envia ambos os documentos com aprovação</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="tipoEnvio"
                        value="orcamento"
                        checked={tipoEnvio === 'orcamento'}
                        onChange={(e) => setTipoEnvio(e.target.value as 'ambos' | 'orcamento' | 'ficha')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Apenas Orçamento</div>
                        <div className="text-xs text-gray-500">Envia somente o orçamento com valores</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="tipoEnvio"
                        value="ficha"
                        checked={tipoEnvio === 'ficha'}
                        onChange={(e) => setTipoEnvio(e.target.value as 'ambos' | 'orcamento' | 'ficha')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Apenas Ficha Técnica</div>
                        <div className="text-xs text-gray-500">Envia somente a ficha técnica HTML</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Informações sobre envio */}
              {contatosSelecionados.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {tipoEnvio === 'ambos' && '📤 Será enviado: Orçamento + Ficha Técnica'}
                    {tipoEnvio === 'orcamento' && '💰 Será enviado: Apenas Orçamento'}
                    {tipoEnvio === 'ficha' && '🔧 Será enviado: Apenas Ficha Técnica'}
                  </h4>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>Email: Link com sistema de aprovação direta (Outlook)</span>
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
        </div>

        {/* Footer com botões */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>

            {/* Botão de Envio */}
            {contatosSelecionados.length > 0 && (
              <Button
                onClick={handleEnviar}
                disabled={enviando}
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
      </DialogContent>
    </Dialog>
  );
};
