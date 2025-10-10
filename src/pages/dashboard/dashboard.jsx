import "./dashboard.css"
import Sidebar from "../../componentes/side-bar/side-bar"
import Header from "../../componentes/header/header"
import { useNavigate } from "react-router-dom"

export default function Dashboard(){
    const navigate = useNavigate();

    return(
       <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Dashboard</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Saldo</h2>
                            <h2 className="subtitle-section">R$ 10.000,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                    <div className="content-section">
                            <h2 className="title-section">Despesas</h2>
                            <h2 className="subtitle-section">R$ 1.924,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                    <div className="content-section">
                            <h2 className="title-section">Investimentos</h2>
                            <h2 className="subtitle-section">R$ 50.000,00</h2>
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