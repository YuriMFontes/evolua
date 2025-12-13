# 🔧 Configuração da API de Cotações

## 📋 Situação Atual

A aplicação agora usa um **sistema híbrido** que tenta múltiplas APIs automaticamente:

1. **Yahoo Finance** (via proxy CORS) - Primeira tentativa
2. **Brapi** (API brasileira) - Fallback automático se Yahoo falhar

## ✅ Não Precisa de Token (Funciona Imediatamente)

A configuração atual **NÃO requer token** e funciona automaticamente. O sistema:

- ✅ Tenta Yahoo Finance primeiro
- ✅ Se falhar, usa Brapi automaticamente
- ✅ Funciona sem configuração adicional

## 🚀 Como Funciona

### Fluxo Automático

```
1. Usuário busca cotação (ex: PETR4)
   ↓
2. Sistema tenta Yahoo Finance
   ↓
3. Se Yahoo Finance falhar (CORS, erro, etc.)
   ↓
4. Sistema usa Brapi automaticamente
   ↓
5. Retorna o resultado
```

### Exemplo de Uso

```javascript
// No código, você apenas chama:
import { buscarPrecoAtual } from './lib/yahoo-finance'

const resultado = await buscarPrecoAtual('PETR4')
// O sistema escolhe automaticamente a melhor API
```

## ⚙️ Configurações Disponíveis

No arquivo `src/lib/yahoo-finance.js`, você pode ajustar:

```javascript
const USE_PROXY = true      // Usa proxy CORS (recomendado)
const USE_FALLBACK = true   // Usa Brapi se Yahoo falhar (recomendado)
```

### Opções

- **USE_PROXY = true**: Usa proxy CORS para evitar bloqueios (recomendado)
- **USE_PROXY = false**: Tenta acesso direto (pode falhar por CORS)

- **USE_FALLBACK = true**: Usa Brapi automaticamente se Yahoo falhar (recomendado)
- **USE_FALLBACK = false**: Apenas Yahoo Finance (pode falhar)

## 🔑 Opcional: Token Brapi (Melhor Performance)

Se você quiser melhorar a performance e confiabilidade, pode configurar um token do Brapi:

### 1. Obter Token Brapi (Gratuito)

1. Acesse: https://brapi.dev/
2. Crie uma conta gratuita
3. Obtenha seu token

### 2. Configurar Token

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_BRAPI_TOKEN=seu_token_aqui
```

### 3. Reiniciar Aplicação

```bash
npm start
```

## 🐛 Troubleshooting

### Problema: "Erro ao buscar preço"

**Solução:**
1. Verifique o console do navegador (F12)
2. Veja qual API está falhando
3. O sistema deve tentar automaticamente a outra API

### Problema: "CORS policy"

**Solução:**
- O sistema já usa proxy CORS automaticamente
- Se ainda falhar, o fallback para Brapi deve funcionar

### Problema: "Ticker não encontrado"

**Soluções:**
1. Verifique se o ticker está correto (ex: PETR4, ITUB4, HGLG11)
2. Alguns tickers podem não estar disponíveis
3. Tente buscar diretamente no site do Yahoo Finance ou Brapi

### Problema: Proxy CORS lento ou instável

**Solução:**
1. Configure um token Brapi (veja acima)
2. O sistema usará Brapi como principal
3. Ou desative o proxy: `USE_PROXY = false`

## 📊 Comparação das APIs

| Característica | Yahoo Finance | Brapi |
|----------------|---------------|------|
| **Gratuito** | ✅ Sim | ✅ Sim |
| **Token** | ❌ Não precisa | ⚠️ Opcional (melhor) |
| **CORS** | ⚠️ Precisa proxy | ✅ Funciona direto |
| **Dados** | 📊 Mais completo | 📊 Bom |
| **Confiabilidade** | ⚠️ Pode falhar | ✅ Mais estável |

## 🎯 Recomendação

Para melhor experiência:

1. **Configure token Brapi** (gratuito, rápido)
2. Mantenha `USE_FALLBACK = true`
3. O sistema usará Brapi como principal e Yahoo como backup

## 📝 Notas

- O sistema é **inteligente** e escolhe automaticamente a melhor API
- Você **não precisa fazer nada** - funciona imediatamente
- Token Brapi é **opcional** mas recomendado para melhor performance

## 🔄 Atualizações Futuras

Se quiser adicionar outras APIs:

1. Adicione a nova API no arquivo `yahoo-finance.js`
2. Configure como fallback adicional
3. O sistema tentará automaticamente

