import "./side-bar.css"

export default function Sidebar(){
    return(
        <aside className="side-bar">
            <section className="section">
                <a href="/financeiro">Financeiro</a>
            </section>
            <section className="section">
                <a href="/investimento">Investimento</a>
            </section>
            <section className="section">
                <a href="/saude">Saúde</a>
            </section>
            <section className="section">
                <a href="/configuracao">Configuração</a>
            </section>
        </aside>
    );
}
