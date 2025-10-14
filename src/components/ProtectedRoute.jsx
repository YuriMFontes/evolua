import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(120deg, #e0eaff, #f8f2ff, #e8f6ff)',
                fontSize: '18px',
                color: '#4a6cf7',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
            }}>
                Carregando...
            </div>
        );
    }

    // Se não estiver autenticado, redirecionar para login
    return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
