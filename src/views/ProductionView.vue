<template>
  <section>
    <header class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Production Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Track daily production output</p>
      </div>
      <button v-if="canCreate" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add Log
      </button>
    </header>

    <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in productionCards" :key="card.label" :class="[cardClass, toneClass(card.tone)]">
        <p class="text-lg">{{ card.label }}</p>
        <h3 class="my-2 text-4xl font-bold">{{ card.value }}</h3>
        <small class="text-sm">{{ card.note }}</small>
      </article>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-[1fr_120px]">
      <input v-model="query" type="text" placeholder="Search date (e.g. Feb)" class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" @keyup.enter="loadData(1)" />
      <button class="rounded-lg border border-[#d1cbc0] bg-[#f2f0ea] px-4 py-3 text-zinc-800" @click="loadData(1)">Filter</button>
    </div>

    <h3 class="mb-3 mt-8 text-2xl font-bold text-zinc-800 md:text-3xl">Daily Production Log</h3>
    <div class="overflow-x-auto rounded-lg border border-[#ddd8ce] bg-farm-panel shadow-sm">
      <table class="min-w-[860px] w-full border-collapse">
        <thead class="bg-farm-green text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm">Date</th>
            <th class="px-4 py-3 text-left text-sm">Milk (L)</th>
            <th class="px-4 py-3 text-left text-sm">Eggs</th>
            <th class="px-4 py-3 text-left text-sm">Wool (kg)</th>
            <th class="px-4 py-3 text-left text-sm">Total Value</th>
            <th v-if="canEdit" class="px-4 py-3 text-right text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredRows.length">
            <td :colspan="canEdit ? 6 : 5" class="px-4 py-8 text-center text-[#7a7467]">No production logs available.</td>
          </tr>
          <tr v-for="row in filteredRows" :key="row.id" class="border-t border-[#ddd8ce]">
            <td class="px-4 py-3 font-bold">{{ row.date }}</td>
            <td class="px-4 py-3">{{ row.milk }}</td>
            <td class="px-4 py-3">{{ row.eggs }}</td>
            <td class="px-4 py-3">{{ row.wool }}</td>
            <td class="px-4 py-3 font-bold">{{ row.total }}</td>
            <td v-if="canEdit" class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(row)">Edit</button>
                <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="askDelete(row)">Delete</button>
              </div>
            </td>
          </tr>
          <tr class="bg-farm-gold font-bold text-zinc-800">
            <td class="px-4 py-3">WEEKLY TOTAL</td>
            <td class="px-4 py-3">{{ weeklyMilk }}</td>
            <td class="px-4 py-3">{{ weeklyEggs }}</td>
            <td class="px-4 py-3">{{ weeklyWool }}</td>
            <td class="px-4 py-3">{{ weeklyValue }}</td>
            <td v-if="canEdit" class="px-4 py-3"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex items-center justify-end gap-2">
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page <= 1" @click="loadData(page - 1)">Prev</button>
      <span class="text-sm text-[#6f6758]">Page {{ page }} / {{ totalPages }}</span>
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page >= totalPages" @click="loadData(page + 1)">Next</button>
    </div>

    <BaseModal :open="modalOpen" :title="modalMode === 'create' ? 'Add Production Log' : 'Edit Production Log'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model="form.date" type="date" required class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.milkLiters" type="number" min="0" step="0.01" required placeholder="Milk (L)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.eggsCount" type="number" min="0" step="1" required placeholder="Eggs" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.woolKg" type="number" min="0" step="0.01" required placeholder="Wool (kg)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.totalValue" type="number" min="0" step="0.01" required placeholder="Total Value" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <div class="md:col-span-2">
          <p v-if="fieldErrors.length" class="mb-2 text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <div class="flex items-center gap-3">
            <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
          </div>
        </div>
      </form>
    </BaseModal>

    <ConfirmModal
      :open="confirmOpen"
      title="Delete Production Log"
      :message="`Delete production log for ${pendingDelete?.date || ''}?`"
      confirm-text="Delete"
      @cancel="confirmOpen = false"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseModal from '../components/BaseModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { fmtCurrency } from '../utils/animal'
import { hasActionAccess } from '../utils/rbac'

const auth = useAuthStore()
const summary = ref({ weeklyMilk: 0, weeklyEggs: 0, weeklyWool: 0, weeklyValue: 0, productivityChange: 0 })
const rows = ref([])
const query = ref('')
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const modalOpen = ref(false)
const modalMode = ref('create')
const selectedId = ref(null)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref([])

const confirmOpen = ref(false)
const pendingDelete = ref(null)

const form = ref({ date: '', milkLiters: 0, eggsCount: 0, woolKg: 0, totalValue: 0 })

const canCreate = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'production.create'))
const canEdit = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'production.manage'))

const filteredRows = computed(() => {
  if (!query.value.trim()) return rows.value
  return rows.value.filter((r) => r.date.toLowerCase().includes(query.value.trim().toLowerCase()))
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const cardClass =
  'rounded-lg p-5 shadow-[0_4px_0_rgba(0,0,0,0.12)] bg-[length:20px_20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)]'
const toneClass = (tone) => ({
  green: 'bg-farm-green text-white',
  gold: 'bg-farm-gold text-zinc-800',
  orange: 'bg-farm-orange text-white',
  red: 'bg-farm-red text-white'
}[tone] || 'bg-farm-green text-white')

const productionCards = computed(() => [
  { label: 'Weekly Milk', value: `${summary.value.weeklyMilk}L`, note: 'Last 7 days', tone: 'green' },
  { label: 'Weekly Eggs', value: summary.value.weeklyEggs, note: 'Last 7 days', tone: 'gold' },
  { label: 'Weekly Wool', value: `${summary.value.weeklyWool} kg`, note: 'Last 7 days', tone: 'orange' },
  {
    label: 'Productivity',
    value: `${summary.value.productivityChange >= 0 ? '+' : ''}${Number(summary.value.productivityChange || 0).toFixed(1)}%`,
    note: 'vs previous 7 days',
    tone: summary.value.productivityChange >= 0 ? 'green' : 'red'
  }
])

const weeklyMilk = computed(() => `${summary.value.weeklyMilk} L`)
const weeklyEggs = computed(() => summary.value.weeklyEggs)
const weeklyWool = computed(() => `${summary.value.weeklyWool} kg`)
const weeklyValue = computed(() => fmtCurrency(summary.value.weeklyValue))

function resetForm() {
  form.value = { date: '', milkLiters: 0, eggsCount: 0, woolKg: 0, totalValue: 0 }
  fieldErrors.value = []
}

function openCreateModal() {
  if (!canCreate.value) return
  resetForm()
  modalMode.value = 'create'
  selectedId.value = null
  error.value = ''
  modalOpen.value = true
}

function openEditModal(row) {
  if (!canEdit.value) return
  modalMode.value = 'edit'
  selectedId.value = row.id
  error.value = ''
  fieldErrors.value = []
  form.value = {
    date: row.dateRaw,
    milkLiters: row.milkValue,
    eggsCount: row.eggsValue,
    woolKg: row.woolValue,
    totalValue: row.totalValue
  }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  error.value = ''
  fieldErrors.value = []
}

function validateForm() {
  const issues = []
  if (!form.value.date) issues.push('Date is required.')
  if (form.value.milkLiters < 0) issues.push('Milk cannot be negative.')
  if (form.value.eggsCount < 0) issues.push('Eggs cannot be negative.')
  if (form.value.woolKg < 0) issues.push('Wool cannot be negative.')
  if (form.value.totalValue < 0) issues.push('Total value cannot be negative.')
  fieldErrors.value = issues
  return issues.length === 0
}

async function loadData(nextPage = page.value) {
  const [sum, logsRes] = await Promise.all([
    apiGet('/api/production/summary'),
    apiGet(`/api/production/logs?page=${nextPage}&pageSize=${pageSize.value}`)
  ])
  summary.value = sum
  rows.value = Array.isArray(logsRes) ? logsRes : (logsRes.items || [])
  totalCount.value = Number(logsRes.total || rows.value.length)
  page.value = Number(logsRes.page || nextPage)
}

async function submitModal() {
  if (modalMode.value === 'create' && !canCreate.value) return
  if (modalMode.value === 'edit' && !canEdit.value) return
  if (!validateForm()) return
  error.value = ''
  saving.value = true
  try {
    if (modalMode.value === 'create') {
      await apiPost('/api/production/logs', form.value)
    } else {
      await apiPut(`/api/production/logs/${selectedId.value}`, form.value)
    }
    await loadData()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save production log'
  } finally {
    saving.value = false
  }
}

function askDelete(row) {
  if (!canEdit.value) return
  pendingDelete.value = row
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  try {
    await apiDelete(`/api/production/logs/${pendingDelete.value.id}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to delete production log'
  }
}

onMounted(() => loadData(1))
</script>
