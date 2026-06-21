# Orientacoes para agentes

Este projeto usa HTML, CSS e JavaScript sem framework ou etapa de build.

## Arquivos principais

- Edite `index.html`, `styles.css`, `app.js` e `firebase-sync.js` na raiz.
- Antes de publicar, copie esses quatro arquivos para `public/`.
- Preserve a compatibilidade com dados existentes no `localStorage` e no Firestore.

## Dados e seguranca

- A base compartilhada fica abaixo de `families/shared` no Firestore.
- Nao remova a lista de e-mails autorizados sem solicitacao expressa.
- Nunca versione `.firebase-session`, caches, logs ou tokens.
- O Firebase Web Config presente no frontend identifica o projeto e nao e uma credencial administrativa.

## Validacao

- Execute verificacao de sintaxe em `app.js` e `firebase-sync.js`.
- Teste login autorizado, bloqueio de terceiros, migracao local e sincronizacao.
- Confira parcelas, recorrencias, metas, Reserva e filtros mensais depois de alterar regras financeiras.

