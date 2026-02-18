<template>
  <section>
    <header>
        <h2 class="text-3xl font-bold text-zinc-800 md:text-4xl">Farm Overview</h2>
      <p class="mt-2 text-base text-[#7a7467]">{{ today }}</p>
    </header>

    <div class="mt-4 grid gap-4 lg:grid-cols-4">
      <article
        v-for="card in stats"
        :key="card.label"
        :class="[
          cardClass,
          toneClass(card.tone)
        ]"
      >
        <p class="text-lg">{{ card.label }}</p>
        <h3 class="my-2 text-4xl font-bold">{{ card.value }}</h3>
        <small class="text-sm">{{ card.note }}</small>
      </article>
    </div>

    <h3 class="mb-3 mt-8 text-3xl font-bold text-zinc-800">Livestock Distribution</h3>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article v-for="item in distribution" :key="item.type" class="rounded-lg border-2 border-[#4b6c4e] bg-farm-panel p-5 text-center">
        <component :is="item.icon" class="mx-auto h-9 w-9" />
        <strong class="mt-2 block text-lg">{{ item.type }}</strong>
        <h3 class="my-2 text-4xl font-bold text-[#2f5736]">{{ item.count }}</h3>
        <small class="text-sm text-[#7a7467]">{{ item.status }}</small>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../services/api'
import { fmtCurrency } from '../utils/animal'
import { animalIcon } from '../utils/icons'

const stats = ref([])
const distribution = ref([])

const cardClass =
  'rounded-lg p-5 shadow-[0_4px_0_rgba(0,0,0,0.12)] bg-[length:20px_20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)]'

const toneClass = (tone) => ({
  green: 'bg-farm-green text-white',
  gold: 'bg-farm-gold text-zinc-800',
  orange: 'bg-farm-orange text-white',
  red: 'bg-farm-red text-white'
}[tone] || 'bg-farm-green text-white')

const today = computed(() =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)

onMounted(async () => {
  const [dashboard, animalsRes] = await Promise.all([apiGet('/api/dashboard'), apiGet('/api/animals?page=1&pageSize=200')])
  const animals = Array.isArray(animalsRes) ? animalsRes : (animalsRes.items || [])

  stats.value = [
    { label: 'Total Animals', value: dashboard.totalAnimals, note: 'Across all types', tone: 'green' },
    { label: 'Sick Animals', value: dashboard.sickAnimals, note: 'Need attention', tone: 'red' },
    { label: 'Upcoming Vaccines', value: dashboard.upcomingVaccinations, note: 'Next 7 days', tone: 'orange' },
    { label: 'Monthly Revenue', value: fmtCurrency(dashboard.monthlyRevenue), note: 'Current month', tone: 'gold' }
  ]

  const grouped = animals.reduce((acc, a) => {
    const key = a.type
    acc[key] = acc[key] || { type: key, count: 0, health: 'Healthy' }
    acc[key].count += 1
    if (a.health !== 'healthy') acc[key].health = 'Attention'
    return acc
  }, {})

  distribution.value = Object.values(grouped).map((g) => ({
    type: g.type,
    icon: animalIcon(g.type),
    count: g.count,
    status: g.health
  }))
})
</script>
