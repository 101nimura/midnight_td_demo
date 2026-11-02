# リポジトリのルートで npm を実行する（例: bash .tools/npm.sh run dev）
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"
cd "$REPO_ROOT" && npm "$@"
