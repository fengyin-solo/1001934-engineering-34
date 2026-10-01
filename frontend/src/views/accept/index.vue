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
      <label class="filter-item">
        <span>验收单号</span>
        <input v-model="filters.keyword" placeholder="按验收单号检索" />
      </label>
      <label class="filter-item">
        <span>验收状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
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
          <td v-for="column in columns" :key="column">{{ formatCell(row, column) }}</td>
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
import { onMounted, ref } from 'vue'

import { request } from '@/api/client'
import {
  ACCEPT_ACTIONS,
  ACCEPT_COLUMNS,
  ACCEPT_STATUSES,
  type AcceptAction,
  type AcceptColumn,
  type AcceptEntry,
  type AcceptListResponse,
  type AcceptStatCard,
  type AcceptStatus,
} from '@/types/accept'

const ENDPOINT = '/api/accept'
const columns = ACCEPT_COLUMNS
const actions = ACCEPT_ACTIONS
const statusOptions = ACCEPT_STATUSES

interface AcceptFilters {
  keyword: string
  status: '' | AcceptStatus
}

const rows = ref<AcceptEntry[]>([])
const total = ref(0)
const stats = ref<AcceptStatCard[]>([])
const errorMessage = ref('')
const filters = ref<AcceptFilters>({ keyword: '', status: '' })

function formatCell(row: AcceptEntry, column: AcceptColumn): string {
  const value = row[column]
  return value === null || value === '' ? '—' : String(value)
}

function resetFilters() {
  filters.value = { keyword: '', status: '' }
  void reload()
}

function exportRows() {
  window.open(`${ENDPOINT}/export`, '_blank')
}

function openCreate() {
  errorMessage.value = '验收单登记入口尚未接入审批流'
}

async function runAction(action: AcceptAction, row: AcceptEntry) {
  errorMessage.value = ''
  try {
    const response = await request(`${ENDPOINT}/${row.id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ values: { action } }),
    })
    if (!response.ok) {
      throw new Error('验收确认动作未生效，请稍后重试')
    }
    const payload = (await response.json()) as { ok?: boolean; message?: string }
    if (payload.ok === false) {
      throw new Error(payload.message ?? '验收确认动作未生效')
    }
    await reload()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '验收确认操作失败'
  }
}

function buildQuery(): string {
  const params = new URLSearchParams()
  if (filters.value.keyword.trim()) {
    params.set('keyword', filters.value.keyword.trim())
  }
  if (filters.value.status) {
    params.set('status', filters.value.status)
  }
  return params.toString()
}

async function reload() {
  errorMessage.value = ''
  const query = buildQuery()
  try {
    const response = await request(`${ENDPOINT}${query ? `?${query}` : ''}`)
    if (!response.ok) {
      throw new Error('验收单列表读取失败')
    }
    // stats 与 items/total 在同一个响应里，由后端按同一筛选口径算出。
    const payload = (await response.json()) as AcceptListResponse
    rows.value = payload.items
    total.value = payload.total
    stats.value = payload.stats
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '验收确认列表读取失败'
  }
}

onMounted(reload)
</script>
