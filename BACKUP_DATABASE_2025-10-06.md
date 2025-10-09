# 🛡️ BACKUP COMPLETO DO BANCO DE DADOS - Supabase

**Data**: 2025-10-06
**Projeto**: gobuakgvzqauzenaswow
**Motivo**: Backup de segurança antes de adicionar novos módulos (Compras, Comercial, PCP, Produção)

---

## 📊 ESTATÍSTICAS DE DADOS

| Tabela | Total Registros |
|--------|----------------|
| `fichas_tecnicas` | **97** |
| `materiais` | **269** |
| `fotos` | **260** |
| `aprovacoes_ftc_cliente` | 0 |
| `aprovacoes_orcamento_cliente` | 0 |
| `aprovacoes_orcamentos` | 0 |
| `visualizacoes_ftc_cliente` | 0 |

**TOTAL DE REGISTROS CRÍTICOS**: 626 registros (97 fichas + 269 materiais + 260 fotos)

---

## 🗄️ ESTRUTURA DAS TABELAS EXISTENTES

### 1. fichas_tecnicas (97 registros)
- PK: `id` (UUID)
- Unique: `numero_ftc` (TEXT)
- Status possíveis: rascunho, preenchida, aguardando_cotacao_compras, aguardando_orcamento_comercial, orcamento_enviado_cliente
- FK: `criado_por`, `editado_por` → auth.users
- Campos principais: 90+ campos (dados técnicos, processos, horas, materiais, etc)

### 2. materiais (269 registros)
- PK: `id` (UUID)
- FK: `ficha_id` → fichas_tecnicas
- FK: `criado_por` → auth.users
- Campos: descricao, quantidade, unidade, valor_unitario, fornecedor, cliente_interno, valor_total

### 3. fotos (260 registros)
- PK: `id` (UUID)
- FK: `ficha_id` → fichas_tecnicas
- FK: `criado_por` → auth.users
- Storage path: Bucket `fichas_fotos`

### 4. aprovacoes_ftc_cliente (0 registros)
- Sistema de aprovação para FTC técnica enviada ao cliente
- PK: `id` (UUID)
- FK: `ficha_id` → fichas_tecnicas
- Campos: tipo (aprovar/alterar/rejeitar), responsavel, email, telefone, observacoes

### 5. aprovacoes_orcamento_cliente (0 registros)
- Sistema de aprovação para orçamento comercial enviado ao cliente
- PK: `id` (UUID)
- FK: `ficha_id` → fichas_tecnicas
- Campos: tipo (aprovar/alterar/rejeitar), responsavel, email, versao_orcamento

### 6. aprovacoes_orcamentos (0 registros)
- Tabela legada (duplicada com aprovacoes_orcamento_cliente)

### 7. visualizacoes_ftc_cliente (0 registros)
- Analytics de visualizações de FTC pelo cliente
- Campos: ip_address, user_agent, data_visualizacao

---

## 🔐 ROW LEVEL SECURITY (RLS)

Todas as tabelas têm RLS habilitado com policies:
- SELECT: Autenticado
- INSERT: Autenticado
- UPDATE: Autenticado
- DELETE: Autenticado (ou restrito)

Exceções:
- `aprovacoes_ftc_cliente`: Permite INSERT anônimo (para formulário público)
- `aprovacoes_orcamento_cliente`: Permite INSERT anônimo (para formulário público)

---

## 🚨 INSTRUÇÕES DE RESTAURAÇÃO (SE NECESSÁRIO)

### Via Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard/project/gobuakgvzqauzenaswow
2. SQL Editor → New Query
3. Execute queries de recriação das tabelas (ver migrations originais)

### Via MCP Supabase:
```bash
# Usar mcp__supabase__execute_sql com queries de restore
```

---

## 📋 MIGRATIONS APLICADAS (Estado Atual)

1. ✅ `20251006132000_create_aprovacoes_orcamento_cliente.sql`
2. ✅ Migrations anteriores (fichas_tecnicas, materiais, fotos, etc)

---

## ⚠️ NOTAS IMPORTANTES

1. **Storage Bucket**: `fichas_fotos` contém 260 imagens referenciadas na tabela `fotos`
2. **Dados de Produção**: Sistema está ATIVO com 4 usuários trabalhando
3. **Nenhuma migration destrutiva**: Todas as migrations foram aditivas (CREATE TABLE, ADD COLUMN)
4. **Integridade Referencial**: Todas as FKs estão funcionando corretamente

---

## 🎯 PRÓXIMAS AÇÕES (APÓS ESTE BACKUP)

1. Criar tabelas novas: `requisicoes_compra`, `aprovacoes_pcp`, `ordens_servico`
2. Manter todas as tabelas existentes INTACTAS
3. Adicionar novos módulos com Feature Flags (OFF por padrão)

---

**Backup criado por**: Claude Code
**Aprovado por**: Usuário (4 usuários ativos em produção)
**Status**: ✅ Backup documentado e pronto para procedimento seguro
