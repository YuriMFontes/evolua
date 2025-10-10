import "../../pages/dashboard/dashboard.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"

export default function Saude(){
    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Saúde</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">IMC</h2>
                            <h2 className="subtitle-section">22.5</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Peso Atual</h2>
                            <h2 className="subtitle-section">70 kg</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Meta de Peso</h2>
                            <h2 className="subtitle-section">65 kg</h2>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
