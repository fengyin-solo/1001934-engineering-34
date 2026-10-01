.PHONY: install backend frontend frontend-typecheck frontend-test frontend-build frontend-pipeline

install:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	# 前端按 package-lock.json 复现依赖，换台机器版本也一致
	cd frontend && npm ci

backend:
	cd backend && ./run.sh

# 本地开发仍然只起前端，不强制类型检查/构建
frontend:
	cd frontend && npm run dev

# 只做类型检查；报错时 vue-tsc 会打印 文件:行:列，非 0 退出
frontend-typecheck:
	cd frontend && npm run typecheck

# 验收单汇总卡片口径断言
frontend-test:
	cd frontend && npm test

# 类型检查通过后才出构建产物（typecheck 不写盘，不污染 dist）
frontend-build:
	cd frontend && npm run build

# 一条命令跑完前端流水线：类型检查 -> 口径测试 -> 构建
frontend-pipeline: frontend-typecheck frontend-test frontend-build
