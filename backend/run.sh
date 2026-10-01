#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# .venv 可能是从别的机器拷来的（解释器路径在本机不存在）；不能用时重建，而不是沿用坏环境。
if [ ! -x .venv/bin/python ] || ! .venv/bin/python -c "import fastapi" >/dev/null 2>&1; then
  rm -rf .venv
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt
exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
