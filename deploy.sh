set -a
. ./.env
set +a

if [ ! -z $1 ]; then
  selected_site="$1"
fi

bun scripts/fetch-data.ts
jq --raw-output -c '.[]' sites.json | while read i; do
  site="$(echo "$i" | jq --raw-output -c '.name')"
  if [ ! -z "$selected_site" ] && [ "$site" != "$selected_site" ]; then
    continue
  fi

  host="$(echo "$i" | jq --raw-output -c '.host')"
  deploy_path="$(echo "$i" | jq --raw-output -c '.deployPath')"
  export SITE="$site"
  echo =========================================================
  echo "Deploying $site"
  bun run build
  ssh "$host" "mkdir -p $deploy_path"
  rsync -avz --delete dist/ "$host":"$deploy_path" --exclude="dist/favicons/*"
done
