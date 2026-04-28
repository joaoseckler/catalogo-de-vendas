# Catálogo de vendas

Gera um (ou mais) sites estáticos a partir de planilhas para exibir um catálogo de
vendas.

## Como usar

1. Instale o [ImageMagick](https://imagemagick.org) para converter imagens para `webp`;
2. Instale o [Bun](https://bun.sh);
3. `cp sites-example.json sites.json` e preencha os dados dos seus sites
   (alternativamente, defina `SITES_CONFIG_URL` em .env para puxar esses dados
   de uma planilha google.);
4. Rode o script que pega os dados das planilhas google: `bun scripts/fetch-data.ts`
5. Para rodar em desenvolvimento: `bun run dev`

## Deploy

### Deploy em servidor

1. Instale o [rsync](https://rsync.samba.org) para enviar os arquivos para o servidor;
2. `./deploy.sh` (isso roda `bun run build`, depois envia os arquivos para o
   servidor)
3. Configure seu servidor para servir páginas estáticas. Exemplo para nginx:

```nginx
server {
    listen 80;
    server_name example.com;

    location /catalogo {
        alias /var/www/catalogo;
        index index.html;
        try_files $uri $uri/;
    }
}
```

### Deploy no CF pages

1. Instale o `wrangler`: `npm install -g wrangler`
2. Faça login: `wrangler login`
3. Crie o projeto: `wrangler pages project create meu-site`
4. Defina o nome do projeto no campo "pages" do `sites.json` (ex: `"pages": "meu-site"`)

Se não for possível fazer login, crie token de acesso com permissão de escrita em "Pages" e de leitura em "Account", e defina as seguintes variáveis de ambiente:

```CLOUDFLARE_ACCOUNT_ID=<id>
CLOUDFLARE_API_TOKEN=<token>```
