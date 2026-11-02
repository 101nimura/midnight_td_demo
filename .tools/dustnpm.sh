# DUST 代替ツール（tools/dust）で npm を実行する
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"
cd "$REPO_ROOT/tools/dust" && npm "$@"
