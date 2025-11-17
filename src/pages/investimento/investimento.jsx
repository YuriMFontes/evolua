import "./investimento.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import { 
    Doughnut, 
    Line, 
    Bar 
} from "react-chartjs-2"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Filler
} from "chart.js"

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Filler
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
    const [dividendos, setDividendos] = useState([])
    const [metas, setMetas] = useState({ patrimonio: 0, dividendos_mensais: 0 })
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showModalDividendo, setShowModalDividendo] = useState(false)
    const [showModalMeta, setShowModalMeta] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [darkMode, setDarkMode] = useState(false)
    
    const [formData, setFormData] = useState({
        tipo_ativo: "",
        ticker: "",
        quantidade: "",
        preco_medio: "",
        corretora: "",
        data_compra: "",
        taxas: "",
        preco_atual: "",
        setor: ""
    })

    const [formDividendo, setFormDividendo] = useState({
        investimento_id: "",
        valor: "",
        data: "",
        tipo: "dividendo"
    })

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
            setInvestimentos(data || [])
        } catch (error) {
            console.error("Erro ao buscar investimentos:", error)
        } finally {
            setLoading(false)
        }
    }, [user])

    // Buscar dividendos
    const fetchDividendos = useCallback(async () => {
        if (!user) return
        
        try {
            const { data, error } = await supabase
                .from("dividendos")
                .select("*")
                .eq("user_id", user.id)
                .order("data", { ascending: false })

            if (error) throw error
            setDividendos(data || [])
        } catch (error) {
            console.error("Erro ao buscar dividendos:", error)
        }
    }, [user])

    // Buscar metas
    const fetchMetas = useCallback(async () => {
        if (!user) return
        
        try {
            const { data, error } = await supabase
                .from("metas_investimento")
                .select("*")
                .eq("user_id", user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (data) {
                setMetas({ 
                    patrimonio: data.patrimonio || 0, 
                    dividendos_mensais: data.dividendos_mensais || 0 
                })
            }
        } catch (error) {
            console.error("Erro ao buscar metas:", error)
        }
    }, [user])

    useEffect(() => {
        fetchInvestimentos()
        fetchDividendos()
        fetchMetas()
    }, [fetchInvestimentos, fetchDividendos, fetchMetas])

    // Formatar moeda
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0)
    }

    // Formatar data
    const formatarData = (data) => {
        if (!data) return ""
        return new Date(data).toLocaleDateString('pt-BR')
    }

    // Calcular valor total investido
    const valorTotalInvestido = useMemo(() => {
        return investimentos.reduce((sum, inv) => {
            const investido = (parseFloat(inv.quantidade) * parseFloat(inv.preco_medio)) + parseFloat(inv.taxas || 0)
            return sum + investido
        }, 0)
    }, [investimentos])

    // Calcular valor atual da carteira
    const valorAtualCarteira = useMemo(() => {
        return investimentos.reduce((sum, inv) => {
            const precoAtual = parseFloat(inv.preco_atual || inv.preco_medio)
            const valorAtual = parseFloat(inv.quantidade) * precoAtual
            return sum + valorAtual
        }, 0)
    }, [investimentos])

    // Calcular lucro/prejuízo
    const lucroPrejuizo = useMemo(() => {
        return valorAtualCarteira - valorTotalInvestido
    }, [valorAtualCarteira, valorTotalInvestido])

    // Calcular rentabilidade percentual
    const rentabilidadePercentual = useMemo(() => {
        if (valorTotalInvestido === 0) return 0
        return ((lucroPrejuizo / valorTotalInvestido) * 100).toFixed(2)
    }, [lucroPrejuizo, valorTotalInvestido])

    // Calcular dividendos do mês
    const dividendosMes = useMemo(() => {
        const hoje = new Date()
        const mesAtual = hoje.getMonth()
        const anoAtual = hoje.getFullYear()
        
        return dividendos
            .filter(div => {
                const dataDiv = new Date(div.data)
                return dataDiv.getMonth() === mesAtual && dataDiv.getFullYear() === anoAtual
            })
            .reduce((sum, div) => sum + parseFloat(div.valor || 0), 0)
    }, [dividendos])

    // Calcular dividendos acumulados
    const dividendosAcumulados = useMemo(() => {
        return dividendos.reduce((sum, div) => sum + parseFloat(div.valor || 0), 0)
    }, [dividendos])

    // Calcular rentabilidade diária (simulado - em produção, buscar preços em tempo real)
    const rentabilidadeDiaria = useMemo(() => {
        // Simulação: 0.1% ao dia em média
        return valorAtualCarteira * 0.001
    }, [valorAtualCarteira])

    // Calcular rentabilidade mensal
    const rentabilidadeMensal = useMemo(() => {
        // Simulação: 3% ao mês em média
        return valorAtualCarteira * 0.03
    }, [valorAtualCarteira])

    // Agrupar por tipo de ativo
    const porTipoAtivo = useMemo(() => {
        const grupos = {}
        investimentos.forEach(inv => {
            const tipo = inv.tipo_ativo || "outros"
            if (!grupos[tipo]) {
                grupos[tipo] = { valor: 0, quantidade: 0 }
            }
            const precoAtual = parseFloat(inv.preco_atual || inv.preco_medio)
            grupos[tipo].valor += parseFloat(inv.quantidade) * precoAtual
            grupos[tipo].quantidade += parseFloat(inv.quantidade)
        })
        return grupos
    }, [investimentos])

    // Agrupar por setor
    const porSetor = useMemo(() => {
        const grupos = {}
        investimentos.forEach(inv => {
            const setor = inv.setor || "Não especificado"
            if (!grupos[setor]) {
                grupos[setor] = 0
            }
            const precoAtual = parseFloat(inv.preco_atual || inv.preco_medio)
            grupos[setor] += parseFloat(inv.quantidade) * precoAtual
        })
        return grupos
    }, [investimentos])

    // Dados para gráfico de pizza - composição por tipo
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
        
        return {
            labels: tipos.map(t => TIPOS_ATIVO.find(ta => ta.value === t)?.label || t),
            datasets: [{
                data: valores,
                backgroundColor: tipos.map(t => cores[t] || "#bdbdbd"),
                borderColor: "#ffffff",
                borderWidth: 2
            }]
        }
    }, [porTipoAtivo])

    // Dados para gráfico de evolução do patrimônio (últimos 12 meses)
    const chartDataEvolucao = useMemo(() => {
        const meses = []
        const valores = []
        const hoje = new Date()
        
        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
            meses.push(data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }))
            
            // Simulação: crescimento linear com variação
            const base = valorTotalInvestido
            const crescimento = (11 - i) * 0.03 // 3% ao mês
            const variacao = (Math.random() - 0.5) * 0.1 // ±5% de variação
            valores.push(base * (1 + crescimento + variacao))
        }
        
        return {
            labels: meses,
            datasets: [{
                label: "Patrimônio",
                data: valores,
                borderColor: "#4a6cf7",
                backgroundColor: "rgba(74, 108, 247, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        }
    }, [valorTotalInvestido])

    // Dados para gráfico de dividendos mensais
    const chartDataDividendos = useMemo(() => {
        const meses = []
        const valores = []
        const hoje = new Date()
        
        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
            meses.push(data.toLocaleDateString('pt-BR', { month: 'short' }))
            
            const mes = data.getMonth()
            const ano = data.getFullYear()
            const totalMes = dividendos
                .filter(div => {
                    const dataDiv = new Date(div.data)
                    return dataDiv.getMonth() === mes && dataDiv.getFullYear() === ano
                })
                .reduce((sum, div) => sum + parseFloat(div.valor || 0), 0)
            
            valores.push(totalMes)
        }
        
        return {
            labels: meses,
            datasets: [{
                label: "Dividendos (R$)",
                data: valores,
                backgroundColor: "rgba(16, 185, 129, 0.6)",
                borderColor: "#10b981",
                borderWidth: 2
            }]
        }
    }, [dividendos])

    // Dados para gráfico de valorização por ativo
    const chartDataValorizacao = useMemo(() => {
        const top10 = [...investimentos]
            .sort((a, b) => {
                const valorA = parseFloat(a.quantidade) * parseFloat(a.preco_atual || a.preco_medio)
                const valorB = parseFloat(b.quantidade) * parseFloat(b.preco_atual || b.preco_medio)
                return valorB - valorA
            })
            .slice(0, 10)
        
        return {
            labels: top10.map(inv => inv.ticker),
            datasets: [{
                label: "Valor Investido",
                data: top10.map(inv => parseFloat(inv.quantidade) * parseFloat(inv.preco_medio)),
                backgroundColor: "rgba(239, 68, 68, 0.6)",
                borderColor: "#ef4444",
                borderWidth: 1
            }, {
                label: "Valor Atual",
                data: top10.map(inv => parseFloat(inv.quantidade) * parseFloat(inv.preco_atual || inv.preco_medio)),
                backgroundColor: "rgba(16, 185, 129, 0.6)",
                borderColor: "#10b981",
                borderWidth: 1
            }]
        }
    }, [investimentos])

    // Opções dos gráficos
    const chartOptions = {
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
                        return `${context.dataset.label || ''}: ${formatarMoeda(context.parsed.y || context.parsed)}`
                    }
                }
            }
        }
    }

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
                        const percentage = ((context.parsed / total) * 100).toFixed(1)
                        return `${context.label}: ${formatarMoeda(context.parsed)} (${percentage}%)`
                    }
                }
            }
        }
    }

    // Salvar/Editar investimento
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const dataToSave = {
                ...formData,
                user_id: user.id,
                quantidade: parseFloat(formData.quantidade),
                preco_medio: parseFloat(formData.preco_medio),
                preco_atual: parseFloat(formData.preco_atual || formData.preco_medio),
                taxas: parseFloat(formData.taxas || 0)
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
            setFormData({
                tipo_ativo: "", ticker: "", quantidade: "", preco_medio: "",
                corretora: "", data_compra: "", taxas: "", preco_atual: "", setor: ""
            })
            fetchInvestimentos()
        } catch (error) {
            console.error("Erro ao salvar investimento:", error)
            alert("Erro ao salvar investimento: " + error.message)
        }
    }

    // Editar investimento
    const handleEdit = (inv) => {
        setEditingId(inv.id)
        setFormData({
            tipo_ativo: inv.tipo_ativo || "",
            ticker: inv.ticker || "",
            quantidade: inv.quantidade || "",
            preco_medio: inv.preco_medio || "",
            corretora: inv.corretora || "",
            data_compra: inv.data_compra || "",
            taxas: inv.taxas || "",
            preco_atual: inv.preco_atual || inv.preco_medio || "",
            setor: inv.setor || ""
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

    // Salvar dividendo
    const handleSubmitDividendo = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from("dividendos")
                .insert([{
                    ...formDividendo,
                    user_id: user.id,
                    valor: parseFloat(formDividendo.valor)
                }])
            if (error) throw error

            setShowModalDividendo(false)
            setFormDividendo({ investimento_id: "", valor: "", data: "", tipo: "dividendo" })
            fetchDividendos()
        } catch (error) {
            console.error("Erro ao salvar dividendo:", error)
            alert("Erro ao salvar dividendo: " + error.message)
        }
    }

    // Salvar metas
    const handleSubmitMeta = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from("metas_investimento")
                .upsert({
                    user_id: user.id,
                    patrimonio: parseFloat(metas.patrimonio || 0),
                    dividendos_mensais: parseFloat(metas.dividendos_mensais || 0)
                })
            if (error) throw error

            setShowModalMeta(false)
            fetchMetas()
        } catch (error) {
            console.error("Erro ao salvar metas:", error)
            alert("Erro ao salvar metas: " + error.message)
        }
    }

    // Exportar CSV
    const exportarCSV = () => {
        const headers = ["Ticker", "Tipo", "Quantidade", "Preço Médio", "Preço Atual", "Valor Investido", "Valor Atual", "Lucro/Prejuízo", "Rentabilidade %"]
        const rows = investimentos.map(inv => {
            const valorInvestido = parseFloat(inv.quantidade) * parseFloat(inv.preco_medio) + parseFloat(inv.taxas || 0)
            const valorAtual = parseFloat(inv.quantidade) * parseFloat(inv.preco_atual || inv.preco_medio)
            const lucro = valorAtual - valorInvestido
            const rentabilidade = valorInvestido > 0 ? ((lucro / valorInvestido) * 100).toFixed(2) : 0

            return [
                inv.ticker,
                TIPOS_ATIVO.find(t => t.value === inv.tipo_ativo)?.label || inv.tipo_ativo,
                inv.quantidade,
                formatarMoeda(inv.preco_medio),
                formatarMoeda(inv.preco_atual || inv.preco_medio),
                formatarMoeda(valorInvestido),
                formatarMoeda(valorAtual),
                formatarMoeda(lucro),
                `${rentabilidade}%`
            ]
        })

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `investimentos_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    // Calcular percentual da carteira por ativo
    const percentualCarteira = (inv) => {
        if (valorAtualCarteira === 0) return 0
        const valorAtual = parseFloat(inv.quantidade) * parseFloat(inv.preco_atual || inv.preco_medio)
        return ((valorAtual / valorAtualCarteira) * 100).toFixed(2)
    }

    return (
        <main className={darkMode ? "dark-mode" : ""}>
            <Header/>
            <Sidebar/>
            <div className="investimento-container">
                <div className="investimento-header">
                    <h1 className="investimento-title">Investimentos</h1>
                    <div className="header-actions">
                        <button className="btn-toggle-theme" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? "☀️" : "🌙"}
                        </button>
                        <button className="btn-export" onClick={exportarCSV}>📥 Exportar CSV</button>
                        <button className="btn-primary" onClick={() => {
                            setEditingId(null)
                            setFormData({
                                tipo_ativo: "", ticker: "", quantidade: "", preco_medio: "",
                                corretora: "", data_compra: "", taxas: "", preco_atual: "", setor: ""
                            })
                            setShowModal(true)
                        }}>+ Novo Investimento</button>
                    </div>
                </div>

                {/* Cards de resumo */}
                <div className="cards-resumo">
                    <div className="card-resumo">
                        <div className="card-label">Patrimônio Total</div>
                        <div className="card-value">{formatarMoeda(valorAtualCarteira)}</div>
                        <div className="card-change positive">+{formatarMoeda(lucroPrejuizo)} ({rentabilidadePercentual}%)</div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Valor Investido</div>
                        <div className="card-value">{formatarMoeda(valorTotalInvestido)}</div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Dividendos do Mês</div>
                        <div className="card-value positive">{formatarMoeda(dividendosMes)}</div>
                        <div className="card-change">Total: {formatarMoeda(dividendosAcumulados)}</div>
                    </div>
                    <div className="card-resumo">
                        <div className="card-label">Rentabilidade Mensal</div>
                        <div className="card-value positive">{formatarMoeda(rentabilidadeMensal)}</div>
                        <div className="card-change">Diária: {formatarMoeda(rentabilidadeDiaria)}</div>
                    </div>
                </div>

                {/* Gráficos */}
                <div className="graficos-grid">
                    <div className="grafico-card">
                        <h3>Composição da Carteira</h3>
                        <div className="chart-wrapper">
                            {investimentos.length > 0 ? (
                                <Doughnut data={chartDataComposicao} options={chartOptionsPizza} />
                            ) : (
                                <p className="sem-dados">Nenhum investimento cadastrado</p>
                            )}
                        </div>
                    </div>
                    <div className="grafico-card">
                        <h3>Evolução do Patrimônio</h3>
                        <div className="chart-wrapper">
                            <Line data={chartDataEvolucao} options={chartOptions} />
                        </div>
                    </div>
                    <div className="grafico-card">
                        <h3>Dividendos Mensais</h3>
                        <div className="chart-wrapper">
                            <Bar data={chartDataDividendos} options={chartOptions} />
                        </div>
                    </div>
                    <div className="grafico-card">
                        <h3>Valorização por Ativo</h3>
                        <div className="chart-wrapper">
                            {investimentos.length > 0 ? (
                                <Bar data={chartDataValorizacao} options={chartOptions} />
                            ) : (
                                <p className="sem-dados">Nenhum investimento cadastrado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabela de investimentos */}
                <div className="tabela-container">
                    <div className="tabela-header">
                        <h2>Meus Investimentos</h2>
                        <button className="btn-secondary" onClick={() => setShowModalDividendo(true)}>
                            + Adicionar Dividendo
                        </button>
                        <button className="btn-secondary" onClick={() => setShowModalMeta(true)}>
                            🎯 Metas
                        </button>
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
                                    <th>Valor Investido</th>
                                    <th>Valor Atual</th>
                                    <th>Lucro/Prejuízo</th>
                                    <th>% Carteira</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investimentos.map(inv => {
                                    const valorInvestido = parseFloat(inv.quantidade) * parseFloat(inv.preco_medio) + parseFloat(inv.taxas || 0)
                                    const valorAtual = parseFloat(inv.quantidade) * parseFloat(inv.preco_atual || inv.preco_medio)
                                    const lucro = valorAtual - valorInvestido
                                    const rentabilidade = valorInvestido > 0 ? ((lucro / valorInvestido) * 100).toFixed(2) : 0

                                    return (
                                        <tr key={inv.id}>
                                            <td><strong>{inv.ticker}</strong></td>
                                            <td>{TIPOS_ATIVO.find(t => t.value === inv.tipo_ativo)?.label || inv.tipo_ativo}</td>
                                            <td>{inv.quantidade}</td>
                                            <td>{formatarMoeda(inv.preco_medio)}</td>
                                            <td>{formatarMoeda(inv.preco_atual || inv.preco_medio)}</td>
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
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingId ? "Editar" : "Novo"} Investimento</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de Ativo *</label>
                                        <select
                                            value={formData.tipo_ativo}
                                            onChange={(e) => setFormData({...formData, tipo_ativo: e.target.value})}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {TIPOS_ATIVO.map(tipo => (
                                                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ticker *</label>
                                        <input
                                            type="text"
                                            value={formData.ticker}
                                            onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                                            required
                                            placeholder="Ex: PETR4"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Quantidade *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.quantidade}
                                            onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Preço Médio *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.preco_medio}
                                            onChange={(e) => setFormData({...formData, preco_medio: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Preço Atual</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.preco_atual}
                                            onChange={(e) => setFormData({...formData, preco_atual: e.target.value})}
                                            placeholder="Deixe vazio para usar preço médio"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Compra *</label>
                                        <input
                                            type="date"
                                            value={formData.data_compra}
                                            onChange={(e) => setFormData({...formData, data_compra: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Corretora</label>
                                        <input
                                            type="text"
                                            value={formData.corretora}
                                            onChange={(e) => setFormData({...formData, corretora: e.target.value})}
                                            placeholder="Ex: XP, Clear, Rico"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Taxas e Custos</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.taxas}
                                            onChange={(e) => setFormData({...formData, taxas: e.target.value})}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Setor</label>
                                    <input
                                        type="text"
                                        value={formData.setor}
                                        onChange={(e) => setFormData({...formData, setor: e.target.value})}
                                        placeholder="Ex: Financeiro, Tecnologia, Varejo"
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
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

                {/* Modal de Dividendo */}
                {showModalDividendo && (
                    <div className="modal-overlay" onClick={() => setShowModalDividendo(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Adicionar Dividendo</h2>
                            <form onSubmit={handleSubmitDividendo}>
                                <div className="form-group">
                                    <label>Investimento</label>
                                    <select
                                        value={formDividendo.investimento_id}
                                        onChange={(e) => setFormDividendo({...formDividendo, investimento_id: e.target.value})}
                                    >
                                        <option value="">Todos</option>
                                        {investimentos.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.ticker}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formDividendo.valor}
                                        onChange={(e) => setFormDividendo({...formDividendo, valor: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data *</label>
                                    <input
                                        type="date"
                                        value={formDividendo.data}
                                        onChange={(e) => setFormDividendo({...formDividendo, data: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModalDividendo(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Metas */}
                {showModalMeta && (
                    <div className="modal-overlay" onClick={() => setShowModalMeta(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Metas de Investimento</h2>
                            <form onSubmit={handleSubmitMeta}>
                                <div className="form-group">
                                    <label>Meta de Patrimônio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={metas.patrimonio}
                                        onChange={(e) => setMetas({...metas, patrimonio: e.target.value})}
                                        placeholder="0.00"
                                    />
                                    <div className="meta-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{width: `${Math.min((valorAtualCarteira / (metas.patrimonio || 1)) * 100, 100)}%`}}
                                            ></div>
                                        </div>
                                        <span>{((valorAtualCarteira / (metas.patrimonio || 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Meta de Dividendos Mensais</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={metas.dividendos_mensais}
                                        onChange={(e) => setMetas({...metas, dividendos_mensais: e.target.value})}
                                        placeholder="0.00"
                                    />
                                    <div className="meta-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{width: `${Math.min((dividendosMes / (metas.dividendos_mensais || 1)) * 100, 100)}%`}}
                                            ></div>
                                        </div>
                                        <span>{((dividendosMes / (metas.dividendos_mensais || 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModalMeta(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

