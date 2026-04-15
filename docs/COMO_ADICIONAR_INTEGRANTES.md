# Como adicionar integrantes

Cada integrante deve ser um arquivo JSON dentro da pasta `integrantes/`, seguindo o padrao:

- `nome-da-pessoa.json` (exemplo: `maria-silva.json`)

## Campos obrigatorios em cada arquivo

```json
{
  "Nome": "Nome da Pessoa",
  "Cargo": "Cargo no LABIIA",
  "Formação": "Formacao principal",
  "Imagem": "integrantes/imagens/nome-da-pessoa.jpg",
  "Minibiografia": "Resumo curto da pessoa",
  "Links importantes": [
    { "titulo": "Lattes", "url": "https://..." }
  ]
}
```

## Passo a passo

1. Crie um novo arquivo em `integrantes/` com o nome da pessoa (exemplo: `maria-silva.json`).
2. Coloque a foto da pessoa em `integrantes/imagens/`.
3. Preencha os campos obrigatorios (incluindo `Imagem` com o caminho da foto).
4. Abra `integrantes/integrantes.json` e adicione o novo arquivo na lista.

Exemplo:

```json
{
  "file": "maria-silva.json"
}
```

Pronto: o integrante aparece automaticamente na pagina `integrantes.html`.
