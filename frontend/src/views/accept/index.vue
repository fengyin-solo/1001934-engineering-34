<template>
  <section class="page" data-module="accept">
    <header class="page-head">
      <div>
        <h2>验收确认管理</h2>
        <p class="page-desc">维护验收单，围绕验收单号、关联任务、验收项目、验收标准做登记、筛选与状态流转。</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" type="button" @click="openCreate">登记验收单</button>
        <button class="btn" type="button" @click="exportRows">导出验收确认清单</button>
      </div>
    </header>

    <div class="stat-row">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span class="stat-label">{{ item.label }}</span>
        <strong class="stat-value">{{ item.value }}</strong>
      </article>
    </div>

    <form class="filter-bar" @submit.prevent="reload">
      <label v-for="field in filterFields" :key="field" class="filter-item">
        <span>{{ field }}</span>
        <input v-model="filters[field]" :placeholder="`按${field}检索`" />
      </label>
      <button class="btn" type="submit">查询</button>
      <button class="btn ghost" type="button" @click="resetFilters">重置条件</button>
    </form>

    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column">{{ column }}</th>
          <th>可执行动作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td v-for="column in columns" :key="column">{{ row[column] ?? '—' }}</td>
          <td class="row-actions">
            <button
              v-for="action in actions"
              :key="action"
              class="link"
              type="button"
              @click="runAction(action, row)"
            >
              {{ action }}
            </button>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length + 1" class="empty-state">暂无验收确认数据，可先登记验收单</td>
        </tr>
      </tbody>
    </table>

    <footer class="page-foot">
      <span>共 {{ total }} 条验收确认记录</span>
      <span v-if="errorMessage" class="error-text">{{ errorMessage }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { request } from '@/api/client'
import { buildAcceptStats, currentMonth, type AcceptRow, type StatCard } from './stats'

/** 列表接口统一返回 { items, total, page, size }。 */
interface AcceptListResponse {
  items: AcceptRow[]
  total: number
  page: number
  size: number
}

interface ActionResponse {
  ok: boolean
  message: string
}

type AcceptColumn = keyof Pick<
  AcceptRow,
  '验收单号' | '关联任务' | '验收项目' | '验收标准' | '验收结论' | '验收人员' | '验收日期' | '验收状态'
>

type AcceptAction = '开始验收' | '确认通过' | '下发返工'

const ENDPOINT = '/api/accept'
const columns: AcceptColumn[] = ['验收单号', '关联任务', '验收项目', '验收标准', '验收结论', '验收人员', '验收日期', '验收状态']
const actions: AcceptAction[] = ['开始验收', '确认通过', '下发返工']
// 后端单页上限 200；一次拉回全部匹配行，保证汇总卡片与列表同一份数据、口径一致
const PAGE_SIZE = 200
const month = currentMonth()

const rows = ref<AcceptRow[]>([])
const total = ref(0)
const errorMessage = ref('')
const filters = ref<Record<string, string>>({})
const filterFields = columns.slice(0, 3)

// 汇总卡片直接从当前列表行计算，不再写死；任一筛选/动作后随列表一起刷新
const stats = computed<StatCard[]>(() => buildAcceptStats(rows.value, month))

function resetFilters() {
  filters.value = {}
  void reload()
}

function exportRows() {
  window.open(`${ENDPOINT}/export`, '_blank')
}

function openCreate() {
  errorMessage.value = '验收单登记入口尚未接入审批流'
}

async function runAction(action: AcceptAction, row: AcceptRow) {
  errorMessage.value = ''
  try {
    const response = await request(`${ENDPOINT}/${row.id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ values: { action } }),
    })
    if (!response.ok) {
      throw new Error('验收确认动作未生效，请稍后重试')
    }
    const result = (await response.json()) as ActionResponse
    if (!result.ok) {
      throw new Error(result.message || '验收确认动作未生效，请稍后重试')
    }
    await reload()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '验收确认操作失败'
  }
}

async function reload() {
  errorMessage.value = ''
  const query = new URLSearchParams({ page: '1', size: String(PAGE_SIZE), ...filters.value }).toString()
  try {
    const response = await request(`${ENDPOINT}?${query}`)
    if (!response.ok) {
      throw new Error('验收单列表读取失败')
    }
    const payload = (await response.json()) as AcceptListResponse
    rows.value = payload.items ?? []
    total.value = payload.total ?? rows.value.length
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '验收确认列表读取失败'
  }
}

onMounted(reload)
</script>
