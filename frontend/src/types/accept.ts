/**
 * 验收确认模块的接口契约：字段名与后端
 * backend/app/routers/accept.py 的 LIST_FIELDS、
 * backend/app/services/accept.py 的状态口径保持一致。
 * 改动「验收项目 / 验收标准」等列名或状态时，这里和页面会一起被类型检查拦住。
 */

/** 验收单可执行动作：与后端 ACTION_RULES 的键一一对应。 */
export type AcceptAction = '开始验收' | '确认通过' | '下发返工'

/** 验收单状态：与后端 STATUS_ORDER 保持同序同值。 */
export type AcceptStatus = '待验收' | '验收中' | '已通过' | '需返工'

/** 验收单明细列：键必须和后端中文列名完全一致，拼错会在类型检查时报错。 */
export interface AcceptEntry {
  id: number
  /** 列表不直接展示，但筛选与动作回写依赖它，后端两条状态列始终同步。 */
  status?: AcceptStatus
  pending?: boolean
  abnormal?: boolean
  验收单号: string
  关联任务: string
  验收项目: string
  验收标准: string
  验收结论: string | null
  验收人员: string | null
  验收日期: string | null
  验收状态: AcceptStatus
}

export interface AcceptStatCard {
  label: string
  value: number
}

/** GET /api/accept 的响应：stats 与 items/total 来自同一筛选口径。 */
export interface AcceptListResponse {
  items: AcceptEntry[]
  total: number
  page: number
  size: number
  stats: AcceptStatCard[]
}

/** 列表上要展示的列；顺序就是表头顺序。 */
export const ACCEPT_COLUMNS = [
  '验收单号',
  '关联任务',
  '验收项目',
  '验收标准',
  '验收结论',
  '验收人员',
  '验收日期',
  '验收状态',
] as const satisfies readonly (keyof AcceptEntry)[]

export type AcceptColumn = (typeof ACCEPT_COLUMNS)[number]

export const ACCEPT_ACTIONS: readonly AcceptAction[] = ['开始验收', '确认通过', '下发返工']

export const ACCEPT_STATUSES: readonly AcceptStatus[] = ['待验收', '验收中', '已通过', '需返工']
