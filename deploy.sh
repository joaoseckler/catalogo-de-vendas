set -a
. ./.env
set +a

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"  # This loads bun

if [ ! -z $1 ]; then
  selected_site="$1"
fi

jq --raw-output -c '.[]' sites.json | while read i; do
  site="$(echo "$i" | jq --raw-output -c '.name')"

  if [ ! -z "$selected_site" ] && [ "$site" != "$selected_site" ]; then
    echo skipping $site
    continue
  fi

  echo =========================================================
  echo "Deploying $site"
  bun run scripts/fetch-data.js -s "$site"

  export SITE="$site"
  deploy_path="$(echo "$i" | jq --raw-output -c '.deployPath')"
  pages="$(echo "$i" | jq --raw-output -c '.pages')"

  if [ -z "$pages" ]; then
    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
      mkdir -p "$deploy_path"
      dest="$deploy_path"
    elif [ -z "$HOST" ]; then
      echo -n "HOST environment variable is not set. Please set it to "
      echo -n "the remote host you want to deploy to or to localhost "
      echo "to have it deployed in this machine."
      exit 1
    else
      ssh "$HOST" "mkdir -p $deploy_path"
      dest="$HOST:$deploy_path"
    fi
  fi

  bun run build

  if [ -z "$pages" ]; then
    rsync -avz --delete dist/ "$dest"
  else
    wrangler pages deploy dist --project-name "$pages"
  fi
done
