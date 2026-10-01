// 运行时断言：直接加载真实的 stats.ts（esbuild 转译），验证卡片口径
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

const ts = readFileSync(fileURLToPath(new URL('../src/views/accept/stats.ts', import.meta.url)), 'utf8')
const { code } = transformSync(ts, { loader: 'ts', format: 'esm' })
const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const { buildAcceptStats, currentMonth } = mod

let failures = 0
const assert = (cond, msg) => {
  console.log(cond ? `PASS: ${msg}` : `FAIL: ${msg}`)
  if (!cond) failures++
}

const month = '2026-10'
const row = (id, status, date) => ({
  id, status, pending: status !== '已通过', abnormal: status === '需返工',
  验收单号: `ACCE-000${id}`, 关联任务: `任务${id}`, 验收项目: `项目${id}`, 验收标准: `标准${id}`,
  验收结论: null, 验收人员: `人员${id}`, 验收日期: date, 验收状态: status,
})

// 场景 1：与 seed 同构的 3 条
let rows = [row(1, '待验收', '2026-10-01'), row(2, '验收中', '2026-10-02'), row(3, '已通过', '2026-10-03')]
let cards = buildAcceptStats(rows, month)
assert(cards[0].value === rows.length, '验收单总数卡片 = 列表条数 (3)')
assert(cards[1].value === 1, '待验收单据 = 1')
assert(cards[2].value === 1, '本月通过数 = 1')
assert(cards[3].value === 0, '需返工项数 = 0')

// 场景 2：动作流转后出现返工 + 本月通过
rows = [
  ...rows,
  row(4, '需返工', '2026-10-04'),
  row(5, '已通过', '2026-09-30'), // 上月通过，不计入本月
]
cards = buildAcceptStats(rows, month)
assert(cards[0].value === rows.length, '流转后总数卡片仍 = 列表条数 (5)')
assert(cards[2].value === 1, '本月通过仍 = 1（9月30日不计入）')
assert(cards[3].value === 1, '需返工项数 = 1')

// 场景 3：筛选后只展示部分行
const filtered = rows.filter((r) => r.status === '需返工')
cards = buildAcceptStats(filtered, month)
assert(cards[0].value === filtered.length, '筛选后总数卡片 = 筛选后列表条数 (1)')
assert(cards[1].value === 0 && cards[3].value === 1, '筛选后分项随筛选集合收敛')

// 场景 4：空列表
cards = buildAcceptStats([], month)
assert(cards.every((c) => c.value === 0), '空列表所有卡片为 0')

// 场景 5：卡片标签顺序稳定（模板按顺序渲染）
assert(cards.map((c) => c.label).join(',') === '验收单总数,待验收单据,本月通过数,需返工项数', '卡片标签与顺序稳定')

// 场景 6：currentMonth 为本地时区 7 位 YYYY-MM
assert(/^\d{4}-\d{2}$/.test(currentMonth()), 'currentMonth 输出 YYYY-MM')

process.exit(failures ? 1 : 0)
