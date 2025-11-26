import "./side-bar.css"
import { Link } from "react-router-dom"

export default function Sidebar({ isOpen = false, onNavigate }) {
    const handleNavigate = () => {
        if (typeof onNavigate === "function") {
            onNavigate()
        }
    }

    return (
        <>
            <aside className={`side-bar ${isOpen ? "side-bar--open" : ""}`}>
                <button
                    type="button"
                    className="side-bar__close"
                    aria-label="Fechar menu lateral"
                    onClick={handleNavigate}
                >
                    ✕
                </button>
                <Link to="/dashboard" className="section" onClick={handleNavigate}>
                    Dashboard
                </Link>
                <Link to="/financeiro" className="section" onClick={handleNavigate}>
                    Financeiro
                </Link>
                <Link to="/investimento" className="section" onClick={handleNavigate}>
                    Investimento
                </Link>
                <Link to="/saude" className="section" onClick={handleNavigate}>
                    Saúde
                </Link>
                <Link to="/configuracao" className="section" onClick={handleNavigate}>
                    Configuração
                </Link>
            </aside>
            <div
                className={`side-bar-overlay ${isOpen ? "side-bar-overlay--visible" : ""}`}
                onClick={handleNavigate}
            />
        </>
    )
}
