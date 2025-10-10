import Dashboard from './pages/dashboard/dashboard';
import Financeiro from './pages/financeiro/financeiro';
import Investimento from './pages/investimento/investimento';
import Saude from './pages/saude/saude';
import Configuracao from './pages/configuracao/configuracao';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/investimento" element={<Investimento />} />
        <Route path="/saude" element={<Saude />} />
        <Route path="/configuracao" element={<Configuracao />} />
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
