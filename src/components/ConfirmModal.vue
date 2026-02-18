<template>
  <BaseModal :open="open" :title="title" @close="$emit('cancel')">
    <p class="text-[#6f6758]">{{ message }}</p>
    <div class="mt-4 flex gap-3">
      <button class="rounded-lg border border-[#cec7b8] px-4 py-2" @click="$emit('cancel')">Cancel</button>
      <button class="rounded-lg bg-farm-red px-4 py-2 font-semibold text-white" @click="$emit('confirm')">{{ confirmText }}</button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Delete' }
})

defineEmits(['cancel', 'confirm'])
</script>
