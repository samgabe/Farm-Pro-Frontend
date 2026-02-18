<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 grid place-items-center p-4">
      <button class="absolute inset-0 bg-black/50" @click="$emit('close')" />
      <div class="relative z-10 w-full max-w-2xl rounded-xl border border-[#ddd8ce] bg-farm-panel shadow-xl">
        <header class="flex items-center justify-between border-b border-[#ddd8ce] px-4 py-3">
          <h3 class="text-2xl font-bold text-zinc-800">{{ title }}</h3>
          <button class="rounded-md border border-[#d3ccbe] px-3 py-1 text-sm text-zinc-700" @click="$emit('close')">Close</button>
        </header>
        <section class="p-4">
          <slot />
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

defineEmits(['close'])
</script>
