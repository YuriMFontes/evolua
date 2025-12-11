import "./financeiro.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

export default function Financeiro(){
    const { user } = useAuth()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [financeiro, setFinanceiro] = useState([])
    const [financeiroCompleto, setFinanceiroCompleto] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [mesFiltro, setMesFiltro] = useState(() => {
        const hoje = new Date()
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    })
    const [formData, setFormData] = useState({
        tipo: "",
        descricao: "",
        valor: "",
        vencimento: "",
        status: "pendente",
        parcelado: false,
        quantidadeParcelas: 1,
        contaFixa: false
    })
    const [tabAtiva, setTabAtiva] = useState("financeiro")
    const defaultVencimentoCartao = () => {
        const hoje = new Date()
        const diaVenc = 8
        const venc = new Date()
        venc.setHours(0, 0, 0, 0)
        if (hoje.getDate() > diaVenc) {
            venc.setMonth(venc.getMonth() + 1)
        }
        venc.setDate(diaVenc)
        return venc.toISOString().split("T")[0]
    }
    const [cartaoResumo, setCartaoResumo] = useState({
        cartao: "",
        vencimento: ""
    })
    const [cartoes, setCartoes] = useState([])
    const [novoCartao, setNovoCartao] = useState("")
    const [novoCartaoVencimento, setNovoCartaoVencimento] = useState(8)
    const [cartaoItem, setCartaoItem] = useState({
        descricao: "",
        valor: ""
    })
    const [cartaoItems, setCartaoItems] = useState([])
    const [showEditModal, setShowEditModal] = useState(false)
    const [editData, setEditData] = useState({
        id: null,
        descricao: "",
        valor: "",
        vencimento: "",
        status: "pendente"
    })

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

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
            setFinanceiroCompleto(data || [])
        } catch (error) {
            console.error("Erro ao buscar dados financeiros:", error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchFinanceiro()
    }, [fetchFinanceiro])

    // Filtrar dados por mês
    useEffect(() => {
        if (!financeiroCompleto.length) {
            setFinanceiro([])
            return
        }

        const [ano, mes] = mesFiltro.split('-')
        const filtered = financeiroCompleto.filter(item => {
            const itemDate = parseDateOnly(item.vencimento)
            if (!itemDate) return false
            const itemAno = itemDate.getFullYear()
            const itemMes = itemDate.getMonth() + 1
            
            return itemAno === parseInt(ano) && itemMes === parseInt(mes)
        })

        setFinanceiro(filtered)
    }, [mesFiltro, financeiroCompleto])

    // Buscar cartões salvos
    useEffect(() => {
        const fetchCartoes = async () => {
            if (!user) return
            const { data, error } = await supabase
                .from("cartoes")
                .select("*")
                .eq("user_id", user.id)
                .order("nome", { ascending: true })
            if (!error && data) setCartoes(data)
        }
        fetchCartoes()
    }, [user])

    // Sempre que selecionar cartão, define o vencimento a partir do dia do cartão
    useEffect(() => {
        if (!cartaoResumo.cartao) {
            setCartaoResumo(prev => ({ ...prev, vencimento: "" }))
            return
        }
        const card = cartoes.find(c => c.nome === cartaoResumo.cartao)
        if (card?.vencimento_dia) {
            const prox = proximoVencimentoDia(card.vencimento_dia)
            setCartaoResumo(prev => ({ ...prev, vencimento: prox }))
        }
    }, [cartaoResumo.cartao, cartoes])

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

    // Garantir que datas "YYYY-MM-DD" sejam tratadas como datas locais (evita fuso/UTC)
    const parseDateOnly = (dateString) => {
        if (!dateString) return null
        const [year, month, day] = dateString.split("-").map(Number)
        return new Date(year, (month || 1) - 1, day || 1)
    }

    // Calcular status baseado na data
    const calcularStatus = (vencimento, statusManual) => {
        if (statusManual === "pago") return "pago"
        
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataVenc = parseDateOnly(vencimento)
        if (!dataVenc) return statusManual || "pendente"
        dataVenc.setHours(0, 0, 0, 0)
        
        if (dataVenc < hoje && statusManual !== "pago") {
            return "atrasado"
        }
        return "pendente"
    }

    // Status calculado em tempo real (despesas vencidas viram "atrasado" automaticamente)
    const getStatusComAtraso = (item) => {
        if (item.tipo !== "despesa") return "pago"
        return calcularStatus(item.vencimento, item.status)
    }

    const totalCartao = cartaoItems.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0)

    const proximoVencimentoDia = (dia) => {
        if (!dia) return ""
        const hoje = new Date()
        const venc = new Date()
        venc.setHours(0, 0, 0, 0)
        venc.setDate(dia)
        if (venc < hoje) {
            venc.setMonth(venc.getMonth() + 1)
        }
        return venc.toISOString().split("T")[0]
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

            // Se for parcelado, criar múltiplos registros
            if (formData.tipo === "despesa" && formData.contaFixa) {
                const registrosFixos = []
                const dataBase = parseDateOnly(formData.vencimento)

                for (let i = 0; i < 12; i++) {
                    const dataMes = new Date(dataBase)
                    dataMes.setMonth(dataBase.getMonth() + i)
                    const labelMes = `${String(dataMes.getMonth() + 1).padStart(2, '0')}/${dataMes.getFullYear()}`

                    registrosFixos.push({
                        user_id: user.id,
                        tipo: formData.tipo,
                        descricao: `${formData.descricao} - ${labelMes}`,
                        valor: parseFloat(formData.valor),
                        vencimento: dataMes.toISOString().split('T')[0],
                        status: calcularStatus(dataMes.toISOString().split('T')[0], formData.status)
                    })
                }

                const { error } = await supabase
                    .from("financeiro")
                    .insert(registrosFixos)

                if (error) throw error
            } else if (formData.parcelado && formData.quantidadeParcelas > 1 && formData.tipo === "despesa") {
                const registros = []
                const valorParcela = parseFloat(formData.valor) / formData.quantidadeParcelas
                const dataBase = parseDateOnly(formData.vencimento)
                
                for (let i = 0; i < formData.quantidadeParcelas; i++) {
                    const dataParcela = new Date(dataBase)
                    dataParcela.setMonth(dataBase.getMonth() + i)
                    
                    registros.push({
                        user_id: user.id,
                        tipo: formData.tipo,
                        descricao: `${formData.descricao} (${i + 1}/${formData.quantidadeParcelas})`,
                        valor: Math.round(valorParcela * 100) / 100, // Arredonda para 2 casas decimais
                        vencimento: dataParcela.toISOString().split('T')[0],
                        status: calcularStatus(dataParcela.toISOString().split('T')[0], formData.status)
                    })
                }

                const { error } = await supabase
                    .from("financeiro")
                    .insert(registros)

                if (error) throw error
            } else {
                // Registro único (sem parcelamento)
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
            }

            // Limpar formulário e recarregar dados
            setFormData({
                tipo: "",
                descricao: "",
                valor: "",
                vencimento: "",
                status: "pendente",
                parcelado: false,
                quantidadeParcelas: 1,
                contaFixa: false
            })
            setShowModal(false)
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao adicionar registro:", error)
            alert("Erro ao adicionar registro: " + error.message)
        }
    }

    // Adicionar item local na aba de cartão (não salva ainda no financeiro)
    const handleAddCartaoItem = (e) => {
        e.preventDefault()
        if (!cartaoItem.descricao || !cartaoItem.valor) {
            alert("Preencha descrição e valor do item")
            return
        }
        setCartaoItems(prev => [...prev, { descricao: cartaoItem.descricao, valor: parseFloat(cartaoItem.valor) || 0 }])
        setCartaoItem({ descricao: "", valor: "" })
    }

    const handleRemoveCartaoItem = (idx) => {
        setCartaoItems(prev => prev.filter((_, i) => i !== idx))
    }

    // Criar cartão (salvo no supabase)
    const handleCriarCartao = async () => {
        if (!novoCartao.trim()) {
            alert("Informe o nome do cartão")
            return
        }
        if (!novoCartaoVencimento || novoCartaoVencimento < 1 || novoCartaoVencimento > 28) {
            alert("Informe o dia de vencimento (1 a 28)")
            return
        }
        if (!user) {
            alert("Usuário não autenticado")
            return
        }
        try {
            const { error } = await supabase
                .from("cartoes")
                .insert([{ user_id: user.id, nome: novoCartao.trim(), vencimento_dia: novoCartaoVencimento }])
            if (error) throw error
            setNovoCartao("")
            setNovoCartaoVencimento(8)
            const { data } = await supabase
                .from("cartoes")
                .select("*")
                .eq("user_id", user.id)
                .order("nome", { ascending: true })
            if (data) setCartoes(data)
        } catch (error) {
            console.error("Erro ao criar cartão:", error)
            alert("Erro ao criar cartão: " + error.message)
        }
    }

    // Registrar fatura de cartão como uma única despesa no financeiro
    const handleRegistrarFatura = async () => {
        if (!user) {
            alert("Usuário não autenticado")
            return
        }
        if (!cartaoResumo.vencimento) {
            alert("Defina o vencimento do cartão (selecionando um cartão salvo com dia de vencimento).")
            return
        }
        if (!cartaoItems.length) {
            alert("Adicione ao menos um item de cartão")
            return
        }

        try {
            const descricaoFinal = `Cartão de crédito ${cartaoResumo.cartao || ""}`.trim()
            const statusFinal = calcularStatus(cartaoResumo.vencimento, "pendente")

            // Verifica se já existe fatura desse cartão nesse vencimento
            const { data: faturaExistente, error: erroBusca } = await supabase
                .from("financeiro")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_cartao", true)
                .eq("vencimento", cartaoResumo.vencimento)
                .eq("descricao", descricaoFinal)
                .limit(1)
                .single()

            if (erroBusca && erroBusca.code !== "PGRST116") {
                throw erroBusca
            }

            if (faturaExistente) {
                const novoValor = parseFloat(faturaExistente.valor || 0) + totalCartao
                const { error } = await supabase
                    .from("financeiro")
                    .update({
                        valor: novoValor,
                        status: statusFinal
                    })
                    .eq("id", faturaExistente.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("financeiro")
                    .insert([{
                        user_id: user.id,
                        tipo: "despesa",
                        descricao: descricaoFinal,
                        valor: totalCartao,
                        vencimento: cartaoResumo.vencimento,
                        status: statusFinal,
                        is_cartao: true
                    }])
                if (error) throw error
            }

            setCartaoItems([])
            setCartaoItem({ descricao: "", valor: "" })
            setCartaoResumo(prev => ({ ...prev, vencimento: defaultVencimentoCartao() }))
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao registrar fatura:", error)
            alert("Erro ao registrar fatura: " + error.message)
        }
    }

    // Abrir modal de edição (somente despesas)
    const handleEditOpen = (item) => {
        setEditData({
            id: item.id,
            descricao: item.descricao || "",
            valor: item.valor?.toString() || "",
            vencimento: item.vencimento || "",
            status: item.status || "pendente"
        })
        setShowEditModal(true)
    }

    // Salvar alterações de despesa
    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editData.id || !user) {
            alert("Registro inválido ou usuário não autenticado")
            return
        }

        try {
            const statusAtualizado = calcularStatus(editData.vencimento, editData.status)
            const { error } = await supabase
                .from("financeiro")
                .update({
                    descricao: editData.descricao,
                    valor: parseFloat(editData.valor),
                    vencimento: editData.vencimento,
                    status: statusAtualizado
                })
                .eq("id", editData.id)

            if (error) throw error

            setShowEditModal(false)
            setEditData({ id: null, descricao: "", valor: "", vencimento: "", status: "pendente" })
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao atualizar registro:", error)
            alert("Erro ao atualizar registro: " + error.message)
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
        console.log("handleDelete chamado com ID:", id)
        
        if (!window.confirm("Tem certeza que deseja excluir este registro?")) {
            return
        }

        if (!user) {
            alert("Usuário não autenticado")
            return
        }

        try {
            console.log("Buscando registro no banco...")
            // Primeiro, buscar o registro para verificar se é parcelado
            const { data: registro, error: errorBuscaRegistro } = await supabase
                .from("financeiro")
                .select("*")
                .eq("id", id)
                .single()

            if (errorBuscaRegistro) {
                console.error("Erro ao buscar registro:", errorBuscaRegistro)
                throw errorBuscaRegistro
            }

            if (!registro) {
                alert("Registro não encontrado")
                return
            }

            console.log("Registro encontrado:", registro)

            // Verificar se é uma parcela (tem o formato "Descrição (x/y)")
            const matchParcela = registro.descricao.match(/\((\d+)\/(\d+)\)$/)
            console.log("Match parcela:", matchParcela)
            
            if (matchParcela) {
                // É uma parcela, buscar todas as parcelas do mesmo grupo
                const descBase = registro.descricao.replace(/\s*\(\d+\/\d+\)$/, "")
                console.log("Descrição base:", descBase)
                
                // Buscar todos os registros do usuário e filtrar localmente
                const { data: todosRegistros, error: errorBusca } = await supabase
                    .from("financeiro")
                    .select("id, descricao")
                    .eq("user_id", user.id)

                if (errorBusca) throw errorBusca
                console.log("Todos os registros:", todosRegistros)

                // Filtrar parcelas que começam com descBase
                const parcelasParaExcluir = (todosRegistros || []).filter(item => {
                    return item.descricao.startsWith(descBase) && item.descricao.match(/\(\d+\/\d+\)$/)
                })
                console.log("Parcelas para excluir:", parcelasParaExcluir)

                if (parcelasParaExcluir.length > 0) {
                    const idsParaExcluir = parcelasParaExcluir.map(p => p.id)
                    console.log("IDs para excluir:", idsParaExcluir)
                    const { error } = await supabase
                        .from("financeiro")
                        .delete()
                        .in("id", idsParaExcluir)

                    if (error) throw error
                    alert(`Todas as parcelas foram excluídas (${parcelasParaExcluir.length} parcelas)`)
                }
            } else {
                // Não é uma parcela, excluir apenas esse registro
                console.log("Excluindo registro único")
                const { error } = await supabase
                    .from("financeiro")
                    .delete()
                    .eq("id", id)

                if (error) throw error
                alert("Registro excluído com sucesso!")
            }

            console.log("Recarregando dados...")
            fetchFinanceiro()
        } catch (error) {
            console.error("Erro ao deletar registro:", error)
            alert("Erro ao deletar registro: " + error.message)
        }
    }

    const { receitas, despesas, saldo } = calcularTotais()

    return(
        <main>
            <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
            <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar}/>
            <div className="financeiro">
                <div className="title-container">
                    <h1 className="title-financeiro">Financeiro</h1>
                    <div className="tabs-financeiro">
                        <button 
                            className={`tab-btn ${tabAtiva === "financeiro" ? "active" : ""}`}
                            onClick={() => setTabAtiva("financeiro")}
                        >
                            Lançamentos
                        </button>
                        <button 
                            className={`tab-btn ${tabAtiva === "cartoes" ? "active" : ""}`}
                            onClick={() => setTabAtiva("cartoes")}
                        >
                            Cartões
                        </button>
                    </div>
                    <button className="btn-adicionar" onClick={() => setShowModal(true)}>
                        + Adicionar
                    </button>
                </div>

                {tabAtiva === "financeiro" && (
                    <>
                        <div className="filtro-container">
                            <label htmlFor="mes-filtro" className="filtro-label">Filtrar por Mês:</label>
                            <input
                                type="month"
                                id="mes-filtro"
                                value={mesFiltro}
                                onChange={(e) => setMesFiltro(e.target.value)}
                                className="input-mes-filtro"
                            />
                            <button 
                                className="btn-hoje"
                                onClick={() => {
                                    const hoje = new Date()
                                    setMesFiltro(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`)
                                }}
                            >
                                Hoje
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
                        </div>
                    </>
                )}

                {tabAtiva === "financeiro" && (
                    <>
                        {/* Seção de Despesas */}
                        <div className="secao-tipo-financeiro">
                            <h2 className="titulo-secao-tipo">💸 Despesas</h2>
                            <section className="section-status">
                                <div>
                                    {loading ? (
                                        <p>Carregando...</p>
                                    ) : financeiro.filter(item => item.tipo === "despesa").length === 0 ? (
                                        <p className="sem-dados">Nenhuma despesa encontrada. Clique em "Adicionar" para começar.</p>
                                    ) : (
                                        <table className="status-table">
                                            <thead>
                                                <tr>
                                                    <th>Descrição</th>
                                                    <th>Valor</th>
                                                    <th>Vencimento</th>
                                                    <th>Status</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financeiro.filter(item => item.tipo === "despesa").map(item => {
                                                    const statusCalculado = getStatusComAtraso(item)
                                                    return (
                                                        <tr key={item.id}>
                                                            <td data-label="Descrição">{item.descricao}</td>
                                                            <td data-label="Valor">{formatarMoeda(item.valor)}</td>
                                                            <td data-label="Vencimento">{formatarData(item.vencimento)}</td>
                                                            <td data-label="Status">
                                                                <select 
                                                                    value={statusCalculado}
                                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                                    className={`status-select status-${statusCalculado}`}
                                                                >
                                                                    <option value="pendente">Pendente</option>
                                                                    <option value="atrasado">Atrasado</option>
                                                                    <option value="pago">Pago</option>
                                                                </select>
                                                            </td>
                                                            <td data-label="Ações">
                                                                <div className="acoes-btns">
                                                                    <button 
                                                                        className="btn-editar"
                                                                        onClick={() => handleEditOpen(item)}
                                                                        title="Editar"
                                                                    >
                                                                        ✏️ Editar
                                                                    </button>
                                                                    <button 
                                                                        className="btn-deletar"
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        Excluir
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Seção de Recebimentos */}
                        <div className="secao-tipo-financeiro">
                            <h2 className="titulo-secao-tipo">💰 Recebimentos</h2>
                            <section className="section-status">
                                <div>
                                    {loading ? (
                                        <p>Carregando...</p>
                                    ) : financeiro.filter(item => item.tipo === "receita").length === 0 ? (
                                        <p className="sem-dados">Nenhum recebimento encontrado. Clique em "Adicionar" para começar.</p>
                                    ) : (
                                        <table className="status-table">
                                            <thead>
                                                <tr>
                                                    <th>Descrição</th>
                                                    <th>Valor</th>
                                                    <th>Data de Recebimento</th>
                                                    <th>Status</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financeiro.filter(item => item.tipo === "receita").map(item => (
                                                    <tr key={item.id}>
                                                        <td data-label="Descrição">{item.descricao}</td>
                                                        <td data-label="Valor">{formatarMoeda(item.valor)}</td>
                                                        <td data-label="Data de Recebimento">{formatarData(item.vencimento)}</td>
                                                        <td data-label="Status">
                                                            <span className="status-select status-pago" style={{ cursor: "default" }}>
                                                                Recebido
                                                            </span>
                                                        </td>
                                                        <td data-label="Ações">
                                                            <div className="acoes-btns">
                                                                <button 
                                                                    className="btn-deletar"
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {tabAtiva === "cartoes" && (
                    <div className="cartoes-wrapper">
                        <section className="section-status">
                            <h2 className="titulo-secao-tipo">💳 Cartões - Lançar gastos</h2>
                            <form className="form-cartao" onSubmit={handleAddCartaoItem}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cartão *</label>
                                        <select
                                            value={cartaoResumo.cartao}
                                            onChange={(e) => setCartaoResumo({...cartaoResumo, cartao: e.target.value})}
                                            required
                                        >
                                            <option value="">Selecione ou cadastre</option>
                                            {cartoes.map(c => (
                                                <option key={c.id} value={c.nome}>{c.nome} (vence dia {c.vencimento_dia || "?"})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Novo cartão</label>
                                        <div className="form-inline">
                                            <input
                                                type="text"
                                                value={novoCartao}
                                                onChange={(e) => setNovoCartao(e.target.value)}
                                                placeholder="Ex: Santander, Nubank..."
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="28"
                                                value={novoCartaoVencimento}
                                                onChange={(e) => setNovoCartaoVencimento(parseInt(e.target.value, 10) || 1)}
                                                style={{ maxWidth: "90px" }}
                                                title="Dia de vencimento (1 a 28)"
                                            />
                                            <button type="button" className="btn-salvar" onClick={handleCriarCartao}>
                                                + Salvar cartão
                                            </button>
                                        </div>
                                        <p className="hint-vencimento">Informe o dia de vencimento do cartão (1 a 28). Ao selecionar o cartão, usamos o próximo vencimento.</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Vencimento da fatura</label>
                                        <input
                                            type="text"
                                            value={cartaoResumo.vencimento ? formatarData(cartaoResumo.vencimento) : ""}
                                            readOnly
                                            placeholder="Selecione um cartão para definir o vencimento"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Descrição do gasto *</label>
                                        <input
                                            type="text"
                                            value={cartaoItem.descricao}
                                            onChange={(e) => setCartaoItem({...cartaoItem, descricao: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={cartaoItem.valor}
                                            onChange={(e) => setCartaoItem({...cartaoItem, valor: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group form-group-button">
                                        <label>&nbsp;</label>
                                        <button type="submit" className="btn-salvar">
                                            Adicionar item
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        <section className="section-status">
                            <h2 className="titulo-secao-tipo">🧾 Gastos de cartão</h2>
                            <div>
                                {cartaoItems.length === 0 ? (
                                    <p className="sem-dados">Nenhum item adicionado. Preencha acima e clique em "Adicionar item".</p>
                                ) : (
                                    <table className="status-table">
                                        <thead>
                                            <tr>
                                                <th>Descrição</th>
                                                <th>Valor</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartaoItems.map((item, idx) => (
                                                <tr key={`${item.descricao}-${idx}`}>
                                                    <td data-label="Descrição">{item.descricao}</td>
                                                    <td data-label="Valor">{formatarMoeda(item.valor)}</td>
                                                    <td data-label="Ações">
                                                        <div className="acoes-btns">
                                                            <button 
                                                                className="btn-deletar"
                                                                onClick={() => handleRemoveCartaoItem(idx)}
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                <div className="cartao-total">
                                    <span>Total desta fatura:</span>
                                    <strong>{formatarMoeda(totalCartao)}</strong>
                                </div>
                                <div className="modal-buttons" style={{ justifyContent: "flex-end", marginTop: "16px" }}>
                                    <button type="button" className="btn-salvar" onClick={handleRegistrarFatura} disabled={!cartaoItems.length}>
                                        Registrar fatura no financeiro
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

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
                                    <>
                                        <div className="form-group checkbox-inline">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.parcelado}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        parcelado: e.target.checked,
                                                        contaFixa: e.target.checked ? false : prev.contaFixa
                                                    }))}
                                                    disabled={formData.contaFixa}
                                                />
                                                Despesa Parcelada
                                            </label>
                                        </div>
                                        {formData.parcelado && (
                                            <div className="form-group">
                                                <label>Quantidade de Parcelas *</label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="48"
                                                    value={formData.quantidadeParcelas}
                                                    onChange={(e) => setFormData({...formData, quantidadeParcelas: parseInt(e.target.value) || 1})}
                                                    required
                                                    placeholder="Ex: 10"
                                                />
                                                {formData.valor && formData.parcelado && (
                                                    <div style={{ 
                                                        marginTop: "8px",
                                                        padding: "8px", 
                                                        background: "linear-gradient(135deg, #e7f3ff, #d0e9ff)", 
                                                        borderRadius: "8px", 
                                                        fontSize: "13px", 
                                                        color: "#0066cc",
                                                        fontWeight: "500"
                                                    }}>
                                                        💰 Valor da parcela: {formatarMoeda(parseFloat(formData.valor || 0) / formData.quantidadeParcelas)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="form-group checkbox-inline">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.contaFixa}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        contaFixa: e.target.checked,
                                                        parcelado: e.target.checked ? false : prev.parcelado
                                                    }))}
                                                />
                                                Conta fixa (replicar pelos próximos 12 meses)
                                            </label>
                                            <p className="checkbox-hint">
                                                Começando da data escolhida, criaremos um lançamento por mês durante 12 meses.
                                            </p>
                                        </div>
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
                                    </>
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

                {/* Modal de Edição de Despesa */}
                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Editar Despesa</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group">
                                    <label>Descrição *</label>
                                    <input
                                        type="text"
                                        value={editData.descricao}
                                        onChange={(e) => setEditData({...editData, descricao: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.valor}
                                        onChange={(e) => setEditData({...editData, valor: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vencimento *</label>
                                    <input
                                        type="date"
                                        value={editData.vencimento}
                                        onChange={(e) => setEditData({...editData, vencimento: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowEditModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-salvar">
                                        Salvar alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Edição de Despesa */}
                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Editar Despesa</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group">
                                    <label>Descrição *</label>
                                    <input
                                        type="text"
                                        value={editData.descricao}
                                        onChange={(e) => setEditData({...editData, descricao: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.valor}
                                        onChange={(e) => setEditData({...editData, valor: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vencimento *</label>
                                    <input
                                        type="date"
                                        value={editData.vencimento}
                                        onChange={(e) => setEditData({...editData, vencimento: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowEditModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-salvar">
                                        Salvar alterações
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