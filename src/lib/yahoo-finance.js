/**
 * Yahoo Finance API v8 com fallback para Brapi
 * Tenta Yahoo Finance primeiro, se falhar usa Brapi (API brasileira)
 * 
 * Formato de símbolos:
 * - Ações brasileiras: PETR4.SA, ITUB4.SA
 * - FIIs: HGLG11.SA, MXRF11.SA
 * - BDRs: AAPL34.SA, ROXO34.SA
 * - ETFs: BOVA11.SA
 */

// Importa Brapi como fallback
import { buscarPrecoAtual as buscarPrecoBrapi, buscarPrecosMultiplos as buscarPrecosBrapi } from './brapi'

// Proxy CORS público (gratuito) - pode ser instável
const CORS_PROXY = "https://api.allorigins.win/raw?url="
const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart"

// Configuração
const USE_PROXY = true // Usa proxy CORS para evitar bloqueios
const USE_FALLBACK = true // Se Yahoo falhar, usa Brapi automaticamente

/**
 * Converte ticker brasileiro para formato Yahoo Finance
 * @param {string} ticker - Ticker brasileiro (ex: PETR4, HGLG11, AAPL34)
 * @returns {string} - Ticker no formato Yahoo (ex: PETR4.SA)
 */
const formatarTickerYahoo = (ticker) => {
    const tickerLimpo = ticker.trim().toUpperCase()
    
    // Se já tem .SA, retorna como está
    if (tickerLimpo.includes('.')) {
        return tickerLimpo
    }
    
    // Adiciona .SA para mercado brasileiro
    return `${tickerLimpo}.SA`
}

/**
 * Extrai dados relevantes da resposta do Yahoo Finance
 * @param {Object} chartResult - Resultado da API do Yahoo
 * @returns {Object|null} - Dados formatados ou null se inválido
 */
const processarRespostaYahoo = (chartResult, tickerOriginal) => {
    try {
        if (!chartResult || !chartResult.result || !chartResult.result[0]) {
            return null
        }

        const resultado = chartResult.result[0]
        const meta = resultado.meta || {}
        const indicadores = resultado.indicators || {}
        const quote = indicadores.quote || []
        
        if (!quote[0] || !quote[0].close) {
            return null
        }

        const precos = quote[0].close
        const volumes = quote[0].volume || []
        const aberturas = quote[0].open || []
        const maximos = quote[0].high || []
        const minimos = quote[0].low || []
        
        // Pega o último preço válido (não nulo)
        let precoAtual = null
        let indiceAtual = precos.length - 1
        
        while (indiceAtual >= 0 && (precos[indiceAtual] === null || precos[indiceAtual] === undefined)) {
            indiceAtual--
        }
        
        if (indiceAtual < 0) {
            return null
        }
        
        precoAtual = precos[indiceAtual]
        
        // Calcula variação percentual (preço atual vs preço anterior)
        let variacao = 0
        if (indiceAtual > 0) {
            const precoAnterior = precos[indiceAtual - 1]
            if (precoAnterior && precoAnterior > 0) {
                variacao = ((precoAtual - precoAnterior) / precoAnterior) * 100
            }
        }
        
        // Se tem regularMarketPrice na meta, usa ele (mais confiável)
        if (meta.regularMarketPrice && meta.regularMarketPrice > 0) {
            precoAtual = meta.regularMarketPrice
        }
        
        // Variação da meta se disponível
        if (meta.regularMarketChangePercent !== undefined) {
            variacao = meta.regularMarketChangePercent * 100 // Yahoo retorna em decimal
        }

        return {
            preco: parseFloat(precoAtual.toFixed(2)),
            variacao: parseFloat(variacao.toFixed(2)),
            nome: meta.longName || meta.shortName || meta.symbol || tickerOriginal,
            simbolo: meta.symbol || tickerOriginal,
            volume: volumes[indiceAtual] || 0,
            abertura: aberturas[indiceAtual] || precoAtual,
            maximo: maximos[indiceAtual] || precoAtual,
            minimo: minimos[indiceAtual] || precoAtual,
            atualizadoEm: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
            moeda: meta.currency || 'BRL',
            exchange: meta.exchangeName || 'B3'
        }
    } catch (error) {
        console.error('[Yahoo Finance] Erro ao processar resposta:', error)
        return null
    }
}

/**
 * Busca o preço atual de um ticker
 * @param {string} ticker - Ticker do ativo (ex: PETR4, ITUB4, HGLG11)
 * @returns {Promise<{preco: number, variacao: number, sucesso: boolean, erro?: string}>}
 */
export const buscarPrecoAtual = async (ticker) => {
    const tickerOriginal = ticker.trim().toUpperCase()
    
    // Tenta Yahoo Finance primeiro
    try {
        const tickerYahoo = formatarTickerYahoo(tickerOriginal)
        
        console.log(`[Yahoo Finance] Buscando preço para ${tickerOriginal} (${tickerYahoo})`)
        
        // Parâmetros da API
        const params = new URLSearchParams({
            interval: '1d',
            range: '1d',
            includePrePost: 'false',
            events: 'div,splits'
        })
        
        // Monta a URL com proxy CORS se necessário
        let url = `${YAHOO_BASE_URL}/${encodeURIComponent(tickerYahoo)}?${params.toString()}`
        
        if (USE_PROXY) {
            url = `${CORS_PROXY}${encodeURIComponent(url)}`
        }
        
        console.log(`[Yahoo Finance] Tentando URL: ${USE_PROXY ? 'via proxy' : 'diretamente'}`)
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Verifica se a resposta do proxy contém JSON válido
        let jsonData = data
        if (typeof data === 'string') {
            try {
                jsonData = JSON.parse(data)
            } catch (e) {
                throw new Error('Resposta inválida do proxy')
            }
        }
        
        console.log(`[Yahoo Finance] Resposta recebida para ${tickerYahoo}`)
        
        const resultado = processarRespostaYahoo(jsonData, tickerOriginal)
        
        if (resultado && resultado.preco > 0) {
            console.log(`[Yahoo Finance] ✅ Preço encontrado para ${tickerOriginal}: R$ ${resultado.preco}`)
            return {
                sucesso: true,
                preco: resultado.preco,
                variacao: resultado.variacao,
                nome: resultado.nome,
                atualizadoEm: resultado.atualizadoEm,
                volume: resultado.volume,
                abertura: resultado.abertura,
                maximo: resultado.maximo,
                minimo: resultado.minimo,
                moeda: resultado.moeda,
                exchange: resultado.exchange
            }
        } else {
            throw new Error('Preço inválido na resposta')
        }
    } catch (error) {
        console.warn(`[Yahoo Finance] ❌ Erro ao buscar preço via Yahoo Finance:`, error.message)
        
        // Fallback para Brapi se configurado
        if (USE_FALLBACK) {
            console.log(`[Brapi] Tentando buscar via Brapi como fallback...`)
            try {
                const resultadoBrapi = await buscarPrecoBrapi(tickerOriginal)
                if (resultadoBrapi.sucesso) {
                    console.log(`[Brapi] ✅ Preço encontrado via Brapi: R$ ${resultadoBrapi.preco}`)
                    return resultadoBrapi
                }
            } catch (brapiError) {
                console.error(`[Brapi] Erro no fallback:`, brapiError)
            }
        }
        
        return {
            sucesso: false,
            preco: 0,
            variacao: 0,
            erro: `Erro ao buscar preço: ${error.message || "Tente novamente mais tarde"}`
        }
    }
}

/**
 * Busca preços de múltiplos tickers de uma vez
 * @param {string[]} tickers - Array de tickers
 * @returns {Promise<Object>} - Objeto com ticker como chave e {preco, variacao, nome} como valor
 */
export const buscarPrecosMultiplos = async (tickers) => {
    try {
        const tickersLimpos = tickers.map(t => t.trim().toUpperCase()).filter(t => t)
        if (tickersLimpos.length === 0) return {}
        
        console.log(`[Yahoo Finance] Buscando preços para:`, tickersLimpos)
        
        // Tenta buscar via Brapi primeiro (mais confiável para múltiplos)
        if (USE_FALLBACK) {
            try {
                const resultadoBrapi = await buscarPrecosBrapi(tickersLimpos)
                if (Object.keys(resultadoBrapi).length > 0) {
                    console.log(`[Brapi] ✅ Preços encontrados via Brapi:`, Object.keys(resultadoBrapi).length)
                    return resultadoBrapi
                }
            } catch (brapiError) {
                console.warn(`[Brapi] Erro ao buscar múltiplos, tentando Yahoo Finance...`)
            }
        }
        
        // Se Brapi falhar ou não estiver configurado, usa Yahoo Finance
        const precos = {}
        const promessas = tickersLimpos.map(async (ticker) => {
            try {
                const resultado = await buscarPrecoAtual(ticker)
                if (resultado.sucesso) {
                    precos[ticker] = {
                        preco: resultado.preco,
                        variacao: resultado.variacao,
                        nome: resultado.nome,
                        atualizadoEm: resultado.atualizadoEm,
                        volume: resultado.volume,
                        abertura: resultado.abertura,
                        maximo: resultado.maximo,
                        minimo: resultado.minimo
                    }
                }
            } catch (error) {
                console.error(`[Yahoo Finance] Erro ao buscar ${ticker}:`, error)
            }
        })
        
        // Aguarda todas as requisições
        await Promise.allSettled(promessas)
        
        console.log(`[Yahoo Finance] Preços encontrados:`, Object.keys(precos).length)
        return precos
    } catch (error) {
        console.error("[Yahoo Finance] Erro ao buscar preços múltiplos:", error)
        return {}
    }
}

/**
 * Busca informações detalhadas de um ativo
 * @param {string} ticker - Ticker do ativo
 * @returns {Promise<Object>} - Informações detalhadas do ativo
 */
export const buscarInfoDetalhada = async (ticker) => {
    try {
        const resultado = await buscarPrecoAtual(ticker)
        if (resultado.sucesso) {
            return {
                ...resultado,
                sucesso: true
            }
        }
        return {
            sucesso: false,
            erro: resultado.erro || "Não foi possível obter informações"
        }
    } catch (error) {
        console.error(`[Yahoo Finance] Erro ao buscar informações de ${ticker}:`, error)
        return {
            sucesso: false,
            erro: error.message || "Erro ao buscar informações"
        }
    }
}

