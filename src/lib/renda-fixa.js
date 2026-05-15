/**
 * API de Renda Fixa Brasileira - Tempo Real
 * Suporta: Tesouro Selic, IPCA+, Prefixado, CDB, LCI, LCA, etc.
 * 
 * Fontes (em ordem de prioridade):
 * 1. ANBIMA API (oficial, gratuita) - Títulos públicos em tempo real
 * 2. Tesouro Direto API (pública) - Dados do Tesouro Nacional
 * 3. Brapi (API brasileira) - Fallback para outros títulos
 */

// Mapeamento de códigos de renda fixa
const CODIGOS_RENDA_FIXA = {
    // Tesouro Direto
    'SELIC': { nome: 'Tesouro Selic', tipo: 'tesouro', codigo: 'SELIC' },
    'SELIC2027': { nome: 'Tesouro Selic 2027', tipo: 'tesouro', codigo: 'SELIC2027' },
    'SELIC2029': { nome: 'Tesouro Selic 2029', tipo: 'tesouro', codigo: 'SELIC2029' },
    'IPCA+': { nome: 'Tesouro IPCA+', tipo: 'tesouro', codigo: 'IPCA+' },
    'IPCA2029': { nome: 'Tesouro IPCA+ 2029', tipo: 'tesouro', codigo: 'IPCA2029' },
    'IPCA2035': { nome: 'Tesouro IPCA+ 2035', tipo: 'tesouro', codigo: 'IPCA2035' },
    'PREFIXADO': { nome: 'Tesouro Prefixado', tipo: 'tesouro', codigo: 'PREFIXADO' },
    'PREFIXADO2025': { nome: 'Tesouro Prefixado 2025', tipo: 'tesouro', codigo: 'PREFIXADO2025' },
    'PREFIXADO2027': { nome: 'Tesouro Prefixado 2027', tipo: 'tesouro', codigo: 'PREFIXADO2027' },
    
    // Outros títulos
    'CDB': { nome: 'CDB', tipo: 'cdb', codigo: 'CDB' },
    'LCI': { nome: 'LCI', tipo: 'lci', codigo: 'LCI' },
    'LCA': { nome: 'LCA', tipo: 'lca', codigo: 'LCA' },
    'DEBENTURE': { nome: 'Debênture', tipo: 'debenture', codigo: 'DEBENTURE' },
}

/**
 * Busca dados de renda fixa via Brapi (tempo real)
 * @param {string} codigo - Código do título (ex: SELIC, IPCA+, CDB)
 * @returns {Promise<Object>} - Dados do título
 */
const buscarViaBrapi = async (codigo) => {
    try {
        const BRAPI_BASE = process.env.REACT_APP_BRAPI_URL || "https://brapi.dev/api"
        const BRAPI_TOKEN = process.env.REACT_APP_BRAPI_TOKEN || ""
        
        console.log(`[Renda Fixa] Buscando via Brapi: ${codigo}`)
        
        // Brapi tem endpoint específico para renda fixa
        const url = `${BRAPI_BASE}/fixed-income${BRAPI_TOKEN ? `?token=${BRAPI_TOKEN}` : ''}`
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (!response.ok) {
            // Se não tiver token, pode retornar 401, mas continua tentando
            if (response.status === 401) {
                console.warn('[Renda Fixa] Brapi requer token. Configure REACT_APP_BRAPI_TOKEN no .env')
            }
            throw new Error(`Erro na API Brapi: ${response.status}`)
        }
        
        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            // Se retornou HTML, significa que a API não está disponível ou mudou
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                throw new Error('API Brapi retornou HTML (endpoint pode ter mudado)')
            }
            throw new Error('Resposta não é JSON')
        }
        
        const data = await response.json()
        
        // Busca o título específico
        if (data && (data.fixedIncome || data.data)) {
            const titulos = data.fixedIncome || data.data || []
            
            // Busca por código ou nome
            const titulo = titulos.find(t => {
                const nome = (t.name || t.nome || '').toUpperCase()
                const codigoTitulo = (t.code || t.codigo || '').toUpperCase()
                const codigoUpper = codigo.toUpperCase()
                
                return nome.includes(codigoUpper) || 
                       codigoTitulo === codigoUpper ||
                       codigoTitulo.includes(codigoUpper)
            })
            
            if (titulo) {
                const taxa = parseFloat(titulo.lastRate || titulo.rate || titulo.taxa || 0)
                const preco = parseFloat(titulo.price || titulo.preco || titulo.valorUnitario || 1000)
                
                return {
                    sucesso: true,
                    preco: preco > 0 ? preco : 1000,
                    nome: titulo.name || titulo.nome || codigo,
                    codigo: titulo.code || titulo.codigo || codigo,
                    tipo: titulo.type || titulo.tipo || 'renda_fixa',
                    rentabilidade: taxa,
                    rentabilidadeMensal: taxa / 12,
                    vencimento: titulo.maturityDate || titulo.vencimento || null,
                    taxa: taxa,
                    dataAtualizacao: titulo.updatedAt || titulo.dataAtualizacao || new Date().toISOString(),
                    fonte: 'Brapi'
                }
            }
        }
        
        return null
    } catch (error) {
        // Não loga erro se for apenas endpoint não disponível
        if (!error.message.includes('HTML') && !error.message.includes('endpoint')) {
            console.warn('[Renda Fixa] Erro ao buscar via Brapi:', error.message)
        }
        return null
    }
}

/**
 * Busca dados via API do Banco Central (SELIC)
 * @param {string} codigo - Código do título
 * @returns {Promise<Object>} - Dados do título
 */
const buscarViaBancoCentral = async (codigo) => {
    try {
        if (codigo.toUpperCase() !== 'SELIC') {
            return null
        }
        
        // API do Banco Central para taxa SELIC
        const proxy = "https://api.allorigins.win/raw?url="
        const urlBC = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json"
        const url = `${proxy}${encodeURIComponent(urlBC)}`
        
        console.log(`[Renda Fixa] Buscando SELIC via Banco Central`)
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`Erro na API BC: ${response.status}`)
        }
        
        const text = await response.text()
        
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error('BC retornou HTML')
        }
        
        const data = JSON.parse(text)
        
        if (data && data.length > 0) {
            const ultimoDado = data[0]
            const taxaSelic = parseFloat(ultimoDado.valor || 0)
            
            if (taxaSelic > 0) {
                return {
                    sucesso: true,
                    preco: 1000, // Valor de face para SELIC
                    nome: 'Tesouro Selic',
                    codigo: 'SELIC',
                    tipo: 'tesouro',
                    rentabilidade: taxaSelic,
                    rentabilidadeMensal: taxaSelic / 12,
                    taxa: taxaSelic,
                    dataAtualizacao: ultimoDado.data || new Date().toISOString(),
                    fonte: 'Banco Central do Brasil'
                }
            }
        }
        
        return null
    } catch (error) {
        console.warn('[Renda Fixa] Erro ao buscar via Banco Central:', error.message)
        return null
    }
}

/**
 * Busca dados via API ANBIMA (oficial, tempo real)
 * @param {string} codigo - Código do título
 * @returns {Promise<Object>} - Dados do título
 */
const buscarViaANBIMA = async (codigo) => {
    try {
        // API oficial da ANBIMA - dados em tempo real
        // Nota: Pode requerer autenticação ou ter CORS bloqueado
        const proxy = "https://api.allorigins.win/raw?url="
        const urlANBIMA = "https://api.anbima.com.br/feed/precos-indices/v1/titulos-publicos/difusao-taxas"
        const url = `${proxy}${encodeURIComponent(urlANBIMA)}`
        
        console.log(`[Renda Fixa] Buscando via ANBIMA: ${codigo}`)
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`Erro na API ANBIMA: ${response.status}`)
        }
        
        // Verifica se a resposta é JSON
        const text = await response.text()
        
        // Se retornou HTML, falha silenciosamente
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error('ANBIMA retornou HTML (pode requerer autenticação)')
        }
        
        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            throw new Error('Resposta da ANBIMA não é JSON válido')
        }
        
        // Processa dados da ANBIMA
        if (data && Array.isArray(data)) {
            // Mapeia códigos para tipos de títulos
            const mapeamento = {
                'SELIC': ['LFT', 'SELIC'],
                'IPCA+': ['NTN-B', 'IPCA'],
                'PREFIXADO': ['LTN', 'NTN-F', 'PREFIXADO']
            }
            
            // Busca o título correspondente
            for (const titulo of data) {
                const nomeTitulo = titulo.nome || titulo.descricao || ''
                const tipoTitulo = titulo.tipo || ''
                
                // Verifica correspondência
                const corresponde = Object.entries(mapeamento).some(([key, valores]) => {
                    if (codigo.toUpperCase().includes(key)) {
                        return valores.some(v => 
                            nomeTitulo.toUpperCase().includes(v) ||
                            tipoTitulo.toUpperCase().includes(v)
                        )
                    }
                    return false
                })
                
                if (corresponde || nomeTitulo.toUpperCase().includes(codigo.toUpperCase())) {
                    const taxaAnual = parseFloat(titulo.taxa || titulo.rentabilidade || 0)
                    
                    return {
                        sucesso: true,
                        preco: parseFloat(titulo.preco || titulo.valorUnitario || 1000),
                        nome: titulo.nome || titulo.descricao || codigo,
                        codigo: titulo.codigo || codigo,
                        tipo: 'tesouro',
                        rentabilidade: taxaAnual,
                        rentabilidadeMensal: taxaAnual / 12,
                        vencimento: titulo.vencimento || titulo.dataVencimento || null,
                        taxa: taxaAnual,
                        dataAtualizacao: titulo.dataAtualizacao || new Date().toISOString(),
                        fonte: 'ANBIMA'
                    }
                }
            }
        }
        
        return null
    } catch (error) {
        console.warn('[Renda Fixa] Erro ao buscar via ANBIMA:', error.message)
        return null
    }
}

/**
 * Busca dados de Tesouro Direto via API pública (tempo real)
 * @param {string} codigo - Código do título
 * @returns {Promise<Object>} - Dados do título
 */
const buscarTesouroDireto = async (codigo) => {
    try {
        // API pública do Tesouro Direto - dados em tempo real
        // Tenta múltiplas URLs possíveis e proxies
        const proxies = [
            "https://api.allorigins.win/raw?url=",
            "https://cors-anywhere.herokuapp.com/",
            "" // Tenta direto também
        ]
        const urlsTesouro = [
            "https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json",
            "https://www.tesourodireto.com.br/api/treasurybondsinfo.json",
            "https://www.tesourodireto.com.br/json/treasurybondsinfo.json",
            "https://www.tesourodireto.com.br/tesourodireto/rest/tesourodireto/consulta.json"
        ]
        
        console.log(`[Renda Fixa] Buscando via Tesouro Direto: ${codigo}`)
        
        // Tenta cada combinação de proxy + URL até uma funcionar
        for (const proxy of proxies) {
            for (const urlTesouro of urlsTesouro) {
                try {
                    const url = proxy ? `${proxy}${encodeURIComponent(urlTesouro)}` : urlTesouro
                    const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                
                if (!response.ok) {
                    continue // Tenta próxima URL
                }
                
                let data
                
                // O proxy pode retornar como texto
                const text = await response.text()
                
                // Verifica se é HTML (erro)
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    continue // Tenta próxima URL
                }
                
                // Tenta parsear JSON
                try {
                    data = JSON.parse(text)
                } catch (e) {
                    continue // Tenta próxima URL
                }
                
                // Se ainda for string após parse, tenta parsear novamente
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data)
                    } catch (e) {
                        continue // Tenta próxima URL
                    }
                }
                
                // Processa os dados do Tesouro
                if (data.response && data.response.TrsrBdTradgList) {
                    const titulos = data.response.TrsrBdTradgList
                    
                    // Mapeia códigos para nomes dos títulos do Tesouro
                    const mapeamento = {
                        'SELIC': ['SELIC', 'LFT', 'TESOURO SELIC'],
                        'IPCA+': ['IPCA', 'NTN-B', 'TESOURO IPCA'],
                        'PREFIXADO': ['PREFIXADO', 'LTN', 'NTN-F', 'TESOURO PREFIXADO']
                    }
                    
                    // Busca o título correspondente
                    for (const titulo of titulos) {
                        const nomeTitulo = (titulo.Nm || '').toUpperCase()
                        const codigoTitulo = (titulo.Cd || '').toUpperCase()
                        const codigoUpper = codigo.toUpperCase()
                        
                        // Verifica se corresponde ao código buscado
                        const corresponde = Object.entries(mapeamento).some(([key, valores]) => {
                            if (codigoUpper.includes(key)) {
                                return valores.some(v => 
                                    nomeTitulo.includes(v) ||
                                    codigoTitulo.includes(v)
                                )
                            }
                            return false
                        })
                        
                        if (corresponde || nomeTitulo.includes(codigoUpper) || codigoTitulo.includes(codigoUpper)) {
                            // Taxa anual de investimento ou resgate
                            const taxaAnual = parseFloat(titulo.anulInvstmtRate || titulo.anulRedRate || 0)
                            const taxaMensal = taxaAnual / 12
                            
                            // Valor unitário de resgate ou investimento
                            const valorUnitario = parseFloat(titulo.untrRedVal || titulo.untrInvstmtVal || 0)
                            
                            return {
                                sucesso: true,
                                preco: valorUnitario > 0 ? valorUnitario : 1000,
                                nome: titulo.Nm || codigo,
                                codigo: codigoTitulo || codigo,
                                tipo: 'tesouro',
                                rentabilidade: taxaAnual,
                                rentabilidadeMensal: taxaMensal,
                                vencimento: titulo.mtrtyDt || null,
                                taxa: taxaAnual,
                                valorMinimo: parseFloat(titulo.minInvstmtAmt || 30),
                                dataAtualizacao: new Date().toISOString(),
                                fonte: 'Tesouro Direto'
                            }
                        }
                    }
                }
                
                // Se chegou aqui e não encontrou, tenta próxima combinação
                break
            } catch (error) {
                // Continua para próxima combinação
                continue
            }
            }
        }
        
        return null
    } catch (error) {
        console.warn('[Renda Fixa] Erro ao buscar Tesouro Direto:', error.message)
        return null
    }
}

/**
 * Busca preço atual de um título de renda fixa
 * @param {string} codigo - Código do título (ex: SELIC, IPCA+, CDB)
 * @returns {Promise<{preco: number, nome: string, sucesso: boolean}>}
 */
export const buscarPrecoRendaFixa = async (codigo) => {
    try {
        const codigoUpper = codigo.trim().toUpperCase()
        
        console.log(`[Renda Fixa] 🔍 Buscando dados em tempo real para: ${codigoUpper}`)
        
        // Verifica se é um código conhecido
        const codigoInfo = CODIGOS_RENDA_FIXA[codigoUpper]
        
        // 1. Para SELIC, tenta Banco Central primeiro (mais confiável e direto)
        if (codigoUpper === 'SELIC') {
            try {
                const resultadoBC = await buscarViaBancoCentral(codigoUpper)
                if (resultadoBC && resultadoBC.sucesso) {
                    console.log(`[Renda Fixa] ✅ Dados encontrados via Banco Central (tempo real)`)
                    return resultadoBC
                }
            } catch (error) {
                console.warn(`[Renda Fixa] Banco Central falhou: ${error.message}`)
            }
        }
        
        // 2. Tenta buscar via Tesouro Direto (para todos os títulos do Tesouro)
        if (codigoInfo && codigoInfo.tipo === 'tesouro') {
            try {
                const resultadoTesouro = await buscarTesouroDireto(codigoUpper)
                if (resultadoTesouro && resultadoTesouro.sucesso) {
                    console.log(`[Renda Fixa] ✅ Dados encontrados via Tesouro Direto (tempo real)`)
                    return resultadoTesouro
                }
            } catch (error) {
                console.warn(`[Renda Fixa] Tesouro Direto falhou: ${error.message}`)
            }
        }
        
        // 3. Tenta buscar via ANBIMA (oficial, tempo real)
        if (codigoInfo && codigoInfo.tipo === 'tesouro') {
            try {
                const resultadoANBIMA = await buscarViaANBIMA(codigoUpper)
                if (resultadoANBIMA && resultadoANBIMA.sucesso) {
                    console.log(`[Renda Fixa] ✅ Dados encontrados via ANBIMA (tempo real)`)
                    return resultadoANBIMA
                }
            } catch (error) {
                console.warn(`[Renda Fixa] ANBIMA falhou: ${error.message}`)
            }
        }
        
        // 4. Para títulos privados (CDB, LCI, LCA), tenta Brapi
        if (!codigoInfo || codigoInfo.tipo !== 'tesouro') {
            try {
                const resultadoBrapi = await buscarViaBrapi(codigoUpper)
                if (resultadoBrapi && resultadoBrapi.sucesso) {
                    console.log(`[Renda Fixa] ✅ Dados encontrados via Brapi`)
                    return resultadoBrapi
                }
            } catch (error) {
                // Brapi pode não ter endpoint de renda fixa
            }
        }
        
        // 5. Se não encontrou em nenhuma API, retorna erro (SEM fallback manual)
        console.warn(`[Renda Fixa] ⚠️ Código não encontrado em nenhuma API: ${codigoUpper}`)
        
        return {
            sucesso: false,
            preco: 0,
            nome: codigoInfo?.nome || codigo,
            codigo: codigoUpper,
            tipo: codigoInfo?.tipo || 'renda_fixa',
            rentabilidade: 0,
            taxa: 0,
            erro: `Título "${codigoUpper}" não encontrado nas APIs disponíveis. Verifique o código ou tente novamente mais tarde.`
        }
        
    } catch (error) {
        console.error(`[Renda Fixa] ❌ Erro ao buscar preço de ${codigo}:`, error)
        return {
            sucesso: false,
            preco: 0,
            nome: codigo,
            erro: error.message || "Erro ao buscar dados de renda fixa. Tente novamente."
        }
    }
}

/**
 * Lista títulos de renda fixa disponíveis
 * @returns {Array} - Lista de títulos disponíveis
 */
export const listarTitulosRendaFixa = () => {
    return Object.values(CODIGOS_RENDA_FIXA).map(titulo => ({
        codigo: titulo.codigo,
        nome: titulo.nome,
        tipo: titulo.tipo
    }))
}

/**
 * Calcula rentabilidade de renda fixa
 * @param {number} valorInvestido - Valor investido
 * @param {number} taxaAnual - Taxa anual (%)
 * @param {number} meses - Período em meses
 * @returns {Object} - Resultado do cálculo
 */
export const calcularRentabilidade = (valorInvestido, taxaAnual, meses) => {
    const taxaMensal = taxaAnual / 12 / 100
    const valorFinal = valorInvestido * Math.pow(1 + taxaMensal, meses)
    const rendimento = valorFinal - valorInvestido
    const rentabilidadePercentual = (rendimento / valorInvestido) * 100
    
    return {
        valorInvestido,
        valorFinal: parseFloat(valorFinal.toFixed(2)),
        rendimento: parseFloat(rendimento.toFixed(2)),
        rentabilidadePercentual: parseFloat(rentabilidadePercentual.toFixed(2)),
        taxaAnual,
        taxaMensal: parseFloat((taxaMensal * 100).toFixed(4)),
        meses
    }
}

