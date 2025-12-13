# Integração com Yahoo Finance API

## 📋 Sobre a API

A aplicação agora utiliza a **Yahoo Finance API v8** (não oficial, mas gratuita) para buscar cotações de ativos brasileiros.

### ✅ Vantagens da API do Yahoo Finance

- **Gratuita** - Não requer autenticação ou token
- **Mais completa** - Fornece mais dados (volume, abertura, máximo, mínimo, etc.)
- **Atualizada** - Cotações em tempo real
- **Suporta múltiplos tipos de ativos** - Ações, FIIs, BDRs, ETFs

## 🔧 Como Funciona

### Formato de Tickers

A API do Yahoo Finance requer que os tickers brasileiros tenham o sufixo `.SA`:

- **Ações**: `PETR4.SA`, `ITUB4.SA`, `VALE3.SA`
- **FIIs**: `HGLG11.SA`, `MXRF11.SA`, `VGHF11.SA`
- **BDRs**: `AAPL34.SA`, `ROXO34.SA`
- **ETFs**: `BOVA11.SA`, `SMAL11.SA`

O código **converte automaticamente** os tickers para o formato correto. Você pode digitar `PETR4` e o sistema automaticamente busca `PETR4.SA`.

## 📡 Endpoint Utilizado

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}.SA
```

### Parâmetros

- `interval`: `1d` (1 dia)
- `range`: `1d` (último dia)
- `includePrePost`: `false`
- `events`: `div,splits`

## 🚀 Uso no Código

### Buscar Preço de um Ticker

```javascript
import { buscarPrecoAtual } from './lib/yahoo-finance'

const resultado = await buscarPrecoAtual('PETR4')

if (resultado.sucesso) {
    console.log('Preço:', resultado.preco)
    console.log('Variação:', resultado.variacao)
    console.log('Nome:', resultado.nome)
    console.log('Volume:', resultado.volume)
    console.log('Abertura:', resultado.abertura)
    console.log('Máximo:', resultado.maximo)
    console.log('Mínimo:', resultado.minimo)
} else {
    console.error('Erro:', resultado.erro)
}
```

### Buscar Múltiplos Preços

```javascript
import { buscarPrecosMultiplos } from './lib/yahoo-finance'

const tickers = ['PETR4', 'ITUB4', 'HGLG11']
const precos = await buscarPrecosMultiplos(tickers)

// Resultado:
// {
//   'PETR4': { preco: 25.50, variacao: 1.2, nome: 'Petróleo Brasileiro S.A. - Petrobras' },
//   'ITUB4': { preco: 22.30, variacao: -0.5, nome: 'Itaú Unibanco Holding S.A.' },
//   'HGLG11': { preco: 145.20, variacao: 0.8, nome: 'CSHG Logística FII' }
// }
```

## 📊 Dados Retornados

A API retorna os seguintes dados para cada ativo:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `preco` | number | Preço atual do ativo |
| `variacao` | number | Variação percentual do dia |
| `nome` | string | Nome completo da empresa/fundo |
| `volume` | number | Volume negociado |
| `abertura` | number | Preço de abertura |
| `maximo` | number | Maior preço do dia |
| `minimo` | number | Menor preço do dia |
| `moeda` | string | Moeda (geralmente 'BRL') |
| `exchange` | string | Bolsa (geralmente 'B3') |
| `atualizadoEm` | string | Data/hora da última atualização (ISO) |

## ⚠️ Limitações e Considerações

### Rate Limiting

A API do Yahoo Finance pode ter limitações de taxa de requisições. O código atual:

- Faz requisições sequenciais para múltiplos tickers (não paralelas)
- Usa `Promise.allSettled` para não falhar se uma requisição falhar
- Inclui tratamento de erros robusto

### CORS (Cross-Origin Resource Sharing)

Se você encontrar erros de CORS em produção, pode ser necessário:

1. **Usar um proxy** (recomendado para produção)
2. **Configurar CORS no servidor** (se você tiver controle)
3. **Usar uma API alternativa** (como RapidAPI Yahoo Finance - paga)

### Exemplo de Proxy (se necessário)

Se precisar usar um proxy, você pode modificar a URL base:

```javascript
// No arquivo yahoo-finance.js
const YAHOO_BASE_URL = "https://seu-proxy.com/api/yahoo-finance/v8/finance/chart"
```

## 🔄 Migração da API Anterior

A migração foi feita de forma transparente:

- ✅ Mesma interface de funções (`buscarPrecoAtual`, `buscarPrecosMultiplos`)
- ✅ Mesmo formato de retorno
- ✅ Compatível com o código existente
- ✅ Não requer mudanças no código que usa a API

## 🧪 Testando

Para testar se a API está funcionando:

```javascript
// No console do navegador ou em um componente React
import { buscarPrecoAtual } from './lib/yahoo-finance'

buscarPrecoAtual('PETR4').then(resultado => {
    console.log('Resultado:', resultado)
})
```

## 📝 Notas Importantes

1. **Não oficial**: Esta é uma API não oficial do Yahoo Finance. Pode mudar sem aviso.

2. **Sem garantias**: O Yahoo pode bloquear ou limitar o acesso a qualquer momento.

3. **Alternativas**: Se a API parar de funcionar, considere:
   - RapidAPI Yahoo Finance (paga, mas oficial)
   - Alpha Vantage (paga)
   - Brapi (API brasileira, requer token)

4. **User-Agent**: O código inclui um User-Agent para evitar bloqueios básicos.

## 🆘 Troubleshooting

### Erro: "Ticker não encontrado"

- Verifique se o ticker está correto
- Alguns tickers podem não estar disponíveis no Yahoo Finance
- Tente buscar diretamente no site do Yahoo Finance

### Erro: "CORS policy"

- Isso geralmente acontece apenas em desenvolvimento
- Em produção, use um proxy ou configure CORS adequadamente

### Erro: "Rate limit exceeded"

- Aguarde alguns segundos antes de fazer novas requisições
- Considere implementar um cache local
- Reduza a frequência de atualizações automáticas

## 📚 Referências

- [Yahoo Finance](https://finance.yahoo.com/)
- [Yahoo Finance API Documentation (não oficial)](https://www.yahoofinanceapi.com/)

