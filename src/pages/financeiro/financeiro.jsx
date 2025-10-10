import "../../pages/dashboard/dashboard.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"

export default function Financeiro(){
    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Financeiro</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Receitas</h2>
                            <h2 className="subtitle-section">R$ 5.000,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Despesas</h2>
                            <h2 className="subtitle-section">R$ 3.200,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Saldo do Mês</h2>
                            <h2 className="subtitle-section">R$ 1.800,00</h2>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}