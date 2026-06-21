# Financa Pessoal

Aplicativo web de financas pessoais feito em HTML, CSS e JavaScript.

## Estrutura

- `index.html`: interface das sete abas.
- `styles.css`: estilos, responsividade e modo escuro.
- `app.js`: regras financeiras, graficos, persistencia e interacoes.
- `public/`: copia dos arquivos necessarios para hospedagem estatica.

## Execucao local

Abra um servidor HTTP na raiz do projeto:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:8000/index.html`.

## Armazenamento

Os dados financeiros ficam no `localStorage` do navegador. O GitHub compartilha apenas o codigo; cada computador possui sua propria base local.

## Colaboracao

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para configurar outro computador e trabalhar no projeto sem sobrescrever alteracoes.
