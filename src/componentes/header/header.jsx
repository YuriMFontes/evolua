import perfil from "../../assets/imagens/perfil.jpg"
import "./header.css"

export default function Header() {
    
    return (
        <header className="header">
            <div className="hamburger">
                ☰
            </div>
            <a className="title" href="/dashboard">EVOLUA</a>
            <div className="perfil">
                <h3 className="bem-vindo" >Bem-vindo, Yuri</h3>
                <img src={perfil} alt="Foto de Perfil" width={64} height={64} />
            </div>
        </header>
    );
}