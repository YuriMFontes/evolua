import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login data:', formData);
        // Aqui você pode adicionar a lógica de login depois
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
                            />
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" />
                                <span className="auth-checkmark"></span>
                                Lembrar de mim
                            </label>
                            <a href="#" className="auth-link">
                                Esqueceu a senha?
                            </a>
                        </div>

                        <button type="submit" className="auth-button">
                            Entrar
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
