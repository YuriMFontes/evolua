import "./side-bar.css"
import { Link } from "react-router-dom"

export default function Sidebar(){
    return(
        <aside className="side-bar">
            <Link to="/dashboard" className="section">
                Dashboard
            </Link>
            <Link to="/financeiro" className="section">
                Financeiro
            </Link>
            <Link to="/investimento" className="section">
                Investimento
            </Link>
            <Link to="/saude" className="section">
                Saúde
            </Link>
            <Link to="/configuracao" className="section">
                Configuração
            </Link>
        </aside>
    );
}
