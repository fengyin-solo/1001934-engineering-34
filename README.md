# 风电场机组运维平台

面向风电场站台账、机组部件监测、变桨偏航调试、缺陷处置与上网电量结算的一体化运维后台。

这是一个前后端分离的管理平台：前端 Vue 3 + Vite + TypeScript，后端 FastAPI（Python）。
两边各自独立启动，前端 dev server 已关掉自动打开页面，启动后按终端打印的地址手工打开。

## 目录结构

```text
.
├── frontend/                 Vue 3 + Vite + TypeScript 前端
│   ├── src/views/            每个业务模块一个页面
│   ├── src/api/              统一请求封装
│   ├── src/stores/           会话与筛选状态
│   └── vite.config.ts        dev server 配置（open: false）
├── backend/                  FastAPI（Python） 后端
│   ├── app/routers/          每个业务模块一组接口
│   ├── app/services/         业务规则与状态流转
│   └── app/store.py          内存数据仓库与示例数据
├── .gitignore
└── docker-compose.yml
```

## 启动

### 后端

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
./run.sh
```

健康检查：`curl http://127.0.0.1:8000/api/health`

### 前端

本地开发只起前端（不强制类型检查/构建）：

```bash
cd frontend
npm ci          # 或 npm install；按 package-lock.json 复现依赖
npm run dev
```

前端默认监听 `http://127.0.0.1:5173/`，dev server 不会自动打开浏览器，
需要自己访问。`/api` 由 vite 代理到后端 `http://127.0.0.1:8000`。

#### 类型检查与构建流水线

装完依赖后一条命令跑通「类型检查 → 汇总口径测试 → 构建」：

```bash
make frontend-pipeline
# 等价于 cd frontend && npm run typecheck && npm test && npm run build
```

- `npm run typecheck`：`vue-tsc --noEmit` 全量类型检查，只报错不写盘，
  重复执行不会改动 `dist/`；报错格式为 `文件(行,列)`，非 0 退出，
  验收单的验收项目/验收标准字段、状态、动作等改动写错会被直接拦下。
- `npm test`：验收确认汇总卡片口径断言（卡片第一张恒为列表条数）。
- `npm run build`：先跑类型检查再 `vite build`，类型不过不出产物。
- 换台机器：`npm ci` 严格按提交的 `package-lock.json` 安装（含 rollup
  各平台原生包），避免「我机器上能装」的问题。

也可单独执行：`make frontend-typecheck`、`make frontend-test`、
`make frontend-build`。

#### 配置优先级（仓库配置优先）

dev 与部署两套参数分别提交在 `frontend/.env.development`、
`frontend/.env.production`，各环节（`vite.config.ts` 的 dev/preview/代理、
前端代码读取的 `import.meta.env`）都只从对应仓库文件取数。shell 里同名
`VITE_*` 变量以及未提交的本地覆盖不会生效，两套参数冲突时以仓库配置为准。

| 变量 | development | production |
| --- | --- | --- |
| dev 监听 | `127.0.0.1:5173` | — |
| preview 监听 | `127.0.0.1:4173` | `0.0.0.0:5173` |
| `/api` 代理目标 | `http://127.0.0.1:8000` | `http://backend:8000` |

部署镜像用多阶段 `frontend/Dockerfile`：构建阶段 `npm ci` 后 `npm run build`
（类型检查不过则镜像构建失败），运行阶段 `vite preview --mode production`
托管 `dist/` 并按 `.env.production` 代理到 compose 里的 `backend` 服务。

## 业务模块

| 模块 | 目录 | 业务对象 | 主要字段 |
| --- | --- | --- | --- |
| 风电场站 | `windfarm` | 风电场站 | 场站编码、场站名称、所在区域 |
| 风电机组 | `turbine` | 风电机组 | 机组编号、机组机型、额定功率 |
| 叶片 | `blade` | 叶片 | 叶片编号、所属机组、叶片长度 |
| 齿轮箱 | `gearbox` | 齿轮箱 | 齿轮箱编号、所属机组、油温上限 |
| 发电机 | `generator` | 发电机 | 发电机编号、所属机组、额定电压 |
| 变桨系统 | `pitch` | 变桨系统 | 系统编号、所属机组、变桨方式 |
| 偏航系统 | `yaw` | 偏航系统 | 系统编号、所属机组、偏航方式 |
| 测风塔 | `metmast` | 测风塔 | 塔架编号、所在场站、塔架高度 |
| 集电线路 | `collector` | 集电线路 | 线路编号、电压等级、起止杆塔 |
| 升压站 | `substation` | 升压站 | 站区编号、主变容量、电压等级 |
| 功率预测 | `forecast` | 功率预测单 | 预测单号、所属场站、预测日期 |
| 振动监测 | `vibration` | 振动监测记录 | 监测编号、监测部位、所属机组 |
| 缺陷登记 | `defect` | 机组缺陷 | 缺陷编号、缺陷部位、缺陷等级 |
| 检修任务 | `maintjob` | 检修任务单 | 任务编号、关联机组、检修类型 |
| 备件领用 | `spare` | 备件领用单 | 领用单号、备件名称、备件规格 |
| 巡视检查 | `patrol` | 巡视单 | 巡视单号、巡视路线、巡视人员 |
| 验收确认 | `accept` | 验收单 | 验收单号、关联任务、验收项目 |
| 电量结算 | `settle` | 电量结算单 | 结算单号、结算周期、所属场站 |

## 约定

- 每个模块的前端页面在 `frontend/src/views/<模块>/index.vue`，后端接口在
  `backend/app/routers/<模块>.py`，业务规则在 `backend/app/services/<模块>.py`。
- 列表接口统一返回 `{ items, total, page, size }`，动作接口统一返回 `{ ok, message }`。
- 状态流转只允许在 `app/services` 里改，路由层不做业务判断。
