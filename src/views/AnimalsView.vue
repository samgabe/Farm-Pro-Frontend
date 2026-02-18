<template>
  <section>
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Animal Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Manage and track all livestock</p>
      </div>
      <button v-if="canWrite" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add Animal
      </button>
    </header>

    <div class="my-4 grid gap-3 md:grid-cols-[1fr_120px]">
      <input v-model="query" type="text" placeholder="Search by ID, type, or breed..." class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" @keyup.enter="loadAnimals(1)" />
      <button class="rounded-lg border border-[#d1cbc0] bg-[#f2f0ea] px-4 py-3 text-zinc-800" @click="loadAnimals(1)">Filter</button>
    </div>
    <div class="mt-3 flex items-center justify-end gap-2">
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page <= 1" @click="loadAnimals(page - 1)">Prev</button>
      <span class="text-sm text-[#6f6758]">Page {{ page }} / {{ totalPages }}</span>
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page >= totalPages" @click="loadAnimals(page + 1)">Next</button>
    </div>

    <div class="overflow-x-auto rounded-lg border border-[#ddd8ce] bg-farm-panel shadow-sm">
      <table class="w-full min-w-[980px] border-collapse">
        <thead class="bg-farm-green text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm">Tag ID</th>
            <th class="px-4 py-3 text-left text-sm">Type</th>
            <th class="px-4 py-3 text-left text-sm">Breed</th>
            <th class="px-4 py-3 text-left text-sm">Age</th>
            <th class="px-4 py-3 text-left text-sm">Weight</th>
            <th class="px-4 py-3 text-left text-sm">Health</th>
            <th class="px-4 py-3 text-left text-sm">Status</th>
            <th v-if="canWrite" class="px-4 py-3 text-right text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td :colspan="canWrite ? 8 : 7" class="px-4 py-8 text-center text-[#7a7467]">No animals found. Use Add Animal to create your first record.</td>
          </tr>
          <tr v-for="a in filtered" :key="a.tagId" class="border-t border-[#ddd8ce]">
            <td class="px-4 py-3"><span class="rounded-md bg-farm-gold px-3 py-2 font-bold text-zinc-800">{{ a.tagId }}</span></td>
            <td class="px-4 py-3">
              <component :is="animalIcon(a.type)" class="mr-1 inline-block h-[18px] w-[18px] align-[-3px]" />
              {{ a.type }}
            </td>
            <td class="px-4 py-3">{{ a.breed }}</td>
            <td class="px-4 py-3">{{ a.age }}</td>
            <td class="px-4 py-3 font-bold">{{ a.weight }}</td>
            <td class="px-4 py-3">
              <span :class="['inline-block rounded-full px-3 py-1 text-xs font-bold lowercase', a.health === 'healthy' ? 'bg-farm-green text-white' : 'bg-farm-gold text-zinc-800']">{{ a.health }}</span>
            </td>
            <td class="px-4 py-3"><span class="rounded border-2 border-farm-green px-2 py-0.5 text-xs font-semibold">{{ a.status }}</span></td>
            <td v-if="canWrite" class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(a)">Edit</button>
                <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="deleteAnimal(a)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="modalOpen" :title="modalMode === 'create' ? 'Add Animal' : 'Edit Animal'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model.trim="form.tagId" :disabled="modalMode === 'edit'" required placeholder="Tag ID (A050)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3 disabled:bg-[#e9e4d9]" />
        <input v-model.trim="form.type" required placeholder="Type (Cattle)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.breed" required placeholder="Breed (Holstein)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model="form.birthDate" type="date" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.number="form.weightKg" type="number" step="0.01" min="0" placeholder="Weight (kg)" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <select v-model="form.healthStatus" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
          <option value="healthy">healthy</option>
          <option value="attention">attention</option>
          <option value="sick">sick</option>
        </select>
        <select v-model="form.status" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="sold">sold</option>
        </select>
        <div class="md:col-span-2 flex items-center gap-3">
          <p v-if="fieldErrors.length" class="text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
        </div>
      </form>
    </BaseModal>
    <ConfirmModal :open="confirmOpen" title="Delete Animal" :message="`Delete animal ${pendingDelete?.tagId || ''}?`" confirm-text="Delete" @cancel="confirmOpen = false" @confirm="confirmDeleteAnimal" />
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
const query = ref('')
const animals = ref([])
const modalOpen = ref(false)
const modalMode = ref('create')
const confirmOpen = ref(false)
const pendingDelete = ref(null)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref([])
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const form = ref({
  tagId: '',
  type: '',
  breed: '',
  birthDate: '',
  weightKg: null,
  healthStatus: 'healthy',
  status: 'active'
})

const filtered = computed(() => animals.value)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const canWrite = computed(() => hasActionAccess(auth.role || auth.user?.role || '', 'animals.write'))

async function loadAnimals(nextPage = page.value) {
  const res = await apiGet(`/api/animals?q=${encodeURIComponent(query.value || '')}&page=${nextPage}&pageSize=${pageSize.value}`)
  animals.value = Array.isArray(res) ? res : (res.items || [])
  total.value = Number(res.total || animals.value.length)
  page.value = Number(res.page || nextPage)
}

async function createAnimal() {
  await apiPost('/api/animals', form.value)
}

async function updateAnimal() {
  await apiPut(`/api/animals/${encodeURIComponent(form.value.tagId)}`, form.value)
}

function resetForm() {
  form.value = { tagId: '', type: '', breed: '', birthDate: '', weightKg: null, healthStatus: 'healthy', status: 'active' }
  fieldErrors.value = []
}

function openCreateModal() {
  if (!canWrite.value) return
  resetForm()
  error.value = ''
  modalMode.value = 'create'
  modalOpen.value = true
}

function openEditModal(animal) {
  if (!canWrite.value) return
  error.value = ''
  fieldErrors.value = []
  modalMode.value = 'edit'
  const weight = Number.parseFloat(String(animal.weight).replace(/[^\d.]/g, ''))
  const ageYears = Number.parseInt(String(animal.age).replace(/[^\d]/g, ''), 10)
  let birthDate = ''
  if (!Number.isNaN(ageYears)) {
    const d = new Date()
    d.setFullYear(d.getFullYear() - ageYears)
    birthDate = d.toISOString().slice(0, 10)
  }
  form.value = {
    tagId: animal.tagId,
    type: animal.type,
    breed: animal.breed,
    birthDate,
    weightKg: Number.isNaN(weight) ? null : weight,
    healthStatus: animal.health || 'healthy',
    status: animal.status || 'active'
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
  if (!String(form.value.tagId || '').trim()) issues.push('Tag ID is required.')
  if (!String(form.value.type || '').trim()) issues.push('Type is required.')
  if (!String(form.value.breed || '').trim()) issues.push('Breed is required.')
  if (form.value.weightKg !== null && Number(form.value.weightKg) < 0) issues.push('Weight cannot be negative.')
  fieldErrors.value = issues
  return issues.length === 0
}

async function submitModal() {
  if (!canWrite.value) return
  if (!validateForm()) return
  error.value = ''
  saving.value = true
  try {
    if (modalMode.value === 'create') await createAnimal()
    else await updateAnimal()
    await loadAnimals()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save animal'
  } finally {
    saving.value = false
  }
}

async function deleteAnimal(animal) {
  if (!canWrite.value) return
  pendingDelete.value = animal
  confirmOpen.value = true
}

async function confirmDeleteAnimal() {
  if (!pendingDelete.value) return
  try {
    await apiDelete(`/api/animals/${encodeURIComponent(pendingDelete.value.tagId)}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadAnimals()
  } catch (err) {
    error.value = err.message || 'Failed to delete animal'
  }
}

onMounted(() => loadAnimals(1))
</script>
