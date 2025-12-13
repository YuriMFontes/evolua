/**
 * API de Criptomoedas - Tempo Real
 * Usa CoinGecko API (gratuita, confiável, sem CORS)
 * 
 * Suporta: Bitcoin, Ethereum, e todas as principais criptomoedas
 */

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

/**
 * Converte código brasileiro para ID da CoinGecko
 * @param {string} codigo - Código (ex: BITCOIN, BTC, ETHEREUM, ETH)
 * @returns {string} - ID da CoinGecko
 */
const converterCodigoParaID = (codigo) => {
    const codigoUpper = codigo.toUpperCase().trim()
    
    const mapeamento = {
        'BITCOIN': 'bitcoin',
        'BTC': 'bitcoin',
        'ETHEREUM': 'ethereum',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'BINANCE': 'binancecoin',
        'SOLANA': 'solana',
        'SOL': 'solana',
        'CARDANO': 'cardano',
        'ADA': 'cardano',
        'DOGECOIN': 'dogecoin',
        'DOGE': 'dogecoin',
        'POLKADOT': 'polkadot',
        'DOT': 'polkadot',
        'AVALANCHE': 'avalanche-2',
        'AVAX': 'avalanche-2',
        'POLYGON': 'matic-network',
        'MATIC': 'matic-network',
        'LITECOIN': 'litecoin',
        'LTC': 'litecoin',
        'CHAINLINK': 'chainlink',
        'LINK': 'chainlink',
        'UNISWAP': 'uniswap',
        'UNI': 'uniswap'
    }
    
    return mapeamento[codigoUpper] || codigoUpper.toLowerCase()
}

/**
 * Busca preço atual de uma criptomoeda
 * @param {string} codigo - Código da cripto (ex: BITCOIN, BTC, ETHEREUM)
 * @returns {Promise<{preco: number, variacao: number, sucesso: boolean}>}
 */
export const buscarPrecoCripto = async (codigo) => {
    try {
        const codigoOriginal = codigo.trim().toUpperCase()
        const coinId = converterCodigoParaID(codigoOriginal)
        
        console.log(`[Cripto] Buscando preço para ${codigoOriginal} (${coinId})`)
        
        // CoinGecko API - gratuita, sem CORS, tempo real
        const url = `${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=brl&include_24hr_change=true&include_last_updated_at=true`
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`Erro na API CoinGecko: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Verifica se a moeda foi encontrada
        if (!data[coinId]) {
            throw new Error(`Criptomoeda "${codigoOriginal}" não encontrada`)
        }
        
        const moeda = data[coinId]
        const preco = parseFloat(moeda.brl || 0)
        const variacao = parseFloat(moeda.brl_24h_change || 0)
        const ultimaAtualizacao = moeda.last_updated_at ? new Date(moeda.last_updated_at * 1000).toISOString() : new Date().toISOString()
        
        if (preco <= 0) {
            throw new Error('Preço inválido retornado pela API')
        }
        
        // Busca nome completo da moeda
        const nomeCompleto = await buscarNomeCripto(coinId)
        
        console.log(`[Cripto] ✅ Preço encontrado: ${codigoOriginal} = R$ ${preco.toFixed(2)}`)
        
        return {
            sucesso: true,
            preco: preco,
            variacao: variacao,
            nome: nomeCompleto || codigoOriginal,
            simbolo: codigoOriginal,
            atualizadoEm: ultimaAtualizacao,
            moeda: 'BRL',
            fonte: 'CoinGecko'
        }
        
    } catch (error) {
        console.error(`[Cripto] Erro ao buscar preço de ${codigo}:`, error)
        return {
            sucesso: false,
            preco: 0,
            variacao: 0,
            erro: error.message || "Erro ao buscar preço da criptomoeda"
        }
    }
}

/**
 * Busca nome completo da criptomoeda
 * @param {string} coinId - ID da CoinGecko
 * @returns {Promise<string>} - Nome completo
 */
const buscarNomeCripto = async (coinId) => {
    try {
        const url = `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (response.ok) {
            const data = await response.json()
            return data.name || null
        }
    } catch (error) {
        // Ignora erro, retorna null
    }
    return null
}

/**
 * Busca preços de múltiplas criptomoedas
 * @param {string[]} codigos - Array de códigos
 * @returns {Promise<Object>} - Objeto com preços
 */
export const buscarPrecosCriptoMultiplos = async (codigos) => {
    try {
        const codigosLimpos = codigos.map(c => c.trim().toUpperCase()).filter(c => c)
        if (codigosLimpos.length === 0) return {}
        
        // Converte todos os códigos para IDs da CoinGecko
        const coinIds = codigosLimpos.map(c => converterCodigoParaID(c))
        const idsString = coinIds.join(',')
        
        const url = `${COINGECKO_BASE_URL}/simple/price?ids=${idsString}&vs_currencies=brl&include_24hr_change=true`
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`)
        }
        
        const data = await response.json()
        const precos = {}
        
        // Mapeia de volta para os códigos originais
        codigosLimpos.forEach((codigo, index) => {
            const coinId = coinIds[index]
            const moeda = data[coinId]
            
            if (moeda && moeda.brl) {
                precos[codigo] = {
                    preco: parseFloat(moeda.brl),
                    variacao: parseFloat(moeda.brl_24h_change || 0),
                    nome: codigo,
                    atualizadoEm: new Date().toISOString()
                }
            }
        })
        
        return precos
    } catch (error) {
        console.error("[Cripto] Erro ao buscar preços múltiplos:", error)
        return {}
    }
}

