import "./side-bar.css"
import { Link } from "react-router-dom"

export default function Sidebar(){
    return(
        <aside className="side-bar">
            <section className="section">
                <Link to="/dashboard">Dashboard</Link>
            </section>
            <section className="section">
                <Link to="/financeiro">Financeiro</Link>
            </section>
            <section className="section">
                <Link to="/investimento">Investimento</Link>
            </section>
            <section className="section">
                <Link to="/saude">Saúde</Link>
            </section>
            <section className="section">
                <Link to="/configuracao">Configuração</Link>
            </section>
        </aside>
    );
}
