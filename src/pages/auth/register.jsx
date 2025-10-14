import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Register data:', formData);
        // Aqui você pode adicionar a lógica de registro depois
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
                            />
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" required />
                                <span className="auth-checkmark"></span>
                                Aceito os <a href="#" className="auth-link">Termos de Uso</a> e <a href="#" className="auth-link">Política de Privacidade</a>
                            </label>
                        </div>

                        <button type="submit" className="auth-button">
                            Criar conta
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
