# Colaboracao no projeto

Carol e Vinicius podem editar este aplicativo em computadores diferentes usando o mesmo repositorio GitHub.

## Configuracao inicial no outro computador

1. Instale o Git e o Codex.
2. Aceite o convite de colaborador enviado pelo GitHub.
3. Clone o repositorio:

```powershell
git clone https://github.com/aninhaac/Financeiro.git
cd Financeiro
```

4. Abra a pasta `Financeiro` no Codex.
5. Solicite ao Codex que leia `AGENTS.md` e `README.md` antes de alterar o projeto.

## Fluxo recomendado

Cada pessoa deve trabalhar em sua propria branch:

```powershell
git switch main
git pull
git switch -c nome-da-alteracao
```

Depois das alteracoes:

```powershell
git add .
git commit -m "Descreve a alteracao"
git push -u origin nome-da-alteracao
```

Abra um Pull Request no GitHub para revisar e juntar a branch na `main`.

## Cuidados

- Sempre execute `git pull` antes de começar.
- Evite editar a mesma funcionalidade simultaneamente em duas branches.
- Nunca envie tokens, senhas ou arquivos `.env`.
- Os dados financeiros sao locais e nao sao enviados ao GitHub.
- Ao alterar os arquivos principais, mantenha `public/` sincronizada com `index.html`, `styles.css` e `app.js`.
