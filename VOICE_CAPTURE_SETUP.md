# 🎙️ Sistema de Captura por Voz - FTC

## ✅ Componentes Implementados

### 1. Edge Functions Supabase
- **ftc-rascunho**: Cria nova ficha rascunho e retorna ID
- **ftc-import**: Recebe dados da transcrição e preenche a ficha

### 2. React Component
- **BotaoVoz**: Botão "🎙️ Gravar FTC por Voz" na página /nova-ficha
- Integrado automaticamente no topo da página

### 3. iOS Shortcuts Integration
- URL Scheme: `shortcuts://x-callback-url/run-shortcut?name=FTC%20Gravar`
- Retorno automático para: `/nova-ficha/{uuid}`

---

## 📱 Configuração do Atalho iOS "FTC Gravar"

### Fluxo do Shortcut:
1. **Receber Input** → JSON com `{ ftc_id, user, timestamp }`
2. **Gravar Áudio** → Usar ação "Record Audio"
3. **Transcrever** → Usar ação "Get Text from Input" (Speech-to-Text)
4. **Processar Transcrição** → Extrair campos usando AI/parsing
5. **Chamar API** → POST para Edge Function ftc-import
6. **Retornar ao App** → Abrir URL de sucesso

### Exemplo de Payload para ftc-import:
```json
{
  "ftc_id": "2025007",
  "cliente": "Santos Brasil",
  "nome_peca": "Eixo principal do guincho",
  "quantidade": "1",
  "servico": "Torneamento IT7 + recuperação",
  "tipo_execucao": "HMC",
  "visita_tecnica": "SIM",
  "transporte": "HMC",
  "pintura": "NAO",
  "galvanizacao": "SIM",
  "peso_peca_galv": "8.4",
  "tratamento_termico": "NAO",
  "data_entrega": "2025-09-20",
  "observacoes": "Fotos antes/durante/depois",
  "materiais": [
    {
      "descricao": "SAE 1045 Ø120",
      "quantidade": "1",
      "unidade": "UN",
      "valor_unitario": 1200,
      "fornecedor": "AçoSul",
      "cliente_interno": "Comercial",
      "valor_total": 1200
    }
  ],
  "torno_grande": 3.0,
  "macarico_solda": 1.0,
  "programacao_cam": 0.5
}
```

---

## 🔗 URLs dos Endpoints

### Edge Functions:
- **ftc-rascunho**: `https://gobuakgvzqauzenaswow.supabase.co/functions/v1/ftc-rascunho`
- **ftc-import**: `https://gobuakgvzqauzenaswow.supabase.co/functions/v1/ftc-import`

### App URLs:
- **Nova Ficha**: `https://[your-domain]/nova-ficha/{uuid}`

---

## 🗺️ Mapeamento Voz → Campos

### Processos (colunas numéricas):
- `torno_grande`, `torno_pequeno`, `cnc_tf`, `fresa_furad`
- `plasma_oxicorte`, `dobra`, `calandra`, `macarico_solda`
- `des_montg`, `balanceamento`, `mandrilhamento`, `tratamento`
- `pintura_horas`, `lavagem_acab`, `programacao_cam`, `eng_tec`

### Campos Boolean (string "SIM"/"NAO"):
- `visita_tecnica`, `pintura`, `galvanizacao`, `tratamento_termico`
- `ensaio_lp`, `solda`, `usinagem`

### Campos Condicionais:
- `cor_pintura` (se pintura = "SIM")
- `peso_peca_galv` (se galvanizacao = "SIM")
- `tempera_reven` (se tratamento_termico = "SIM")

---

## 🎯 Fluxo Completo de Uso

1. **Usuário clica** → "🎙️ Gravar FTC por Voz"
2. **Sistema cria** → Rascunho FTC no banco
3. **App abre** → Atalho iOS "FTC Gravar"
4. **Usuário grava** → Voz com dados da ficha
5. **iOS transcreve** → Áudio para texto
6. **Atalho processa** → Extrai campos da transcrição
7. **API recebe** → Dados estruturados via ftc-import
8. **App retorna** → Para /nova-ficha/{id} preenchida
9. **Usuário revisa** → Adiciona fotos, gera PDF

---

## ✅ Status de Implementação

- ✅ Edge Functions criadas e configuradas
- ✅ Botão de voz adicionado à interface
- ✅ Integração iOS Shortcuts preparada
- ✅ Mapeamento de campos documentado
- ✅ URLs e endpoints configurados
- ⏳ **Próximo passo**: Criar Atalho iOS "FTC Gravar"

---

## 🚀 Testes

### Teste Manual:
1. Acesse `/nova-ficha`
2. Clique em "🎙️ Gravar FTC por Voz"
3. Verifique se abre o iOS Shortcuts
4. Grave uma transcrição de teste
5. Confirme se retorna para a ficha preenchida

### Teste da API:
```bash
# Criar rascunho
curl -X POST https://gobuakgvzqauzenaswow.supabase.co/functions/v1/ftc-rascunho

# Importar dados
curl -X POST https://gobuakgvzqauzenaswow.supabase.co/functions/v1/ftc-import \
  -H "Content-Type: application/json" \
  -d '{"ftc_id":"2025007","cliente":"Teste","nome_peca":"Peça Teste"}'
```