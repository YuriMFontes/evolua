import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn(formData.email, formData.password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-gradient-orb auth-orb-1"></div>
                <div className="auth-gradient-orb auth-orb-2"></div>
                <div className="auth-gradient-orb auth-orb-3"></div>
            </div>
            
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Evolua</h1>
                        <p className="auth-subtitle">Entre na sua conta para continuar</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}
                        
                        <div className="auth-input-group">
                            <label htmlFor="email" className="auth-label">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="seu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-input-group">
                            <label htmlFor="password" className="auth-label">Senha</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" disabled={loading} />
                                <span className="auth-checkmark"></span>
                                Lembrar de mim
                            </label>
                            <a href="#" className="auth-link">
                                Esqueceu a senha?
                            </a>
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p className="auth-footer-text">
                            Não tem uma conta? 
                            <Link to="/register" className="auth-link auth-link-primary">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
