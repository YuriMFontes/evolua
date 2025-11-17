import "./dashboard.css"
import Sidebar from "../../componentes/side-bar/side-bar"
import Header from "../../componentes/header/header"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import { Doughnut } from "react-chartjs-2"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

// Categorizar despesa baseado na descrição
const categorizarDespesa = (descricao) => {
    if (!descricao) return "Outros"
    
    const desc = descricao.toLowerCase()
    
    // Fixas: contas básicas e serviços essenciais
    if (desc.match(/(luz|água|internet|plano|netflix|spotify|aluguel|ipva|seguro|financiamento)/)) {
        return "Fixas"
    }
    
    // Mercado: alimentação e produtos de supermercado
    if (desc.match(/(mercado|supermercado|padaria|comida|alimentação|restaurante|lanche|delivery|ifood|uber eats|rappi)/)) {
        return "Mercado"
    }
    
    // Lazer: entretenimento e diversão
    if (desc.match(/(cinema|teatro|show|festa|bar|balada|viagem|hotel|passagem|ingresso|jogo|games|playstation|xbox|nintendo|hobby|livro|revista|parque|praia|piscina|academia|ginásio|ginasio|esporte|futebol|basquete|natação|natacao)/)) {
        return "Lazer"
    }
    
    // Transporte
    if (desc.match(/(uber|taxi|ônibus|onibus|metrô|metro|combustível|combustivel|gasolina|álcool|alcool|estacionamento|pedágio|pedagio|manutenção|manutencao|oficina|pneu|óleo|oleo)/)) {
        return "Transporte"
    }
    
    // Saúde
    if (desc.match(/(médico|medico|hospital|clínica|clinica|farmacia|farmácia|remédio|remedio|medicamento|dentista|psicólogo|psicologo|exame|consulta|plano de saúde|plano de saude)/)) {
        return "Saúde"
    }
    
    // Educação
    if (desc.match(/(escola|faculdade|universidade|curso|aula|material escolar|material|livro didático|livro didatico|mensalidade|matrícula|matricula)/)) {
        return "Educação"
    }
    
    return "Outros"
}

export default function Dashboard(){
    const navigate = useNavigate();
    const { user } = useAuth()
    const [financeiro, setFinanceiro] = useState([])
    const [ultimasTransacoes, setUltimasTransacoes] = useState([])
    const [loading, setLoading] = useState(true)

    // Buscar dados do financeiro do mês atual
    const fetchFinanceiro = useCallback(async () => {
        if (!user) return
        
        try {
            setLoading(true)
            const hoje = new Date()
            const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
            const [ano, mes] = mesAtual.split('-')
            
            const { data, error } = await supabase
                .from("financeiro")
                .select("*")
                .eq("user_id", user.id)
                .order("vencimento", { ascending: true })

            if (error) throw error

            // Filtrar por mês atual
            const filtered = (data || []).filter(item => {
                const itemDate = new Date(item.vencimento)
                const itemAno = itemDate.getFullYear()
                const itemMes = itemDate.getMonth() + 1
                
                return itemAno === parseInt(ano) && itemMes === parseInt(mes)
            })

            setFinanceiro(filtered)
        } catch (error) {
            console.error("Erro ao buscar dados financeiros:", error)
        } finally {
            setLoading(false)
        }
    }, [user])

    // Buscar últimas transações pagas
    const fetchUltimasTransacoes = useCallback(async () => {
        if (!user) return
        
        try {
            const { data, error } = await supabase
                .from("financeiro")
                .select("*")
                .eq("user_id", user.id)
                .eq("status", "pago")
                .order("vencimento", { ascending: false })
                .limit(10)

            if (error) throw error
            setUltimasTransacoes(data || [])
        } catch (error) {
            console.error("Erro ao buscar últimas transações:", error)
        }
    }, [user])

    useEffect(() => {
        fetchFinanceiro()
        fetchUltimasTransacoes()
    }, [fetchFinanceiro, fetchUltimasTransacoes])

    // Calcular totais
    const calcularTotais = () => {
        const receitas = financeiro
            .filter(item => item.tipo === "receita")
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0)
        
        const despesas = financeiro
            .filter(item => item.tipo === "despesa")
            .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0)

        return { receitas, despesas }
    }

    // Calcular despesas por categoria
    const despesasPorCategoria = useMemo(() => {
        const despesas = financeiro.filter(item => item.tipo === "despesa")
        const categorias = {}
        
        despesas.forEach(item => {
            const categoria = categorizarDespesa(item.descricao)
            if (!categorias[categoria]) {
                categorias[categoria] = 0
            }
            categorias[categoria] += parseFloat(item.valor || 0)
        })
        
        return categorias
    }, [financeiro])

    // Formatar moeda
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    // Formatar data
    const formatarData = (data) => {
        if (!data) return ""
        const date = new Date(data)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const { receitas, despesas } = calcularTotais()

    // Preparar dados do gráfico
    const chartData = useMemo(() => {
        const categorias = Object.keys(despesasPorCategoria)
        const valores = Object.values(despesasPorCategoria)
        
        // Cores para cada categoria
        const cores = {
            "Fixas": "#4a6cf7",
            "Mercado": "#9b5de5",
            "Lazer": "#ff6b9d",
            "Transporte": "#ffa726",
            "Saúde": "#66bb6a",
            "Educação": "#42a5f5",
            "Outros": "#bdbdbd"
        }
        
        const backgroundColors = categorias.map(cat => cores[cat] || "#bdbdbd")
        
        return {
            labels: categorias,
            datasets: [
                {
                    label: "Despesas por Categoria",
                    data: valores,
                    backgroundColor: backgroundColors,
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    hoverOffset: 4
                }
            ]
        }
    }, [despesasPorCategoria])

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    },
                    generateLabels: function(chart) {
                        const data = chart.data
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i]
                                return {
                                    text: `${label}: ${formatarMoeda(value)}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }
                            })
                        }
                        return []
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || ""
                        const value = context.parsed || 0
                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                        const percentage = ((value / total) * 100).toFixed(1)
                        return `${label}: ${formatarMoeda(value)} (${percentage}%)`
                    }
                }
            }
        }
    }

    return(
       <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Dashboard</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Receitas</h2>
                            <h2 className="subtitle-section">
                                {loading ? "Carregando..." : formatarMoeda(receitas)}
                            </h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Despesas</h2>
                            <h2 className="subtitle-section">
                                {loading ? "Carregando..." : formatarMoeda(despesas)}
                            </h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Investimentos</h2>
                            <h2 className="subtitle-section">Informativos</h2>
                        </div>
                    </section>
                </div>
                <div className="dashboard-info">
                    <div className="dashboard-container">
                        <h1 className="dashboard-container-title">Distribuição de Despesas</h1>
                        {loading ? (
                            <p>Carregando...</p>
                        ) : Object.keys(despesasPorCategoria).length === 0 ? (
                            <p style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>
                                Nenhuma despesa encontrada para este mês
                            </p>
                        ) : (
                            <div className="chart-container">
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                        )}
                    </div>
                    <div className="dashboard-container">
                        <h1 className="dashboard-container-title">Últimas transações</h1>
                        {loading ? (
                            <p style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>Carregando...</p>
                        ) : ultimasTransacoes.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>
                                Nenhuma transação paga encontrada
                            </p>
                        ) : (
                            <div className="transacoes-list">
                                {ultimasTransacoes.map((transacao) => (
                                    <div key={transacao.id} className="transacao-item">
                                        <div className="transacao-info">
                                            <div className="transacao-descricao">{transacao.descricao}</div>
                                            <div className="transacao-data">{formatarData(transacao.vencimento)}</div>
                                        </div>
                                        <div className={`transacao-valor ${transacao.tipo === "receita" ? "receita" : "despesa"}`}>
                                            {transacao.tipo === "receita" ? "+" : "-"} {formatarMoeda(transacao.valor)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="dashboard-container-saude">
                        <h1 className="dashboard-container-title">Saúde</h1>
                        <p>Metas aqui</p>
                    </div>
                    <div className="dashboard-container-saude">
                        <h1 className="dashboard-container-title">Investimentos</h1>
                        <p>Metas aqui</p>
                    </div>
                </div>
            </div>
       </main>  
    );
}