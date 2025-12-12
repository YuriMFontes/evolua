import { useState, useEffect, useCallback } from "react"
import "./saude.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import { Line, Bar } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export default function Saude() {
    const { user } = useAuth()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    
    // Estados para medidas
    const [medidas, setMedidas] = useState([])
    const [showModalMedida, setShowModalMedida] = useState(false)
    const [formMedida, setFormMedida] = useState({
        peso: "",
        altura: "",
        data_medicao: new Date().toISOString().split("T")[0],
        observacoes: ""
    })
    
    // Estados para treinos
    const [treinos, setTreinos] = useState([])
    const [showModalTreino, setShowModalTreino] = useState(false)
    const [formTreino, setFormTreino] = useState({
        data_treino: new Date().toISOString().split("T")[0],
        tipo_treino: "jiu-jitsu",
        presenca: true,
        observacoes: "",
        duracao_minutos: "",
        intensidade: "moderada"
    })
    
    // Estados para metas
    const [meta, setMeta] = useState(null)
    const [showModalMeta, setShowModalMeta] = useState(false)
    const [formMeta, setFormMeta] = useState({
        meta_peso: "",
        meta_imc: "",
        meta_treinos_mes: 8,
        dias_treino_semana: ["segunda", "quarta"]
    })
    
    // Estado para filtro de mês
    const [mesFiltro, setMesFiltro] = useState(() => {
        const hoje = new Date()
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    })

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    // Buscar medidas
    const fetchMedidas = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("saude_medidas")
                .select("*")
                .eq("user_id", user.id)
                .order("data_medicao", { ascending: false })
                .limit(50)

            if (error) throw error
            setMedidas(data || [])
        } catch (error) {
            console.error("Erro ao buscar medidas:", error)
        }
    }, [user])

    // Buscar treinos
    const fetchTreinos = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("treinos")
                .select("*")
                .eq("user_id", user.id)
                .order("data_treino", { ascending: false })
                .limit(200)

            if (error) throw error
            setTreinos(data || [])
        } catch (error) {
            console.error("Erro ao buscar treinos:", error)
        }
    }, [user])

    // Buscar meta
    const fetchMeta = useCallback(async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from("metas_saude")
                .select("*")
                .eq("user_id", user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error // PGRST116 = nenhum resultado
            setMeta(data || null)
            if (data) {
                setFormMeta({
                    meta_peso: data.meta_peso || "",
                    meta_imc: data.meta_imc || "",
                    meta_treinos_mes: data.meta_treinos_mes || 8,
                    dias_treino_semana: data.dias_treino_semana || ["segunda", "quarta"]
                })
            }
        } catch (error) {
            console.error("Erro ao buscar meta:", error)
        }
    }, [user])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchMedidas(), fetchTreinos(), fetchMeta()])
            setLoading(false)
        }
        loadData()
    }, [fetchMedidas, fetchTreinos, fetchMeta])

    // Calcular IMC
    const calcularIMC = (peso, altura) => {
        if (!peso || !altura) return 0
        return (peso / (altura * altura)).toFixed(2)
    }

    // Obter última medida
    const ultimaMedida = medidas[0] || null
    const imcAtual = ultimaMedida ? calcularIMC(ultimaMedida.peso, ultimaMedida.altura) : 0

    // Estatísticas de treinos
    const calcularEstatisticasTreinos = () => {
        const [ano, mes] = mesFiltro.split('-')
        const treinosMes = treinos.filter(t => {
            const dataTreino = new Date(t.data_treino)
            return dataTreino.getFullYear() === parseInt(ano) && 
                   dataTreino.getMonth() + 1 === parseInt(mes)
        })

        const treinosFeitos = treinosMes.filter(t => t.presenca === true).length
        const treinosFaltados = treinosMes.filter(t => t.presenca === false).length
        const totalTreinos = treinosFeitos + treinosFaltados

        // Calcular meses ativos (meses com pelo menos 1 treino)
        const mesesUnicos = new Set()
        treinos.forEach(t => {
            const data = new Date(t.data_treino)
            mesesUnicos.add(`${data.getFullYear()}-${data.getMonth() + 1}`)
        })
        const mesesAtivos = mesesUnicos.size

        // Calcular tempo total (primeiro treino até hoje)
        let tempoTotal = "0 meses"
        if (treinos.length > 0) {
            const primeiroTreino = new Date(Math.min(...treinos.map(t => new Date(t.data_treino).getTime())))
            const hoje = new Date()
            const diffMeses = (hoje.getFullYear() - primeiroTreino.getFullYear()) * 12 + 
                            (hoje.getMonth() - primeiroTreino.getMonth())
            tempoTotal = `${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`
        }

        return {
            treinosFeitos,
            treinosFaltados,
            totalTreinos,
            mesesAtivos,
            tempoTotal,
            percentualPresenca: totalTreinos > 0 ? ((treinosFeitos / totalTreinos) * 100).toFixed(1) : 0
        }
    }

    const stats = calcularEstatisticasTreinos()

    // Salvar medida
    const handleSalvarMedida = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from("saude_medidas")
                .upsert({
                    user_id: user.id,
                    peso: parseFloat(formMedida.peso),
                    altura: parseFloat(formMedida.altura),
                    data_medicao: formMedida.data_medicao,
                    observacoes: formMedida.observacoes || null
                }, {
                    onConflict: 'user_id,data_medicao'
                })

            if (error) throw error
            setShowModalMedida(false)
            setFormMedida({
                peso: "",
                altura: "",
                data_medicao: new Date().toISOString().split("T")[0],
                observacoes: ""
            })
            fetchMedidas()
        } catch (error) {
            console.error("Erro ao salvar medida:", error)
            alert("Erro ao salvar medida: " + error.message)
        }
    }

    // Salvar treino
    const handleSalvarTreino = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from("treinos")
                .upsert({
                    user_id: user.id,
                    data_treino: formTreino.data_treino,
                    tipo_treino: formTreino.tipo_treino,
                    presenca: formTreino.presenca,
                    observacoes: formTreino.observacoes || null,
                    duracao_minutos: formTreino.duracao_minutos ? parseInt(formTreino.duracao_minutos) : null,
                    intensidade: formTreino.intensidade || null
                }, {
                    onConflict: 'user_id,data_treino,tipo_treino'
                })

            if (error) throw error
            setShowModalTreino(false)
            setFormTreino({
                data_treino: new Date().toISOString().split("T")[0],
                tipo_treino: "jiu-jitsu",
                presenca: true,
                observacoes: "",
                duracao_minutos: "",
                intensidade: "moderada"
            })
            fetchTreinos()
        } catch (error) {
            console.error("Erro ao salvar treino:", error)
            alert("Erro ao salvar treino: " + error.message)
        }
    }

    // Salvar meta
    const handleSalvarMeta = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from("metas_saude")
                .upsert({
                    user_id: user.id,
                    meta_peso: formMeta.meta_peso ? parseFloat(formMeta.meta_peso) : null,
                    meta_imc: formMeta.meta_imc ? parseFloat(formMeta.meta_imc) : null,
                    meta_treinos_mes: parseInt(formMeta.meta_treinos_mes),
                    dias_treino_semana: formMeta.dias_treino_semana
                }, {
                    onConflict: 'user_id'
                })

            if (error) throw error
            setShowModalMeta(false)
            fetchMeta()
        } catch (error) {
            console.error("Erro ao salvar meta:", error)
            alert("Erro ao salvar meta: " + error.message)
        }
    }

    // Deletar medida
    const handleDeletarMedida = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta medida?")) return
        try {
            const { error } = await supabase
                .from("saude_medidas")
                .delete()
                .eq("id", id)

            if (error) throw error
            fetchMedidas()
        } catch (error) {
            console.error("Erro ao deletar medida:", error)
            alert("Erro ao deletar medida: " + error.message)
        }
    }

    // Deletar treino
    const handleDeletarTreino = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este treino?")) return
        try {
            const { error } = await supabase
                .from("treinos")
                .delete()
                .eq("id", id)

            if (error) throw error
            fetchTreinos()
        } catch (error) {
            console.error("Erro ao deletar treino:", error)
            alert("Erro ao deletar treino: " + error.message)
        }
    }

    // Preparar dados do gráfico de evolução de peso
    const dadosGraficoPeso = {
        labels: medidas.slice().reverse().map(m => {
            const data = new Date(m.data_medicao)
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        }),
        datasets: [
            {
                label: 'Peso (kg)',
                data: medidas.slice().reverse().map(m => m.peso),
                borderColor: '#4a6cf7',
                backgroundColor: 'rgba(74, 108, 247, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            ...(meta?.meta_peso ? [{
                label: 'Meta de Peso',
                data: medidas.slice().reverse().map(() => meta.meta_peso),
                borderColor: '#10b981',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }] : [])
        ]
    }

    // Preparar dados do gráfico de treinos do mês
    const [ano, mes] = mesFiltro.split('-')
    const treinosMes = treinos.filter(t => {
        const dataTreino = new Date(t.data_treino)
        return dataTreino.getFullYear() === parseInt(ano) && 
               dataTreino.getMonth() + 1 === parseInt(mes)
    })

    const diasMes = new Date(parseInt(ano), parseInt(mes), 0).getDate()
    const diasComTreino = Array.from({ length: diasMes }, (_, i) => {
        const dia = i + 1
        const dataStr = `${ano}-${mes.padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        const treinoDia = treinosMes.find(t => t.data_treino === dataStr)
        return treinoDia ? (treinoDia.presenca ? 1 : -1) : 0
    })

    const dadosGraficoTreinos = {
        labels: Array.from({ length: diasMes }, (_, i) => i + 1),
        datasets: [
            {
                label: 'Presença',
                data: diasComTreino.map(v => v === 1 ? 1 : null),
                backgroundColor: '#10b981',
                borderRadius: 4
            },
            {
                label: 'Falta',
                data: diasComTreino.map(v => v === -1 ? 1 : null),
                backgroundColor: '#ef4444',
                borderRadius: 4
            }
        ]
    }

    const opcoesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }

    return (
        <main>
            <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
            <div className="saude-container">
                <div className="saude-header">
                    <h1 className="saude-title">Saúde & Fitness</h1>
                    <div className="saude-actions">
                        <button className="btn-saude btn-primary" onClick={() => setShowModalMedida(true)}>
                            + Nova Medida
                        </button>
                        <button className="btn-saude btn-secondary" onClick={() => setShowModalTreino(true)}>
                            + Registrar Treino
                        </button>
                        <button className="btn-saude btn-outline" onClick={() => setShowModalMeta(true)}>
                            🎯 Metas
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Carregando...</div>
                ) : (
                    <>
                        {/* Cards de Resumo */}
                        <div className="saude-cards">
                            <div className="saude-card">
                                <div className="saude-card-icon">⚖️</div>
                                <div className="saude-card-content">
                                    <h3>Peso Atual</h3>
                                    <p className="saude-card-value">
                                        {ultimaMedida ? `${ultimaMedida.peso} kg` : "Não registrado"}
                                    </p>
                                    {meta?.meta_peso && ultimaMedida && (
                                        <p className="saude-card-meta">
                                            Meta: {meta.meta_peso} kg
                                            {ultimaMedida.peso > meta.meta_peso ? (
                                                <span className="text-danger"> ({((ultimaMedida.peso - meta.meta_peso).toFixed(1))} kg acima)</span>
                                            ) : (
                                                <span className="text-success"> ({((meta.meta_peso - ultimaMedida.peso).toFixed(1))} kg abaixo)</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="saude-card">
                                <div className="saude-card-icon">📏</div>
                                <div className="saude-card-content">
                                    <h3>IMC</h3>
                                    <p className="saude-card-value">
                                        {imcAtual > 0 ? imcAtual : "Não calculado"}
                                    </p>
                                    {imcAtual > 0 && (
                                        <p className="saude-card-status">
                                            {imcAtual < 18.5 ? "Abaixo do peso" :
                                             imcAtual < 25 ? "Peso normal" :
                                             imcAtual < 30 ? "Sobrepeso" : "Obesidade"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="saude-card">
                                <div className="saude-card-icon">🥋</div>
                                <div className="saude-card-content">
                                    <h3>Treinos Este Mês</h3>
                                    <p className="saude-card-value">{stats.treinosFeitos}</p>
                                    <p className="saude-card-meta">
                                        {stats.totalTreinos > 0 ? `${stats.percentualPresenca}% de presença` : "Nenhum registro"}
                                    </p>
                                </div>
                            </div>

                            <div className="saude-card">
                                <div className="saude-card-icon">📅</div>
                                <div className="saude-card-content">
                                    <h3>Tempo Total</h3>
                                    <p className="saude-card-value">{stats.tempoTotal}</p>
                                    <p className="saude-card-meta">{stats.mesesAtivos} meses ativos</p>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos */}
                        <div className="saude-graficos">
                            {medidas.length > 0 && (
                                <div className="grafico-card">
                                    <h2>Evolução do Peso</h2>
                                    <div className="grafico-wrapper">
                                        <Line data={dadosGraficoPeso} options={opcoesGrafico} />
                                    </div>
                                </div>
                            )}

                            <div className="grafico-card">
                                <div className="grafico-header">
                                    <h2>Treinos do Mês</h2>
                                    <input
                                        type="month"
                                        value={mesFiltro}
                                        onChange={(e) => setMesFiltro(e.target.value)}
                                        className="input-mes"
                                    />
                                </div>
                                <div className="grafico-wrapper">
                                    <Bar data={dadosGraficoTreinos} options={opcoesGrafico} />
                                </div>
                                <div className="grafico-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Treinos Feitos:</span>
                                        <span className="stat-value text-success">{stats.treinosFeitos}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Faltas:</span>
                                        <span className="stat-value text-danger">{stats.treinosFaltados}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Meta do Mês:</span>
                                        <span className="stat-value">
                                            {meta?.meta_treinos_mes || 8} treinos
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Histórico de Medidas */}
                        <div className="saude-secao">
                            <h2>Histórico de Medidas</h2>
                            {medidas.length === 0 ? (
                                <p className="sem-dados">Nenhuma medida registrada. Clique em "Nova Medida" para começar.</p>
                            ) : (
                                <div className="tabela-medidas">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Peso</th>
                                                <th>Altura</th>
                                                <th>IMC</th>
                                                <th>Observações</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medidas.map(medida => (
                                                <tr key={medida.id}>
                                                    <td>{new Date(medida.data_medicao).toLocaleDateString('pt-BR')}</td>
                                                    <td>{medida.peso} kg</td>
                                                    <td>{medida.altura} m</td>
                                                    <td>{calcularIMC(medida.peso, medida.altura)}</td>
                                                    <td>{medida.observacoes || "-"}</td>
                                                    <td>
                                                        <button
                                                            className="btn-delete-small"
                                                            onClick={() => handleDeletarMedida(medida.id)}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Histórico de Treinos */}
                        <div className="saude-secao">
                            <h2>Histórico de Treinos</h2>
                            {treinos.length === 0 ? (
                                <p className="sem-dados">Nenhum treino registrado. Clique em "Registrar Treino" para começar.</p>
                            ) : (
                                <div className="tabela-treinos">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tipo</th>
                                                <th>Status</th>
                                                <th>Duração</th>
                                                <th>Intensidade</th>
                                                <th>Observações</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {treinos.slice(0, 30).map(treino => (
                                                <tr key={treino.id}>
                                                    <td>{new Date(treino.data_treino).toLocaleDateString('pt-BR')}</td>
                                                    <td>{treino.tipo_treino}</td>
                                                    <td>
                                                        <span className={`badge ${treino.presenca ? 'badge-success' : 'badge-danger'}`}>
                                                            {treino.presenca ? '✓ Presente' : '✗ Faltou'}
                                                        </span>
                                                    </td>
                                                    <td>{treino.duracao_minutos ? `${treino.duracao_minutos} min` : "-"}</td>
                                                    <td>{treino.intensidade || "-"}</td>
                                                    <td>{treino.observacoes || "-"}</td>
                                                    <td>
                                                        <button
                                                            className="btn-delete-small"
                                                            onClick={() => handleDeletarTreino(treino.id)}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Modal Nova Medida */}
                {showModalMedida && (
                    <div className="modal-overlay" onClick={() => setShowModalMedida(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Nova Medida</h2>
                            <form onSubmit={handleSalvarMedida}>
                                <div className="form-group">
                                    <label>Peso (kg) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formMedida.peso}
                                        onChange={(e) => setFormMedida({...formMedida, peso: e.target.value})}
                                        required
                                        placeholder="Ex: 70.5"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Altura (m) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formMedida.altura}
                                        onChange={(e) => setFormMedida({...formMedida, altura: e.target.value})}
                                        required
                                        placeholder="Ex: 1.75"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data da Medição *</label>
                                    <input
                                        type="date"
                                        value={formMedida.data_medicao}
                                        onChange={(e) => setFormMedida({...formMedida, data_medicao: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Observações</label>
                                    <textarea
                                        value={formMedida.observacoes}
                                        onChange={(e) => setFormMedida({...formMedida, observacoes: e.target.value})}
                                        placeholder="Ex: Após treino, pela manhã..."
                                        rows="3"
                                    />
                                </div>
                                {formMedida.peso && formMedida.altura && (
                                    <div className="form-preview">
                                        <strong>IMC Calculado: {calcularIMC(formMedida.peso, formMedida.altura)}</strong>
                                    </div>
                                )}
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowModalMedida(false)}>
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

                {/* Modal Registrar Treino */}
                {showModalTreino && (
                    <div className="modal-overlay" onClick={() => setShowModalTreino(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Registrar Treino</h2>
                            <form onSubmit={handleSalvarTreino}>
                                <div className="form-group">
                                    <label>Data do Treino *</label>
                                    <input
                                        type="date"
                                        value={formTreino.data_treino}
                                        onChange={(e) => setFormTreino({...formTreino, data_treino: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipo de Treino *</label>
                                    <select
                                        value={formTreino.tipo_treino}
                                        onChange={(e) => setFormTreino({...formTreino, tipo_treino: e.target.value})}
                                        required
                                    >
                                        <option value="jiu-jitsu">Jiu-Jitsu</option>
                                        <option value="academia">Academia</option>
                                        <option value="corrida">Corrida</option>
                                        <option value="ciclismo">Ciclismo</option>
                                        <option value="natação">Natação</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formTreino.presenca}
                                            onChange={(e) => setFormTreino({...formTreino, presenca: e.target.checked})}
                                        />
                                        {" "}Compareci ao treino
                                    </label>
                                </div>
                                {formTreino.presenca && (
                                    <>
                                        <div className="form-group">
                                            <label>Duração (minutos)</label>
                                            <input
                                                type="number"
                                                value={formTreino.duracao_minutos}
                                                onChange={(e) => setFormTreino({...formTreino, duracao_minutos: e.target.value})}
                                                placeholder="Ex: 90"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Intensidade</label>
                                            <select
                                                value={formTreino.intensidade}
                                                onChange={(e) => setFormTreino({...formTreino, intensidade: e.target.value})}
                                            >
                                                <option value="leve">Leve</option>
                                                <option value="moderada">Moderada</option>
                                                <option value="intensa">Intensa</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div className="form-group">
                                    <label>Observações</label>
                                    <textarea
                                        value={formTreino.observacoes}
                                        onChange={(e) => setFormTreino({...formTreino, observacoes: e.target.value})}
                                        placeholder="Ex: Treino focado em guarda, muito bom..."
                                        rows="3"
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowModalTreino(false)}>
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

                {/* Modal Metas */}
                {showModalMeta && (
                    <div className="modal-overlay" onClick={() => setShowModalMeta(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Metas de Saúde</h2>
                            <form onSubmit={handleSalvarMeta}>
                                <div className="form-group">
                                    <label>Meta de Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formMeta.meta_peso}
                                        onChange={(e) => setFormMeta({...formMeta, meta_peso: e.target.value})}
                                        placeholder="Ex: 65.0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Meta de IMC</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formMeta.meta_imc}
                                        onChange={(e) => setFormMeta({...formMeta, meta_imc: e.target.value})}
                                        placeholder="Ex: 22.5"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Meta de Treinos por Mês</label>
                                    <input
                                        type="number"
                                        value={formMeta.meta_treinos_mes}
                                        onChange={(e) => setFormMeta({...formMeta, meta_treinos_mes: e.target.value})}
                                        placeholder="Ex: 8"
                                    />
                                    <small>Ex: 8 treinos = 2x por semana</small>
                                </div>
                                <div className="form-group">
                                    <label>Dias de Treino na Semana</label>
                                    <div className="checkbox-group">
                                        {['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'].map(dia => (
                                            <label key={dia} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formMeta.dias_treino_semana.includes(dia)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormMeta({
                                                                ...formMeta,
                                                                dias_treino_semana: [...formMeta.dias_treino_semana, dia]
                                                            })
                                                        } else {
                                                            setFormMeta({
                                                                ...formMeta,
                                                                dias_treino_semana: formMeta.dias_treino_semana.filter(d => d !== dia)
                                                            })
                                                        }
                                                    }}
                                                />
                                                {dia.charAt(0).toUpperCase() + dia.slice(1)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-buttons">
                                    <button type="button" className="btn-cancelar" onClick={() => setShowModalMeta(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-salvar">
                                        Salvar Metas
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
