import perfil from "../../assets/imagens/perfil.jpg"

export default function Header() {
    
    
    return (
        <header className="header">
            <h1 className="titulo" >EVOLUA</h1>
            <div className="perfil">
                <h3 className="bem-vindo" >Bem-vindo, Yuri</h3>
                <img className="img-perfil" src={perfil} alt="Foto de Perfil" width={64} height={64} />
            </div>
        </header>
    );
}