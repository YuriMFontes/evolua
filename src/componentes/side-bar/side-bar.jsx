import "./side-bar.css"
import { NavLink, useLocation } from "react-router-dom"

export default function Sidebar({ isOpen = false, onNavigate }) {
    const location = useLocation()
    
    const handleNavigate = () => {
        if (typeof onNavigate === "function") {
            onNavigate()
        }
    }

    const isActive = (path) => {
        return location.pathname === path
    }

    return (
        <>
            <aside
                className={`side-bar ${isOpen ? "side-bar--open" : ""}`}
                role="navigation"
                aria-label="Menu lateral"
            >
                <button
                    type="button"
                    className="side-bar__close"
                    aria-label="Fechar menu lateral"
                    onClick={handleNavigate}
                >
                    ✕
                </button>
                <nav className="side-bar__nav">
                    <NavLink 
                        to="/dashboard" 
                        className={`section ${isActive('/dashboard') ? 'active' : ''}`}
                        onClick={handleNavigate}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink 
                        to="/financeiro" 
                        className={`section ${isActive('/financeiro') ? 'active' : ''}`}
                        onClick={handleNavigate}
                    >
                        Financeiro
                    </NavLink>
                    <NavLink 
                        to="/investimento" 
                        className={`section ${isActive('/investimento') ? 'active' : ''}`}
                        onClick={handleNavigate}
                    >
                        Investimento
                    </NavLink>
                    <NavLink 
                        to="/saude" 
                        className={`section ${isActive('/saude') ? 'active' : ''}`}
                        onClick={handleNavigate}
                    >
                        Saúde
                    </NavLink>
                    <NavLink 
                        to="/configuracao" 
                        className={`section ${isActive('/configuracao') ? 'active' : ''}`}
                        onClick={handleNavigate}
                    >
                        Configuração
                    </NavLink>
                </nav>
            </aside>
            <div
                className={`side-bar-overlay ${isOpen ? "side-bar-overlay--visible" : ""}`}
                onClick={handleNavigate}
            />
        </>
    )
}
