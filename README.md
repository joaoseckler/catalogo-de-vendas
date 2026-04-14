# Catálogo de vendas

Gera um site estático a partir de uma planilha para exibir um catálogo de
vendas.

## Como usar

1. Instale o [ImageMagick](https://imagemagick.org) para converter imagens para `webp`;
2. Instale o [Bun](https://bun.sh);
3. Rode o script que pega os dados da planilha google: `bun scripts/fetch-data.ts`
4. Para rodar em desenvolvimento: `bun run dev`
5. Para compilar o site: `bun run build`
