# CLAUDE.md - Sistema de Fichas Técnicas HMC

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com este projeto.

---

## 📋 Sobre o Projeto

**Nome**: Sistema de Fichas Técnicas (FTC) - HMC
**Tipo**: Aplicação Web SPA (Single Page Application)
**Framework**: React 18 + TypeScript + Vite
**Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
**UI**: shadcn/ui + Radix UI + Tailwind CSS

### Propósito
Sistema interno para gerenciamento de Fichas Técnicas de Cotação (FTC) em uma metalúrgica. Permite:
- Criação e edição de fichas técnicas
- Upload de fotos com armazenamento em Supabase Storage
- Geração de PDFs profissionais para orçamentos
- Visualização HTML/impressão otimizada
- Cotação de materiais e serviços
- Integração com iOS Shortcuts para captura por voz
- Workflow de aprovações (Técnico → Compras → Comercial)

---

## 🏗️ Arquitetura

### Stack Tecnológico Completo

#### Frontend
- **React 18.3.1**: Biblioteca core
- **TypeScript 5.8.3**: Type safety
- **Vite 5.4.19**: Build tool e dev server
- **React Router DOM 6.30.1**: Roteamento SPA
- **TanStack React Query 5.83.0**: Server state management
- **React Hook Form 7.61.1**: Formulários performáticos
- **Zod 3.25.76**: Validação de schemas

#### UI/UX
- **Tailwind CSS 3.4.17**: Utility-first CSS
- **shadcn/ui**: Componentes acessíveis (baseado em Radix UI)
- **Radix UI**: 20+ componentes primitivos
- **Lucide React 0.462.0**: Ícones
- **next-themes 0.3.0**: Dark mode
- **Sonner 1.7.4**: Toast notifications

#### Backend/Database
- **Supabase 2.57.2**:
  - PostgreSQL database
  - Storage (fotos)
  - Edge Functions (ftc-rascunho, ftc-import)
  - Auth (autenticação de usuários)

#### Utilitários
- **jsPDF 3.0.3**: Geração de PDFs
- **jspdf-autotable 5.0.2**: Tabelas em PDF
- **date-fns 3.6.0**: Manipulação de datas
- **recharts 2.15.4**: Gráficos (Dashboard)

#### Dev Tools
- **ESLint 9.32.0**: Linting
- **Vitest 3.2.4**: Testing framework
- **Lovable Tagger**: Componentes taggeados para Lovable.dev

---

## 📂 Estrutura de Diretórios

```
meu-app-ficha-main/
├── src/
│   ├── components/
│   │   ├── FichaTecnica/          # Componentes específicos de fichas
│   │   │   ├── CalculosSummary.tsx
│   │   │   ├── ConsultaActionButtons.tsx
│   │   │   ├── DadosClienteForm.tsx
│   │   │   ├── DadosPecaForm.tsx
│   │   │   ├── FichasList.tsx
│   │   │   ├── FotoUpload.tsx
│   │   │   ├── HTMLViewer.tsx
│   │   │   ├── MaterialItem.tsx
│   │   │   ├── PhotoGalleryViewer.tsx  # Modal de fotos com lightbox
│   │   │   ├── RevertConfirmModal.tsx
│   │   │   ├── SaveButton.tsx
│   │   │   ├── SaveConfirmModal.tsx
│   │   │   ├── ShareActions.tsx
│   │   │   └── UniversalFichaTable.tsx
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── ProtectedRoute.tsx      # Auth guard
│   │   ├── SimplePhotoPreview.tsx
│   │   └── ThemeToggle.tsx         # Dark mode toggle
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Context de autenticação
│   │
│   ├── hooks/                       # Custom hooks
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # Cliente Supabase configurado
│   │       └── types.ts            # Types auto-gerados do banco
│   │
│   ├── lib/                         # Configurações de libs
│   │
│   ├── pages/
│   │   ├── AdminUsuarios.tsx       # Gerenciamento de usuários
│   │   ├── ConsultarFichas.tsx     # Listagem e busca de fichas
│   │   ├── Dashboard.tsx           # Página inicial
│   │   ├── FichaTecnicaForm.tsx    # Formulário principal (40KB+)
│   │   ├── Login.tsx               # Autenticação
│   │   ├── NotFound.tsx            # 404
│   │   └── NovaFicha.tsx           # Wrapper para nova ficha
│   │
│   ├── types/
│   │   └── ficha-tecnica.ts        # Interfaces principais do domínio
│   │
│   ├── utils/
│   │   ├── calculations.ts         # Cálculos de horas e materiais
│   │   ├── helpers.ts              # Funções utilitárias
│   │   ├── htmlGenerator.ts        # Gera HTML para visualização/impressão
│   │   ├── htmlGenerator.OLD.ts    # Versão anterior (backup)
│   │   ├── imageCompression.ts     # Compressão de fotos
│   │   ├── logger.ts               # Sistema de logs
│   │   ├── openaiService.ts        # Integração OpenAI (opcional)
│   │   ├── outlookIntegration.ts   # Envio de email via Outlook
│   │   ├── pdfGenerator.ts         # Gerador de PDF versão 1
│   │   ├── pdfGeneratorV2.ts       # Gerador de PDF v2 (2 colunas)
│   │   ├── photoCache.ts           # Cache de fotos
│   │   ├── photoHelpers.ts         # Helpers para signed URLs de fotos
│   │   ├── statusMapping.ts        # Mapeamento de status de fichas
│   │   └── supabaseStorage.ts      # Funções de upload/download
│   │
│   ├── App.tsx                      # Root component com roteamento
│   ├── main.tsx                     # Entry point
│   └── vite-env.d.ts
│
├── supabase/
│   ├── functions/                   # Edge Functions
│   │   ├── ftc-rascunho/           # Criar ficha via voz
│   │   └── ftc-import/             # Importar dados da transcrição
│   ├── migrations/                  # 12 migrations SQL
│   ├── config.toml                  # Config do Supabase local
│   └── performance-indexes.sql      # Índices de performance
│
├── public/                          # Assets estáticos
├── dist/                            # Build de produção
├── node_modules/
│
├── .env                             # Variáveis de ambiente (NÃO commitar)
├── .env.example                     # Template de .env
├── .gitignore
├── bun.lockb                        # Lockfile (Bun)
├── package.json
├── package-lock.json                # Lockfile (npm)
│
├── components.json                  # Config shadcn/ui
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.ts               # Config Tailwind
├── tsconfig.json                    # Config TypeScript
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                   # Config Vite
│
├── CODIGO HTML                      # Documentação HTML antiga
├── exemplo-teste-redutor.md         # Exemplo de uso
├── index.html                       # HTML root
├── README.md                        # Documentação geral
├── TESTE_VERSAO.md                  # Guia de teste de versões
├── VOICE_CAPTURE_SETUP.md           # Setup de captura por voz
└── CLAUDE.md                        # Este arquivo
```

---

## 🔑 Funcionalidades Principais

### 1. Gestão de Fichas Técnicas
- **Criar nova ficha**: `/nova-ficha` (FichaTecnicaForm.tsx:1-850)
- **Editar ficha existente**: `/nova-ficha/:id`
- **Consultar fichas**: `/consultar-fichas` (ConsultarFichas.tsx)
- **Visualização HTML**: HTMLViewer.tsx com layout idêntico ao formulário
- **Galeria de fotos**: PhotoGalleryViewer.tsx com modal lightbox

### 2. Upload e Gerenciamento de Fotos
- **Upload**: FotoUpload.tsx com compressão automática
- **Storage**: Supabase Storage (`fichas_fotos` bucket)
- **Signed URLs**: photoHelpers.ts gerencia URLs temporárias
- **Galeria**: Modal com navegação por teclado (← → ESC)
- **Download individual**: Botão por foto na visualização

### 3. Geração de Documentos
- **PDF v1**: pdfGenerator.ts (layout simples)
- **PDF v2**: pdfGeneratorV2.ts (2 colunas, otimizado para 2 páginas A4)
- **HTML**: htmlGenerator.ts (print-friendly, grid 3x3 de fotos)
- **Impressão**: CSS otimizado com margens 10mm

### 4. Workflow de Aprovações
```
Rascunho → Aguardando Cotação (Compras) → Aguardando Orçamento (Comercial) → Orçamento Enviado
```
- Status configurados em: types/ficha-tecnica.ts:119-180
- Mapeamento de status: utils/statusMapping.ts

### 5. Integração com iOS Shortcuts
- **Edge Function**: `ftc-rascunho` cria ficha via API
- **Edge Function**: `ftc-import` importa dados transcritos
- **Documentação**: VOICE_CAPTURE_SETUP.md
- **URL Scheme**: `shortcuts://x-callback-url/run-shortcut?name=FTC%20Gravar`

### 6. Administração
- **Usuários**: `/admin/usuarios` (AdminUsuarios.tsx)
- **Dashboard**: `/` com métricas (Dashboard.tsx)
- **Autenticação**: AuthContext.tsx + ProtectedRoute.tsx

---

## 🗄️ Modelo de Dados

### Tabela Principal: `fichas_tecnicas`

**Campos principais** (types.ts:17-89):
- `id` (UUID): Chave primária
- `numero_ftc` (string): Número da ficha (ex: "2025007")
- `status` (enum): rascunho | aguardando_cotacao_compras | aguardando_orcamento_comercial | orcamento_enviado_cliente
- `cliente` (string): Nome do cliente
- `nome_peca` (string): Descrição da peça
- `quantidade` (string): Quantidade de peças
- `servico` (string): Tipo de serviço
- `data_entrega` (date): Prazo de entrega
- `criado_por` (UUID): Usuário criador
- `editado_por` (UUID): Último editor
- `data_criacao` (timestamp): Data de criação
- `data_ultima_edicao` (timestamp): Última modificação

**Campos de processos** (horas de trabalho):
- `torno_grande`, `torno_pequeno`, `cnc_tf`, `fresa_furad`
- `plasma_oxicorte`, `dobra`, `calandra`, `macarico_solda`
- `des_montg`, `balanceamento`, `mandrilhamento`, `tratamento`
- `pintura_horas`, `lavagem_acab`, `programacao_cam`, `eng_tec`

**Campos condicionais**:
- `visita_tecnica` (SIM/NAO): Se sim, `data_visita`
- `pintura` (SIM/NAO): Se sim, `cor_pintura`
- `galvanizacao` (SIM/NAO): Se sim, `peso_peca_galv`
- `tratamento_termico` (SIM/NAO): Se sim, `tempera_reven`

### Tabela: `materiais_ficha`
- `id` (serial): Auto-incremento
- `ficha_id` (UUID): FK para fichas_tecnicas
- `descricao` (string): Descrição do material
- `quantidade` (decimal): Quantidade
- `unidade` (string): UN | KG | M | M² | L
- `valor_unitario` (decimal): Preço unitário
- `fornecedor` (string): Nome do fornecedor
- `cliente_interno` (string): Setor interno
- `cliente_interno_tipo` (string): Tipo de setor
- `valor_total` (decimal): Calculado automaticamente

### Storage Buckets
- **`fichas_fotos`**: Armazena fotos das fichas
  - Path: `{ficha_id}/{timestamp}_{filename}`
  - Max size: 5MB (após compressão)
  - Formatos: JPG, PNG, WEBP
  - Signed URLs válidas por 1 hora

---

## 🚀 Comandos Comuns

### Desenvolvimento
```bash
npm run dev              # Inicia dev server em localhost:8080
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento
npm run preview          # Preview do build
```

### Testes
```bash
npm run test             # Rodar testes com Vitest
npm run test:ui          # UI de testes do Vitest
```

### Linting
```bash
npm run lint             # ESLint check
```

### Supabase Local (se necessário)
```bash
npx supabase start       # Inicia Supabase local
npx supabase stop        # Para Supabase local
npx supabase db reset    # Reset banco local
npx supabase migration new <name>  # Nova migration
```

### Cache e Rebuild Completo
```bash
rm -rf dist
rm -rf node_modules/.vite
npm run build:dev
npm run dev
```

---

## ⚙️ Configuração do Ambiente

### Variáveis de Ambiente (`.env`)

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (OPCIONAL - para melhorar descrição técnica com IA)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**IMPORTANTE**:
- Copie `.env.example` para `.env`
- Nunca commite o arquivo `.env`
- As chaves Supabase são obrigatórias
- A chave OpenAI é opcional

### Configuração de Alias
TypeScript está configurado para usar `@/` como alias para `./src/`:

```typescript
import { supabase } from "@/integrations/supabase/client"
import { FormData } from "@/types/ficha-tecnica"
```

---

## 🎨 Padrões de Código

### Convenções TypeScript
- **Strict mode**: `noImplicitAny`, `strictNullChecks` habilitados
- **Naming**:
  - Componentes: PascalCase (`FichaTecnicaForm.tsx`)
  - Funções: camelCase (`generatePDF()`)
  - Interfaces: PascalCase (`FormData`, `Material`)
  - Constantes: UPPER_SNAKE_CASE (`STATUS_CONFIG`)

### Estrutura de Componentes React
```typescript
// 1. Imports
import { useState } from "react"
import { Button } from "@/components/ui/button"

// 2. Interfaces/Types
interface Props {
  id: string
  onSave: () => void
}

// 3. Componente
export const MyComponent = ({ id, onSave }: Props) => {
  // 4. Hooks
  const [loading, setLoading] = useState(false)

  // 5. Functions
  const handleClick = () => {
    // ...
  }

  // 6. JSX
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### Padrões de Estado
- **Local state**: `useState` para UI state
- **Server state**: React Query (`useQuery`, `useMutation`)
- **Form state**: React Hook Form
- **Auth state**: `AuthContext`

### Padrões de Estilo
- **Tailwind utility-first**: Preferir classes utilitárias
- **Componentes shadcn/ui**: Usar componentes pré-configurados
- **Responsive design**: Mobile-first approach
- **Dark mode**: Suporte via `next-themes`

---

## 📦 Build e Otimizações

### Code Splitting (vite.config.ts:28-49)
O build está configurado para separar em chunks:
- **pdf**: jsPDF + jspdf-autotable
- **vendor**: React, React DOM, React Router
- **ui**: Radix UI components
- **supabase**: Supabase client
- **query**: TanStack React Query
- **charts**: Recharts
- **forms**: React Hook Form + Zod

### Compressão
- **Gzip** habilitado em produção (threshold: 1KB)
- **Plugin**: vite-plugin-compression

### Lazy Loading
Rotas principais carregadas com `lazy()`:
- `NovaFicha`
- `ConsultarFichas`
- `AdminUsuarios`

### Performance
- **Target**: ES2015
- **Minify**: esbuild
- **Source maps**: Desabilitados em produção
- **Chunk size warning**: 500KB

---

## 🔐 Segurança e Autenticação

### Supabase Auth
- **Provider**: Email/Password (padrão)
- **Context**: `AuthContext.tsx` gerencia estado de autenticação
- **Protected Routes**: `ProtectedRoute.tsx` guarda rotas privadas
- **RLS (Row Level Security)**: Configurado no banco Supabase

### Permissões
- **Técnicos**: Criar e editar fichas em rascunho
- **Compras**: Cotar materiais, mudar status para "aguardando_orcamento_comercial"
- **Comercial**: Gerar e enviar orçamentos
- **Admin**: Gerenciar usuários

---

## 🐛 Debug e Troubleshooting

### Problemas Comuns

#### 1. Fotos não aparecem na visualização HTML
**Causa**: Cache do navegador com versão antiga
**Solução**: Ver TESTE_VERSAO.md para limpar cache

#### 2. Erro ao fazer upload de foto
**Causa**: Bucket não configurado ou sem permissões
**Solução**: Verificar Storage no Supabase Dashboard

#### 3. PDF gerado vazio ou com erro
**Causa**: Dados faltando na ficha
**Solução**: Verificar logs no console (logger.ts)

#### 4. Build falha
**Causa**: Cache corrompido
**Solução**:
```bash
rm -rf node_modules/.vite
rm -rf dist
npm install
npm run build
```

### Sistema de Logs
```typescript
import { logger } from "@/utils/logger"

logger.info("Mensagem informativa")
logger.warn("Alerta")
logger.error("Erro", { error })
```

Logs aparecem no console em desenvolvimento com cores e timestamps.

---

## 📚 Recursos e Documentação

### Documentação Interna
- **README.md**: Overview geral do projeto
- **VOICE_CAPTURE_SETUP.md**: Configuração de captura por voz
- **TESTE_VERSAO.md**: Guia de testes e debug de versões
- **exemplo-teste-redutor.md**: Exemplo de uso do sistema

### Documentação Externa
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Supabase**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Hook Form**: https://react-hook-form.com/
- **TanStack Query**: https://tanstack.com/query/latest

---

## 🔄 Workflow Git (Recomendado)

### Branches
```bash
main            # Produção estável
develop         # Desenvolvimento ativo
feature/*       # Novas funcionalidades
bugfix/*        # Correções de bugs
hotfix/*        # Correções urgentes em produção
```

### Commits
Seguir padrão **Conventional Commits**:
```bash
feat: adiciona geração de PDF v2
fix: corrige upload de fotos grandes
docs: atualiza CLAUDE.md
refactor: reorganiza utils/
style: formata código com prettier
test: adiciona testes para calculations
```

---

## 🎯 Próximos Passos / Backlog

### Features Planejadas
- [ ] Integração completa com OpenAI para melhorar descrições técnicas
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] Exportação para Excel
- [ ] Histórico de edições (audit log)
- [ ] Comentários e anotações em fichas
- [ ] Assinatura digital de orçamentos

### Melhorias Técnicas
- [ ] Adicionar testes unitários (Vitest)
- [ ] Adicionar testes E2E (Playwright)
- [ ] Implementar CI/CD
- [ ] Melhorar performance de carregamento de fotos
- [ ] Adicionar PWA capabilities
- [ ] Implementar i18n (internacionalização)

---

## 💡 Dicas para o Claude Code

### Ao Editar Fichas Técnicas
1. **FichaTecnicaForm.tsx** é o arquivo mais crítico (40KB+)
2. Sempre validar com Zod antes de salvar
3. Usar React Hook Form para performance
4. Testar cálculos automáticos após mudanças

### Ao Trabalhar com Fotos
1. Usar `photoHelpers.ts` para signed URLs
2. Comprimir imagens antes de upload (imageCompression.ts)
3. Limitar tamanho máximo: 5MB
4. Cache de fotos: `photoCache.ts`

### Ao Gerar PDFs
1. Preferir `pdfGeneratorV2.ts` (mais recente)
2. Testar impressão em A4 (máximo 2 páginas)
3. Verificar se todas as fotos estão carregadas

### Ao Modificar Schemas do Banco
1. Criar migration no Supabase
2. Atualizar `types.ts` (pode ser auto-gerado)
3. Atualizar interfaces em `ficha-tecnica.ts`
4. Testar RLS policies

### Performance
1. Lazy load sempre que possível
2. Usar React Query para cache de dados
3. Evitar re-renders desnecessários
4. Otimizar imagens antes de upload

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar este CLAUDE.md
2. Verificar documentação interna (README.md, VOICE_CAPTURE_SETUP.md)
3. Consultar logs no console (utils/logger.ts)
4. Verificar Supabase Dashboard para issues de banco/storage

---

## 🔧 Web Development Workflow - REGRAS OBRIGATÓRIAS

### **PRINCÍPIOS FUNDAMENTAIS**
- **EXECUTION MINDSET**: Trabalho rápido e direto - SEM cronogramas longos ou promessas vagas
- **FULL OWNERSHIP**: Claude é responsável por TODA a implementação do início ao fim
- **ZERO ASSUMPTIONS**: NUNCA deduzir o que o usuário quis dizer - SEMPRE confirmar ou perguntar
- **REAL DATA ONLY**: NUNCA mockar dados sem permissão explícita do usuário
- **MODULAR & OPTIMIZED**: Código sempre otimizado, modular e seguindo DRY e boas práticas
- **NO HALLUCINATION**: NUNCA inventar fatos, APIs, métodos ou funcionalidades que não existem
- **COLLABORATIVE PLANNING**: Sempre dar ideias e discutir planos com o usuário antes de implementar

---

### 🗄️ **Supabase MCP Integration - OBRIGATÓRIO**

#### **USO MANDATÓRIO**
- **ALWAYS use Supabase MCP** para TODAS as operações de banco de dados
- **ZERO EXCEPTIONS**: Nunca mockar dados, nunca usar dados fake sem permissão do usuário
- **NO HARDCODING**: Nunca hardcodar credenciais ou connection strings

#### **WORKFLOW PADRÃO**
1. **Project Discovery**: Use `mcp__supabase__list_projects` para identificar projeto
2. **Database Operations**:
   - Use `mcp__supabase__list_tables` para ver schema
   - Use `mcp__supabase__execute_sql` para queries
   - Use `mcp__supabase__apply_migration` para DDL/schema changes
3. **Type Safety**: Use `mcp__supabase__generate_typescript_types` após mudanças no schema
4. **Security Check**: Use `mcp__supabase__get_advisors` com type "security" após mudanças DDL
5. **Performance Check**: Use `mcp__supabase__get_advisors` com type "performance" para otimizações

#### **EDGE FUNCTIONS**
- Sempre listar Edge Functions existentes antes de criar novas
- Deploy Edge Functions com `mcp__supabase__deploy_edge_function`
- Check logs com `mcp__supabase__get_logs` service "edge-function" após deploy

#### **DEBUGGING**
- Sempre check logs quando algo não funcionar: `mcp__supabase__get_logs`
- Services disponíveis: api, postgres, edge-function, auth, storage, realtime
- Logs retornam apenas último 1 minuto - reproduza erro se necessário

#### **⚠️ REGRA CRÍTICA: SEMPRE USE SUPABASE MCP**

**NUNCA use curl, psql, ou qualquer outro método direto para acessar o banco de dados Supabase.**

**SEMPRE use as ferramentas MCP do Supabase:**

```bash
# ✅ CORRETO - Usar MCP Supabase
mcp__supabase__execute_sql           # Para queries SELECT
mcp__supabase__apply_migration       # Para DDL (ALTER, CREATE, etc)
mcp__supabase__list_tables           # Para ver schema
mcp__supabase__get_advisors          # Para security/performance checks
mcp__supabase__get_logs              # Para debug

# ❌ ERRADO - NÃO usar
curl -X POST 'https://...supabase.co/rest/v1/...'
psql postgres://...
npx supabase db ... (requer Docker local)
```

**Por quê?**
- MCP já está autenticado com o projeto `gobuakgvzqauzenaswow`
- Garante que operations são auditadas e rastreáveis
- Previne erros de autenticação e permissões
- Fornece feedback estruturado e tratamento de erros

**Exemplos:**

```typescript
// Verificar status das fichas
mcp__supabase__execute_sql({
  project_id: "gobuakgvzqauzenaswow",
  query: "SELECT DISTINCT status FROM fichas_tecnicas ORDER BY status;"
})

// Criar migration
mcp__supabase__apply_migration({
  project_id: "gobuakgvzqauzenaswow",
  name: "update_status_constraint",
  query: "ALTER TABLE fichas_tecnicas ADD CONSTRAINT..."
})

// Verificar security advisors após mudanças DDL
mcp__supabase__get_advisors({
  project_id: "gobuakgvzqauzenaswow",
  type: "security"
})
```

---

### 🌐 **Chrome DevTools MCP Integration - VERIFICAÇÃO OBRIGATÓRIA**

#### **VERIFICAÇÃO UI MANDATÓRIA**
- **ALWAYS verify** após QUALQUER mudança na interface
- **CRITICAL**: Mostrar erro crítico para QUALQUER erro no console do site
- **WORKFLOW COMPLETO**:
  1. Implementar mudança no código
  2. **OBRIGATÓRIO**: Usar Chrome MCP para validar implementação
  3. Check console logs
  4. Corrigir erros se encontrados
  5. Verificar novamente até estar 100% correto

#### **CHECKLIST DE VERIFICAÇÃO**
1. **Console Logs**: `mcp__chrome-devtools__list_console_messages`
   - ZERO TOLERÂNCIA para errors ou warnings críticos
   - Reportar TODOS os erros encontrados ao usuário
   - Corrigir imediatamente antes de prosseguir

2. **Visual Snapshot**: `mcp__chrome-devtools__take_snapshot`
   - Verificar se UI renderizou corretamente
   - Confirmar elementos esperados estão presentes
   - Validar layout e estrutura

3. **Network Requests**: `mcp__chrome-devtools__list_network_requests`
   - Verificar se APIs foram chamadas corretamente
   - Check status codes (200, 201, etc)
   - Validar request/response payloads

4. **Performance**: `mcp__chrome-devtools__performance_start_trace`
   - Verificar Core Web Vitals
   - Identificar bottlenecks
   - Otimizar quando necessário

#### **TRATAMENTO DE ERROS CRÍTICOS**
```
SE encontrar erro no console:
1. PARAR tudo imediatamente
2. Reportar erro crítico ao usuário com detalhes completos
3. Identificar causa raiz
4. Corrigir o erro
5. Verificar novamente com Chrome MCP
6. Confirmar zero erros antes de continuar
```

---

### 💎 **Code Quality & Best Practices**

#### **DRY (Don't Repeat Yourself)**
- NUNCA duplicar código
- Criar funções/componentes reutilizáveis
- Extrair lógica comum em utils/helpers

#### **ARQUITETURA MODULAR**
- Componentes pequenos e focados (Single Responsibility)
- Props bem definidas e tipadas
- Separação clara de concerns (UI, lógica, data)

#### **OTIMIZAÇÃO**
- Lazy loading quando apropriado
- Memoization (useMemo, useCallback, React.memo)
- Code splitting para bundles menores
- Otimizar queries do Supabase (select apenas campos necessários)

#### **TYPE SAFETY**
- SEMPRE usar TypeScript quando disponível
- Gerar types do Supabase após schema changes
- Validar props e data shapes

#### **TRATAMENTO DE ERROS**
- Try-catch em operações assíncronas
- Error boundaries em React
- Mensagens de erro claras para usuário
- Logging apropriado para debugging

---

### 🔄 **Refactoring & Code Health**

#### **ANTES DE ADICIONAR FEATURES**
- **ALWAYS analyze** necessidade de refatoramento antes de adicionar funcionalidade
- Identificar problemas existentes que podem impactar nova feature

#### **CHECKLIST DE REFATORAMENTO**
1. **Código Duplicado**:
   - Procurar por lógica repetida
   - Extrair para funções/componentes reutilizáveis
   - Aplicar DRY principle

2. **Complexidade Excessiva**:
   - Identificar funções muito longas (>50 linhas)
   - Componentes com muitas responsabilidades
   - Lógica complexa que pode ser simplificada
   - Quebrar em funções menores e focadas

3. **Code Smells**:
   - Nomes de variáveis/funções confusos
   - Magic numbers (números hardcoded)
   - Comentários excessivos (código deve ser auto-explicativo)
   - Dependências desnecessárias

4. **Performance Issues**:
   - Re-renders desnecessários
   - Queries não otimizadas
   - Bundles grandes demais

#### **WORKFLOW DE REFATORAMENTO**
1. Analisar código existente relacionado à nova feature
2. Identificar pontos de melhoria
3. **Propor refatoramento ao usuário** antes de implementar
4. Refatorar código existente
5. **OBRIGATÓRIO**: Testar TUDO com Chrome MCP após refatorar
   - Verificar que nada quebrou
   - Confirmar funcionalidades antigas funcionando
   - Zero erros no console
6. Implementar nova funcionalidade
7. **OBRIGATÓRIO**: Testar TUDO com Chrome MCP novamente
   - Verificar nova feature funcionando
   - Confirmar que não quebrou nada
   - Zero erros no console

---

### 📦 **Package Management & Compatibility**

#### **COMPATIBILIDADE PRIMEIRO**
- **ALWAYS check** compatibilidade de pacotes com o projeto existente
- Verificar versões de Node, framework, e dependências principais
- Checar se novos pacotes são compatíveis com stack atual
- Evitar breaking changes sem discussão prévia

#### **TROUBLESHOOTING DE INSTALAÇÃO**
- **NEVER brute force** ou tentar hard code quando instalação falhar
- **ALWAYS ask user** quando não conseguir instalar ferramenta/pacote
- Apresentar opções claras:
  - Versão alternativa compatível
  - Pacote substituto similar
  - Solução manual com passos detalhados
  - Remover conflito (se seguro)

---

### 💡 **Planning & Ideation**

#### **ABORDAGEM COLABORATIVA**
- **ALWAYS present ideas** ao planejar novas funcionalidades
- Discutir opções de implementação com usuário
- Mostrar pros/cons de diferentes abordagens
- Esperar aprovação antes de implementar

#### **WORKFLOW DE PLANEJAMENTO**
1. Entender requisito completamente
2. **Propor ideias e soluções** possíveis
3. Discutir com usuário qual caminho seguir
4. Confirmar abordagem escolhida
5. Implementar solução aprovada

---

### 💬 **Confirmation & Communication Rules**

#### **SEMPRE PERGUNTAR QUANDO**
- Não tiver certeza do que usuário quer
- Houver múltiplas formas de implementar
- Precisar de credenciais, IDs, ou configurações
- For fazer mudanças estruturais significativas
- For deletar ou modificar dados

#### **NUNCA ASSUMIR**
- O que usuário quis dizer se não estiver claro
- Configurações ou preferências
- Estrutura de dados sem confirmar
- Nomes de variáveis/funções sem contexto

#### **COMUNICAÇÃO CLARA**
- Explicar O QUE vai fazer antes de fazer
- Reportar TODOS os erros encontrados
- Confirmar conclusão de tarefas
- Pedir feedback quando necessário

---

### 📋 **File Creation Policy**

#### **PREFERIR EDIÇÃO A CRIAÇÃO**
- SEMPRE prefira editar arquivo existente a criar novo
- NUNCA crie arquivos desnecessários

#### **DOCUMENTAÇÃO**
- NUNCA crie documentation files (*.md) ou README proativamente
- Apenas criar documentação se EXPLICITAMENTE solicitado

#### **APENAS ARQUIVOS ESSENCIAIS**
- Criar arquivo apenas se absolutamente necessário para objetivo
- Confirmar com usuário se não tiver certeza

---

### ⚡ **Quick Reference - Checklist**

```
□ Entender requisito (perguntar se necessário)
□ Propor ideias e discutir abordagem com usuário
□ Analisar código existente (duplicação, complexidade, code smells)
□ Propor refatoramento se necessário e aprovar com usuário
□ Refatorar primeiro se aprovado
□ Testar TUDO com Chrome MCP após refatorar (garantir zero quebras)
□ Usar Supabase MCP para dados (NUNCA mockar)
□ Verificar compatibilidade de pacotes
□ Implementar código (modular, DRY, otimizado)
□ Testar TUDO com Chrome MCP após implementar (console, UI, network)
□ Corrigir erros se houver
□ Verificar regressão visual
□ Confirmar com usuário
```

#### **LEMBRETES CRÍTICOS**
- ❌ NUNCA mockar dados sem permissão
- ❌ NUNCA assumir - sempre confirmar
- ❌ NUNCA ignorar erros no console
- ❌ NUNCA criar arquivos desnecessários
- ❌ NUNCA alucinar (inventar APIs, métodos, funcionalidades)
- ❌ NUNCA forçar instalação de pacotes (perguntar opções)
- ❌ NUNCA modificar dados em migrations de constraint
- ✅ SEMPRE analisar código antes de adicionar features
- ✅ SEMPRE propor refatoramento quando necessário
- ✅ SEMPRE testar TUDO com Chrome MCP após refatorar
- ✅ SEMPRE testar TUDO com Chrome MCP após implementar nova funcionalidade
- ✅ SEMPRE usar Supabase MCP
- ✅ SEMPRE pensar em regressão visual
- ✅ SEMPRE verificar compatibilidade de pacotes
- ✅ SEMPRE propor ideias e discutir com usuário
- ✅ SEMPRE seguir DRY e boas práticas
- ✅ SEMPRE validar constraints, NUNCA modificar dados automaticamente

---

## 📊 AUDITORIA COMPLETA DO SISTEMA - Estado Atual

**Data da Auditoria**: 2025-10-06
**Auditor**: Claude Code

### 🎨 **FRONTEND - Estado Atual**

#### **Estatísticas Gerais**
- **Total de Arquivos**: 75 arquivos TypeScript/TSX
- **Linhas de Código Frontend**: ~10.500 linhas
- **Componentes**: 41 componentes
- **Páginas**: 6 páginas principais
- **Utils**: 11 arquivos utilitários
- **Hooks Customizados**: 3 hooks

#### **Componentes por Tamanho** (Top 10 maiores)
1. **EnviarOrcamentoModal.tsx**: 632 linhas ⚠️
2. **OrcamentoModal.tsx**: 579 linhas ⚠️
3. **SaveConfirmModal.tsx**: 417 linhas
4. **ShareActions.tsx**: 385 linhas
5. **UniversalFichaTable.tsx**: 329 linhas
6. **FotoUpload.tsx**: 317 linhas
7. **PhotoGalleryViewer.tsx**: 261 linhas
8. **ConsultaActionButtons.tsx**: 254 linhas
9. **MaterialItem.tsx**: 246 linhas
10. **Pagination.tsx**: 187 linhas

#### **Páginas por Tamanho**
1. **FichaTecnicaForm.tsx**: 1.278 linhas 🔴 **CRÍTICO - MUITO GRANDE!**
2. **ConsultarFichas.tsx**: 544 linhas ⚠️
3. **AdminUsuarios.tsx**: 333 linhas
4. **Login.tsx**: 134 linhas
5. **Dashboard.tsx**: 74 linhas
6. **NovaFicha.tsx**: 71 linhas
7. **NotFound.tsx**: 24 linhas

#### **Utils por Tamanho**
1. **htmlGenerator.ts**: 1.454 linhas 🔴 **CRÍTICO - MUITO COMPLEXO!**
2. **htmlGenerator.OLD.ts**: 853 linhas (backup - pode ser removido)
3. **supabaseStorage.ts**: 809 linhas ⚠️
4. **photoHelpers.ts**: 651 linhas ⚠️
5. **outlookIntegration.ts**: 326 linhas
6. **openaiService.ts**: 235 linhas
7. **logger.ts**: 168 linhas
8. **photoCache.ts**: 147 linhas
9. **imageCompression.ts**: 142 linhas
10. **statusMapping.ts**: 85 linhas
11. **helpers.ts**: 65 linhas
12. **calculations.ts**: 54 linhas

#### **Componentes UI (shadcn/ui)**
- Total: 28 componentes base do shadcn/ui
- Todos funcionando corretamente
- **form.tsx**: 176 linhas (adicionado recentemente)

#### **Dependências Principais**
- React: 18.3.1
- TypeScript: 5.8.3
- Vite: 5.4.19
- Supabase: 2.57.2
- TanStack React Query: 5.83.0
- React Hook Form: 7.61.1
- Zod: 3.25.76
- jsPDF: 3.0.3
- Tailwind CSS: 3.4.17

---

### 🔌 **BACKEND - Estado Atual**

#### **Edge Functions (Supabase Deno)**
Total: 4 Edge Functions

1. **improve-description** (191 linhas)
   - Integração com OpenAI para melhorar descrições técnicas
   - Status: Funcional
   - Uso: Opcional

2. **ftc-import** (152 linhas)
   - Importa dados de transcrição de voz
   - Parse de texto para campos estruturados
   - Regex patterns para extração de horas de processos
   - Status: Funcional
   - Uso: iOS Shortcuts integration

3. **ftc-rascunho** (112 linhas)
   - Cria nova FTC em modo rascunho
   - Gera número FTC automaticamente
   - Retry logic (até 3 tentativas)
   - Status: Funcional
   - Uso: iOS Shortcuts integration

4. **send-email-with-pdf** (50 linhas)
   - Envia email com PDF anexado
   - Status: Funcional
   - Uso: Sistema de orçamentos

**Total de Linhas Backend**: 505 linhas

---

### 🗄️ **BANCO DE DADOS - Estado Atual**

#### **Migrations**
- **Total**: 13 migrations SQL
- **Linhas Totais**: 436 linhas de DDL
- **Status**: Aplicadas no Supabase remoto (após restauração de backup)

#### **Tabelas Principais**

##### 1. **fichas_tecnicas** (Tabela Core)
**Campos**: 58+ campos
- **Identificação**:
  - `id` (UUID, PK)
  - `numero_ftc` (TEXT, UNIQUE)
  - `status` (ENUM: rascunho, preenchida, aguardando_cotacao_compras, aguardando_orcamento_comercial, orcamento_enviado_cliente)

- **Auditoria**:
  - `data_criacao` (TIMESTAMPTZ)
  - `data_ultima_edicao` (TIMESTAMPTZ)
  - `criado_por` (UUID, FK users)
  - `editado_por` (UUID, FK users)

- **Dados Cliente**:
  - cliente, solicitante, contato
  - data_visita, data_entrega

- **Dados Peça**:
  - nome_peca, quantidade, servico

- **Processos** (15 campos de horas):
  - torno_grande, torno_pequeno, cnc_tf, fresa_furad
  - plasma_oxicorte, dobra, calandra, macarico_solda
  - des_montg, balanceamento, mandrilhamento, tratamento
  - pintura_horas, lavagem_acab, programacao_cam, eng_tec

- **Tratamentos**:
  - pintura, galvanizacao, tratamento_termico
  - dureza, ensaio_lp, solda, usinagem

- **Controle**:
  - numero_orcamento, numero_os, numero_nf

- **Totalizadores**:
  - total_horas_servico, total_material_peca, total_material_todas_pecas

**Índices**:
- `idx_fichas_tecnicas_numero_ftc`
- `idx_fichas_tecnicas_cliente`
- `idx_fichas_tecnicas_data_criacao`
- `idx_fichas_tecnicas_status`

**RLS**: Habilitado (policy: allow all com autenticação)

##### 2. **materiais_ficha** (antiga: materiais)
**Campos**: 11 campos
- `id` (SERIAL, PK)
- `ficha_id` (UUID, FK)
- `descricao` (TEXT)
- `quantidade` (DECIMAL)
- `unidade` (ENUM: UN, KG, M, M², L)
- `valor_unitario` (DECIMAL)
- `fornecedor` (TEXT)
- `cliente_interno` (TEXT)
- `cliente_interno_tipo` (TEXT) - Adicionado em 2025-09-27
- `valor_total` (DECIMAL)
- `created_at` (TIMESTAMPTZ)

**Índices**:
- `idx_materiais_ficha_id`

**RLS**: Habilitado

##### 3. **fotos**
**Campos**: 6 campos
- `id` (UUID, PK)
- `ficha_id` (UUID, FK)
- `name` (TEXT)
- `size` (INTEGER)
- `type` (TEXT, DEFAULT 'image/jpeg')
- `uploaded_at` (TIMESTAMPTZ)

**Índices**:
- `idx_fotos_ficha_id`

**RLS**: Habilitado

##### 4. **aprovacoes_ftc_cliente** ✨ **NOVA** (2025-10-06)
**Campos**: 15 campos
- `id` (UUID, PK)
- `ficha_id` (UUID, FK)
- `numero_ftc` (TEXT)
- `tipo` (ENUM: aprovar, alterar, rejeitar)
- `responsavel` (TEXT)
- `email` (TEXT)
- `telefone` (TEXT)
- `observacoes` (TEXT)
- `versao_ftc` (INTEGER)
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `criado_em` (TIMESTAMPTZ)

**Índices**: 5 índices (ficha_id, numero_ftc, tipo, email, criado_em)

**RLS**: Habilitado
- Policy: Allow anonymous inserts (para formulário público)
- Policy: Authenticated users can view/update/delete

##### 5. **usuarios** (auth.users integration)
- Integração com Supabase Auth
- Email/Password provider
- RLS habilitado

#### **Storage Buckets**
1. **fichas_fotos**
   - Tamanho máximo: 5MB (após compressão)
   - Formatos: JPG, PNG, WEBP
   - Path pattern: `{ficha_id}/{timestamp}_{filename}`
   - Signed URLs: Válidas por 1 hora
   - Compressão automática no frontend

#### **Funções do Banco** (RPC)
1. **get_next_ftc_number()**
   - Gera próximo número FTC sequencial
   - Formato: YYYY + sequencial (ex: 2025001)
   - Thread-safe (usa locking)

---

### 🚨 **PROBLEMAS IDENTIFICADOS**

#### **CRÍTICOS** 🔴

1. **FichaTecnicaForm.tsx - 1.278 linhas**
   - **Problema**: Arquivo monolítico demais (>1000 linhas)
   - **Impacto**: Dificulta manutenção, performance, e debug
   - **Recomendação**: Refatorar em componentes menores (DadosCliente, DadosPeca, Processos, Materiais, etc.)
   - **Prioridade**: ALTA

2. **htmlGenerator.ts - 1.454 linhas**
   - **Problema**: Função muito complexa, difícil de manter
   - **Impacto**: Bugs difíceis de corrigir, código duplicado
   - **Recomendação**: Quebrar em funções menores (header, body sections, footer, etc.)
   - **Prioridade**: ALTA

3. **htmlGenerator.OLD.ts - 853 linhas**
   - **Problema**: Arquivo de backup não está sendo usado
   - **Impacto**: Ocupa espaço desnecessário, confunde
   - **Recomendação**: Remover após confirmar que nova versão está estável
   - **Prioridade**: MÉDIA

#### **IMPORTANTES** ⚠️

4. **EnviarOrcamentoModal.tsx - 632 linhas**
   - **Problema**: Modal muito complexo
   - **Recomendação**: Extrair lógica de geração de HTML e email para hooks/utils
   - **Prioridade**: MÉDIA

5. **OrcamentoModal.tsx - 579 linhas**
   - **Problema**: Modal muito complexo
   - **Recomendação**: Extrair seções em subcomponentes
   - **Prioridade**: MÉDIA

6. **ConsultarFichas.tsx - 544 linhas**
   - **Problema**: Página muito grande
   - **Recomendação**: Extrair filtros, tabela, e ações para componentes separados
   - **Prioridade**: MÉDIA

7. **supabaseStorage.ts - 809 linhas**
   - **Problema**: Muita lógica em um único arquivo
   - **Recomendação**: Separar em módulos (upload, download, signed URLs, compression)
   - **Prioridade**: MÉDIA

8. **photoHelpers.ts - 651 linhas**
   - **Problema**: Arquivo grande com múltiplas responsabilidades
   - **Recomendação**: Separar helpers de signed URLs, cache, e transformações
   - **Prioridade**: BAIXA

#### **CÓDIGO DUPLICADO**

9. **Lógica de Status**
   - **Problema**: Mapeamento de status repetido em múltiplos componentes
   - **Localização**: ShareActions, UniversalFichaTable, SaveConfirmModal
   - **Recomendação**: Centralizar em hook customizado `useStatusFlow()`
   - **Prioridade**: MÉDIA

10. **Geração de HTML/PDF**
    - **Problema**: Lógica similar em htmlGenerator e pdfGenerator
    - **Recomendação**: Criar abstração comum para formatação de dados
    - **Prioridade**: BAIXA

11. **Validação de Formulários**
    - **Problema**: Validações repetidas em múltiplos forms
    - **Recomendação**: Criar schemas Zod reutilizáveis
    - **Prioridade**: BAIXA

---

### ✅ **PONTOS POSITIVOS**

1. **Arquitetura Bem Definida**
   - Separação clara entre components, pages, utils, hooks
   - Uso consistente de TypeScript
   - Types auto-gerados do Supabase

2. **Boas Práticas de UI**
   - shadcn/ui bem integrado
   - Componentes reutilizáveis
   - Dark mode support

3. **State Management**
   - React Query para server state
   - React Hook Form para formulários
   - Context API para autenticação

4. **Performance**
   - Code splitting configurado
   - Lazy loading de rotas
   - Compressão de imagens
   - Gzip habilitado

5. **Database**
   - RLS habilitado (segurança)
   - Índices bem posicionados
   - Migrations organizadas
   - Constraints de integridade

6. **Backend**
   - Edge Functions bem estruturadas
   - Error handling adequado
   - CORS configurado

---

### 🔧 **RECOMENDAÇÕES DE REFATORAMENTO**

#### **Prioridade ALTA** 🔴

1. **Refatorar FichaTecnicaForm.tsx**
   ```
   Quebrar em:
   - FichaTecnicaLayout.tsx (container principal)
   - DadosClienteSection.tsx (~100 linhas)
   - DadosPecaSection.tsx (~100 linhas)
   - ProcessosSection.tsx (~150 linhas)
   - MateriaisSection.tsx (~150 linhas)
   - TratamentosSection.tsx (~100 linhas)
   - FotosSection.tsx (~100 linhas)
   - TotalizadoresSection.tsx (~80 linhas)
   ```
   **Benefício**: Código mais legível, manutenível, e testável

2. **Refatorar htmlGenerator.ts**
   ```
   Quebrar em:
   - generateHTMLHeader()
   - generateHTMLStyles()
   - generateHTMLClientData()
   - generateHTMLPieceData()
   - generateHTMLProcesses()
   - generateHTMLMaterials()
   - generateHTMLPhotos()
   - generateHTMLFooter()
   - generateHTMLWithApproval() (orquestrador)
   ```
   **Benefício**: Mais fácil de debugar e manter

#### **Prioridade MÉDIA** ⚠️

3. **Criar Hooks Customizados**
   - `useStatusFlow()` - Gerenciar transições de status
   - `useOrcamento()` - Lógica de orçamentos
   - `useFichaValidation()` - Validações compartilhadas
   - `usePhotoManagement()` - Gerenciamento de fotos

4. **Extrair Lógica de Modals**
   - Criar hooks para lógica de negócio
   - Manter modals apenas com UI
   - Exemplo: `useOrcamentoSubmit()`, `useEnviarEmail()`

5. **Centralizar Configurações**
   - Criar `config/constants.ts` para magic numbers
   - Centralizar configurações de API, Storage, etc.

#### **Prioridade BAIXA**

6. **Melhorias de Performance**
   - Adicionar React.memo em componentes pesados
   - Otimizar re-renders com useCallback/useMemo
   - Virtual scrolling para listas grandes

7. **Testes**
   - Adicionar testes unitários (Vitest)
   - Testes E2E (Playwright)
   - Coverage mínimo: 60%

8. **Documentação**
   - JSDoc em funções complexas
   - Storybook para componentes UI
   - API documentation

---

**Última atualização**: 2025-10-06
**Versão**: 2.0.0
**Ambiente**: Windows (Git Bash/WSL)
**Porta dev server**: 8080-8083
