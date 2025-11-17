import perfil from "../../assets/imagens/perfil.jpg"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import "./header.css"

export default function Header() {
    const { user, signOut } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    
    const handleLogout = async () => {
        await signOut();
    };
    
    return (
        <header className="header">
            <div className="hamburger">
                ☰
            </div>
            <a className="title" href="/dashboard">EVOLUA</a>
            <div className="perfil">
                <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Modo Claro" : "Modo Escuro"}>
                    {darkMode ? "☀️" : "🌙"}
                </button>
                <h3 className="bem-vindo">Bem-vindo, {user?.user_metadata?.name || 'Usuário'}</h3>
                <img src={perfil} alt="Foto de Perfil" width={64} height={64} />
                <button onClick={handleLogout} className="logout-btn">
                    Sair
                </button>
            </div>
        </header>
    );
}