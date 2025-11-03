import "./financeiro.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

export default function Financeiro(){
    const { user } = useAuth()
    const [financeiro, setFinanceiro] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        tipo: "",
        descricao: "",
        valor: "",
        vencimento: "",
        status: "pendente"
    })

    // Buscar dados do financeiro
    const fetchFinanceiro = useCallback(async () => {
        if (!user) return
        
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("financeiro")
                .select("*")
                .eq("user_id", user.id)
                .order("vencimento", { ascending: true })

            if (error) throw error
            setFinanceiro(data || [])
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
        
        const saldo = receitas - despesas

        return { receitas, despesas, saldo }
    }

    // Calcular status baseado na data
    const calcularStatus = (vencimento, statusManual) => {
        if (statusManual === "pago") return "pago"
        
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataVenc = new Date(vencimento)
        dataVenc.setHours(0, 0, 0, 0)
        
        if (dataVenc < hoje && statusManual !== "pago") {
            return "atrasado"
        }
        return "pendente"
    }

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
        return new Date(data).toLocaleDateString('pt-BR')
    }

    // Adicionar novo registro
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!user) {
            alert("Usuário não autenticado")
            return
        }

        try {
            // Se for receita, status é sempre "pago" (recebido)
            // Se for despesa, calcular status baseado na data
            let statusFinal = formData.tipo === "receita" ? "pago" : calcularStatus(formData.vencimento, formData.status)

            const { error } = await supabase
                .from("financeiro")
                .insert([{
                    user_id: user.id,
                    tipo: formData.tipo,
                    descricao: formData.descricao,
                    valor: parseFloat(formData.valor),
                    vencimento: formData.vencimento,
                    status: statusFinal
                }])

            if (error) throw error

            // Limpar formulário e recarregar dados
            setFormData({
                tipo: "",
                descricao: "",
                valor: "",
                vencimento: "",
                status: "pendente"
            })
            setShowModal(false)
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao adicionar registro:", error)
            alert("Erro ao adicionar registro: " + error.message)
        }
    }

    // Atualizar status
    const handleStatusChange = async (id, novoStatus) => {
        try {
            const { error } = await supabase
                .from("financeiro")
                .update({ status: novoStatus })
                .eq("id", id)

            if (error) throw error
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao atualizar status:", error)
        }
    }

    // Deletar registro
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este registro?")) {
            return
        }

        try {
            const { error } = await supabase
                .from("financeiro")
                .delete()
                .eq("id", id)

            if (error) throw error
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao deletar registro:", error)
        }
    }

    const { receitas, despesas, saldo } = calcularTotais()

    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="financeiro">
                <div className="title-container">
                    <h1 className="title-financeiro">Financeiro</h1>
                    <button className="btn-adicionar" onClick={() => setShowModal(true)}>
                        + Adicionar
                    </button>
                </div>
                
                <div className="content-financeiro">
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Receitas</h2>
                            <h2 className="subtitle-section">{formatarMoeda(receitas)}</h2>
                        </div>
                    </section>
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Despesas</h2>
                            <h2 className="subtitle-section">{formatarMoeda(despesas)}</h2>
                        </div>
                    </section>
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Saldo do Mês</h2>
                            <h2 className={`subtitle-section ${saldo < 0 ? 'saldo-negativo' : ''}`}>
                                {formatarMoeda(saldo)}
                            </h2>
                        </div>
                    </section>
                    <section className="section-status">
                        <div>
                            {loading ? (
                                <p>Carregando...</p>
                            ) : financeiro.length === 0 ? (
                                <p className="sem-dados">Nenhum registro encontrado. Clique em "Adicionar" para começar.</p>
                            ) : (
                                <table className="status-table">
                                    <thead>
                                        <tr>
                                            <th>Conta</th>
                                            <th>Tipo</th>
                                            <th>Valor</th>
                                            <th>Data/Vencimento</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financeiro.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.descricao}</td>
                                                <td className={`tipo-badge tipo-${item.tipo}`}>
                                                    {item.tipo === "receita" ? "Receita" : "Despesa"}
                                                </td>
                                                <td>{formatarMoeda(item.valor)}</td>
                                                <td>{formatarData(item.vencimento)}</td>
                                                <td>
                                                    {item.tipo === "receita" ? (
                                                        <span className="status-select status-pago" style={{ cursor: "default" }}>
                                                            Recebido
                                                        </span>
                                                    ) : (
                                                        <select 
                                                            value={item.status}
                                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                            className={`status-select status-${item.status}`}
                                                        >
                                                            <option value="pendente">Pendente</option>
                                                            <option value="atrasado">Atrasado</option>
                                                            <option value="pago">Pago</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn-deletar"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {/* Modal de Adicionar */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Adicionar Registro Financeiro</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tipo *</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="receita">Receita</option>
                                        <option value="despesa">Despesa</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Descrição *</label>
                                    <input
                                        type="text"
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                        required
                                        placeholder="Ex: Luz, Internet, Salário..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.valor}
                                        onChange={(e) => setFormData({...formData, valor: e.target.value})}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{formData.tipo === "receita" ? "Data de Recebimento" : "Vencimento"} *</label>
                                    <input
                                        type="date"
                                        value={formData.vencimento}
                                        onChange={(e) => setFormData({...formData, vencimento: e.target.value})}
                                        required
                                    />
                                </div>
                                {formData.tipo === "despesa" && (
                                    <div className="form-group">
                                        <label>Status Inicial *</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            required
                                        >
                                            <option value="pendente">Pendente</option>
                                            <option value="pago">Pago</option>
                                        </select>
                                    </div>
                                )}
                                {formData.tipo === "receita" && (
                                    <div style={{ 
                                        padding: "12px", 
                                        background: "linear-gradient(135deg, #d4edda, #c3e6cb)", 
                                        borderRadius: "12px", 
                                        fontSize: "14px", 
                                        color: "#155724",
                                        fontWeight: "500"
                                    }}>
                                        ℹ️ Receitas são sempre marcadas como recebidas automaticamente
                                    </div>
                                )}
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-salvar">
                                        Salvar
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