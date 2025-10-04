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

**Última atualização**: 2025-10-03
**Versão**: 1.0.0
**Ambiente**: Windows (Git Bash/WSL)
**Porta dev server**: 8080
