<template>
  <section class="grid min-h-screen place-content-center bg-[#f2efe6] bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:40px_40px] p-5">
    <div class="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-farm-green">
      <img src="/assets/logo.png" alt="FarmPro" class="h-12 w-12 rounded-lg" />
    </div>
    <h1 class="mt-3 text-center text-3xl font-bold text-zinc-800 md:text-4xl">Join FarmPro</h1>
    <p class="mb-4 text-center text-base text-[#7a7467]">Create your account to get started</p>

    <form class="grid w-[min(460px,92vw)] gap-3 rounded-lg border border-[#ddd8ce] bg-[#f7f4ee] p-6 shadow" @submit.prevent="submit">
      <label class="font-bold">Full Name</label>
      <div class="relative">
        <User class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#847a67]" />
        <input v-model="form.name" type="text" autocomplete="name" placeholder="John Doe" required class="w-full rounded-md border border-[#cdc6b7] bg-[#f1eee6] py-3 pl-11 pr-3" />
      </div>

      <label class="mt-2 font-bold">Email Address</label>
      <div class="relative">
        <Mail class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#847a67]" />
        <input v-model="form.email" type="email" autocomplete="email" placeholder="farmer@example.com" required class="w-full rounded-md border border-[#cdc6b7] bg-[#f1eee6] py-3 pl-11 pr-3" />
      </div>

      <label class="mt-2 font-bold">Password</label>
      <div class="relative">
        <Lock class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#847a67]" />
        <input v-model="form.password" type="password" autocomplete="new-password" placeholder="••••••••" required minlength="6" class="w-full rounded-md border border-[#cdc6b7] bg-[#f1eee6] py-3 pl-11 pr-3" />
      </div>

      <label class="mt-2 font-bold">Confirm Password</label>
      <div class="relative">
        <ShieldCheck class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#847a67]" />
        <input v-model="form.confirmPassword" type="password" autocomplete="new-password" placeholder="••••••••" required minlength="6" class="w-full rounded-md border border-[#cdc6b7] bg-[#f1eee6] py-3 pl-11 pr-3" />
      </div>

      <button class="mt-2 rounded-lg bg-farm-green px-4 py-3 font-semibold text-white disabled:opacity-60" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Creating...' : 'Create Account' }}
      </button>

      <p class="text-center text-[#7a7467]">
        Already have an account?
        <RouterLink to="/login" class="font-bold text-farm-green">Sign in here</RouterLink>
      </p>

      <p v-if="error" class="m-0 font-semibold text-farm-red">{{ error }}</p>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Lock, Mail, ShieldCheck, User } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function submit() {
  error.value = ''
  const name = String(form.name || '').trim()
  const email = String(form.email || '').trim().toLowerCase()
  if (name.length < 2) {
    error.value = 'Enter your full name'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.value = 'Enter a valid email address'
    return
  }
  if (String(form.password || '').length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  try {
    await auth.register({ name, email, password: form.password })
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Registration failed'
  }
}
</script>
