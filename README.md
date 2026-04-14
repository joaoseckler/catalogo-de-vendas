# Catálogo de vendas

Gera um site estático a partir de uma planilha para exibir um catálogo de
vendas.

## Como usar

1. Instale o [ImageMagick](https://imagemagick.org) para converter imagens para `webp`;
2. Instale o [Bun](https://bun.sh);
3. Rode o script que pega os dados da planilha google: `bun scripts/fetch-data.ts`
4. Para rodar em desenvolvimento: `bun run dev`

## Deploy

1. `cp .env.example .env` e preencha as variáveis de ambiente;
2. Instale o [rsync](https://rsync.samba.org) para enviar os arquivos para o servidor;
3. `./deploy.sh` (isso roda `bun run build`, depois envia os arquivos para o
   servidor)
4. Configure seu servidor para servir páginas estáticas. Exemplo para nginx:

```nginx
server {
    listen 80;
    server_name example.com;

    location /catalogo {
        alias /var/www/catalogo;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```
