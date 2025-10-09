# 🔄 FLUXO COMPLETO DO SISTEMA DE FICHAS TÉCNICAS

**Data**: 2025-10-06
**Versão**: 1.0
**Autor**: Claude Code
**Propósito**: Documentação COMPLETA do fluxo para nunca mais esquecer

---

## 📋 SUMÁRIO

1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Status e Transições](#status-e-transições)
3. [Criação de Rascunho](#criação-de-rascunho)
4. [Cotação de Materiais (Compras)](#cotação-de-materiais-compras)
5. [Geração de Orçamento (Comercial)](#geração-de-orçamento-comercial)
6. [Envio para Cliente](#envio-para-cliente)
7. [Sistema de Aprovação (HTML)](#sistema-de-aprovação-html)
8. [Arquivos Principais](#arquivos-principais)
9. [O Que Está Faltando](#o-que-está-faltando)

---

## 🎯 VISÃO GERAL DO FLUXO

```
┌─────────────┐
│  TÉCNICO    │ Cria rascunho → Preenche ficha → Salva
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  RASCUNHO   │ Status: 'rascunho'
└─────┬───────┘
      │ Técnico muda status ↓
      ▼
┌──────────────────────────┐
│ AGUARDANDO COTAÇÃO      │ Status: 'aguardando_cotacao_compras'
│ (COMPRAS)                │
└─────┬────────────────────┘
      │ Compras cota materiais, muda status ↓
      ▼
┌──────────────────────────┐
│ AGUARDANDO ORÇAMENTO     │ Status: 'aguardando_orcamento_comercial'
│ (COMERCIAL)              │
└─────┬────────────────────┘
      │ Comercial gera orçamento, muda status ↓
      ▼
┌──────────────────────────┐
│ ORÇAMENTO ENVIADO        │ Status: 'orcamento_enviado_cliente'
│ (CLIENTE)                │ Campo: dados_orcamento (JSON)
└─────┬────────────────────┘
      │ Cliente recebe link com sistema de aprovação ↓
      ▼
┌──────────────────────────┐
│ CLIENTE APROVA/REJEITA   │ (Pendente de implementação)
└──────────────────────────┘
```

---

## 🔄 STATUS E TRANSIÇÕES

### Status Disponíveis

Definidos em `src/types/ficha-tecnica.ts` (linhas 199-207):

```typescript
export type StatusFicha =
  | 'rascunho'                        // Técnico ainda preenchendo
  | 'aguardando_cotacao_compras'      // Aguardando compras cotar materiais
  | 'aguardando_orcamento_comercial'  // Compras cotou, aguardando comercial
  | 'orcamento_enviado_cliente';      // Comercial gerou e enviou orçamento
```

### Configuração de Status

Arquivo: `src/types/ficha-tecnica.ts` (linhas 232-260)

```typescript
export const STATUS_CONFIG = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-800',
    icon: '✏️',
    description: 'Técnico ainda preenchendo',
    department: 'tecnico'
  },
  aguardando_cotacao_compras: {
    label: 'Aguardando Cotação (Compras)',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '💰',
    description: 'Compras cotando materiais',
    department: 'compras'
  },
  aguardando_orcamento_comercial: {
    label: 'Aguardando Orçamento (Comercial)',
    color: 'bg-purple-100 text-purple-800',
    icon: '📊',
    description: 'Comercial gerando orçamento',
    department: 'comercial'
  },
  orcamento_enviado_cliente: {
    label: 'Orçamento Enviado',
    color: 'bg-green-100 text-green-800',
    icon: '📤',
    description: 'Orçamento enviado ao cliente',
    department: 'comercial'
  }
}
```

---

## 📝 CRIAÇÃO DE RASCUNHO

### Arquivo Principal
- **Componente**: `src/pages/FichaTecnicaForm.tsx`
- **Rota**: `/nova-ficha`

### Processo

1. **Técnico preenche formulário**:
   - Dados do Cliente (nome, solicitante, telefone/email)
   - Dados da Peça (nome, quantidade, serviço)
   - Materiais (lista de materiais com cotação)
   - Horas de Produção (torno, fresa, solda, etc.)
   - Fotos (upload para Supabase Storage)
   - Tratamentos (pintura, galvanização, etc.)

2. **Sistema calcula automaticamente**:
   ```typescript
   // src/hooks/useFichaTecnica.ts
   const calculos = {
     horasPorPeca: totalHoras / quantidade,
     horasTodasPecas: totalHoras,
     materialPorPeca: totalMaterial / quantidade,
     materialTodasPecas: totalMaterial
   }
   ```

3. **Salvar ficha**:
   ```typescript
   // src/hooks/useFichaTecnica.ts - função salvarFichaTecnica()
   const result = await salvarFichaTecnica('rascunho'); // Status inicial
   ```

4. **Dados salvos no banco**:
   - Tabela: `fichas_tecnicas`
   - Campos principais:
     - `id` (UUID)
     - `numero_ftc` (ex: "2025077")
     - `status` = 'rascunho'
     - `form_data` (JSON com todos os campos)
     - `created_at`, `updated_at`
     - `created_by_user_id`

---

## 💰 COTAÇÃO DE MATERIAIS (COMPRAS)

### Como Funciona

1. **Técnico muda status para "Aguardando Cotação"**:
   - Arquivo: `src/components/FichaTecnica/SaveButton.tsx`
   - Ação: Dropdown com opção "Enviar para Compras"
   - Resultado: `status` vira `'aguardando_cotacao_compras'`

2. **Compras vê fichas pendentes**:
   - Página: `/consultar-fichas`
   - Filtro: Status "💰 AG. COTAÇÃO"
   - Lista todas as fichas aguardando cotação

3. **Compras edita a ficha**:
   - Clica em "Editar Ficha"
   - Adiciona/edita materiais na seção "Materiais para Cotação"
   - Preenche: descrição, quantidade, valor unitário, fornecedor

4. **Compras finaliza e muda status**:
   - Botão "Enviar para Comercial"
   - Status vira: `'aguardando_orcamento_comercial'`

---

## 📊 GERAÇÃO DE ORÇAMENTO (COMERCIAL)

### Como DEVERIA Funcionar (Ainda Não Implementado Completamente)

1. **Comercial abre ficha para orçamento**:
   - Página: `/consultar-fichas`
   - Filtro: Status "📊 AG. ORÇAMENTO"
   - Clica em "Editar Ficha"

2. **Comercial gera orçamento** (PENDENTE DE IMPLEMENTAÇÃO):
   ```
   ATUALMENTE NÃO HÁ:
   ❌ Botão para criar orçamento
   ❌ Modal de orçamento
   ❌ Formulário de cálculo de margem/lucro

   O QUE EXISTE:
   ✅ Interface de dados (OrcamentoData) em types/ficha-tecnica.ts
   ✅ Campo dados_orcamento no banco
   ✅ Função generateHTMLWithApproval() pronta
   ```

3. **Estrutura de Dados do Orçamento**:

   Arquivo: `src/types/ficha-tecnica.ts` (linhas 137-187)

   ```typescript
   export interface OrcamentoData {
     // Itens do orçamento
     itens: OrcamentoItem[];  // Lista de produtos

     // Formação de preço
     custoBase: {
       materiaisCotados: number;        // Auto-calculado dos materiais
       materiasPrimaEstoque: number;    // Input manual
       servicosTerceiros: number;       // Input manual
       horasProducao: {
         horas: number;                 // Auto-calculado
         valorHora: number;             // Padrão R$ 53,00
         total: number;                 // Auto-calculado
       };
       horasDespesasFixas: {
         horas: number;                 // Eng, técnico, CAM...
         valorHora: number;             // Padrão R$ 0,00
         total: number;
       };
       totalCustoIndustrial: number;    // Soma de tudo
     };

     // Percentuais
     percentuais: {
       despesasVariaveis: number;       // % (ex: 10%)
       despesasFixas: number;           // % (ex: 15%)
       margemLucro: number;             // % (ex: 25%)
     };

     // Configurações
     config: {
       prazoEntrega: number;            // dias
       validadeProposta: number;        // dias
       prazoPagamento: number;          // dias
       condicoesPagamento: string;
       garantia: number;                // dias
     };

     // Preço final calculado
     precoVendaFinal: number;
   }
   ```

4. **Salvamento do Orçamento**:
   ```typescript
   // Quando comercial salvar orçamento:
   formData.dados_orcamento = JSON.stringify(orcamentoData);
   status = 'orcamento_enviado_cliente';
   ```

---

## 📤 ENVIO PARA CLIENTE

### Como Funciona ATUALMENTE

1. **Comercial acessa Consultar Fichas**
2. **Clica no botão de compartilhamento** (ícones coloridos):
   - 🔵 Visualizar HTML
   - 🟢 Baixar HTML
   - 🟣 Email com HTML
   - 🟢 WhatsApp com HTML

3. **Sistema gera HTML simples**:

   Arquivo: `src/components/FichaTecnica/ShareActions.tsx`

   ```typescript
   const uploadHTMLAndGetLink = async () => {
     // 🔧 FIX: Carrega fotos da ficha
     const fotos = await carregarFotosFicha(ficha.id);
     const fichaComFotos = { ...ficha, fotos };

     // Gera HTML simples (SEM sistema de aprovação)
     const htmlContent = await generateHTMLContent(fichaComFotos);

     // Upload para Supabase Storage
     const filePath = `temp/ficha-${numeroFTC}-${timestamp}.html`;
     await supabase.storage.from('ficha-fotos').upload(filePath, htmlBlob);

     // Retorna link público
     return `${baseUrl}/view-html/${filePath}`;
   }
   ```

4. **Link enviado via WhatsApp ou Email**:
   - Cliente recebe link
   - Abre no navegador
   - VÊ a ficha técnica
   - **MAS NÃO PODE APROVAR/REJEITAR**

---

## ✅ SISTEMA DE APROVAÇÃO (HTML)

### O Que JÁ EXISTE

**Função Completa e Pronta**:

Arquivo: `src/utils/htmlGenerator.ts` (linha 1204)

```typescript
export async function generateHTMLWithApproval(dados: ApprovalSystemData): Promise<string> {
  const { ficha, versaoFTC, supabaseUrl, supabaseAnonKey } = dados;

  // 1. Gera HTML base (mesma função usada para visualização)
  let htmlBase = await generateCompactHTMLContent(ficha);

  // 2. Adiciona CSS para botões de aprovação
  const approvalCSS = `
    .btn-aprovar { background: #10b981; color: white; }
    .btn-alterar { background: #f59e0b; color: white; }
    .btn-rejeitar { background: #ef4444; color: white; }
  `;

  // 3. Adiciona botões no final do HTML
  const approvalSection = `
    <div class="approval-section">
      <h2>Sistema de Aprovação</h2>
      <div class="btn-container">
        <button class="btn btn-aprovar" onclick="aprovar()">
          ✅ Aprovar Orçamento
        </button>
        <button class="btn btn-alterar" onclick="solicitarAlteracao()">
          🔄 Solicitar Alteração
        </button>
        <button class="btn btn-rejeitar" onclick="rejeitar()">
          ❌ Rejeitar Orçamento
        </button>
      </div>
    </div>

    <script>
      async function aprovar() {
        // POST para Supabase salvando aprovação
        const response = await fetch('${supabaseUrl}/rest/v1/aprovacoes_orcamentos', {
          method: 'POST',
          headers: {
            'apikey': '${supabaseAnonKey}',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ficha_id: '${ficha.id}',
            decisao: 'aprovado',
            data_decisao: new Date().toISOString()
          })
        });

        if (response.ok) {
          alert('✅ Orçamento aprovado com sucesso!');
        }
      }

      function solicitarAlteracao() {
        // Similar ao aprovar, mas com decisao: 'alteracao_solicitada'
      }

      function rejeitar() {
        // Similar ao aprovar, mas com decisao: 'rejeitado'
      }
    </script>
  `;

  // 4. Injeta no HTML ANTES do </body> final
  const lastBodyIndex = htmlBase.lastIndexOf('</body>');
  htmlBase = htmlBase.substring(0, lastBodyIndex) +
             approvalSection + '\n' +
             htmlBase.substring(lastBodyIndex);

  return htmlBase;
}
```

### O Que ESTÁ FALTANDO

#### ❌ 1. Componente de Modal de Orçamento
**Arquivo inexistente**: `src/components/FichaTecnica/OrcamentoModal.tsx`

**Deveria fazer**:
- Mostrar interface para preencher valores de orçamento
- Calcular margem de lucro automaticamente
- Validar campos obrigatórios
- Salvar dados em `formData.dados_orcamento`

#### ❌ 2. Integração no ShareActions
**Arquivo atual**: `src/components/FichaTecnica/ShareActions.tsx`

**O que falta**:
```typescript
// ATUALMENTE:
const htmlContent = await generateHTMLContent(ficha); // HTML simples

// DEVERIA SER:
const temOrcamento = ficha.formData.dados_orcamento;

if (temOrcamento) {
  // Gera HTML COM sistema de aprovação
  const htmlContent = await generateHTMLWithApproval({
    ficha,
    versaoFTC: ficha.versao_ftc_atual || 1,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  });
} else {
  // Gera HTML simples (atual)
  const htmlContent = await generateHTMLContent(ficha);
}
```

#### ❌ 3. Tabela de Aprovações no Banco
**Tabela inexistente**: `aprovacoes_orcamentos`

**Schema necessário**:
```sql
CREATE TABLE aprovacoes_orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES fichas_tecnicas(id),
  decisao TEXT NOT NULL, -- 'aprovado' | 'alteracao_solicitada' | 'rejeitado'
  observacoes TEXT,
  data_decisao TIMESTAMP DEFAULT NOW(),
  aprovado_por TEXT, -- Nome/email do cliente
  versao_ftc INTEGER -- Qual versão da FTC foi aprovada
);
```

#### ❌ 4. Rota Pública para Cliente
**Rotas inexistentes**:
- `/ftc-cliente-publico/:token`
- Componente `FTCClientePublico.tsx`

**Deveria fazer**:
- Exibir HTML com sistema de aprovação
- Permitir acesso SEM login
- Token seguro para evitar acesso não autorizado

#### ❌ 5. Sistema de Notificações
Quando cliente aprovar/rejeitar:
- Enviar email para comercial
- Atualizar status da ficha
- Salvar histórico de decisões

---

## 📁 ARQUIVOS PRINCIPAIS

### 1. Tipos e Interfaces
- **`src/types/ficha-tecnica.ts`**: Todas as interfaces (FormData, OrcamentoData, StatusFicha)

### 2. Formulário de Ficha
- **`src/pages/FichaTecnicaForm.tsx`**: Criação/edição de fichas
- **`src/hooks/useFichaTecnica.ts`**: Lógica de negócio, salvar, carregar

### 3. Listagem e Consulta
- **`src/pages/ConsultarFichas.tsx`**: Lista fichas, filtros por status
- **`src/components/FichaTecnica/UniversalFichaTable.tsx`**: Tabela de fichas

### 4. Compartilhamento
- **`src/components/FichaTecnica/ShareActions.tsx`**: Botões de compartilhar (WhatsApp, Email, Download)
- **`src/components/FichaTecnica/HTMLViewer.tsx`**: Visualizador de HTML público

### 5. Geração de HTML
- **`src/utils/htmlGenerator.ts`**:
  - `generateHTMLContent()` - HTML simples
  - `generateCompactHTMLContent()` - Base para todos os HTMLs
  - `generateHTMLWithApproval()` - **HTML com sistema de aprovação (PRONTO MAS NÃO CONECTADO)**

### 6. Fotos
- **`src/components/FichaTecnica/FotoUpload.tsx`**: Upload de fotos
- **`src/utils/photoHelpers.ts`**: Signed URLs do Supabase Storage
- **`src/utils/supabaseStorage.ts`**: `carregarFotosFicha()` - Busca fotos do banco

### 7. Salvamento
- **`src/utils/supabaseStorage.ts`**: `salvarFichaTecnica()` - Salva ficha no banco

---

## 🚧 O QUE ESTÁ FALTANDO

### Para Implementar Sistema de Aprovação Completo

#### 1. **Criar Modal de Orçamento**
**Arquivo**: `src/components/FichaTecnica/OrcamentoModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  ficha: FichaSalva;
  onSave: (orcamentoData: OrcamentoData) => Promise<void>;
}

export function OrcamentoModal({ isOpen, onClose, ficha, onSave }: Props) {
  // Formulário com:
  // - Itens do orçamento
  // - Cálculo de custos (materiais + horas)
  // - Percentuais (despesas variáveis, fixas, margem)
  // - Configurações (prazo, pagamento, garantia)
  // - Preço final calculado automaticamente
}
```

#### 2. **Adicionar Botão de Orçamento no FichaTecnicaForm**
**Arquivo**: `src/pages/FichaTecnicaForm.tsx`

```typescript
// Adicionar próximo ao botão "Salvar":
<Button
  onClick={() => setShowOrcamentoModal(true)}
  disabled={!fichaCarregada || fichaCarregada.status !== 'aguardando_orcamento_comercial'}
>
  📊 Gerar Orçamento
</Button>

<OrcamentoModal
  isOpen={showOrcamentoModal}
  onClose={() => setShowOrcamentoModal(false)}
  ficha={fichaCarregada}
  onSave={handleSaveOrcamento}
/>
```

#### 3. **Modificar ShareActions para Usar HTML com Aprovação**
**Arquivo**: `src/components/FichaTecnica/ShareActions.tsx`

```typescript
const uploadHTMLAndGetLink = async () => {
  const fotos = await carregarFotosFicha(ficha.id);
  const fichaComFotos = { ...ficha, fotos };

  // 🆕 DETECTAR SE TEM ORÇAMENTO
  const temOrcamento = fichaComFotos.formData.dados_orcamento;

  let htmlContent: string;

  if (temOrcamento) {
    // Usar HTML com sistema de aprovação
    htmlContent = await generateHTMLWithApproval({
      ficha: fichaComFotos,
      versaoFTC: fichaComFotos.versao_ftc_atual || 1,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    });
  } else {
    // Usar HTML simples (atual)
    htmlContent = await generateHTMLContent(fichaComFotos);
  }

  // Resto do código continua igual...
}
```

#### 4. **Criar Tabela de Aprovações**
**Migration SQL**: `supabase/migrations/XXXXXX_create_aprovacoes.sql`

```sql
CREATE TABLE aprovacoes_orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  decisao TEXT NOT NULL CHECK (decisao IN ('aprovado', 'alteracao_solicitada', 'rejeitado')),
  observacoes TEXT,
  nome_aprovador TEXT,
  email_aprovador TEXT,
  data_decisao TIMESTAMP DEFAULT NOW(),
  versao_ftc INTEGER,

  -- Índices
  CONSTRAINT unique_aprovacao_por_versao UNIQUE (ficha_id, versao_ftc)
);

-- Index para busca rápida
CREATE INDEX idx_aprovacoes_ficha_id ON aprovacoes_orcamentos(ficha_id);
CREATE INDEX idx_aprovacoes_decisao ON aprovacoes_orcamentos(decisao);
```

#### 5. **Criar Componente Público de Aprovação**
**Arquivo**: `src/components/FichaTecnica/FTCClientePublico.tsx`

```typescript
export function FTCClientePublico() {
  const { filePath } = useParams();
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Buscar HTML do Supabase Storage
    const fetchHTML = async () => {
      const { data } = await supabase.storage
        .from('ficha-fotos')
        .download(filePath);

      const text = await data.text();
      setHtmlContent(text);
    };

    fetchHTML();
  }, [filePath]);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
```

#### 6. **Adicionar Rota Pública**
**Arquivo**: `src/App.tsx`

```typescript
<Route
  path="/ftc-cliente-publico/:filePath"
  element={<FTCClientePublico />}
/>
```

---

## 📝 RESUMO PARA NUNCA ESQUECER

### ✅ O QUE JÁ FUNCIONA
1. Criação de rascunho
2. Cotação de materiais (Compras)
3. Upload e exibição de fotos
4. Geração de HTML simples
5. Compartilhamento via WhatsApp/Email
6. Função `generateHTMLWithApproval()` **PRONTA MAS NÃO USADA**

### ❌ O QUE FALTA IMPLEMENTAR
1. Modal de geração de orçamento (interface)
2. Botão para abrir modal de orçamento
3. Integração do `generateHTMLWithApproval()` no ShareActions
4. Tabela `aprovacoes_orcamentos` no banco
5. Rota pública `/ftc-cliente-publico/:token`
6. Sistema de notificações quando cliente aprovar

### 🔑 CAMPO CHAVE
**`formData.dados_orcamento`**:
- Tipo: `string` (JSON serializado)
- Conteúdo: `OrcamentoData` em JSON
- Indica se ficha tem orçamento
- Usado para decidir entre HTML simples ou HTML com aprovação

---

**FIM DA DOCUMENTAÇÃO**

**NUNCA MAIS ESQUECER**:
1. O sistema de aprovação JÁ EXISTE em `htmlGenerator.ts`
2. Só falta CONECTAR ele no fluxo
3. Precisa criar modal de orçamento
4. Precisa modificar ShareActions para detectar orçamento
5. Precisa criar rota pública

**Última atualização**: 2025-10-06
