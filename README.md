# Financa Pessoal

Aplicativo web de financas pessoais feito em HTML, CSS e JavaScript, com Firebase Authentication, Cloud Firestore e Firebase Hosting.

## Estrutura

- `index.html`: interface das sete abas.
- `styles.css`: estilos, responsividade e modo escuro.
- `app.js`: regras financeiras, graficos e interacoes.
- `firebase-sync.js`: login Google, migracao local e sincronizacao com Firestore.
- `firestore.rules`: acesso restrito aos dois e-mails autorizados.
- `public/`: arquivos enviados ao Firebase Hosting.

## Execucao local

Abra um servidor HTTP na raiz do projeto. Exemplo:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:8000/index.html`.

## Firebase

Projeto configurado: `financeiro-cccab`.

Antes do deploy:

1. Ative o provedor Google no Firebase Authentication.
2. Crie o banco Cloud Firestore.
3. Confirme os dominios autorizados.

Para publicar:

```powershell
firebase deploy --project financeiro-cccab
```

Arquivos de credenciais, caches e logs locais estão protegidos pelo `.gitignore`.

