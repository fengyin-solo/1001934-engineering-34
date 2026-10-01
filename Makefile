.PHONY: install backend frontend frontend-typecheck frontend-build build

# 一条完整流程：装依赖 -> 类型检查 -> 构建产物。
# 前端依赖带 package-lock.json，换机器用 npm ci 装出和仓库一致的版本；
# 后端 .venv 不能用时（例如从别的机器拷过来、指向不存在的解释器）直接重建，不复用坏环境。
install:
	if [ ! -x backend/.venv/bin/python ] || ! backend/.venv/bin/python -c "import fastapi" >/dev/null 2>&1; then \
		rm -rf backend/.venv && python3 -m venv backend/.venv; \
	fi
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm ci

# 本地开发仍可只起前端：make frontend
frontend:
	cd frontend && npm run dev

frontend-typecheck:
	cd frontend && npm run typecheck

# 前端构建内含类型检查；类型检查不过不会产出 dist。
frontend-build:
	cd frontend && npm run build

# 不装依赖，只跑「类型检查 + 构建」这一段流水线。
build: frontend-typecheck frontend-build

backend:
	cd backend && ./run.sh
