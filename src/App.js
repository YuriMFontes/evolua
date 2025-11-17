import Dashboard from './pages/dashboard/dashboard';
import Financeiro from './pages/financeiro/financeiro';
import Investimento from './pages/investimento/investimento';
import Saude from './pages/saude/saude';
import Configuracao from './pages/configuracao/configuracao';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Rotas públicas (só acessíveis quando não logado) */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Rotas privadas (só acessíveis quando logado) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/financeiro" element={
            <ProtectedRoute>
              <Financeiro />
            </ProtectedRoute>
          } />
          <Route path="/investimento" element={
            <ProtectedRoute>
              <Investimento />
            </ProtectedRoute>
          } />
          <Route path="/saude" element={
            <ProtectedRoute>
              <Saude />
            </ProtectedRoute>
          } />
          <Route path="/configuracao" element={
            <ProtectedRoute>
              <Configuracao />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<div>Página não encontrada</div>} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
