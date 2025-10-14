import "./financeiro.css"
import Header from "../../componentes/header/header"
import Sidebar from "../../componentes/side-bar/side-bar"

export default function Financeiro(){
    return(
        <main>
            <Header/>
            <Sidebar/>
            <div className="financeiro">
                <h1 className="title-financeiro">Financeiro</h1>
                <div className="content-financeiro">
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Receitas</h2>
                            <h2 className="subtitle-section">R$ 5.000,00</h2>
                        </div>
                    </section>
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Despesas</h2>
                            <h2 className="subtitle-section">R$ 3.200,00</h2>
                        </div>
                    </section>
                    <section className="section-financeiro">
                        <div className="content-section">
                            <h2 className="title-section">Saldo do Mês</h2>
                            <h2 className="subtitle-section">R$ 1.800,00</h2>
                        </div>
                    </section>
                    <section className="section-status">
                        <div>
                        <table className="status-table">
                            <thead>
                                <tr>
                                    <th>Conta</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Luz</td>
                                    <td>R$ 180,00</td>
                                    <td>10/06/2024</td>
                                    <td>
                                        <span className="status-pendente">Pendente</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Internet</td>
                                    <td>R$ 120,00</td>
                                    <td>05/06/2024</td>
                                    <td>
                                        <span className="status-pago">Pago</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Cartão de Crédito</td>
                                    <td>R$ 900,00</td>
                                    <td>01/06/2024</td>
                                    <td>
                                        <span className="status-atrasado">Atrasado</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}