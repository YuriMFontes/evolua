import "../../pages/dashboard/dashboard.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"

export default function Investimento(){
    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Investimentos</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Portfolio Total</h2>
                            <h2 className="subtitle-section">R$ 50.000,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Rendimento do Mês</h2>
                            <h2 className="subtitle-section">+R$ 1.200,00</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Ações</h2>
                            <h2 className="subtitle-section">R$ 30.000,00</h2>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
