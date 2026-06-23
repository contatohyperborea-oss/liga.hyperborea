# La Maggiê — Página temporária de manutenção

Este pacote é uma página estática simples para publicar hoje no Vercel enquanto o site definitivo da La Maggiê fica em construção.

## Arquivos

- `index.html` — página de manutenção
- `styles.css` — visual da página
- `sw.js` — service worker temporário de manutenção
- `manifest.webmanifest` — manifesto PWA simples
- `favicon.svg` — ícone simples
- `vercel.json` — força todas as rotas para a manutenção e adiciona noindex
- `robots.txt` — evita indexação enquanto estiver em manutenção

## Antes de publicar

No arquivo `index.html`, troque:

```html
https://wa.me/55SEUNUMEROAQUI
```

pelo WhatsApp oficial da La Maggiê no formato:

```text
55 + DDD + número
```

Exemplo fictício:

```text
https://wa.me/5519999999999
```

## GitHub + Vercel

1. Crie um repositório no GitHub.
2. Envie estes arquivos na raiz do repositório.
3. No Vercel, clique em `Add New...` > `Project`.
4. Importe o repositório do GitHub.
5. Framework: `Other`.
6. Build Command: deixe vazio.
7. Output Directory: deixe vazio.
8. Clique em `Deploy`.

## Domínio

No projeto do Vercel, vá em:

`Settings` > `Domains`

Adicione:

- `lamaggie.com.br`
- `www.lamaggie.com.br`

Depois siga os registros DNS que o próprio Vercel mostrar.

## Importante sobre o service worker

Este service worker é temporário. Quando o site definitivo entrar no ar, remova o registro do service worker em `index.html` ou substitua o `sw.js` por uma versão nova que limpe o cache antigo.
