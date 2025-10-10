import "../../pages/dashboard/dashboard.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"

export default function Configuracao(){
    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="dashboard">
                <h1 className="title-dashboard">Configurações</h1>
                <div className="content-dashboard">
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Perfil</h2>
                            <h2 className="subtitle-section">Editar informações pessoais</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Notificações</h2>
                            <h2 className="subtitle-section">Configurar alertas</h2>
                        </div>
                    </section>
                    <section className="section-dashboard">
                        <div className="content-section">
                            <h2 className="title-section">Privacidade</h2>
                            <h2 className="subtitle-section">Controle de dados</h2>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
