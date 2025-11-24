import "./investimento.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import { buscarPrecosMultiplos, buscarPrecoAtual } from "../../lib/brapi"
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
    { value: "cripto", label: "Criptomoeda" },
    { value: "renda_fixa", label: "Renda Fixa" },
    { value: "multimercado", label: "Multimercado" },
    { value: "etf", label: "ETF" },
    { value: "bdr", label: "BDR" },
    { value: "outros", label: "Outros" }
]

export default function Investimento(){
    const { user } = useAuth()
    const [investimentos, setInvestimentos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    
    const [formData, setFormData] = useState({
        tipo_ativo: "",
        ticker: "",
        quantidade: "",
        preco_medio: "",
        data_compra: ""
    })
    const [formError, setFormError] = useState("")
    const [atualizandoPrecos, setAtualizandoPrecos] = useState(false)
    const [cotacaoAtual, setCotacaoAtual] = useState(null)
    const [cotacaoLoading, setCotacaoLoading] = useState(false)
    const [cotacaoErro, setCotacaoErro] = useState("")
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
    const [cotacoesTempoReal, setCotacoesTempoReal] = useState({})

    // Atualizar preços dos investimentos via API
    const atualizarPrecosInvestimentos = useCallback(async (investimentosList, { silencioso = false } = {}) => {
        if (!user || !investimentosList || investimentosList.length === 0) {
            console.log("[Investimentos] Nenhum investimento para atualizar")
            return
        }
        
        try {
            if (!silencioso) {
                setAtualizandoPrecos(true)
            }
            console.log("[Investimentos] Iniciando atualização de preços...")
            
            // Buscar tickers únicos
            const tickersUnicos = [...new Set(investimentosList.map(inv => inv.ticker))]
            console.log("[Investimentos] Tickers a buscar:", tickersUnicos)
            
            // Buscar preços da API
            const precos = await buscarPrecosMultiplos(tickersUnicos)
            console.log("[Investimentos] Preços recebidos da API:", precos)

            if (Object.keys(precos).length === 0) {
                console.warn("[Investimentos] Nenhum preço foi encontrado na API")
            } else {
                setCotacoesTempoReal(prev => ({ ...prev, ...precos }))
            }
            
            // Atualizar cada investimento com o preço atual
            const atualizacoes = investimentosList.map(async (inv) => {
                const tickerUpper = inv.ticker.toUpperCase()
                const dadosPreco = precos[tickerUpper]
                
                if (dadosPreco && dadosPreco.preco > 0) {
                    const precoAtual = parseFloat(inv.preco_atual || inv.preco_medio)
                    const novoPreco = dadosPreco.preco
                    
                    // Sempre atualizar para garantir que está sincronizado
                    console.log(`[Investimentos] Atualizando ${inv.ticker}: R$ ${precoAtual} -> R$ ${novoPreco}`)
                    
                    const { error } = await supabase
                        .from("investimentos")
                        .update({ preco_atual: novoPreco })
                        .eq("id", inv.id)
                    
                    if (error) {
                        console.error(`[Investimentos] Erro ao atualizar preço de ${inv.ticker}:`, error)
                    } else {
                        console.log(`[Investimentos] Preço de ${inv.ticker} atualizado com sucesso`)
                    }
                } else {
                    console.warn(`[Investimentos] Preço não encontrado para ${inv.ticker}`)
                }
            })
            
            await Promise.all(atualizacoes)
            console.log("[Investimentos] Todas as atualizações concluídas")
            
            // Recarregar investimentos atualizados
            const { data, error } = await supabase
                .from("investimentos")
                .select("*")
                .eq("user_id", user.id)
                .order("data_compra", { ascending: false })
            
            if (!error && data) {
                console.log("[Investimentos] Investimentos recarregados:", data.length)
                setInvestimentos(data)
                setUltimaAtualizacao(new Date())
            } else if (error) {
                console.error("[Investimentos] Erro ao recarregar:", error)
            }
        } catch (error) {
            console.error("[Investimentos] Erro ao atualizar preços:", error)
            alert("Erro ao atualizar preços. Verifique o console para mais detalhes.")
        } finally {
            if (!silencioso) {
                setAtualizandoPrecos(false)
            }
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
            
            // Atualizar preços automaticamente via API (em background, sem bloquear)
            if (investimentosData.length > 0) {
                // Usar setTimeout para não bloquear a renderização
                setTimeout(async () => {
                    await atualizarPrecosInvestimentos(investimentosData)
                }, 1000)
            }
        } catch (error) {
            console.error("Erro ao buscar investimentos:", error)
        } finally {
            setLoading(false)
        }
    }, [user, atualizarPrecosInvestimentos])

    useEffect(() => {
        fetchInvestimentos()
    }, [fetchInvestimentos])

    useEffect(() => {
        if (!investimentos.length) return

        const intervalo = setInterval(() => {
            atualizarPrecosInvestimentos(investimentos, { silencioso: true })
        }, 60000)

        return () => clearInterval(intervalo)
    }, [investimentos, atualizarPrecosInvestimentos])

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



    // Agrupar por tipo de ativo - mostrar quantidade
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


    // Dados para gráfico de pizza - composição por tipo (quantidade)
    const chartDataComposicao = useMemo(() => {
        const tipos = Object.keys(porTipoAtivo)
        const quantidades = Object.values(porTipoAtivo).map(g => g.quantidade)
        
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
        
        return {
            labels: tipos.map(t => {
                const label = TIPOS_ATIVO.find(ta => ta.value === t)?.label || t
                const qtd = porTipoAtivo[t].quantidade
                return `${label} (${qtd.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})`
            }),
            datasets: [{
                data: quantidades,
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
                        const quantidade = context.parsed.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                        return `Quantidade: ${quantidade} (${percentage}%)`
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
                taxas: 0,
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
                tipo_ativo: "", ticker: "", quantidade: "", preco_medio: "", data_compra: ""
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

    return (
        <main>
            <Header/>
            <Sidebar/>
            <div className="investimento-container">
                <div className="investimento-header">
                    <h1 className="investimento-title">Investimentos</h1>
                    <div className="header-actions">
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
                    </div>
                </div>

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
                        <div className="card-label">Quantidade Total</div>
                        <div className="card-value">{investimentos.reduce((sum, inv) => sum + parseFloat(inv.quantidade || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
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
                                {Object.entries(porTipoAtivo).map(([tipo, dados]) => {
                                    const label = TIPOS_ATIVO.find(t => t.value === tipo)?.label || tipo
                                    const total = Object.values(porTipoAtivo).reduce((sum, g) => sum + g.quantidade, 0)
                                    const percentual = total > 0 ? ((dados.quantidade / total) * 100).toFixed(1) : 0
                                    return (
                                        <div key={tipo} className="distribuicao-item">
                                            <span className="distribuicao-tipo">{label}</span>
                                            <span className="distribuicao-quantidade">
                                                {dados.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ({percentual}%)
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

            </div>
        </main>
    )
}

