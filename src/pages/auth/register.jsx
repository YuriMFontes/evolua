import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signUp } = useAuth();
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

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        const result = await signUp(formData.email, formData.password, {
            name: formData.name
        });
        
        if (result.success) {
            setError('Conta criada com sucesso! Verifique seu email para confirmar.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
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
                        <p className="auth-subtitle">Crie sua conta e comece sua jornada</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}
                        
                        <div className="auth-input-group">
                            <label htmlFor="name" className="auth-label">Nome completo</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="Seu nome completo"
                                required
                                disabled={loading}
                            />
                        </div>

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

                        <div className="auth-input-group">
                            <label htmlFor="confirmPassword" className="auth-label">Confirmar senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="auth-input"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" required disabled={loading} />
                                <span className="auth-checkmark"></span>
                                Aceito os <a href="#" className="auth-link">Termos de Uso</a> e <a href="#" className="auth-link">Política de Privacidade</a>
                            </label>
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Criar conta'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p className="auth-footer-text">
                            Já tem uma conta? 
                            <Link to="/login" className="auth-link auth-link-primary">
                                Entre aqui
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
