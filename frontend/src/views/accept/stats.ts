/** 验收确认汇总卡片口径：卡片一律由当前列表行直接计算，保证与列表条数同源一致。 */

/** 验收单业务状态，与后端 routers/accept.py 的 STATUSES 保持一致。 */
export type AcceptStatus = '待验收' | '验收中' | '已通过' | '需返工'

/** 验收单列表行：展示列用中文字段，状态机用 status/pending/abnormal。 */
export interface AcceptRow {
  id: number
  status: AcceptStatus
  pending: boolean
  abnormal: boolean
  验收单号: string | null
  关联任务: string | null
  验收项目: string | null
  验收标准: string | null
  验收结论: string | null
  验收人员: string | null
  验收日期: string | null
  验收状态: string | null
}

export interface StatCard {
  label: string
  value: number
}

/** 当前年月按本地时区取（YYYY-MM），避免 toISOString 的 UTC 口径在月末跨天误判。 */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 由一批列表行算汇总卡片。第一张卡片恒为列表条数，其余为状态分项；
 * 入参是页面当前展示的同一批行（含筛选），故卡片数字与表格行数天然一致。
 */
export function buildAcceptStats(rows: readonly AcceptRow[], month: string = currentMonth()): StatCard[] {
  return [
    { label: '验收单总数', value: rows.length },
    { label: '待验收单据', value: rows.filter((row) => row.status === '待验收').length },
    {
      label: '本月通过数',
      value: rows.filter((row) => row.status === '已通过' && (row.验收日期 ?? '').startsWith(month)).length,
    },
    { label: '需返工项数', value: rows.filter((row) => row.status === '需返工').length },
  ]
}
