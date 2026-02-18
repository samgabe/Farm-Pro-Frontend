<template>
  <section>
    <header class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
      <div>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">User Management</h2>
        <p class="mt-2 text-base text-[#7a7467]">Manage farm staff and permissions</p>
      </div>
      <button v-if="canManageUsers" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" @click="openCreateModal">
        + Add User
      </button>
    </header>
    <div class="mt-4 grid gap-3 md:grid-cols-[1fr_120px]">
      <input v-model="query" type="text" placeholder="Search name, email, role..." class="w-full rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" @keyup.enter="loadData(1)" />
      <button class="rounded-lg border border-[#d1cbc0] bg-[#f2f0ea] px-4 py-3 text-zinc-800" @click="loadData(1)">Filter</button>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-4">
      <article v-for="card in cards" :key="card.label" :class="[cardClass, toneClass(card.tone)]">
        <p class="text-lg">{{ card.label }}</p>
        <h3 class="my-2 text-4xl font-bold">{{ card.value }}</h3>
      </article>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Staff Directory</h3>
    <div class="rounded-lg border border-[#ddd8ce] bg-farm-panel p-4 shadow-sm">
      <p v-if="!staffDirectory.length" class="py-8 text-center text-[#7a7467]">No users yet. Add your first user.</p>
      <article class="mb-3 grid items-start gap-3 rounded-lg border border-[#ddd8ce] p-4 md:grid-cols-[auto_1fr_auto]" v-for="user in staffDirectory" :key="user.email">
        <div class="grid h-16 w-16 place-items-center rounded-full bg-[#4c7152] text-2xl font-bold text-white">{{ user.initials }}</div>
        <div>
          <h4 class="text-3xl font-bold">{{ user.name }}</h4>
          <span class="inline-block rounded-full bg-farm-green px-3 py-1 text-xs font-bold text-white">{{ user.role }}</span>
          <p class="mt-2">{{ user.email }}</p>
          <p>{{ user.phone }}</p>
        </div>
        <div class="text-right">
          <span class="inline-block rounded-full bg-farm-green px-3 py-1 text-xs font-bold lowercase text-white">{{ user.status }}</span>
          <div v-if="canManageUsers" class="mt-3 inline-flex gap-2">
            <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm" @click="openEditModal(user)">Edit</button>
            <button class="rounded-md border border-farm-red px-3 py-1 text-sm text-farm-red" @click="deleteUser(user)">Delete</button>
          </div>
        </div>
      </article>
    </div>
    <div class="mt-3 flex items-center justify-end gap-2">
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page <= 1" @click="loadData(page - 1)">Prev</button>
      <span class="text-sm text-[#6f6758]">Page {{ page }} / {{ totalPages }}</span>
      <button class="rounded-md border border-[#cec7b8] px-3 py-1 text-sm disabled:opacity-40" :disabled="page >= totalPages" @click="loadData(page + 1)">Next</button>
    </div>

    <BaseModal v-if="canManageUsers" :open="modalOpen" :title="modalMode === 'create' ? 'Add User' : 'Edit User'" @close="closeModal">
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="submitModal">
        <input v-model.trim="form.name" required placeholder="Full Name" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <input v-model.trim="form.email" type="email" required placeholder="Email" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <select v-model="form.role" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
          <option value="worker">worker</option>
          <option value="manager">manager</option>
          <option value="veterinarian">veterinarian</option>
          <option value="owner">owner</option>
        </select>
        <input v-model.trim="form.phone" placeholder="Phone" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <select v-model="form.status" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3">
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <input v-model="form.password" :required="modalMode === 'create'" type="password" minlength="6" :placeholder="modalMode === 'create' ? 'Password (min 6)' : 'New password (optional)'" class="rounded-lg border border-[#cec7b8] bg-[#f5f2eb] px-3 py-3" />
        <div class="md:col-span-2 flex items-center gap-3">
          <p v-if="fieldErrors.length" class="text-sm font-semibold text-farm-red">{{ fieldErrors.join(' ') }}</p>
          <button type="submit" class="rounded-lg bg-farm-green px-5 py-3 font-semibold text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <p v-if="error" class="font-semibold text-farm-red">{{ error }}</p>
        </div>
      </form>
    </BaseModal>
    <ConfirmModal :open="confirmOpen" title="Delete User" :message="`Delete user ${pendingDelete?.name || ''}?`" confirm-text="Delete" @cancel="confirmOpen = false" @confirm="confirmDeleteUser" />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseModal from '../components/BaseModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { canManageUsers as canManageUsersByRole } from '../utils/rbac'

const auth = useAuthStore()
const stats = ref({ totalStaff: 0, activeUsers: 0, managers: 0, veterinarians: 0 })
const staffDirectory = ref([])
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
  name: '',
  email: '',
  role: 'worker',
  phone: '',
  password: '',
  status: 'active'
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
  { label: 'Total Staff', value: stats.value.totalStaff, tone: 'green' },
  { label: 'Active Users', value: stats.value.activeUsers, tone: 'gold' },
  { label: 'Managers', value: stats.value.managers, tone: 'orange' },
  { label: 'Veterinarians', value: stats.value.veterinarians, tone: 'red' }
])
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const canManageUsers = computed(() => canManageUsersByRole(auth.role || auth.user?.role || ''))

async function loadData(nextPage = page.value) {
  const [s, users] = await Promise.all([
    apiGet('/api/users/stats'),
    apiGet(`/api/users?q=${encodeURIComponent(query.value || '')}&page=${nextPage}&pageSize=${pageSize.value}`)
  ])
  stats.value = s
  staffDirectory.value = Array.isArray(users) ? users : (users.items || [])
  totalCount.value = Number(users.total || staffDirectory.value.length)
  page.value = Number(users.page || nextPage)
}

async function createUser() {
  await apiPost('/api/users', form.value)
}

async function updateUser() {
  const payload = { ...form.value }
  if (!payload.password) delete payload.password
  await apiPut(`/api/users/${selectedId.value}`, payload)
}

function resetForm() {
  form.value = { name: '', email: '', role: 'worker', phone: '', password: '', status: 'active' }
  fieldErrors.value = []
}

function openCreateModal() {
  resetForm()
  selectedId.value = null
  error.value = ''
  modalMode.value = 'create'
  modalOpen.value = true
}

function openEditModal(user) {
  selectedId.value = user.id
  error.value = ''
  modalMode.value = 'edit'
  form.value = {
    name: user.name,
    email: user.email,
    role: String(user.role || '').toLowerCase(),
    phone: user.phone,
    password: '',
    status: user.status
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
  if (!form.value.name.trim()) issues.push('Name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) issues.push('Valid email is required.')
  if (!['owner', 'manager', 'worker', 'veterinarian'].includes(form.value.role)) issues.push('Invalid role.')
  if (!['active', 'inactive'].includes(form.value.status)) issues.push('Invalid status.')
  if (modalMode.value === 'create' && String(form.value.password || '').length < 6) issues.push('Password must be at least 6 characters.')
  if (modalMode.value === 'edit' && form.value.password && String(form.value.password).length < 6) issues.push('New password must be at least 6 characters.')
  fieldErrors.value = issues
  return issues.length === 0
}

async function submitModal() {
  if (!validateForm()) return
  error.value = ''
  saving.value = true
  try {
    if (modalMode.value === 'create') await createUser()
    else await updateUser()
    await loadData()
    closeModal()
  } catch (err) {
    error.value = err.message || 'Failed to save user'
  } finally {
    saving.value = false
  }
}

async function deleteUser(user) {
  pendingDelete.value = user
  confirmOpen.value = true
}

async function confirmDeleteUser() {
  if (!pendingDelete.value) return
  try {
    await apiDelete(`/api/users/${pendingDelete.value.id}`)
    confirmOpen.value = false
    pendingDelete.value = null
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to delete user'
  }
}

onMounted(() => loadData(1))
</script>
