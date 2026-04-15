# Como adicionar integrantes

Cada integrante deve ser um arquivo JSON dentro da pasta `site/integrantes/`, seguindo o padrao:

- `nome-da-pessoa.json` (exemplo: `maria-silva.json`)

## Campos obrigatorios em cada arquivo

```json
{
  "Nome": "Nome da Pessoa",
  "Cargo": "Cargo no LABIIA",
  "Formação": "Formacao principal",
  "Imagem": "integrantes/img/nome-da-pessoa.jpg",
  "Minibiografia": "Resumo curto da pessoa",
  "Links importantes": [
    { "titulo": "Lattes", "url": "https://..." }
  ]
}
```

## Passo a passo

1. Crie um novo arquivo em `site/integrantes/` com o nome da pessoa (exemplo: `maria-silva.json`).
2. Coloque a foto da pessoa em `site/integrantes/img/`.
3. Preencha os campos obrigatorios (incluindo `Imagem` com o caminho da foto).
4. Abra `site/integrantes/integrantes.json` e adicione o novo arquivo na lista.

Exemplo:

```json
{
  "file": "maria-silva.json"
}
```

Pronto: o integrante aparece automaticamente na pagina `site/quemsomos.html`.
