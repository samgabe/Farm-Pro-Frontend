<template>
  <section>
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Sales Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Track all farm sales and revenue</p>
      </div>
      <button v-if="canWrite" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add Sale
      </button>
    </header>
    <div class="mt-4 grid gap-3 md:grid-cols-[1fr_120px]">
      <input v-model="query" type="text" placeholder="Search product or buyer..." class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" @keyup.enter="loadData(1)" />
      <button class="rounded-lg border border-[#d1cbc0] bg-[#f2f0ea] px-4 py-3 text-zinc-800" @click="loadData(1)">Filter</button>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <article v-for="card in cards" :key="card.label" :class="[cardClass, toneClass(card.tone)]">
        <p class="text-lg">{{ card.label }}</p>
        <h3 class="my-2 text-4xl font-bold">{{ card.value }}</h3>
        <small class="text-sm">{{ card.note }}</small>
      </article>
    </div>
    <div class="mt-3 flex items-center justify-end gap-2">
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page <= 1" @click="loadData(page - 1)">Prev</button>
      <span class="text-sm text-[#6f6758]">Page {{ page }} / {{ totalPages }}</span>
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page >= totalPages" @click="loadData(page + 1)">Next</button>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Sales Ledger</h3>
    <div class="overflow-x-auto rounded-lg border border-[#ddd8ce] bg-farm-panel shadow-sm">
      <table class="w-full min-w-[1040px] border-collapse">
        <thead class="bg-farm-green text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm">Date</th>
            <th class="px-4 py-3 text-left text-sm">Product</th>
            <th class="px-4 py-3 text-left text-sm">Quantity</th>
            <th class="px-4 py-3 text-left text-sm">Buyer</th>
            <th class="px-4 py-3 text-left text-sm">Price/Unit</th>
            <th class="px-4 py-3 text-left text-sm">Total</th>
            <th v-if="canWrite" class="px-4 py-3 text-right text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!ledger.length">
            <td :colspan="canWrite ? 7 : 6" class="px-4 py-8 text-center text-[#7a7467]">No sales yet. Add your first sale.</td>
          </tr>
          <tr v-for="row in ledger" :key="row.date + row.product" class="border-t border-[#ddd8ce]">
            <td class="px-4 py-3">{{ row.date }}</td>
            <td class="px-4 py-3 font-bold">{{ row.product }}</td>
            <td class="px-4 py-3">{{ row.quantity }}</td>
            <td class="px-4 py-3">{{ row.buyer }}</td>
            <td class="px-4 py-3">{{ row.price }}</td>
            <td class="px-4 py-3 font-bold text-farm-green">{{ row.total }}</td>
            <td v-if="canWrite" class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(row)">Edit</button>
                <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="deleteSale(row)">Delete</button>
              </div>
            </td>
          </tr>
          <tr class="bg-farm-gold font-bold text-zinc-800">
            <td class="px-4 py-3">TOTAL REVENUE</td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3">{{ total }}</td>
            <td v-if="canWrite" class="px-4 py-3"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="modalOpen" :title="modalMode === 'create' ? 'Add Sale' : 'Edit Sale'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model="form.date" type="date" required class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.product" required placeholder="Product" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.quantityValue" type="number" min="0.01" step="0.01" required placeholder="Quantity" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.quantityUnit" required placeholder="Unit" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.buyer" required placeholder="Buyer" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.pricePerUnit" type="number" min="0.01" step="0.01" required placeholder="Price per unit" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <div class="md:col-span-2 flex items-center gap-3">
          <p v-if="fieldErrors.length" class="text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
        </div>
      </form>
    </BaseModal>
    <ConfirmModal :open="confirmOpen" title="Delete Sale" :message="`Delete sale ${pendingDelete?.product || ''}?`" confirm-text="Delete" @cancel="confirmOpen = false" @confirm="confirmDeleteSale" />
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
const summary = ref({ totalRevenue: 0, dailyAverage: 0, topProduct: '-', topAmount: 0 })
const ledger = ref([])
const modalOpen = ref(false)
const modalMode = ref('create')
const confirmOpen = ref(false)
const pendingDelete = ref(null)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref([])
const selectedId = ref(null)
const query = ref('')
const page = ref(1)
const totalCount = ref(0)
const pageSize = ref(10)
const form = ref({
  date: '',
  product: '',
  quantityValue: null,
  quantityUnit: '',
  buyer: '',
  pricePerUnit: null
})

const cardClass =
  'rounded-lg p-5 shadow-[0_4px_0_rgba(0,0,0,0.12)] bg-[length:20px_20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)]'

const toneClass = (tone) => ({
  green: 'bg-farm-green text-white',
  gold: 'bg-farm-gold text-zinc-800',
  orange: 'bg-farm-orange text-white',
  red: 'bg-farm-red text-white'
}[tone] || 'bg-farm-green text-white')

const cards = computed(() => [
  { label: 'Total Revenue (Month)', value: fmtCurrency(summary.value.totalRevenue), note: 'Current month', tone: 'green' },
  { label: 'Daily Average', value: fmtCurrency(summary.value.dailyAverage), note: 'Per day', tone: 'gold' },
  {
    label: 'Top Product',
    value: summary.value.topProduct || '-',
    note: fmtCurrency(summary.value.topAmount),
    tone: 'orange'
  }
])

const total = computed(() => fmtCurrency(summary.value.totalRevenue))
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const canWrite = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'sales.write'))

async function loadData(nextPage = page.value) {
  const [sum, items] = await Promise.all([
    apiGet('/api/sales/summary'),
    apiGet(`/api/sales?q=${encodeURIComponent(query.value || '')}&page=${nextPage}&pageSize=${pageSize.value}`)
  ])
  summary.value = sum
  ledger.value = Array.isArray(items) ? items : (items.items || [])
  totalCount.value = Number(items.total || ledger.value.length)
  page.value = Number(items.page || nextPage)
}

async function createSale() {
  await apiPost('/api/sales', form.value)
}

async function updateSale() {
  await apiPut(`/api/sales/${selectedId.value}`, form.value)
}

function resetForm() {
  form.value = { date: '', product: '', quantityValue: null, quantityUnit: '', buyer: '', pricePerUnit: null }
  fieldErrors.value = []
}

function openCreateModal() {
  if (!canWrite.value) return
  resetForm()
  selectedId.value = null
  error.value = ''
  modalMode.value = 'create'
  modalOpen.value = true
}

function openEditModal(row) {
  if (!canWrite.value) return
  selectedId.value = row.id
  error.value = ''
  modalMode.value = 'edit'
  form.value = {
    date: row.dateRaw,
    product: row.product,
    quantityValue: row.quantityValue,
    quantityUnit: row.quantityUnit,
    buyer: row.buyer,
    pricePerUnit: row.pricePerUnit
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
  if (!String(form.value.date || '').trim()) issues.push('Date is required.')
  if (!String(form.value.product || '').trim()) issues.push('Product is required.')
  if (!Number.isFinite(Number(form.value.quantityValue)) || Number(form.value.quantityValue) <= 0) issues.push('Quantity must be greater than 0.')
  if (!String(form.value.quantityUnit || '').trim()) issues.push('Unit is required.')
  if (!String(form.value.buyer || '').trim()) issues.push('Buyer is required.')
  if (!Number.isFinite(Number(form.value.pricePerUnit)) || Number(form.value.pricePerUnit) <= 0) issues.push('Price must be greater than 0.')
  fieldErrors.value = issues
  return issues.length === 0
}

async function submitModal() {
  if (!canWrite.value) return
  if (!validateForm()) return
  error.value = ''
  saving.value = true
  try {
    if (modalMode.value === 'create') await createSale()
    else await updateSale()
    await loadData()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save sale'
  } finally {
    saving.value = false
  }
}

async function deleteSale(row) {
  if (!canWrite.value) return
  pendingDelete.value = row
  confirmOpen.value = true
}

async function confirmDeleteSale() {
  if (!pendingDelete.value) return
  try {
    await apiDelete(`/api/sales/${pendingDelete.value.id}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to delete sale'
  }
}

onMounted(() => loadData(1))
</script>
