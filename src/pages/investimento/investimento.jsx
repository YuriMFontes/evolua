import "./investimento.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
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
        corretora: "",
        data_compra: "",
        taxas: "",
        preco_atual: "",
        setor: ""
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

    useEffect(() => {
        fetchInvestimentos()
    }, [fetchInvestimentos])

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



    // Agrupar por tipo de ativo - mostrar quantidade
    const porTipoAtivo = useMemo(() => {
        const grupos = {}
        investimentos.forEach(inv => {
            const tipo = inv.tipo_ativo || "outros"
            if (!grupos[tipo]) {
                grupos[tipo] = { quantidade: 0, valor: 0 }
            }
            grupos[tipo].quantidade += parseFloat(inv.quantidade || 0)
            const precoAtual = parseFloat(inv.preco_atual || inv.preco_medio || 0)
            grupos[tipo].valor += parseFloat(inv.quantidade || 0) * precoAtual
        })
        return grupos
    }, [investimentos])


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
        <main>
            <Header/>
            <Sidebar/>
            <div className="investimento-container">
                <div className="investimento-header">
                    <h1 className="investimento-title">Investimentos</h1>
                    <div className="header-actions">
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

            </div>
        </main>
    )
}

