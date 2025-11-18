# 🔧 Configuração da API de Cotações (Brapi)

## ✅ O que foi implementado:

1. **Integração com API Brapi** (gratuita, sem necessidade de chave)
2. **Atualização automática** de preços ao carregar a página
3. **Botão manual** para atualizar preços
4. **Cálculo automático** de lucro/prejuízo baseado em preços reais

## 🚀 Como funciona:

### 1. Ao cadastrar um investimento:
- Você informa o **ticker** (ex: PETR4, ITUB4, HGLG11)
- O sistema **busca automaticamente** o preço atual da API
- Salva o preço de compra (`preco_medio`) e o preço atual (`preco_atual`)

### 2. Atualização automática:
- Ao abrir a página de investimentos, os preços são atualizados automaticamente
- No dashboard, os preços são atualizados a cada 5 minutos

### 3. Botão "Atualizar Preços":
- Clique no botão "🔄 Atualizar Preços" para atualizar manualmente
- Útil quando quiser ver os preços mais recentes

## 🔍 Como verificar se está funcionando:

### 1. Abra o Console do Navegador:
- **Chrome/Edge**: F12 → Aba "Console"
- **Firefox**: F12 → Aba "Console"
- **Safari**: Cmd+Option+I → Console

### 2. Procure por logs:
Você deve ver mensagens como:
```
[Brapi] Buscando preços para: ["PETR4", "ITUB4"]
[Brapi] Resposta da API: {...}
[Brapi] Preço atualizado para PETR4: R$ 32.88
[Investimentos] Preço de PETR4 atualizado com sucesso
```

### 3. Verifique erros:
Se houver erros, você verá:
- `[Brapi] Erro ao buscar preço de...`
- `[Investimentos] Erro ao atualizar preço...`

## ⚠️ Problemas comuns e soluções:

### Problema 1: "Nenhum preço foi encontrado na API"
**Causa**: Ticker pode estar incorreto ou não existe na Brapi
**Solução**: 
- Verifique se o ticker está correto (ex: PETR4, não PETR)
- Tickers brasileiros funcionam melhor (PETR4, ITUB4, VALE3, etc)
- FIIs: HGLG11, XPLG11, etc

### Problema 2: "Erro na API: 429"
**Causa**: Muitas requisições (rate limit)
**Solução**: 
- Aguarde alguns minutos
- Use o botão manual em vez de atualização automática

### Problema 3: "CORS error" ou "Network error"
**Causa**: Problema de conexão ou CORS
**Solução**:
- Verifique sua conexão com internet
- A API Brapi permite CORS, mas pode haver problemas temporários

### Problema 4: Preços não atualizam no banco
**Causa**: Problema com Supabase ou permissões
**Solução**:
- Verifique se as políticas RLS estão corretas
- Verifique o console para erros específicos do Supabase

## 📝 Tickers suportados:

A API Brapi suporta:
- ✅ **Ações**: PETR4, ITUB4, VALE3, BBDC4, etc
- ✅ **FIIs**: HGLG11, XPLG11, HGRU11, etc
- ✅ **ETFs**: BOVA11, SMAL11, etc
- ✅ **BDRs**: Alguns BDRs também funcionam

## 🧪 Teste manual:

Para testar se a API está funcionando, abra o console e execute:

```javascript
// Teste simples
fetch('https://brapi.dev/api/quote/PETR4')
  .then(r => r.json())
  .then(data => console.log('Preço PETR4:', data.results[0].regularMarketPrice))
```

Se funcionar, você verá o preço atual da PETR4.

## 🔄 Atualização automática:

- **Página de Investimentos**: Atualiza ao carregar a página
- **Dashboard**: Atualiza a cada 5 minutos (apenas quando há investimentos)
- **Botão Manual**: Sempre disponível para atualização imediata

## 💡 Dicas:

1. **Primeira vez**: Cadastre um investimento com um ticker conhecido (ex: PETR4) para testar
2. **Verifique o console**: Os logs mostram exatamente o que está acontecendo
3. **Tickers corretos**: Use o formato correto (PETR4, não PETROBRAS)
4. **Paciência**: A primeira atualização pode demorar alguns segundos

---

**Pronto!** Agora você pode acompanhar a variação real dos seus investimentos! 📈

