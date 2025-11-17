import "./dashboard.css"
import Sidebar from "../../componentes/side-bar/side-bar"
import Header from "../../componentes/header/header"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

export default function Dashboard(){
    const navigate = useNavigate();
    const { user } = useAuth()
    const [financeiro, setFinanceiro] = useState([])
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

    useEffect(() => {
        fetchFinanceiro()
    }, [fetchFinanceiro])

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

    // Formatar moeda
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    const { receitas, despesas } = calcularTotais()

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
                        <p>Gráfico principal aqui</p>
                    </div>
                    <div className="dashboard-container">
                        <h1 className="dashboard-container-title">Últimas transações</h1>
                        <p>Resumo aqui</p>
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