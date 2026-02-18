<template>
  <section>
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Breeding Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Track breeding cycles and births</p>
      </div>
      <button v-if="canWrite" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add Breeding Record
      </button>
    </header>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Active Breeding Records</h3>
    <div class="grid gap-3 rounded-lg border border-[#ddd8ce] bg-farm-panel p-3 shadow-sm">
      <p v-if="!breedingRecords.length" class="p-6 text-center text-[#7a7467]">No active breeding records yet.</p>
      <article class="border-l-4 border-farm-green bg-[#f4f1eb] p-3" v-for="record in breedingRecords" :key="record.id">
        <p class="font-bold">
          <component :is="animalIcon(record.animal)" class="mr-1 inline-block h-[18px] w-[18px] align-[-3px]" />
          Mother: {{ record.mother }} | Father: {{ record.father }} ({{ record.animal }})
        </p>
        <div class="mt-2 flex flex-wrap gap-5 text-sm">
          <span>Breed Date: <strong>{{ record.breedDate }}</strong></span>
          <span>Expected Date: <strong>{{ record.expected }}</strong></span>
          <span>Days Remaining: <strong>{{ record.days }}</strong></span>
        </div>
        <div class="mt-3 h-3 rounded-full bg-[#ddd5c6]"><div class="h-full rounded-full bg-farm-green" :style="`width: ${record.progress}%`" /></div>
        <div v-if="canWrite" class="mt-3 inline-flex gap-2">
          <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(record)">Edit</button>
          <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="deleteRecord(record)">Delete</button>
        </div>
      </article>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Recent Births</h3>
    <div class="overflow-x-auto rounded-lg border border-[#ddd8ce] bg-farm-panel shadow-sm">
      <table class="w-full min-w-[860px] border-collapse">
        <thead class="bg-farm-green text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm">Mother ID</th>
            <th class="px-4 py-3 text-left text-sm">Type</th>
            <th class="px-4 py-3 text-left text-sm">Birth Date</th>
            <th class="px-4 py-3 text-left text-sm">Offspring</th>
            <th class="px-4 py-3 text-left text-sm">Health Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in recentBirths" :key="row.mother + row.date" class="border-t border-[#ddd8ce]">
            <td class="px-4 py-3"><component :is="animalIcon(row.type)" class="mr-1 inline-block h-[18px] w-[18px] align-[-3px]" />{{ row.mother }}</td>
            <td class="px-4 py-3">{{ row.type }}</td>
            <td class="px-4 py-3">{{ row.date }}</td>
            <td class="px-4 py-3"><span class="inline-block rounded-full bg-farm-gold px-3 py-1 text-xs font-bold">{{ row.offspring }}</span></td>
            <td class="px-4 py-3"><span :class="['inline-block rounded-full px-3 py-1 text-xs font-bold lowercase', row.health === 'healthy' ? 'bg-farm-green text-white' : 'bg-farm-gold text-zinc-800']">{{ row.health }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="modalOpen" :title="modalMode === 'create' ? 'Add Breeding Record' : 'Edit Breeding Record'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model.trim="form.motherTagId" required placeholder="Mother Tag (A047)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.fatherTagId" required placeholder="Father Tag (A045)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.species" required placeholder="Species (Cattle)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model="form.breedingDate" type="date" required class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model="form.expectedBirthDate" type="date" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.notes" placeholder="Notes (optional)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <div class="md:col-span-2 flex items-center gap-3">
          <p v-if="fieldErrors.length" class="text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
        </div>
      </form>
    </BaseModal>
    <ConfirmModal :open="confirmOpen" title="Delete Breeding Record" :message="`Delete breeding record ${pendingDelete?.mother || ''}/${pendingDelete?.father || ''}?`" confirm-text="Delete" @cancel="confirmOpen = false" @confirm="confirmDeleteRecord" />
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
const breedingRecords = ref([])
const recentBirths = ref([])
const modalOpen = ref(false)
const modalMode = ref('create')
const selectedId = ref(null)
const confirmOpen = ref(false)
const pendingDelete = ref(null)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref([])
const form = ref({
  motherTagId: '',
  fatherTagId: '',
  species: '',
  breedingDate: '',
  expectedBirthDate: '',
  notes: ''
})
const canWrite = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'breeding.write'))

async function loadData() {
  const [active, births] = await Promise.all([
    apiGet('/api/breeding/active'),
    apiGet('/api/breeding/births')
  ])
  breedingRecords.value = active
  recentBirths.value = births
}

async function createRecord() {
  await apiPost('/api/breeding', form.value)
}

async function updateRecord() {
  await apiPut(`/api/breeding/${selectedId.value}`, form.value)
}

function dateForInput(v) {
  if (!v) return ''
  const parts = String(v).split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function resetForm() {
  form.value = { motherTagId: '', fatherTagId: '', species: '', breedingDate: '', expectedBirthDate: '', notes: '' }
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
    motherTagId: record.mother,
    fatherTagId: record.father,
    species: record.animal,
    breedingDate: dateForInput(record.breedDate),
    expectedBirthDate: dateForInput(record.expected),
    notes: ''
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
  if (!String(form.value.motherTagId || '').trim()) issues.push('Mother tag is required.')
  if (!String(form.value.fatherTagId || '').trim()) issues.push('Father tag is required.')
  if (!String(form.value.species || '').trim()) issues.push('Species is required.')
  if (!String(form.value.breedingDate || '').trim()) issues.push('Breeding date is required.')
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
    error.value = err.message || 'Failed to save breeding record'
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
    await apiDelete(`/api/breeding/${pendingDelete.value.id}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to delete breeding record'
  }
}

onMounted(loadData)
</script>
