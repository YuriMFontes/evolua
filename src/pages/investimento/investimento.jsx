import "./investimento.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import { buscarPrecosMultiplos, buscarPrecoAtual } from "../../lib/yahoo-finance"
import { 
    Doughnut
} from "react-chartjs-2"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js"

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
)

// Tipos de ativos disponíveis
const TIPOS_ATIVO = [
    { value: "acao", label: "Ação" },
    { value: "fii", label: "FII" },
    { value: "bdr", label: "BDR" },
]

export default function Investimento(){
    const { user } = useAuth()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    
    const [formData, setFormData] = useState({
        tipo_ativo: "",
        ticker: "",
        quantidade: "",
        preco_medio: "",
        taxas: "",
        data_compra: ""
    })
    const [formError, setFormError] = useState("")
    const [atualizandoPrecos, setAtualizandoPrecos] = useState(false)
    const [cotacaoAtual, setCotacaoAtual] = useState(null)
    const [cotacaoLoading, setCotacaoLoading] = useState(false)
    const [cotacaoErro, setCotacaoErro] = useState("")
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
    const [cotacoesTempoReal, setCotacoesTempoReal] = useState({})
    
    // Estados para calculadora de rebalanceamento
    const [tabAtiva, setTabAtiva] = useState("investimentos") // "investimentos" ou "rebalanceamento"
    const [percentuaisIdeais, setPercentuaisIdeais] = useState({
        acao: 25,
        bdr: 15,
        etf: 0,
        fii: 30,
        renda_fixa: 25,
        cripto: 5
    })
    const [valorAporte, setValorAporte] = useState("")

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    // Atualizar preços dos investimentos via API (simplificado)
    const atualizarPrecosInvestimentos = useCallback(async (investimentosList) => {
        if (!user || !investimentosList || investimentosList.length === 0) {
            return
        }
        
        try {
            setAtualizandoPrecos(true)
            
            // Buscar tickers únicos
            const tickersUnicos = [...new Set(investimentosList.map(inv => inv.ticker))]
            
            // Buscar preços da API
            const precos = await buscarPrecosMultiplos(tickersUnicos)

            if (Object.keys(precos).length === 0) {
                alert("Nenhum preço foi encontrado na API. Verifique se os tickers estão corretos.")
                return
            }
            
            // Atualizar cada investimento com o preço atual
            const atualizacoes = investimentosList.map(async (inv) => {
                const tickerUpper = inv.ticker.toUpperCase()
                const dadosPreco = precos[tickerUpper]
                
                if (dadosPreco && dadosPreco.preco > 0) {
                    const { error } = await supabase
                        .from("investimentos")
                        .update({ preco_atual: dadosPreco.preco })
                        .eq("id", inv.id)
                    
                    if (error) {
                        console.error(`Erro ao atualizar preço de ${inv.ticker}:`, error)
                    }
                }
            })
            
            await Promise.all(atualizacoes)
            
            // Recarregar investimentos atualizados
            const { data, error } = await supabase
                .from("investimentos")
                .select("*")
                .eq("user_id", user.id)
                .order("data_compra", { ascending: false })
            
            if (!error && data) {
                setInvestimentos(data)
                setUltimaAtualizacao(new Date())
                setCotacoesTempoReal(prev => ({ ...prev, ...precos }))
            }
        } catch (error) {
            console.error("Erro ao atualizar preços:", error)
            alert("Erro ao atualizar preços: " + (error.message || "Erro desconhecido"))
        } finally {
            setAtualizandoPrecos(false)
        }
    }, [user])

    // Buscar investimentos
    const fetchInvestimentos = useCallback(async () => {
        if (!user) return
        
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("investimentos")
                .select("*")
                .eq("user_id", user.id)
                .order("data_compra", { ascending: false })

            if (error) throw error
            
            const investimentosData = data || []
            setInvestimentos(investimentosData)
            
            // Atualizar preços automaticamente apenas na primeira carga (opcional)
            // Removido atualização automática para evitar problemas de performance
        } catch (error) {
            console.error("Erro ao buscar investimentos:", error)
        } finally {
            setLoading(false)
        }
    }, [user, atualizarPrecosInvestimentos])

    useEffect(() => {
        fetchInvestimentos()
    }, [fetchInvestimentos])

    // Removido: atualização automática muito frequente estava causando problemas
    // Usuário pode atualizar manualmente quando necessário

    useEffect(() => {
        if (!showModal) {
            setCotacaoAtual(null)
            setCotacaoErro("")
            setCotacaoLoading(false)
        }
    }, [showModal])

    // Formatar moeda
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0)
    }

    const formatarHorarioAtualizacao = (data) => {
        if (!data) return "Nunca atualizado"
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const obterDadosTempoReal = useCallback((ticker) => {
        if (!ticker) return null
        return cotacoesTempoReal[ticker.toUpperCase()] || null
    }, [cotacoesTempoReal])

    const obterPrecoAtual = useCallback((inv) => {
        const dados = obterDadosTempoReal(inv.ticker)
        if (dados?.preco) return dados.preco
        return parseFloat(inv.preco_atual || inv.preco_medio)
    }, [obterDadosTempoReal])

    // Calcular valor total investido
    const valorTotalInvestido = useMemo(() => {
        return investimentos.reduce((sum, inv) => {
            const investido = (parseFloat(inv.quantidade) * parseFloat(inv.preco_medio)) + parseFloat(inv.taxas || 0)
            return sum + investido
        }, 0)
    }, [investimentos])

    // Calcular valor atual da carteira (usa preço atual da API ou preço médio como fallback)
    const valorAtualCarteira = useMemo(() => {
        return investimentos.reduce((sum, inv) => {
            const precoAtual = obterPrecoAtual(inv)
            const valorAtual = parseFloat(inv.quantidade) * precoAtual
            return sum + valorAtual
        }, 0)
    }, [investimentos, obterPrecoAtual])

    // Calcular lucro/prejuízo
    const lucroPrejuizo = useMemo(() => {
        return valorAtualCarteira - valorTotalInvestido
    }, [valorAtualCarteira, valorTotalInvestido])

    // Calcular rentabilidade percentual
    const rentabilidadePercentual = useMemo(() => {
        if (valorTotalInvestido === 0) return 0
        return ((lucroPrejuizo / valorTotalInvestido) * 100).toFixed(2)
    }, [lucroPrejuizo, valorTotalInvestido])

    const handleBuscarCotacao = useCallback(async () => {
        if (!formData.ticker || formData.ticker.trim() === "") {
            setFormError("Informe o ticker antes de buscar a cotação")
            return
        }

        setCotacaoErro("")
        setCotacaoLoading(true)

        try {
            const ticker = formData.ticker.trim().toUpperCase()
            const resultado = await buscarPrecoAtual(ticker)

            if (!resultado.sucesso || !resultado.preco) {
                throw new Error(resultado.erro || "Ticker não encontrado")
            }

            setCotacaoAtual({
                ...resultado,
                ticker
            })

            setFormData(prev => ({
                ...prev,
                ticker,
                preco_medio: resultado.preco ? resultado.preco.toFixed(2) : prev.preco_medio,
                data_compra: prev.data_compra || (resultado.atualizadoEm ? resultado.atualizadoEm.split("T")[0] : prev.data_compra)
            }))
        } catch (error) {
            console.error("[Investimentos] Erro ao buscar cotação:", error)
            setCotacaoAtual(null)
            setCotacaoErro(error.message || "Não foi possível buscar a cotação")
        } finally {
            setCotacaoLoading(false)
        }
    }, [formData.ticker])



    // Agrupar por tipo de ativo - mostrar VALOR (não quantidade)
    const porTipoAtivo = useMemo(() => {
        const grupos = {}
        investimentos.forEach(inv => {
            const tipo = inv.tipo_ativo || "outros"
            if (!grupos[tipo]) {
                grupos[tipo] = { quantidade: 0, valor: 0 }
            }
            grupos[tipo].quantidade += parseFloat(inv.quantidade || 0)
            const precoAtual = obterPrecoAtual(inv)
            grupos[tipo].valor += parseFloat(inv.quantidade || 0) * precoAtual
        })
        return grupos
    }, [investimentos, obterPrecoAtual])


    // Dados para gráfico de pizza - composição por tipo (VALOR em R$)
    const chartDataComposicao = useMemo(() => {
        const tipos = Object.keys(porTipoAtivo)
        const valores = Object.values(porTipoAtivo).map(g => g.valor)
        
        const cores = {
            acao: "#4a6cf7",
            fii: "#9b5de5",
            cripto: "#ff6b9d",
            renda_fixa: "#66bb6a",
            multimercado: "#ffa726",
            etf: "#42a5f5",
            bdr: "#ab47bc",
            outros: "#bdbdbd"
        }
        
        const formatarMoedaLocal = (valor) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(valor || 0)
        }
        
        return {
            labels: tipos.map(t => {
                const label = TIPOS_ATIVO.find(ta => ta.value === t)?.label || t
                const valor = porTipoAtivo[t].valor
                return `${label} (${formatarMoedaLocal(valor)})`
            }),
            datasets: [{
                data: valores,
                backgroundColor: tipos.map(t => cores[t] || "#bdbdbd"),
                borderColor: "#ffffff",
                borderWidth: 2
            }]
        }
    }, [porTipoAtivo])



    const chartOptionsPizza = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    padding: 10,
                    font: { size: 11 }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0
                        const valor = new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(context.parsed || 0)
                        return `${valor} (${percentage}%)`
                    }
                }
            }
        }
    }

    // Salvar/Editar investimento
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user) return

        setFormError("")

        // Validações básicas
        if (!formData.tipo_ativo) {
            setFormError("Selecione o tipo de ativo")
            return
        }
        if (!formData.ticker || formData.ticker.trim() === "") {
            setFormError("Informe o ticker")
            return
        }
        if (!formData.quantidade || parseFloat(formData.quantidade) <= 0) {
            setFormError("Informe uma quantidade válida")
            return
        }
        if (!formData.preco_medio || parseFloat(formData.preco_medio) <= 0) {
            setFormError("Informe um preço médio válido")
            return
        }
        if (!formData.data_compra) {
            setFormError("Informe a data de compra")
            return
        }

        try {
            // Buscar preço atual da API ao salvar novo investimento
            let precoAtual = parseFloat(formData.preco_medio)
            const ticker = formData.ticker.trim().toUpperCase()

            if (cotacaoAtual && cotacaoAtual.ticker === ticker && cotacaoAtual.preco) {
                precoAtual = cotacaoAtual.preco
            } else {
                try {
                    const resultado = await buscarPrecoAtual(ticker)
                    if (resultado.sucesso && resultado.preco > 0) {
                        precoAtual = resultado.preco
                    }
                } catch (apiError) {
                    console.log("Não foi possível buscar preço da API, usando preço médio:", apiError)
                    // Continua com o preço médio se a API falhar
                }
            }
            
            const dataToSave = {
                user_id: user.id,
                tipo_ativo: formData.tipo_ativo,
                ticker: ticker,
                quantidade: parseFloat(formData.quantidade),
                preco_medio: parseFloat(formData.preco_medio),
                preco_atual: precoAtual, // Preço atual da API ou preço médio como fallback
                taxas: parseFloat(formData.taxas || 0),
                data_compra: formData.data_compra
            }

            if (editingId) {
                const { error } = await supabase
                    .from("investimentos")
                    .update(dataToSave)
                    .eq("id", editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("investimentos")
                    .insert([dataToSave])
                if (error) throw error
            }

            setShowModal(false)
            setEditingId(null)
            setFormError("")
            setFormData({
                tipo_ativo: "", ticker: "", quantidade: "", preco_medio: "", taxas: "", data_compra: ""
            })
            setCotacaoAtual(null)
            setCotacaoErro("")
            fetchInvestimentos()
        } catch (error) {
            console.error("Erro ao salvar investimento:", error)
            let errorMessage = "Erro ao salvar investimento"
            
            if (error.message) {
                if (error.message.includes("duplicate") || error.message.includes("unique")) {
                    errorMessage = "Este investimento já existe"
                } else if (error.message.includes("foreign key") || error.message.includes("user_id")) {
                    errorMessage = "Erro de autenticação. Faça login novamente"
                } else if (error.message.includes("null value") || error.message.includes("NOT NULL")) {
                    errorMessage = "Preencha todos os campos obrigatórios"
                } else {
                    errorMessage = error.message
                }
            }
            
            setFormError(errorMessage)
        }
    }

    // Editar investimento
    const handleEdit = (inv) => {
        setEditingId(inv.id)
        setFormError("")
        setCotacaoAtual(null)
        setCotacaoErro("")
        setFormData({
            tipo_ativo: inv.tipo_ativo || "",
            ticker: inv.ticker || "",
            quantidade: inv.quantidade || "",
            preco_medio: inv.preco_medio || "",
            taxas: inv.taxas || "",
            data_compra: inv.data_compra ? inv.data_compra.split('T')[0] : ""
        })
        setShowModal(true)
    }

    // Deletar investimento
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este investimento?")) return

        try {
            const { error } = await supabase
                .from("investimentos")
                .delete()
                .eq("id", id)
            if (error) throw error
            fetchInvestimentos()
        } catch (error) {
            console.error("Erro ao deletar investimento:", error)
            alert("Erro ao deletar investimento: " + error.message)
        }
    }



    // Calcular percentual da carteira por ativo
    const percentualCarteira = (inv) => {
        if (valorAtualCarteira === 0) return 0
        const valorAtual = parseFloat(inv.quantidade) * obterPrecoAtual(inv)
        return ((valorAtual / valorAtualCarteira) * 100).toFixed(2)
    }

    // Calcular valores por tipo de ativo para rebalanceamento
    const valoresPorTipo = useMemo(() => {
        const grupos = {}
        investimentos.forEach(inv => {
            const tipo = inv.tipo_ativo || "outros"
            if (!grupos[tipo]) {
                grupos[tipo] = 0
            }
            const precoAtual = obterPrecoAtual(inv)
            grupos[tipo] += parseFloat(inv.quantidade || 0) * precoAtual
        })
        return grupos
    }, [investimentos, obterPrecoAtual])

    // Calcular rebalanceamento
    const calculoRebalanceamento = useMemo(() => {
        const patrimonioAtual = parseFloat(valorAtualCarteira) || 0
        const aporte = parseFloat(valorAporte) || 0
        const patrimonioFuturo = patrimonioAtual + aporte

        // Garantir que sempre retornamos um objeto válido
        const resultadoBase = {
            patrimonioAtual: isNaN(patrimonioAtual) ? 0 : patrimonioAtual,
            aporte: isNaN(aporte) ? 0 : aporte,
            patrimonioFuturo: isNaN(patrimonioFuturo) ? 0 : patrimonioFuturo,
            somaPercentuais: 0,
            somaQuantoInvestir: 0,
            resultados: []
        }

        if (patrimonioFuturo === 0 || isNaN(patrimonioFuturo)) {
            return resultadoBase
        }

        // Mapear tipos do banco para os tipos da calculadora
        // O banco pode ter: "acao", "fii", "bdr", "etf", "renda_fixa", "cripto"
        // A calculadora usa os mesmos nomes, então podemos usar diretamente
        const resultados = Object.keys(percentuaisIdeais).map(tipo => {
            // Buscar o valor atual do tipo correspondente no banco
            // Os tipos são os mesmos, então podemos usar diretamente
            const valorAtual = parseFloat(valoresPorTipo[tipo]) || 0
            const percentualAtualNum = patrimonioAtual > 0 ? (valorAtual / patrimonioAtual) * 100 : 0
            const percentualIdeal = parseFloat(percentuaisIdeais[tipo]) || 0
            
            // Valor ideal após aporte
            const valorIdeal = (patrimonioFuturo * percentualIdeal) / 100
            
            // Diferença entre valor ideal e valor atual
            const diferenca = valorIdeal - valorAtual
            
            // Se já está acima do percentual ideal, não investir nada
            const quantoInvestir = diferenca > 0 ? diferenca : 0
            
            return {
                tipo,
                label: tipo === "acao" ? "Ações" : 
                       tipo === "bdr" ? "BDRs" :
                       tipo === "etf" ? "ETFs" :
                       tipo === "fii" ? "FIIs" :
                       tipo === "renda_fixa" ? "Renda Fixa" :
                       tipo === "cripto" ? "Criptomoedas" : tipo,
                valorAtual: isNaN(valorAtual) ? 0 : valorAtual,
                percentualAtual: isNaN(percentualAtualNum) ? 0 : parseFloat(percentualAtualNum.toFixed(2)),
                percentualIdeal: isNaN(percentualIdeal) ? 0 : percentualIdeal,
                valorIdeal: isNaN(valorIdeal) ? 0 : valorIdeal,
                quantoInvestir: isNaN(quantoInvestir) ? 0 : parseFloat(quantoInvestir.toFixed(2))
            }
        })

        // Verificar se a soma dos percentuais ideais é 100%
        const somaPercentuais = Object.values(percentuaisIdeais).reduce((sum, val) => {
            const numVal = parseFloat(val) || 0
            return sum + (isNaN(numVal) ? 0 : numVal)
        }, 0)
        const somaQuantoInvestir = resultados.reduce((sum, r) => {
            const valor = parseFloat(r.quantoInvestir) || 0
            return sum + (isNaN(valor) ? 0 : valor)
        }, 0)

        return {
            patrimonioAtual: isNaN(patrimonioAtual) ? 0 : patrimonioAtual,
            aporte: isNaN(aporte) ? 0 : aporte,
            patrimonioFuturo: isNaN(patrimonioFuturo) ? 0 : patrimonioFuturo,
            somaPercentuais: isNaN(somaPercentuais) ? 0 : somaPercentuais,
            somaQuantoInvestir: isNaN(somaQuantoInvestir) ? 0 : somaQuantoInvestir,
            resultados: Array.isArray(resultados) ? resultados : []
        }
    }, [valorAtualCarteira, valorAporte, percentuaisIdeais, valoresPorTipo])

    return (
        <main>
            <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
            <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar}/>
            <div className="investimento-container">
                <div className="investimento-header">
                    <h1 className="investimento-title">Investimentos</h1>
                    <div className="header-actions">
                        {tabAtiva === "investimentos" && (
                            <>
                                <div className="update-meta">
                                    {atualizandoPrecos ? "Atualizando cotações..." : `Última atualização: ${formatarHorarioAtualizacao(ultimaAtualizacao)}`}
                                </div>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => atualizarPrecosInvestimentos(investimentos)}
                                    disabled={atualizandoPrecos || investimentos.length === 0}
                                    title="Atualizar preços dos ativos"
                                >
                                    {atualizandoPrecos ? "Atualizando..." : "🔄 Atualizar Preços"}
                                </button>
                                <button className="btn-primary" onClick={() => {
                                    setEditingId(null)
                                    setFormError("")
                                    setFormData({
                                        tipo_ativo: "", ticker: "", quantidade: "", preco_medio: "", data_compra: ""
                                    })
                                    setCotacaoAtual(null)
                                    setCotacaoErro("")
                                    setShowModal(true)
                                }}>+ Novo Investimento</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-investimento">
                    <button 
                        className={`tab-btn ${tabAtiva === "investimentos" ? "active" : ""}`}
                        onClick={() => setTabAtiva("investimentos")}
                    >
                        Meus Investimentos
                    </button>
                    <button 
                        className={`tab-btn ${tabAtiva === "rebalanceamento" ? "active" : ""}`}
                        onClick={() => setTabAtiva("rebalanceamento")}
                    >
                        Rebalanceamento
                    </button>
                </div>

                {/* Conteúdo da aba de investimentos */}
                {tabAtiva === "investimentos" && (
                    <>
                {/* Cards de resumo */}
                <div className="cards-resumo">
                    <div className="card-resumo">
                        <div className="card-label">
                            Patrimônio Total
                            {atualizandoPrecos && <span style={{ fontSize: "10px", marginLeft: "8px", color: "#667eea" }}>🔄 Atualizando...</span>}
                        </div>
                        <div className="card-value">{formatarMoeda(valorAtualCarteira)}</div>
                        <div className={`card-change ${lucroPrejuizo >= 0 ? "positive" : "negative"}`}>
                            {lucroPrejuizo >= 0 ? "+" : ""}{formatarMoeda(lucroPrejuizo)} ({rentabilidadePercentual}%)
                        </div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Valor Investido</div>
                        <div className="card-value">{formatarMoeda(valorTotalInvestido)}</div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Total de Ativos</div>
                        <div className="card-value">{investimentos.length}</div>
                        <div className="card-change">Tipos diferentes: {Object.keys(porTipoAtivo).length}</div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Rentabilidade</div>
                        <div className={`card-value ${parseFloat(rentabilidadePercentual) >= 0 ? "positive" : "negative"}`}>
                            {rentabilidadePercentual}%
                        </div>
                        <div className="card-change">
                            {lucroPrejuizo >= 0 ? "Lucro" : "Prejuízo"}
                        </div>
                    </div>
                </div>

                {/* Gráfico de Distribuição */}
                <div className="graficos-grid">
                    <div className="grafico-card">
                        <h3>Distribuição por Tipo de Ativo</h3>
                        <div className="chart-wrapper">
                            {investimentos.length > 0 ? (
                                <Doughnut data={chartDataComposicao} options={chartOptionsPizza} />
                            ) : (
                                <p className="sem-dados">Nenhum investimento cadastrado</p>
                            )}
                        </div>
                        {/* Lista de quantidades por tipo */}
                        {investimentos.length > 0 && (
                            <div className="distribuicao-lista">
                                {Object.entries(porTipoAtivo)
                                    .sort((a, b) => b[1].valor - a[1].valor) // Ordenar por valor (maior primeiro)
                                    .map(([tipo, dados]) => {
                                        const label = TIPOS_ATIVO.find(t => t.value === tipo)?.label || tipo
                                        const totalValor = Object.values(porTipoAtivo).reduce((sum, g) => sum + g.valor, 0)
                                        const percentual = totalValor > 0 ? ((dados.valor / totalValor) * 100).toFixed(1) : 0
                                        return (
                                            <div key={tipo} className="distribuicao-item">
                                                <span className="distribuicao-tipo">{label}</span>
                                                <span className="distribuicao-quantidade">
                                                    {formatarMoeda(dados.valor)} ({percentual}%)
                                                </span>
                                            </div>
                                        )
                                    })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabela de investimentos */}
                <div className="tabela-container">
                    <div className="tabela-header">
                        <h2>Meus Investimentos</h2>
                    </div>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : investimentos.length === 0 ? (
                        <p className="sem-dados">Nenhum investimento cadastrado. Clique em "Novo Investimento" para começar.</p>
                    ) : (
                        <table className="tabela-investimentos">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Tipo</th>
                                    <th>Quantidade</th>
                                    <th>Preço Médio</th>
                                    <th>Preço Atual</th>
                                    <th>Variação</th>
                                    <th>Valor Investido</th>
                                    <th>Valor Atual</th>
                                    <th>Lucro/Prejuízo</th>
                                    <th>% Carteira</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investimentos.map(inv => {
                                    const precoAtual = obterPrecoAtual(inv)
                                    const valorInvestido = parseFloat(inv.quantidade) * parseFloat(inv.preco_medio) + parseFloat(inv.taxas || 0)
                                    const valorAtual = parseFloat(inv.quantidade) * precoAtual
                                    const lucro = valorAtual - valorInvestido
                                    const rentabilidade = valorInvestido > 0 ? ((lucro / valorInvestido) * 100).toFixed(2) : 0
                                    const variacaoTempoReal = obterDadosTempoReal(inv.ticker)?.variacao

                                    return (
                                        <tr key={inv.id}>
                                            <td><strong>{inv.ticker}</strong></td>
                                            <td>{TIPOS_ATIVO.find(t => t.value === inv.tipo_ativo)?.label || inv.tipo_ativo}</td>
                                            <td>{inv.quantidade}</td>
                                            <td>{formatarMoeda(inv.preco_medio)}</td>
                                            <td>
                                                {formatarMoeda(precoAtual)}
                                                {(obterDadosTempoReal(inv.ticker)?.preco || inv.preco_atual) && (
                                                    <span style={{ fontSize: "10px", marginLeft: "4px", color: "#10b981" }} title="Preço atualizado via API">✓</span>
                                                )}
                                            </td>
                                            <td className={variacaoTempoReal ? (variacaoTempoReal >= 0 ? "positive" : "negative") : ""}>
                                                {typeof variacaoTempoReal === "number" && !Number.isNaN(variacaoTempoReal)
                                                    ? `${variacaoTempoReal >= 0 ? "+" : ""}${variacaoTempoReal.toFixed(2)}%`
                                                    : "—"}
                                            </td>
                                            <td>{formatarMoeda(valorInvestido)}</td>
                                            <td>{formatarMoeda(valorAtual)}</td>
                                            <td className={lucro >= 0 ? "positive" : "negative"}>
                                                {formatarMoeda(lucro)} ({rentabilidade}%)
                                            </td>
                                            <td>{percentualCarteira(inv)}%</td>
                                            <td>
                                                <button className="btn-edit" onClick={() => handleEdit(inv)}>✏️</button>
                                                <button className="btn-delete" onClick={() => handleDelete(inv.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal de Investimento */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => {
                        setShowModal(false)
                        setFormError("")
                        setCotacaoAtual(null)
                        setCotacaoErro("")
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingId ? "Editar" : "Novo"} Investimento</h2>
                            
                            {formError && (
                                <div className="form-error">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tipo de Ativo *</label>
                                    <select
                                        value={formData.tipo_ativo}
                                        onChange={(e) => {
                                            setFormData({...formData, tipo_ativo: e.target.value})
                                            setFormError("")
                                        }}
                                    >
                                        <option value="">Selecione o tipo...</option>
                                        {TIPOS_ATIVO.map(tipo => (
                                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Ticker *</label>
                                    <div className="input-with-action">
                                        <input
                                            type="text"
                                            value={formData.ticker}
                                            onChange={(e) => {
                                                setFormData({...formData, ticker: e.target.value.toUpperCase()})
                                                setFormError("")
                                                setCotacaoErro("")
                                            }}
                                            placeholder="Ex: PETR4, ITUB4, HGLG11"
                                            maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            className="btn-quote"
                                            onClick={handleBuscarCotacao}
                                            disabled={cotacaoLoading || !formData.ticker || !formData.ticker.trim()}
                                        >
                                            {cotacaoLoading ? "Buscando..." : "Buscar cotação"}
                                        </button>
                                    </div>
                                    {cotacaoErro && <p className="form-hint error">{cotacaoErro}</p>}
                                    {cotacaoAtual && (
                                        <div className="cotacao-info">
                                            <div>
                                                <strong>{cotacaoAtual.nome || cotacaoAtual.ticker}</strong>
                                                <span className="cotacao-ticker">{cotacaoAtual.ticker}</span>
                                            </div>
                                            <div className="cotacao-valores">
                                                <span className="cotacao-preco">{formatarMoeda(cotacaoAtual.preco)}</span>
                                                {typeof cotacaoAtual.variacao === "number" && !Number.isNaN(cotacaoAtual.variacao) && (
                                                    <span className={`cotacao-variacao ${cotacaoAtual.variacao >= 0 ? "positivo" : "negativo"}`}>
                                                        {cotacaoAtual.variacao >= 0 ? "+" : ""}{cotacaoAtual.variacao.toFixed(2)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {cotacaoAtual && parseFloat(formData.quantidade) > 0 && (
                                        <p className="cotacao-total">
                                            Valor estimado ({formData.quantidade} un.):{" "}
                                            <strong>
                                                {formatarMoeda(cotacaoAtual.preco * parseFloat(formData.quantidade))}
                                            </strong>
                                        </p>
                                    )}
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Quantidade *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={formData.quantidade}
                                            onChange={(e) => {
                                                setFormData({...formData, quantidade: e.target.value})
                                                setFormError("")
                                            }}
                                            placeholder="Ex: 10, 100, 0.5"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Preço Médio (R$) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={formData.preco_medio}
                                            onChange={(e) => {
                                                setFormData({...formData, preco_medio: e.target.value})
                                                setFormError("")
                                            }}
                                            placeholder="Ex: 25.50"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Data de Compra *</label>
                                    <input
                                        type="date"
                                        value={formData.data_compra}
                                        onChange={(e) => {
                                            setFormData({...formData, data_compra: e.target.value})
                                            setFormError("")
                                        }}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setShowModal(false)
                                        setFormError("")
                                        setCotacaoAtual(null)
                                        setCotacaoErro("")
                                    }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save">
                                        {editingId ? "Atualizar" : "Salvar"}
                                    </button>
                        </div>
                            </form>
                        </div>
                </div>
                )}
                    </>
                )}

                {/* Conteúdo da aba de rebalanceamento */}
                {tabAtiva === "rebalanceamento" && (
                    <div className="rebalanceamento-container">
                        <div className="rebalanceamento-header">
                            <h2>Calculadora de Rebalanceamento de Carteira</h2>
                            <p className="rebalanceamento-descricao">
                                Defina os percentuais ideais para cada tipo de ativo e informe quanto vai aportar. 
                                O sistema calculará automaticamente quanto investir em cada categoria.
                            </p>
                        </div>

                        {/* Configuração de percentuais ideais */}
                        <div className="rebalanceamento-config">
                            <h3>Percentuais Ideais (%)</h3>
                            <div className="percentuais-grid">
                                {Object.keys(percentuaisIdeais).map(tipo => {
                                    const label = tipo === "acao" ? "Ações" : 
                                                 tipo === "bdr" ? "BDRs" :
                                                 tipo === "etf" ? "ETFs" :
                                                 tipo === "fii" ? "FIIs" :
                                                 tipo === "renda_fixa" ? "Renda Fixa" :
                                                 tipo === "cripto" ? "Criptomoedas" : tipo
                                    return (
                                        <div key={tipo} className="percentual-input-group">
                                            <label>{label}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={percentuaisIdeais[tipo]}
                                                onChange={(e) => {
                                                    const novoValor = parseFloat(e.target.value) || 0
                                                    setPercentuaisIdeais(prev => ({
                                                        ...prev,
                                                        [tipo]: novoValor
                                                    }))
                                                }}
                                            />
                                            <span>%</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="soma-percentuais">
                                <strong>
                                    Soma: {(Object.values(percentuaisIdeais).reduce((sum, val) => {
                                        const numVal = parseFloat(val) || 0
                                        return sum + (isNaN(numVal) ? 0 : numVal)
                                    }, 0)).toFixed(2)}%
                                    {Math.abs(Object.values(percentuaisIdeais).reduce((sum, val) => {
                                        const numVal = parseFloat(val) || 0
                                        return sum + (isNaN(numVal) ? 0 : numVal)
                                    }, 0) - 100) > 0.01 && (
                                        <span className="aviso-percentual"> (Deveria ser 100%)</span>
                                    )}
                                </strong>
                            </div>
                        </div>

                        {/* Input de aporte */}
                        <div className="rebalanceamento-aporte">
                            <h3>Novo Aporte</h3>
                            <div className="aporte-input-group">
                                <label>Quanto vou aportar (R$)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorAporte}
                                    onChange={(e) => setValorAporte(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Resumo do patrimônio */}
                        <div className="rebalanceamento-resumo">
                            <div className="resumo-item">
                                <span className="resumo-label">Patrimônio Atual:</span>
                                <span className="resumo-value">{formatarMoeda(calculoRebalanceamento?.patrimonioAtual || 0)}</span>
                            </div>
                            <div className="resumo-item">
                                <span className="resumo-label">Novo Aporte:</span>
                                <span className="resumo-value">{formatarMoeda(calculoRebalanceamento?.aporte || 0)}</span>
                            </div>
                            <div className="resumo-item">
                                <span className="resumo-label">Patrimônio Futuro:</span>
                                <span className="resumo-value destaque">{formatarMoeda(calculoRebalanceamento?.patrimonioFuturo || 0)}</span>
                            </div>
                        </div>

                        {/* Tabela de resultados */}
                        <div className="rebalanceamento-tabela">
                            <h3>Resultado do Rebalanceamento</h3>
                            <table className="tabela-rebalanceamento">
                                <thead>
                                    <tr>
                                        <th>Tipo de Ativo</th>
                                        <th>Percentual Atual</th>
                                        <th>Percentual Ideal</th>
                                        <th>Valor Atual</th>
                                        <th>Quanto Investir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculoRebalanceamento?.resultados?.map((resultado, index) => {
                                        const percentualAtual = parseFloat(resultado.percentualAtual) || 0
                                        const percentualIdeal = parseFloat(resultado.percentualIdeal) || 0
                                        const quantoInvestir = parseFloat(resultado.quantoInvestir) || 0
                                        return (
                                            <tr key={resultado.tipo} className={quantoInvestir === 0 && percentualAtual > percentualIdeal ? "acima-ideal" : ""}>
                                                <td>
                                                    <strong>{resultado.label}</strong>
                                                </td>
                                                <td>{isNaN(percentualAtual) ? "0.00" : percentualAtual.toFixed(2)}%</td>
                                                <td>{isNaN(percentualIdeal) ? "0.00" : percentualIdeal.toFixed(2)}%</td>
                                                <td>{formatarMoeda(resultado.valorAtual || 0)}</td>
                                                <td className={quantoInvestir > 0 ? "valor-investir" : "sem-investimento"}>
                                                    {formatarMoeda(quantoInvestir)}
                                                </td>
                                            </tr>
                                        )
                                    }) || (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                                                Nenhum resultado disponível
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td><strong>Total</strong></td>
                                        <td><strong>100.00%</strong></td>
                                        <td><strong>{(calculoRebalanceamento?.somaPercentuais && !isNaN(calculoRebalanceamento.somaPercentuais) ? calculoRebalanceamento.somaPercentuais.toFixed(2) : "0.00")}%</strong></td>
                                        <td><strong>{formatarMoeda(calculoRebalanceamento?.patrimonioAtual || 0)}</strong></td>
                                        <td><strong>{formatarMoeda(calculoRebalanceamento?.somaQuantoInvestir || 0)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </main>
    )
}

