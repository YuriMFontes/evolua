
const BRAPI_BASE_URL = "https://brapi.dev/api"
const BRAPI_TOKEN = process.env.REACT_APP_BRAPI_TOKEN || ""
let tokenWarned = false

const buildQuoteUrl = (symbol, params = {}) => {
    const searchParams = new URLSearchParams(params)

    if (BRAPI_TOKEN) {
        searchParams.set("token", BRAPI_TOKEN)
    } else if (!tokenWarned) {
        console.warn("[Brapi] Token não configurado. Defina REACT_APP_BRAPI_TOKEN em um arquivo .env na raiz.")
        tokenWarned = true
    }

    const queryString = searchParams.toString()
    return `${BRAPI_BASE_URL}/quote/${symbol}${queryString ? `?${queryString}` : ""}`
}

const extrairDataAtualizacao = (resultado) => {
    if (!resultado) return new Date().toISOString()

    const { regularMarketTime, updatedAt } = resultado

    if (regularMarketTime !== undefined && regularMarketTime !== null) {
        const valorNumerico = Number(regularMarketTime)
        if (!Number.isNaN(valorNumerico) && valorNumerico !== 0) {
            const epochMs = valorNumerico > 1_000_000_000_000 ? valorNumerico : valorNumerico * 1000
            const data = new Date(epochMs)
            if (!Number.isNaN(data.getTime())) {
                return data.toISOString()
            }
        }
    }

    if (updatedAt) {
        const data = new Date(updatedAt)
        if (!Number.isNaN(data.getTime())) {
            return data.toISOString()
        }
    }

    return new Date().toISOString()
}

/**
 * Busca o preço atual de um ticker
 * @param {string} ticker - Ticker do ativo (ex: PETR4, ITUB4, HGLG11)
 * @returns {Promise<{preco: number, variacao: number, sucesso: boolean}>}
 */
export const buscarPrecoAtual = async (ticker) => {
    try {
        // Remove espaços e converte para maiúsculo
        const tickerLimpo = ticker.trim().toUpperCase()
        
        // Para FIIs, adiciona sufixo se necessário
        let tickerFormatado = tickerLimpo
        if (tickerLimpo.length <= 4 && !tickerLimpo.includes('11')) {
            // Pode ser ação ou FII, tenta primeiro como está
        }
        
        const response = await fetch(buildQuoteUrl(tickerFormatado), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`)
        }

        const data = await response.json()
        
        console.log(`[Brapi] Resposta para ${tickerFormatado}:`, data)
        
        if (data.results && data.results.length > 0) {
            const resultado = data.results[0]
            const preco = parseFloat(resultado.regularMarketPrice || resultado.price || resultado.close || 0)
            const variacao = parseFloat(resultado.regularMarketChangePercent || resultado.changePercent || 0)
            
            if (preco > 0) {
                console.log(`[Brapi] Preço encontrado para ${tickerFormatado}: R$ ${preco}`)
                return {
                    sucesso: true,
                    preco: preco,
                    variacao: variacao,
                    nome: resultado.longName || resultado.shortName || resultado.name || tickerFormatado,
                    atualizadoEm: extrairDataAtualizacao(resultado)
                }
            } else {
                console.warn(`[Brapi] Preço inválido para ${tickerFormatado}:`, resultado)
            }
        } else {
            console.warn(`[Brapi] Nenhum resultado encontrado para ${tickerFormatado}`)
        }
        
        return {
            sucesso: false,
            preco: 0,
            variacao: 0,
            erro: "Ticker não encontrado"
        }
    } catch (error) {
        console.error(`Erro ao buscar preço de ${ticker}:`, error)
        return {
            sucesso: false,
            preco: 0,
            variacao: 0,
            erro: error.message || "Erro ao buscar preço"
        }
    }
}

/**
 * Busca preços de múltiplos tickers de uma vez
 * @param {string[]} tickers - Array de tickers
 * @returns {Promise<Object>} - Objeto com ticker como chave e preço como valor
 */
export const buscarPrecosMultiplos = async (tickers) => {
    try {
        const tickersLimpos = tickers.map(t => t.trim().toUpperCase()).filter(t => t)
        if (tickersLimpos.length === 0) return {}
        
        const tickersString = tickersLimpos.join(',')
        const response = await fetch(buildQuoteUrl(tickersString), {
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
        
        console.log(`[Brapi] Buscando preços para:`, tickersLimpos)
        console.log(`[Brapi] Resposta da API:`, data)
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(resultado => {
                const ticker = resultado.symbol || resultado.ticker || resultado.stock
                if (ticker) {
                    const preco = parseFloat(resultado.regularMarketPrice || resultado.price || resultado.close || 0)
                    const variacao = parseFloat(resultado.regularMarketChangePercent || resultado.changePercent || 0)
                    
                    if (preco > 0) {
                        precos[ticker.toUpperCase()] = {
                            preco: preco,
                            variacao: variacao,
                            nome: resultado.longName || resultado.shortName || resultado.name || ticker,
                            atualizadoEm: extrairDataAtualizacao(resultado)
                        }
                        console.log(`[Brapi] Preço atualizado para ${ticker}: R$ ${preco}`)
                    } else {
                        console.warn(`[Brapi] Preço inválido para ${ticker}:`, resultado)
                    }
                }
            })
        } else {
            console.warn(`[Brapi] Nenhum resultado encontrado para os tickers:`, tickersLimpos)
        }
        
        console.log(`[Brapi] Preços encontrados:`, precos)
        return precos
    } catch (error) {
        console.error("Erro ao buscar preços múltiplos:", error)
        return {}
    }
}

