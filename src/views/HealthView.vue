<template>
  <section>
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Health Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Track vaccinations and health records</p>
      </div>
      <button v-if="canWrite" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add Record
      </button>
    </header>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Upcoming Vaccinations</h3>
    <div class="grid gap-3 rounded-lg border border-[#ddd8ce] bg-farm-panel p-3 shadow-sm">
      <article class="flex justify-between border-l-4 border-farm-gold bg-[#f4f1eb] p-4" v-for="item in upcomingVaccinations" :key="item.id + item.treatment">
        <div>
          <strong>
            <component :is="animalIcon(item.animal)" class="mr-1 inline-block h-[18px] w-[18px] align-[-3px]" />
            {{ item.id }} - {{ item.animal }}
          </strong>
          <p class="mt-1">{{ item.treatment }}</p>
        </div>
        <div class="text-right">
          <strong>{{ item.dueDate }}</strong>
          <small class="block">{{ item.remaining }}</small>
        </div>
      </article>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Health Records</h3>
    <div class="overflow-x-auto rounded-lg border border-[#ddd8ce] bg-farm-panel shadow-sm">
      <table class="w-full min-w-[1040px] border-collapse">
        <thead class="bg-farm-green text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm">Animal ID</th>
            <th class="px-4 py-3 text-left text-sm">Action</th>
            <th class="px-4 py-3 text-left text-sm">Vaccine/Treatment</th>
            <th class="px-4 py-3 text-left text-sm">Date</th>
            <th class="px-4 py-3 text-left text-sm">Veterinarian</th>
            <th class="px-4 py-3 text-left text-sm">Next Due</th>
            <th v-if="canWrite" class="px-4 py-3 text-right text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!healthRecords.length">
            <td :colspan="canWrite ? 7 : 6" class="px-4 py-8 text-center text-[#7a7467]">No health records yet.</td>
          </tr>
          <tr v-for="r in healthRecords" :key="r.id + r.date" class="border-t border-[#ddd8ce]">
            <td class="px-4 py-3">{{ r.animalId }}</td>
            <td class="px-4 py-3 font-bold">{{ r.action }}</td>
            <td class="px-4 py-3">{{ r.treatment }}</td>
            <td class="px-4 py-3">{{ r.date }}</td>
            <td class="px-4 py-3">{{ r.vet }}</td>
            <td class="px-4 py-3"><span class="inline-block rounded-full bg-farm-gold px-3 py-1 text-xs font-bold">{{ r.nextDue }}</span></td>
            <td v-if="canWrite" class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(r)">Edit</button>
                <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="deleteRecord(r)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="modalOpen" :title="modalMode === 'create' ? 'Add Health Record' : 'Edit Health Record'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model.trim="form.animalTagId" required placeholder="Animal Tag (A049)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.action" required placeholder="Action" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.treatment" required placeholder="Treatment" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model="form.recordDate" type="date" required class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.veterinarian" required placeholder="Veterinarian" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model="form.nextDue" type="date" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <div class="md:col-span-2 flex items-center gap-3">
          <p v-if="fieldErrors.length" class="text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
        </div>
      </form>
    </BaseModal>
    <ConfirmModal :open="confirmOpen" title="Delete Health Record" :message="`Delete health record for ${pendingDelete?.animalId || ''}?`" confirm-text="Delete" @cancel="confirmOpen = false" @confirm="confirmDeleteRecord" />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseModal from '../components/BaseModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { animalIcon } from '../utils/icons'
import { hasActionAccess } from '../utils/rbac'

const auth = useAuthStore()
const upcomingVaccinations = ref([])
const healthRecords = ref([])
const modalOpen = ref(false)
const modalMode = ref('create')
const selectedId = ref(null)
const confirmOpen = ref(false)
const pendingDelete = ref(null)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref([])
const form = ref({
  animalTagId: '',
  action: '',
  treatment: '',
  recordDate: '',
  veterinarian: '',
  nextDue: ''
})
const canWrite = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'health.write'))

async function loadData() {
  const [upcoming, records] = await Promise.all([
    apiGet('/api/health/upcoming'),
    apiGet('/api/health/records')
  ])
  upcomingVaccinations.value = upcoming
  healthRecords.value = records
}

async function createRecord() {
  await apiPost('/api/health/records', form.value)
}

async function updateRecord() {
  await apiPut(`/api/health/records/${selectedId.value}`, form.value)
}

function dateForInput(v) {
  if (!v || v === 'N/A') return ''
  const parts = String(v).split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function resetForm() {
  form.value = { animalTagId: '', action: '', treatment: '', recordDate: '', veterinarian: '', nextDue: '' }
  fieldErrors.value = []
}

function openCreateModal() {
  if (!canWrite.value) return
  resetForm()
  selectedId.value = null
  modalMode.value = 'create'
  error.value = ''
  modalOpen.value = true
}

function openEditModal(record) {
  if (!canWrite.value) return
  selectedId.value = record.id
  modalMode.value = 'edit'
  error.value = ''
  form.value = {
    animalTagId: record.animalId,
    action: record.action,
    treatment: record.treatment,
    recordDate: dateForInput(record.date),
    veterinarian: record.vet,
    nextDue: dateForInput(record.nextDue)
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
  if (!String(form.value.animalTagId || '').trim()) issues.push('Animal tag is required.')
  if (!String(form.value.action || '').trim()) issues.push('Action is required.')
  if (!String(form.value.treatment || '').trim()) issues.push('Treatment is required.')
  if (!String(form.value.recordDate || '').trim()) issues.push('Record date is required.')
  if (!String(form.value.veterinarian || '').trim()) issues.push('Veterinarian is required.')
  fieldErrors.value = issues
  return issues.length === 0
}

async function submitModal() {
  if (!canWrite.value) return
  if (!validateForm()) return
  error.value = ''
  saving.value = true
  try {
    if (modalMode.value === 'create') await createRecord()
    else await updateRecord()
    await loadData()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save record'
  } finally {
    saving.value = false
  }
}

async function deleteRecord(record) {
  if (!canWrite.value) return
  pendingDelete.value = record
  confirmOpen.value = true
}

async function confirmDeleteRecord() {
  if (!pendingDelete.value) return
  try {
    await apiDelete(`/api/health/records/${pendingDelete.value.id}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to delete record'
  }
}

onMounted(loadData)
</script>
