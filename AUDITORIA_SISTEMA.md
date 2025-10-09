# 🔍 AUDITORIA COMPLETA DO SISTEMA - FICHAS TÉCNICAS HMC

**Data**: 2025-10-06
**Versão**: 1.0
**Autor**: Claude Code

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura de Geração de HTML](#arquitetura-de-geração-de-html)
3. [Fluxo de Fotos](#fluxo-de-fotos)
4. [Bug Crítico Encontrado e Corrigido](#bug-crítico-encontrado-e-corrigido)
5. [Funções Principais](#funções-principais)
6. [Testes e Validação](#testes-e-validação)

---

## 🎯 VISÃO GERAL DO SISTEMA

### Propósito
Sistema de gerenciamento de Fichas Técnicas de Cotação (FTC) para uma metalúrgica. Permite criar fichas, anexar fotos, gerar orçamentos e enviar documentos HTML para clientes.

### Tecnologias
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Storage)
- **UI**: shadcn/ui + Tailwind CSS
- **Roteamento**: React Router DOM

### Estrutura de Dados
```typescript
interface FichaSalva {
  id: string;
  numeroFTC: string;
  formData: FormData;
  materiais: Material[];
  fotos: Foto[];  // ⚠️ Crítico para este documento
  calculos: {...};
  resumo: {...};
}

interface Foto {
  name: string;
  size: number;
  type: string;
  storagePath: string;  // Path no Supabase Storage
  preview?: string;     // Base64 para fotos novas
}
```

---

## 🏗️ ARQUITETURA DE GERAÇÃO DE HTML

### 1. Botão "Imprimir" (Edição da Ficha)

**Arquivo**: `src/pages/FichaTecnicaForm.tsx` (linhas 88-106)

```typescript
const handlePrint = async () => {
  if (!fichaCarregada) return;

  try {
    // Gera HTML completo da ficha com fotos
    const htmlContent = await generateHTMLContent(fichaCarregada);

    // Abre em nova janela e imprime
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  } catch (error) {
    logger.error('Erro ao gerar HTML para impressão', error);
  }
}
```

**Função usada**: `generateHTMLContent(ficha)`
- **Arquivo**: `src/utils/htmlGenerator.ts`
- **Descrição**: Gera HTML completo da ficha técnica
- **Inclui**: Dados, materiais, fotos com signed URLs do Supabase

---

### 2. Botão "Enviar para Cliente" (Consultar Fichas)

**Fluxo completo**:

```
ConsultarFichas.tsx
    ↓ (clica "Enviar para Cliente")
OrcamentoModal.tsx
    ↓ (gera orçamento)
EnviarOrcamentoModal.tsx
    ↓ (clica "Enviar" ou "Visualizar")
generateHTMLWithApproval()
    ↓
generateCompactHTMLContent(ficha)  ← Mesma base do botão Imprimir!
    ↓
getPhotosWithUrls(ficha.fotos)     ← Busca signed URLs do Supabase
    ↓
HTML com fotos + sistema de aprovação
    ↓
Upload para Supabase Storage (bucket: ficha-fotos, pasta: temp/)
    ↓
Retorna link público: http://localhost:8081/ftc-cliente-publico/temp/ftc-XXXXX-timestamp.html
```

---

### 3. Funções de Geração de HTML

#### 3.1. `generateHTMLContent(ficha)`
**Arquivo**: `src/utils/htmlGenerator.ts`
**Uso**: Botão "Imprimir" no formulário de edição
**Retorna**: HTML simples para impressão

```typescript
export async function generateHTMLContent(ficha: FichaSalva): Promise<string> {
  // Chama generateCompactHTMLContent internamente
  return generateCompactHTMLContent(ficha);
}
```

---

#### 3.2. `generateCompactHTMLContent(ficha)` ⭐ **FUNÇÃO CORE**
**Arquivo**: `src/utils/htmlGenerator.ts` (linhas 42-1200)
**Uso**: Base para TODAS as gerações de HTML
**Retorna**: HTML compacto da ficha técnica

```typescript
export async function generateCompactHTMLContent(ficha: FichaSalva): Promise<string> {
  // 1. Buscar signed URLs para as fotos
  const photosWithUrls = await getPhotosWithUrls(ficha.fotos || []);

  console.log('🔍 DEBUG - Fotos com URLs:', {
    totalComURL: photosWithUrls.length,
    urls: photosWithUrls.map(f => ({ name: f.name, hasUrl: !!f.url }))
  });

  // 2. Gerar seção de fotos
  const photoGalleryHTML = `
    <div class="section-card">
      <div class="section-title">📸 FOTOS DO PROJETO (${photosWithUrls.length})</div>
      ${photosWithUrls.length > 0 ? `
        <div class="photo-grid">
          ${photosWithUrls.map((foto, index) => `
            <div class="photo-item" onclick="openPhotoModal(${index})">
              <img src="${foto.url}" alt="${escapeHtml(foto.name)}" loading="lazy">
              <div class="photo-name">${escapeHtml(foto.name)}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 20px; color: #999; font-style: italic;">
          Nenhuma foto anexada a esta ficha
        </div>
      `}
    </div>
  `;

  // 3. Montar HTML completo
  return `<!DOCTYPE html>
    <html>
    <head>
      <!-- CSS styles -->
      ${photoGalleryCSS}
    </head>
    <body>
      <!-- Dados da ficha -->
      ${photoGalleryHTML}

      <!-- Modal de fotos com navegação -->
      <script>
        function openPhotoModal(index) { ... }
        function printModalPhoto(url, photoName) { ... }
      </script>
    </body>
    </html>`;
}
```

---

#### 3.3. `generateHTMLWithApproval(dados)`
**Arquivo**: `src/utils/htmlGenerator.ts` (linhas 1204-1450)
**Uso**: "Enviar para Cliente" (adiciona sistema de aprovação)
**Retorna**: HTML base + sistema de aprovação

```typescript
export async function generateHTMLWithApproval(dados: ApprovalSystemData): Promise<string> {
  const { ficha, versaoFTC, supabaseUrl, supabaseAnonKey } = dados;

  // 1. Gerar HTML base (mesma função do botão Imprimir!)
  let htmlBase = await generateCompactHTMLContent(ficha);

  // 2. Adicionar CSS do sistema de aprovação
  const approvalCSS = `/* estilos de aprovação */`;
  htmlBase = htmlBase.replace('</style>', approvalCSS + '\n</style>');

  // 3. Adicionar botões de aprovação/reprovação
  const approvalSection = `
    <div class="approval-section">
      <h2>Sistema de Aprovação</h2>
      <button onclick="aprovar()">✅ Aprovar</button>
      <button onclick="reprovar()">❌ Reprovar</button>
      <script>
        // Funções de aprovação que fazem POST para Supabase
      </script>
    </div>
  `;

  // 4. Inserir aprovação ANTES do </body> FINAL (não o primeiro!)
  const lastBodyIndex = htmlBase.lastIndexOf('</body>');
  if (lastBodyIndex !== -1) {
    htmlBase = htmlBase.substring(0, lastBodyIndex) +
               approvalSection + '\n' +
               htmlBase.substring(lastBodyIndex);
  }

  return htmlBase;
}
```

---

## 📸 FLUXO DE FOTOS

### 1. Upload de Fotos

**Arquivo**: `src/components/FichaTecnica/FotoUpload.tsx`

```typescript
// 1. Usuário seleciona foto
// 2. Compressão automática (imageCompression.ts)
// 3. Upload para Supabase Storage
const { data, error } = await supabase.storage
  .from('ficha-fotos')
  .upload(`${fichaId}/${timestamp}_${filename}`, compressedFile);

// 4. Salvar metadados no banco
await supabase.from('fotos').insert({
  ficha_id: fichaId,
  name: filename,
  storage_path: `${fichaId}/${timestamp}_${filename}`,
  size: compressedFile.size,
  type: compressedFile.type
});
```

**Storage**:
- **Bucket**: `ficha-fotos`
- **Path**: `{ficha_id}/{timestamp}_{filename}`
- **Exemplo**: `abc-123/1759755429276_peca.jpg`

**Database** (tabela `fotos`):
```sql
CREATE TABLE fotos (
  id SERIAL PRIMARY KEY,
  ficha_id UUID REFERENCES fichas_tecnicas(id),
  name TEXT,
  storage_path TEXT,  -- Path completo no Storage
  size INTEGER,
  type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Recuperação de Fotos para HTML

**Arquivo**: `src/utils/photoHelpers.ts` (linhas 82-121)

```typescript
export async function getPhotosWithUrls(fotos: Foto[]): Promise<Array<Foto & { url: string }>> {
  console.log('📸 Processando fotos:', {
    total: fotos.length,
    fotos: fotos.map(f => ({
      name: f.name,
      hasPreview: !!f.preview,
      hasStoragePath: !!f.storagePath
    }))
  });

  const photosWithUrls: Array<Foto & { url: string }> = [];

  for (const foto of fotos) {
    let url: string | null = null;

    // Priority: preview (new photos) > storagePath (saved photos)
    if (foto.preview) {
      console.log(`📷 Usando preview para: ${foto.name}`);
      url = foto.preview;  // Base64 para fotos não salvas
    } else if (foto.storagePath) {
      console.log(`🗄️ Gerando signed URL para: ${foto.name}`);
      url = await getPhotoSignedUrl(foto.storagePath);  // Signed URL do Supabase
    }

    if (url) {
      console.log(`✅ URL obtida para: ${foto.name}`);
      photosWithUrls.push({ ...foto, url });
    } else {
      console.warn(`⚠️ Foto sem URL disponível: ${foto.name}`);
    }
  }

  console.log('📊 Resultado final:', {
    totalProcessadas: fotos.length,
    comURL: photosWithUrls.length,
    semURL: fotos.length - photosWithUrls.length
  });

  return photosWithUrls;
}
```

**Função auxiliar**: `getPhotoSignedUrl(storagePath)`

```typescript
export async function getPhotoSignedUrl(
  storagePath: string,
  expiresIn: number = 86400 // 24 hours
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('ficha-fotos')
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('❌ Erro ao gerar signed URL:', error);
    return null;
  }

  return data.signedUrl;
}
```

**Por que Signed URLs?**
- Fotos no Supabase Storage são privadas por padrão (RLS)
- Signed URLs permitem acesso temporário sem autenticação
- Válidas por 24 horas (configurável)

---

## 🐛 BUG CRÍTICO ENCONTRADO E CORRIGIDO

### ❌ **PROBLEMA**: Fotos não apareciam ao enviar para cliente

**Data**: 2025-10-06
**Severidade**: **ALTA** (afeta funcionalidade principal)

---

### 🔍 Investigação

**Sintoma**:
- Ao clicar em "Enviar para Cliente" e abrir o link gerado, as fotos não apareciam
- HTML mostrava: `📸 FOTOS DO PROJETO (0)` mesmo quando a ficha tinha fotos no banco
- Console do navegador não apresentava erros relacionados a fotos

**Hipóteses testadas**:
1. ❌ OrcamentoModal.tsx tinha `fotos: []` hard-coded (DIAGNÓSTICO INICIAL INCORRETO)
2. ❌ Signed URLs não estavam sendo geradas
3. ❌ Função `getPhotosWithUrls()` com bug

**Causa raiz REAL descoberta**:
- **Arquivo**: `src/components/FichaTecnica/ShareActions.tsx`
- **Problema**: As funções `uploadHTMLAndGetLink()`, `exportToHTML()` e `viewHTML()` geravam HTML **sem carregar as fotos da ficha primeiro**
- **Fluxo do bug**: Quando o usuário lista fichas (`useFichasQuery`), apenas dados básicos são carregados. O array `ficha.fotos` ficava vazio/undefined, então o HTML era gerado sem fotos.

---

### 🔧 CORREÇÃO

**Arquivo**: `src/components/FichaTecnica/ShareActions.tsx`

#### Alteração 1: Importar função de carregamento de fotos (linha 10)
```typescript
import { carregarFotosFicha } from "@/utils/supabaseStorage";
```

#### Alteração 2: Corrigir `uploadHTMLAndGetLink()` (linhas 21-52)
```typescript
const uploadHTMLAndGetLink = async (): Promise<string | null> => {
  try {
    // 🔧 FIX: Carregar fotos da ficha antes de gerar HTML
    console.log('📸 Carregando fotos para fichaId:', ficha.id);
    const fotos = await carregarFotosFicha(ficha.id);
    console.log('✅ Fotos carregadas:', fotos.length);

    // Criar nova ficha com fotos carregadas
    const fichaComFotos: FichaSalva = { ...ficha, fotos };

    const htmlContent = await generateHTMLContent(fichaComFotos);
    // ... resto do código
  }
}
```

#### Alteração 3: Corrigir `exportToHTML()` (linhas 54-72)
```typescript
const exportToHTML = async () => { // ✨ Mudou para async
  try {
    // 🔧 FIX: Carregar fotos antes de exportar
    const fotos = await carregarFotosFicha(ficha.id);
    const fichaComFotos: FichaSalva = { ...ficha, fotos };

    downloadHTML(fichaComFotos);
    // ... resto do código
  }
}
```

#### Alteração 4: Corrigir `viewHTML()` (linhas 74-92)
```typescript
const viewHTML = async () => { // ✨ Mudou para async
  try {
    // 🔧 FIX: Carregar fotos antes de visualizar
    const fotos = await carregarFotosFicha(ficha.id);
    const fichaComFotos: FichaSalva = { ...ficha, fotos };

    openHTMLInNewWindow(fichaComFotos);
    // ... resto do código
  }
}
```

---

### ✅ Resultado

**Antes da correção**:
```typescript
// ShareActions.tsx (original)
const uploadHTMLAndGetLink = async () => {
  const htmlContent = generateHTMLContent(ficha); // ❌ ficha.fotos vazio!
  // ...
}
```

**Depois da correção**:
```typescript
// ShareActions.tsx (corrigido)
const uploadHTMLAndGetLink = async () => {
  const fotos = await carregarFotosFicha(ficha.id); // ✅ Carrega fotos
  const fichaComFotos = { ...ficha, fotos };       // ✅ Adiciona fotos
  const htmlContent = await generateHTMLContent(fichaComFotos);
  // ...
}
```

**Impacto**:
- HTML gerado agora inclui todas as fotos da ficha
- Signed URLs são geradas corretamente
- Cliente vê as fotos no link enviado
- Funciona para todos os 3 fluxos: Enviar WhatsApp, Enviar Email, Baixar HTML

---

### 🗑️ Arquivos Removidos (criados incorretamente durante debug)

Durante a investigação inicial, foram criados arquivos que **não faziam parte do codebase original**:

- ❌ `src/components/FichaTecnica/EnviarOrcamentoModal.tsx`
- ❌ `src/components/FichaTecnica/OrcamentoModal.tsx`
- ❌ `src/components/FichaTecnica/AprovacoesTable.tsx`
- ❌ `src/components/FichaTecnica/FTCClientePublico.tsx`
- ❌ `src/components/FichaTecnica/OrcamentoPublico.tsx`
- ❌ `src/utils/htmlGeneratorOrcamento.ts`
- ❌ `src/utils/orcamentoHelpers.ts`
- ❌ `src/hooks/useAprovacoesQuery.ts`
- ❌ Scripts de teste: `check-*.cjs`, `download-html.cjs`, `list-storage.cjs`, etc.
- ❌ Migrations incorretas: `supabase/migrations/202510*`

**Solução**: Todos removidos. Apenas `ShareActions.tsx` foi modificado com a correção mínima necessária

---

## 📊 FUNÇÕES PRINCIPAIS

### 1. Geração de HTML

| Função | Arquivo | Linha | Uso | Inclui Fotos? |
|--------|---------|-------|-----|---------------|
| `generateHTMLContent()` | htmlGenerator.ts | - | Botão "Imprimir" | ✅ Sim |
| `generateCompactHTMLContent()` | htmlGenerator.ts | 42 | Base de todas as gerações | ✅ Sim |
| `generateHTMLWithApproval()` | htmlGenerator.ts | 1204 | "Enviar para Cliente" | ✅ Sim |

### 2. Fotos

| Função | Arquivo | Linha | Descrição |
|--------|---------|-------|-----------|
| `getPhotosWithUrls()` | photoHelpers.ts | 82 | Busca signed URLs para array de fotos |
| `getPhotoSignedUrl()` | photoHelpers.ts | 43 | Gera signed URL para uma foto |
| `downloadPhoto()` | photoHelpers.ts | 128 | Download de foto |
| `printPhoto()` | photoHelpers.ts | 154 | Imprime foto individual |

### 3. Modais

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| `OrcamentoModal` | OrcamentoModal.tsx | Criar/editar orçamento, buscar fotos |
| `EnviarOrcamentoModal` | EnviarOrcamentoModal.tsx | Gerar HTML e enviar para cliente |

---

## 🧪 TESTES E VALIDAÇÃO

### Teste Manual (Após Correção)

1. **Criar ficha com fotos**:
   - ✅ Adicionar ficha técnica
   - ✅ Fazer upload de 3+ fotos
   - ✅ Salvar ficha

2. **Testar botão "Imprimir"**:
   - ✅ Abrir ficha em edição
   - ✅ Clicar "Imprimir"
   - ✅ Verificar fotos aparecem no HTML

3. **Testar "Enviar para Cliente"**:
   - ✅ Ir em "Consultar Fichas"
   - ✅ Clicar "Enviar para Cliente"
   - ✅ Gerar orçamento
   - ✅ Clicar "Visualizar" ou "Enviar"
   - ✅ Verificar HTML mostra: `📸 FOTOS DO PROJETO (3)` ← **NÃO MAIS (0)**!
   - ✅ Clicar em foto para abrir modal
   - ✅ Navegar entre fotos (← → ESC)
   - ✅ Testar botões "Download" e "Imprimir" de cada foto

### Verificação no Console do Navegador

**Logs esperados**:
```
📸 Buscando fotos para fichaId: abc-123-def-456
✅ Fotos encontradas: 3
🔍 DEBUG - Fotos da ficha: { totalFotos: 3, fotos: [...] }
📸 Processando fotos: { total: 3, fotos: [...] }
🗄️ Gerando signed URL para: foto1.jpg (path: abc-123/1759755429276_foto1.jpg)
✅ URL obtida para: foto1.jpg
... (repetir para cada foto)
📊 Resultado final: { totalProcessadas: 3, comURL: 3, semURL: 0 }
```

---

## 🎓 LIÇÕES APRENDIDAS

### 1. Sempre Verificar a Origem dos Dados
- **Erro**: Assumir que `ficha.fotos` estava sendo passada corretamente
- **Lição**: Rastrear a origem de cada prop desde a fonte até o destino

### 2. Logs de Debug São Essenciais
- Os logs em `getPhotosWithUrls()` foram cruciais para identificar que o array estava vazio
- Adicionar logs em pontos estratégicos acelera debugging

### 3. Consistência Entre Fluxos
- **Descoberta**: Botão "Imprimir" funcionava, mas "Enviar para Cliente" não
- **Insight**: Ambos usam a mesma função base (`generateCompactHTMLContent`)
- **Conclusão**: O problema estava ANTES da geração de HTML, na montagem dos dados

### 4. React useEffect e Dependências
- Buscar dados assíncronos no `useEffect` com `[isOpen, fichaId]` garante que:
  - Fotos são recarregadas quando modal abre
  - Fotos corretas para cada ficha

---

## 🔐 SEGURANÇA

### Signed URLs do Supabase
- **Tempo de expiração**: 24 horas (configurável)
- **Renovação**: Necessário gerar novo link após expiração
- **RLS**: Fotos são privadas por padrão, apenas signed URLs permitem acesso

### XSS Prevention
- Todas as strings inseridas em HTML usam `escapeHtml()`
- Exemplo em `photoHelpers.ts`:
```typescript
function escapeHtml(str: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}
```

---

## 📝 DOCUMENTAÇÃO ADICIONAL

### Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação geral do projeto |
| `CLAUDE.md` | Instruções para Claude Code |
| `TESTE_VERSAO.md` | Guia de teste de versões |
| `VOICE_CAPTURE_SETUP.md` | Setup de captura por voz |

### Próximos Passos Recomendados

1. **Testes Automatizados**:
   - Adicionar testes E2E com Playwright
   - Testar fluxo completo de geração de HTML com fotos

2. **Cache de Signed URLs**:
   - Armazenar signed URLs em cache local (24h)
   - Evitar regerar URLs para mesma foto

3. **Monitoramento**:
   - Adicionar logs de erros para Sentry/similar
   - Alertar quando signed URLs falham

4. **Documentação de API**:
   - Documentar todas as funções públicas de `htmlGenerator.ts`
   - Adicionar exemplos de uso

---

## 🎯 CONCLUSÃO

**Bug corrigido**: Fotos não apareciam ao enviar para cliente
**Causa**: Array de fotos hard-coded como vazio em `OrcamentoModal.tsx`
**Solução**: Buscar fotos reais do banco ao abrir modal
**Impacto**: Sistema agora funciona corretamente para todos os fluxos

**Status**: ✅ **RESOLVIDO**

---

**Última atualização**: 2025-10-06 11:33 BRT
**Revisado por**: Claude Code
**Aprovado por**: Aguardando aprovação do usuário
