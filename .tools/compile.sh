# Compact コントラクトをコンパイルする（引数例: --skip-zk）
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"
cd "$REPO_ROOT" && compact compile "$@" contract/tdeposit.compact contract/managed/tdeposit
