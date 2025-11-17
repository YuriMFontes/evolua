# 🚀 Setup Rápido - Investimentos

## ✅ O que foi simplificado:

1. **Removido modo escuro local** - Agora está global no header
2. **Removidas funcionalidades que precisam de APIs externas**:
   - Rentabilidade diária/mensal (simuladas)
   - Evolução do patrimônio (gráfico simulado)
   - Dividendos mensais (gráfico)
   - Valorização por ativo (gráfico comparativo)

3. **Mantido apenas o essencial**:
   - ✅ Cadastro de investimentos
   - ✅ Gráfico de pizza mostrando distribuição por tipo (quantidade)
   - ✅ Lista detalhada com quantidades por tipo
   - ✅ Tabela de investimentos
   - ✅ Exportar CSV

## 📋 Para funcionar, você precisa:

### 1. Criar tabela no Supabase

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de investimentos
CREATE TABLE IF NOT EXISTS investimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_ativo VARCHAR(50) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    quantidade DECIMAL(15, 4) NOT NULL,
    preco_medio DECIMAL(15, 2) NOT NULL,
    preco_atual DECIMAL(15, 2),
    corretora VARCHAR(100),
    data_compra DATE NOT NULL,
    taxas DECIMAL(15, 2) DEFAULT 0,
    setor VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_investimentos_user_id ON investimentos(user_id);

-- RLS (Row Level Security)
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver seus próprios investimentos"
    ON investimentos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios investimentos"
    ON investimentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios investimentos"
    ON investimentos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios investimentos"
    ON investimentos FOR DELETE
    USING (auth.uid() = user_id);
```

### 2. Variáveis de ambiente

Certifique-se de que o arquivo `.env` existe na raiz do projeto:

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon-key
```

### 3. Reiniciar o servidor

```bash
npm start
```

## 🎯 Funcionalidades Atuais:

- ✅ **Cadastro de investimentos** com todos os campos
- ✅ **Gráfico de pizza** mostrando distribuição por tipo de ativo (baseado em quantidade)
- ✅ **Lista detalhada** com quantidade e percentual de cada tipo
- ✅ **Tabela completa** com todos os investimentos
- ✅ **Exportar CSV** dos investimentos
- ✅ **Modo escuro/claro global** (botão no header)

## 📊 O que o gráfico mostra:

O gráfico de pizza mostra a **quantidade** de cada tipo de ativo (Ação, FII, Cripto, etc.) e o percentual que cada tipo representa na carteira total.

---

**Pronto!** Agora é só criar a tabela no Supabase e começar a usar! 🎉


