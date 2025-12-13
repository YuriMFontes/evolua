# 📡 APIs Implementadas - Tempo Real

## ✅ Criptomoedas - CoinGecko API

### Funcionamento
- **API**: CoinGecko (gratuita, sem CORS, tempo real)
- **URL**: `https://api.coingecko.com/api/v3`
- **Status**: ✅ Funcionando perfeitamente

### Códigos Suportados
- `BITCOIN` ou `BTC` - Bitcoin
- `ETHEREUM` ou `ETH` - Ethereum
- `BNB` ou `BINANCE` - Binance Coin
- `SOLANA` ou `SOL` - Solana
- `CARDANO` ou `ADA` - Cardano
- `DOGECOIN` ou `DOGE` - Dogecoin
- E muitas outras...

### Dados Retornados
- ✅ Preço em BRL (tempo real)
- ✅ Variação 24h (%)
- ✅ Nome completo da moeda
- ✅ Data/hora da última atualização

### Como Usar
1. Selecione "Criptomoeda" no tipo de ativo
2. Digite o código (ex: `BITCOIN` ou `BTC`)
3. Clique em "Buscar cotação"
4. Dados são retornados automaticamente em tempo real

---

## ✅ Renda Fixa - Múltiplas APIs

### Fontes (em ordem de prioridade)

#### 1. Banco Central do Brasil (SELIC)
- **API**: Banco Central - Taxa SELIC
- **URL**: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1`
- **Status**: ✅ Funcionando (via proxy CORS)
- **Código**: `SELIC`

#### 2. Tesouro Direto
- **API**: Tesouro Nacional (pública)
- **Status**: ⚠️ Pode ter problemas de CORS
- **Códigos**: `SELIC`, `IPCA+`, `PREFIXADO`

#### 3. ANBIMA
- **API**: ANBIMA (oficial)
- **Status**: ⚠️ Pode requerer autenticação
- **Códigos**: Títulos públicos

#### 4. Brapi
- **API**: Brapi (API brasileira)
- **Status**: ⚠️ Endpoint de renda fixa pode não estar disponível
- **Códigos**: Títulos privados (CDB, LCI, LCA)

### Códigos Suportados
- `SELIC` - Tesouro Selic (via Banco Central)
- `IPCA+` - Tesouro IPCA+
- `PREFIXADO` - Tesouro Prefixado
- `CDB` - Certificado de Depósito Bancário
- `LCI` - Letra de Crédito Imobiliário
- `LCA` - Letra de Crédito do Agronegócio
- `DEBENTURE` - Debênture

### Dados Retornados
- ✅ Preço/Valor unitário
- ✅ Taxa de rentabilidade anual
- ✅ Rentabilidade mensal (calculada)
- ✅ Data de vencimento (quando disponível)
- ✅ Data/hora da última atualização

### Como Usar
1. Selecione "Renda Fixa" no tipo de ativo
2. Digite o código (ex: `SELIC`, `IPCA+`)
3. Clique em "Buscar cotação"
4. Sistema tenta múltiplas APIs automaticamente

---

## ⚠️ Observações Importantes

### Criptomoedas
- ✅ **100% funcional** - CoinGecko é confiável e gratuita
- ✅ Sem necessidade de token
- ✅ Sem problemas de CORS
- ✅ Dados em tempo real

### Renda Fixa
- ⚠️ **Pode ter problemas de CORS** - APIs públicas podem bloquear
- ⚠️ **SELIC funciona melhor** - Banco Central é mais confiável
- ⚠️ **Outros títulos** - Podem não ter APIs públicas disponíveis
- 💡 **Solução**: Se uma API falhar, o sistema tenta outras automaticamente

### Atualização Automática
- ✅ Ao clicar em "Atualizar Preços", busca todos os tipos
- ✅ Criptomoedas: CoinGecko
- ✅ Renda Fixa: Múltiplas APIs
- ✅ Ações/FIIs/BDRs: Yahoo Finance + Brapi

---

## 🔧 Configuração

### Não Precisa de Nada!
- ✅ Criptomoedas funcionam imediatamente
- ✅ Renda Fixa tenta múltiplas APIs automaticamente
- ✅ Sem necessidade de tokens ou configuração

### Opcional: Token Brapi
Se quiser melhorar a busca de renda fixa:
1. Obtenha token em: https://brapi.dev/
2. Adicione no `.env`:
   ```env
   REACT_APP_BRAPI_TOKEN=seu_token
   ```

---

## 📊 Status das APIs

| Tipo | API | Status | Confiabilidade |
|------|-----|--------|----------------|
| **Cripto** | CoinGecko | ✅ Funcionando | ⭐⭐⭐⭐⭐ |
| **Renda Fixa (SELIC)** | Banco Central | ✅ Funcionando | ⭐⭐⭐⭐ |
| **Renda Fixa (Outros)** | Tesouro/ANBIMA | ⚠️ Pode falhar | ⭐⭐⭐ |
| **Ações/FIIs/BDRs** | Yahoo + Brapi | ✅ Funcionando | ⭐⭐⭐⭐ |

---

## 🚀 Teste Agora

### Criptomoedas
1. Tipo: **Criptomoeda**
2. Ticker: **BITCOIN** ou **BTC**
3. Clique em "Buscar cotação"
4. ✅ Deve funcionar imediatamente!

### Renda Fixa
1. Tipo: **Renda Fixa**
2. Ticker: **SELIC**
3. Clique em "Buscar cotação"
4. ✅ Deve buscar via Banco Central!

---

## ❓ Problemas Comuns

### "Criptomoeda não encontrada"
- Verifique se o código está correto
- Use códigos como: BITCOIN, BTC, ETHEREUM, ETH

### "Título de renda fixa não encontrado"
- Para SELIC: Deve funcionar via Banco Central
- Para outros: Pode ser problema de CORS nas APIs
- Tente novamente mais tarde

### APIs retornando HTML
- Isso indica bloqueio de CORS
- O sistema tenta múltiplas APIs automaticamente
- Se todas falharem, mostra erro (sem valores manuais)

