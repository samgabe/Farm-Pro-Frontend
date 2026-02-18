<template>
  <section>
    <header>
      <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Reports & Analytics</h2>
      <p class="mt-2 text-base text-[#7a7467]">Generate and view farm reports</p>
    </header>

    <div class="mt-4 grid gap-4 lg:grid-cols-4">
      <article v-for="card in cards" :key="card.label" :class="[cardClass, toneClass(card.tone)]">
        <p class="text-lg">{{ card.label }}</p>
        <h3 class="my-2 text-4xl font-bold">{{ card.value }}</h3>
        <small class="text-sm">{{ card.note }}</small>
      </article>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Available Reports</h3>
    <div class="grid gap-4 lg:grid-cols-2">
      <article class="rounded-lg border border-[#ddd8ce] bg-farm-panel p-4" v-for="report in reports" :key="report.id">
        <h4 class="text-2xl font-bold">{{ report.title }}</h4>
        <p class="mt-2 min-h-12 text-[#7a7467]">{{ report.detail }}</p>
        <p class="mt-2 text-sm font-semibold text-[#6f6758]">
          {{ report.category }} | {{ report.dateRange || 'Last 7 days' }} | {{ report.format || 'JSON' }}
        </p>
        <footer class="mt-3 flex items-center justify-between border-t border-[#ddd8ce] pt-3">
          <small>Last generated: {{ report.generated }}</small>
          <button class="font-bold text-farm-green" @click="downloadReport(report)">Download</button>
        </footer>
      </article>
    </div>

    <div class="mt-4 rounded-lg border border-[#ddd8ce] bg-farm-panel p-4 shadow-sm">
      <h3 class="text-3xl font-bold text-zinc-800">Custom Report Builder</h3>
      <p class="mt-2 text-[#7a7467]">Create a custom report by selecting date range, categories, and metrics</p>
      <div class="my-4 grid gap-3 lg:grid-cols-3">
        <label class="grid gap-1">
          Date Range
          <select v-model="builder.dateRange" class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
          </select>
        </label>
        <label class="grid gap-1">
          Report Type
          <select v-model="builder.reportType" class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
            <option>Financial</option>
            <option>Health</option>
            <option>Resources</option>
            <option>Sales</option>
          </select>
        </label>
        <label class="grid gap-1">
          Format
          <select v-model="builder.format" class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
            <option>JSON</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </label>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="canGenerate" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="generating" @click="generateReport">{{ generating ? 'Generating...' : 'Generate Report' }}</button>
        <p v-else class="text-sm font-semibold text-[#7a7467]">You do not have permission to generate reports.</p>
        <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet, apiPost } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { fmtCurrency } from '../utils/animal'
import { hasActionAccess } from '../utils/rbac'

const auth = useAuthStore()
const stats = ref({ monthlyProfit: 0, totalAnimals: 0, operatingCosts: 0, productivityRate: 0 })
const reports = ref([])
const generating = ref(false)
const error = ref('')
const builder = ref({
  dateRange: 'Last 7 days',
  reportType: 'Financial',
  format: 'JSON'
})
const canGenerate = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'reports.generate'))

const cardClass =
  'rounded-lg p-5 shadow-[0_4px_0_rgba(0,0,0,0.12)] bg-[length:20px_20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)]'

const toneClass = (tone) => ({
  green: 'bg-farm-green text-white',
  gold: 'bg-farm-gold text-zinc-800',
  orange: 'bg-farm-orange text-white',
  red: 'bg-farm-red text-white'
}[tone] || 'bg-farm-green text-white')

const cards = computed(() => [
  { label: 'Monthly Profit', value: fmtCurrency(stats.value.monthlyProfit), note: 'Current month', tone: 'green' },
  { label: 'Total Animals', value: stats.value.totalAnimals, note: 'Active livestock', tone: 'green' },
  { label: 'Operating Costs', value: fmtCurrency(stats.value.operatingCosts), note: 'Current month', tone: 'orange' },
  { label: 'Productivity', value: `${stats.value.productivityRate}%`, note: 'Profit-to-revenue ratio', tone: 'green' }
])

async function loadData() {
  const [s, r] = await Promise.all([
    apiGet('/api/reports/stats'),
    apiGet('/api/reports')
  ])
  stats.value = s
  reports.value = Array.isArray(r) ? r : (r.items || [])
}

async function generateReport() {
  if (!canGenerate.value) return
  error.value = ''
  generating.value = true
  try {
    await apiPost('/api/reports/generate', builder.value)
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to generate report'
  } finally {
    generating.value = false
  }
}

async function downloadReport(report) {
  error.value = ''
  try {
    const format = String(report.format || builder.value.format || 'JSON').toUpperCase()
    const token = localStorage.getItem('farmpro_token')
    const apiBase = import.meta.env.VITE_API_BASE || ''
    const res = await fetch(`${apiBase}/api/reports/${report.id}/download?format=${encodeURIComponent(format)}`, {
      headers: {
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.error || `Request failed (${res.status})`)
    }
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    const ext = format === 'CSV' ? 'csv' : (format === 'PDF' ? 'pdf' : 'json')
    link.download = `${String(report.title || 'report').replace(/\s+/g, '-').toLowerCase()}.${ext}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(href)
  } catch (err) {
    error.value = err.message || 'Failed to download report'
  }
}

onMounted(loadData)
</script>
