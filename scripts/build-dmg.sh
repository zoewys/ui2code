#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="${1:-$(node -p "require('./package.json').version")}"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/dmg-stage"
PLUGIN_DIR="$STAGE_DIR/UI2Code"
DMG_PATH="$DIST_DIR/UI2Code-$VERSION.dmg"

rm -rf "$STAGE_DIR"
mkdir -p "$PLUGIN_DIR"

rsync -a "$ROOT_DIR"/ "$PLUGIN_DIR"/ \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude ".ui2code" \
  --exclude "*.log" \
  --exclude ".DS_Store"

cat > "$STAGE_DIR/Install UI2Code.command" <<'INSTALLER'
#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/UI2Code" && pwd)"
TARGET_DIR="$HOME/plugins/ui2code"

mkdir -p "$HOME/plugins"
if [ -e "$TARGET_DIR" ]; then
  BACKUP_DIR="$HOME/plugins/ui2code.backup.$(date +%Y%m%d%H%M%S)"
  mv "$TARGET_DIR" "$BACKUP_DIR"
  echo "已备份旧版本到 $BACKUP_DIR"
fi
ditto "$SOURCE_DIR" "$TARGET_DIR"

if command -v npm >/dev/null 2>&1; then
  (cd "$TARGET_DIR" && npm install)
else
  echo "未找到 npm，请先安装 Node.js 后再运行：cd ~/plugins/ui2code && npm install"
fi

if command -v codex >/dev/null 2>&1; then
  codex plugin marketplace add "$HOME/plugins" || true
  codex plugin add ui2code@personal || true
else
  echo "未找到 codex 命令，请稍后手动运行：codex plugin marketplace add ~/plugins && codex plugin add ui2code@personal"
fi

echo
echo "UI2Code 已安装到 $TARGET_DIR"
echo "建议打开一个新的 Codex 对话，让插件配置重新加载。"
read -r -n 1 -s -p "按任意键关闭窗口..."
echo
INSTALLER

chmod +x "$STAGE_DIR/Install UI2Code.command"

rm -f "$DMG_PATH"
hdiutil create \
  -volname "UI2Code $VERSION" \
  -srcfolder "$STAGE_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo "$DMG_PATH"
