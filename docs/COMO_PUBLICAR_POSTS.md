# Como publicar posts no blog (modo simples)

Este site agora usa arquivos Markdown para os artigos.

## 1) Criar o arquivo do post

1. Entre na pasta `posts/`.
2. Duplique o arquivo `modelo-post.md`.
3. Renomeie para algo curto, por exemplo: `ia-na-educacao.md`.

## 2) Preencher o cabecalho do post

No topo do arquivo, mantenha este formato:

```md
---
title: Titulo do post
categories: método, política
authors: geraldo-homero
date: Abr 2026
excerpt: Resumo curto em uma frase.
---
```

Categorias aceitas para filtro:
- `método`
- `política`
- `regulação`

Para usar mais de uma categoria no mesmo post, separe com virgula:
- `categories: método, política`

Os rótulos visíveis são gerados automaticamente pelo site.

Autores do post:
- Use `authors` com o slug do integrante (nome do arquivo em `integrantes/` sem `.json`).
- Exemplo: `authors: geraldo-homero`
- Para mais de um autor: `authors: geraldo-homero, rafael-sampaio`

## 3) Escrever o conteudo em Markdown

Exemplos:

```md
## Subtitulo

Paragrafo normal.

- Item 1
- Item 2
```

## 4) Registrar no arquivo de lista

Abra `posts/posts.json` e adicione uma entrada na lista `posts`:

```json
{
  "slug": "ia-na-educacao",
  "file": "ia-na-educacao.md"
}
```

Regras:
- `slug` sem espacos e sem acentos.
- `file` deve ser exatamente o nome do arquivo `.md`.

## 5) Pronto

O post aparece automaticamente em `blog.html` e abre em `post.html?slug=...`.

Se nao carregar, rode o projeto em servidor local (ex.: extensao Live Server no VS Code).
