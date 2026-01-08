import "./side-bar.css"
import { NavLink, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react"

export default function Sidebar({ isOpen = false, onNavigate }) {
    const location = useLocation()
    const sidebarRef = useRef(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    
    const handleNavigate = () => {
        if (typeof onNavigate === "function") {
            onNavigate()
        }
    }

    // Suporte para swipe gesture para fechar sidebar no mobile
    useEffect(() => {
        const sidebar = sidebarRef.current
        if (!sidebar) return

        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
        }

        const handleTouchMove = (e) => {
            if (!isOpen) return
            
            const touchCurrentX = e.touches[0].clientX
            const touchCurrentY = e.touches[0].clientY
            const diffX = touchStartX.current - touchCurrentX
            const diffY = touchStartY.current - touchCurrentY

            // Só fechar se o swipe horizontal for maior que o vertical (swipe horizontal)
            if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
                handleNavigate()
            }
        }

        sidebar.addEventListener('touchstart', handleTouchStart, { passive: true })
        sidebar.addEventListener('touchmove', handleTouchMove, { passive: true })

        return () => {
            sidebar.removeEventListener('touchstart', handleTouchStart)
            sidebar.removeEventListener('touchmove', handleTouchMove)
        }
    }, [isOpen])

    const isActive = (path) => {
        return location.pathname === path
    }

    return (
        <>
            <aside
                ref={sidebarRef}
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
