# Entendimento Codex

## 1. Panorama rapido
- SPA em React 18 + Vite + TypeScript; UI baseada em shadcn + Tailwind; estado server-side com React Query
- Autenticacao com Supabase Auth (provider `AuthProvider` em src/contexts/AuthContext.tsx) protegendo rotas via `ProtectedRoute`
- Backend Supabase com tabelas `fichas_tecnicas`, `materiais`, `fotos`; arquivos compartilhaveis e fotos ficam no bucket `ficha-fotos`
- Workflow inteiro gira em torno da ficha tecnica: criacao/edicao (`/nova-ficha`), listagem (`/consultar-fichas`), administracao de usuarios (`/admin/usuarios`)
- Geracao de HTML reutilizavel (src/utils/htmlGenerator.ts) + rotas internas para visualizar arquivos (`/view-html/*`) e utilitarios de envio via Outlook/WhatsApp/email
- Automatizacoes auxiliares via Edge Functions Supabase (`ftc-rascunho`, `ftc-import`, `improve-description`, `send-email-with-pdf`)

## 2. Estrutura essencial
- `src/pages`: telas principais (Dashboard, Login, NovaFicha/FichaTecnicaForm, ConsultarFichas, AdminUsuarios, NotFound)
- `src/hooks`: hooks de negocio (`useFichaTecnica`, `useFichasQuery`, `useFichaTecnicaOptimized`, `use-mobile`, `use-toast`)
- `src/components/FichaTecnica`: componentes especializados (MaterialItem, FotoUpload, SaveButton + modal, tabelas, compartilhamento, foto gallery)
- `src/utils`: camada de servicos (supabaseStorage, htmlGenerator, outlookIntegration, openaiService, calculations, helpers, statusMapping, photo helpers/cache)
- `supabase/`: migrations SQL, edge functions (Deno) e configuracoes auxiliares
- Configuracoes de build: `vite.config.ts` (aliases, manual chunks, gzip), `tailwind.config.ts`, `tsconfig*.json`

## 3. Rotas, autenticacao e shell da aplicacao
- `src/App.tsx` monta QueryClientProvider, TooltipProvider e AuthProvider; define rotas protegidas via `ProtectedRoute`
- Rotas principais: `/login`, `/` (Dashboard), `/nova-ficha`, `/nova-ficha/:id` (mesmo componente com parametro), `/consultar-fichas`, `/admin/usuarios` e `/view-html/:filePath`
- `ProtectedRoute` bloqueia acesso se `useAuth()` nao retornar usuario logado (mostra spinner enquanto carrega sessao)
- `AuthContext` escuta `supabase.auth.onAuthStateChange`, armazena user/session, oferece `signIn`, `signUp`, `signOut`

## 4. Fluxo de ficha tecnica (criacao e edicao)
### 4.1 Hook `useFichaTecnica` (`src/hooks/useFichaTecnica.ts`)
- Controla todo estado do formulario: `formData`, lista de `materiais`, `fotos`, numero FTC, flags de salvamento
- Lida com query params `edit` e `clone` + state `loadFichaId` (sessionStorage) para abrir ficha existente ou clonar
- Clonagem reaproveita dados mas zera fotos e gera `numeroFTC` temporario `DRAFT-{timestamp}`
- Efeito inicial cria ficha em branco se nao houver edit/clone; materiais sempre iniciam com 1 item vazio
- `salvarFichaTecnica` valida campos (`validarCamposObrigatorios`), recalcula totais (`calculateTotals`), delega persistencia a `salvarFicha` em `supabaseStorage.ts`, atualiza caches do React Query
- `criarNovaFicha` limpa estado para ficha nova

### 4.2 Formulario `src/pages/FichaTecnicaForm.tsx`
- Renderiza seções compactas com classes definidas inline; organiza todas as centenas de campos (cliente, peca, execucao, tratamentos, horas, controles)
- Usa `useServiceDescriptionImprovement` (OpenAI via edge function) para melhorar texto do campo `servico`
- Componentes chave:
  - `MaterialItem`: grade responsiva com calculo automatico de total
  - `FotoUpload`: compressao cliente (canvas) + preview + assinaturas Supabase
  - `CalculosSummary`: mostra horas totais e custo de materiais
  - `SaveButton` + `SaveConfirmModal`: confirmam status destino, permitem enviar notificacao/Outlook, redirecionam para `/consultar-fichas`
- Acoes adicionais: navegar para Dashboard, listar fichas, criar nova ficha limpa, imprimir gerando HTML on-the-fly
- Quando carregada ficha existente, exibe `handlePrint` que usa `generateHTMLContent` e `window.print`

### 4.3 Componentes auxiliares
- `SaveConfirmModal`: apresenta opcoes "continuar editando" ou avancar etapa. Calcula proximo status com base no atual, valida presenca de precos e numero de orcamento, opcionalmente dispara envio Outlook (`sendFichaViaOutlook`) ou aviso WhatsApp
- `ShareActions` e `ConsultaActionButtons`: wrapper para gerar/view/exportar HTML, enviar email/WhatsApp com link hospedado
- `RevertConfirmModal`: coleta motivo (>=10 caracteres) e chama `estornarFicha` para retroceder status seguindo `getPreviousStatus`
- `FotoUpload` depende de `compressImage`, `SimplePhotoPreview`, `photoCache` e bucket `ficha-fotos`

## 5. Lista e gestao de fichas
### 5.1 Hook `useFichasQuery`
- Usa React Query (`queryKey ['fichas']`) para carregar fichas otimizadas (sem fotos completas) via `carregarFichasSalvas`
- Fornece `deleteFicha` (mutacao) e `invalidateFichas`

### 5.2 Tela `src/pages/ConsultarFichas.tsx`
- Controles de busca, filtros por status, ordenacao, paginacao (8 itens)
- Acoes: visualizar (gera HTML), editar (abre `NovaFicha` via query), clonar, excluir, estornar
- Modal confirma estorno e chama `estornarFicha`; apos sucesso recarrega pagina (TODO: poderia invalidar query ao inves de reload)
- Usa `UniversalFichaTable` para renderizar tabela responsiva com contagens, badges de status e botoes de compartilhamento
- Estado `location.state` permite auto selecionar aba apos salvar

### 5.3 `UniversalFichaTable`
- Recebe conjuntos de colunas/acoes dinamicas e inclui `ShareActions` compactos
- Implementa dialogs de confirmacao para delete e clone

## 6. Camada de dados e Supabase (`src/utils/supabaseStorage.ts`)
- Conversao bidirecional entre linhas do banco e `FichaSalva` (inclui fallback para campos novos x antigos, mapping de status via `statusMapping.ts`)
- Operacoes principais:
  - `salvarFicha`: gera numero sequencial (`get_next_ftc_number`) para novas fichas ou rascunhos, atualiza `fichas_tecnicas`, sincroniza materiais e fotos
  - `carregarFichasSalvas`: busca fichas + materiais e conta fotos (sem baixar conteudo)
  - `carregarFicha`: carrega ficha completa (materiais + fotos)
  - `carregarFotosFicha`: traz metadados de fotos por demanda
  - `excluirFicha`: remove ficha
  - `estornarFicha`: valida status corrente, obtem status anterior com `getPreviousStatus`, grava volta e loga (requer motivo >=10 chars)
  - `validarCamposObrigatorios`: garante cliente, solicitante, contato, peca, quantidade > 0, servico e ao menos uma hora preenchida
- Todas funcoes usam `logger` para trace; fotos sao guardadas com `storage_path`

## 7. Status e fluxos
- `StatusFicha` (src/types/ficha-tecnica.ts) cobre estados antigos e novos, mas UI usa apenas: `rascunho`, `aguardando_cotacao_compras`, `aguardando_orcamento_comercial`, `orcamento_enviado_cliente`
- `statusMapping.ts` converte status legados do banco (`preenchida`, `orcamento_gerado`, etc.) para UI e vice-versa ao salvar
- Fluxo previsto: Tecnico -> Compras -> Comercial -> Cliente. Estorno so possivel se houver etapa anterior (`canRevertStatus`)

## 8. Geracao e consumo de HTML
- `src/utils/htmlGenerator.ts` gera HTML compacto com cabecalho, resumo, tabelas de materiais, fotos (com signed URLs), e inclui modais de aprovacao (nao ativados hoje)
- APIs expostas: `generateHTMLContent`, `downloadHTML`, `openHTMLInNewWindow`, helpers para salvar arquivo temporario no bucket
- `ShareActions` sempre recarrega fotos via `carregarFotosFicha` antes de gerar HTML para garantir links validos
- `src/components/FichaTecnica/HTMLViewer.tsx` leitura segura de HTML via `supabase.storage.download` usando rota `/view-html/*`
- `supabase/utils/outlookIntegration.ts` monta email mailto com resumo, materiais, horas e link HTML; baixa arquivo local para anexar manualmente

## 9. Fotografias
- Upload limitado a 10 arquivos, compressao cliente (1920px, quality 0.85) com feedback por foto
- `photoCache` usa sessionStorage para armazenar signed URLs por 4h (evita requisicoes repetidas)
- `SimplePhotoPreview` gera signed URL sob demanda (1h) e lida com fallback de preview/local
- `PhotoGalleryViewer` e HTML inline (via `photoHelpers.ts`) exibem fotos em grade com modal e navegacao

## 10. Integracoes de IA e automacoes
- `openaiService.ts` chama Edge Function `improve-description` (modelo gpt-4o-mini) para refinar descritivos ou gerar analise de pericia; aceita urls de fotos (ate 4) para contexto
- Edge functions:
  - `improve-description`: valida inputs, chama OpenAI, limpa titulos extras, trata erros padronizados
  - `ftc-rascunho`: gera nova ficha com numero sequencial (`get_next_ftc_number`) usando chave de service role
  - `ftc-import`: recebe transcricao (voz) ou dados diretos, extrai info via regex e atualiza ficha pelo numero FTC
  - `send-email-with-pdf`: placeholder respondendo sucesso sem enviar efetivamente
- Recurso `useServiceDescriptionImprovement` usa toast para feedback ao usuario

## 11. Outras telas
- `Dashboard`: cards para criar, consultar, administrar
- `Login`: form com react-hook-form + zod; chama `signIn`
- `AdminUsuarios`: permite `signUp` de novos usuarios; listagem completa depende de edge function futura (atualmente so exibe alerta)
- `NotFound`: mensagem simples

## 12. Base de dados e migrations
- Migrations criam tabelas, adicionam colunas, regras de RLS e bucket `ficha-fotos`; destaques:
  - `20250908224623_*.sql`: cria `fichas_tecnicas`, `materiais`, `fotos`, trigger `update_fichas_tecnicas_updated_at`
  - `20250909135123_*.sql`: funcao `get_next_ftc_number`
  - `20250926104505_update_status_constraint.sql` + `20250926111500_fix_status_mapping.sql`: adaptam constraint e mapeiam status antigos
  - `20250927160000_add_cliente_interno_tipo_to_materiais.sql`: coluna adicional para materiais
- `performance-indexes.sql` lista indices recomendados para filtros (status/data/numero)
- Tabela `usuarios_autorizados` foi criada mas depois removida (vide migrations de 09/09)

## 13. Documentos auxiliares
- `FLUXO_SISTEMA_FICHAS.md` e `AUDITORIA_SISTEMA.md` descrevem historico e pendencias (arquivos com caracteres corrompidos devido a encoding)
- `VOICE_CAPTURE_SETUP.md`, `exemplo-teste-redutor.md`, `TESTE_VERSAO.md` e `CODIGO HTML` guardam experimentos e testes

## 14. Pontos de atencao
- Chaves sensiveis (`SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`) expostas em `.env` comprometido no repositorio; garantir rotacao
- `htmlGenerator` contem logica de aprovacao nao integrada: conectar com fluxo caso necessario (modal no cliente, tabela `aprovacoes_orcamentos` mencionada mas nao migrada)
- Revert de status recarrega pagina; otimizar invalidando query para melhor UX
- `send-email-with-pdf` nao envia emails reais (stub). Aplicacao usa mailto/WhatsApp locais
- `AdminUsuarios` depende de service role para listar usuarios; falta edge function apropriada
- Varias strings usam emojis unicode em arquivos existentes; ao alterar manter consistencia ou substituir por ASCII

## 15. Checklist rapido para debugging
1. Usar `/login` com credenciais supabase; confirmar `AuthContext` populando user
2. Criar ficha nova: preencher campos obrigatorios (cliente, solicitante, contato, nome peca, quantidade > 0, servico, ao menos uma hora) e salvar -> conferir redirecionamento para aba correspondente em `/consultar-fichas`
3. Editar ficha via card de lista (botao lapis ou duplo clique); validar que fotos carregam sob demanda
4. Compartilhar: testar botoes de visualizacao/baixa/email/WhatsApp; garantir que arquivo HTML aparece em bucket `ficha-fotos/temp`
5. Estornar ficha: avancar status ate comercial, usar botao `RotateCcw` na tabela, informar motivo >= 10 chars, checar status revertido
6. Executar edge `ftc-rascunho` (via Supabase dashboard) para validar numeracao sequencial
7. Ao ajustar HTML gGerado, verificar rota `/view-html/*` em navegadores externos

