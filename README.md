# 🌟 Evolua - Gestão Pessoal (Protótipo)

**Evolua** é um **protótipo de SaaS de Gestão Pessoal**, desenvolvido para centralizar em um único sistema diversas áreas da vida: **finanças, investimentos, saúde e organização pessoal**.  

O objetivo é oferecer uma plataforma **simples, responsiva e inteligente**, ajudando o usuário a **evoluir** em diferentes áreas do dia a dia.  
> ⚠️ **Atenção:** Este projeto ainda é apenas um **protótipo**. Novas funcionalidades estão sendo avaliadas e implementadas gradualmente.

---

## 🚀 Tecnologias utilizadas

- **Frontend**: [React](https://react.dev/) + [React Router](https://reactrouter.com/)  
- **Banco de Dados**: Implementação inicial baseada Supabase
- **Autenticação**: Estrutura básica (integração com Supabase)  
- **Responsividade**: Mobile-first, adaptado para diferentes telas  
- **Inteligência Artificial**: Planejamento para dicas inteligentes utilizando APIs gratuitas  

---

## 📱 Funcionalidades atuais (Protótipo)

### 🔑 Autenticação
- Cadastro e login de usuário (base inicial)  
- Edição de perfil  

### 💰 Financeiro
- Registro de receitas e despesas  
- Acompanhamento simples de saldo  

### 📈 Investimentos
- Visualização de investimentos cadastrados  
- Acompanhamento com atualização automática de cotações (Brapi)

### 🏋️ Saúde
- Planejamento inicial de dieta  
- Registro de treinos  
- Marcação de calorias 

---

## 🔮 Futuras Funcionalidades

- Dashboard com **gráficos e relatórios** (finanças, investimentos e saúde)  
- Integração com **bancos de dados reais**  
- **Autenticação avançada** com provedores externos  
- **Dicas com IA** para saúde, finanças e produtividade  
- Sistema de **notificações e lembretes**  
- Integração com **wearables** (smartwatches, apps de treino e dieta)  

---

## 🎯 Objetivos do Projeto

- Criar um **SaaS de gestão pessoal** acessível e inteligente  
- Aprender e aplicar conceitos de:
  - **Frontend com React**  
  - **Gerenciamento de rotas com React Router**  
  - **Banco de dados e autenticação**  
  - **Responsividade mobile-first**  
  - **Integração com IA**  

---

## ⚙️ Configuração das cotações (Brapi)

As telas de investimentos utilizam a API pública do [Brapi](https://brapi.dev/) para preencher o preço dos ativos na data da compra e manter as variações em tempo quase real.  

1. Crie um arquivo `.env` na raiz do projeto (mesmo nível do `package.json`).  
2. Adicione sua chave da API Brapi:

```
REACT_APP_BRAPI_TOKEN=SUA_CHAVE_AQUI
```

3. Reinicie o `npm start`.  

> Sem a chave, o sistema ainda funciona, mas as cotações em tempo real ficarão limitadas.