<template>
  <section class="space-y-4 border-t border-gray-200 pt-8 dark:border-zinc-800">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-50">{{ t('account.backup.title') }}</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">{{ t('account.backup.subtitle') }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        :disabled="exporting"
        @click="onExport"
      >
        {{ t('account.backup.download') }}
      </button>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800"
        :disabled="restoring"
        @click="fileInput?.click()"
      >
        {{ t('account.backup.restore') }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onFileSelected"
      />
      <p v-if="hint" class="text-sm text-emerald-600">{{ hint }}</p>
      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { createWorkspaceBackup, restoreWorkspaceBackup } from '../../utils/workspaceSync'

const { t } = useI18n()

const fileInput = ref(null)
const exporting = ref(false)
const restoring = ref(false)
const hint = ref('')
const error = ref('')

function clearMessages() {
  hint.value = ''
  error.value = ''
}

function flashHint(message) {
  hint.value = message
  window.setTimeout(() => {
    if (hint.value === message) hint.value = ''
  }, 3000)
}

async function onExport() {
  clearMessages()
  exporting.value = true
  try {
    const backup = await createWorkspaceBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `nohooks-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    flashHint(t('account.backup.downloaded'))
  } catch (err) {
    error.value = err?.message || t('account.backup.exportError')
  } finally {
    exporting.value = false
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  clearMessages()
  restoring.value = true
  try {
    const text = await file.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(t('account.backup.invalidFile'))
    }
    await restoreWorkspaceBackup(parsed)
    flashHint(t('account.backup.restored'))
    window.setTimeout(() => {
      window.location.reload()
    }, 800)
  } catch (err) {
    if (err?.message === 'invalid_backup') {
      error.value = t('account.backup.invalidFile')
    } else {
      error.value = err?.message || t('account.backup.restoreError')
    }
  } finally {
    restoring.value = false
  }
}
</script>
