set -a
. ./.env
set +a

bun scripts/fetch-data.ts
bun run build
rsync -avz --delete dist/ "$HOST":"$DEPLOY_PATH"
