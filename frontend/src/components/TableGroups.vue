<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">{{ t('finance.salary.jobsTitle') }}</h1>
        <p class="mt-2 text-sm text-gray-700">{{ t('finance.salary.jobsSubtitle') }}</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          type="button"
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
          @click="openAddEmployer"
        >
          {{ t('finance.salary.addEmployer') }}
        </button>
      </div>
    </div>

    <form
      v-if="employerFormOpen"
      class="mt-6 max-w-xl rounded-lg border border-gray-200 bg-gray-50/80 p-4"
      @submit.prevent="submitEmployer"
    >
      <h2 class="text-sm font-semibold text-gray-900">
        {{ editingEmployerId ? t('finance.salary.editEmployer') : t('finance.salary.newEmployer') }}
      </h2>
      <label for="salary-employer-name" class="mt-3 block text-sm font-medium text-gray-700">
        {{ t('finance.salary.employerName') }}
      </label>
      <input
        id="salary-employer-name"
        v-model="employerDraft.name"
        type="text"
        required
        class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
      />
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {{ t('finance.salary.save') }}
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          @click="closeEmployerForm"
        >
          {{ t('finance.salary.cancel') }}
        </button>
      </div>
    </form>

    <form
      v-if="roleFormOpen"
      class="mt-6 max-w-xl rounded-lg border border-gray-200 bg-gray-50/80 p-4"
      @submit.prevent="submitRole"
    >
      <h2 class="text-sm font-semibold text-gray-900">
        {{ editingRoleId ? t('finance.salary.editRole') : t('finance.salary.newRole') }}
      </h2>
      <p class="mt-1 text-xs text-gray-500">{{ roleFormEmployerName }}</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="salary-role-title" class="block text-sm font-medium text-gray-700">
            {{ t('finance.salary.roleTitle') }}
          </label>
          <input
            id="salary-role-title"
            v-model="roleDraft.title"
            type="text"
            required
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label for="salary-role-role" class="block text-sm font-medium text-gray-700">
            {{ t('finance.salary.roleLabel') }}
          </label>
          <input
            id="salary-role-role"
            v-model="roleDraft.role"
            type="text"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label for="salary-role-years" class="block text-sm font-medium text-gray-700">
            {{ t('finance.salary.years') }}
          </label>
          <input
            id="salary-role-years"
            v-model="roleDraft.years"
            type="text"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="salary-role-ms" class="block text-sm font-medium text-gray-700">
            {{ t('finance.salary.msGross') }}
          </label>
          <input
            id="salary-role-ms"
            v-model="roleDraft.ms_gross"
            type="text"
            class="mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {{ t('finance.salary.save') }}
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          @click="closeRoleForm"
        >
          {{ t('finance.salary.cancel') }}
        </button>
      </div>
    </form>

    <p v-if="store.isEmpty" class="mt-8 text-sm text-gray-500">{{ t('finance.salary.empty') }}</p>

    <div v-else class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table class="relative min-w-full">
            <thead class="bg-white">
              <tr>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  {{ t('finance.salary.roleTitle') }}
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  {{ t('finance.salary.roleLabel') }}
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  {{ t('finance.salary.years') }}
                </th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  {{ t('finance.salary.msGross') }}
                </th>
                <th scope="col" class="py-3.5 pr-4 pl-3 text-right text-sm font-semibold text-gray-900 sm:pr-3">
                  {{ t('finance.salary.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <template v-for="employer in store.employers" :key="employer.id">
                <tr class="border-t border-gray-200">
                  <th
                    colspan="5"
                    scope="colgroup"
                    class="bg-gray-50 py-2 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span>{{ employer.name }}</span>
                      <span class="flex flex-wrap gap-2 font-medium">
                        <button
                          type="button"
                          class="text-xs text-indigo-600 hover:text-indigo-500"
                          @click="openAddRole(employer)"
                        >
                          {{ t('finance.salary.addRole') }}
                        </button>
                        <button
                          type="button"
                          class="text-xs text-gray-500 hover:text-gray-800"
                          @click="openEditEmployer(employer)"
                        >
                          {{ t('finance.salary.edit') }}
                        </button>
                        <button
                          type="button"
                          class="text-xs text-rose-600 hover:text-rose-500"
                          @click="store.removeEmployer(employer.id)"
                        >
                          {{ t('finance.salary.delete') }}
                        </button>
                      </span>
                    </div>
                  </th>
                </tr>
                <tr
                  v-for="(job, jobIdx) in employer.roles"
                  :key="job.id"
                  :class="[jobIdx === 0 ? 'border-gray-300' : 'border-gray-200', 'border-t']"
                >
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ job.title || '—' }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ job.role || '—' }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ job.years || '—' }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ job.ms_gross || '—' }}</td>
                  <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                    <button
                      type="button"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="openEditRole(employer, job)"
                    >
                      {{ t('finance.salary.edit') }}
                    </button>
                    <button
                      type="button"
                      class="ml-3 text-rose-600 hover:text-rose-500"
                      @click="store.removeRole(employer.id, job.id)"
                    >
                      {{ t('finance.salary.delete') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!employer.roles.length" class="border-t border-gray-200">
                  <td colspan="5" class="px-3 py-3 text-sm text-gray-400">
                    {{ t('finance.salary.noRoles') }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSalaryJobsStore } from '../stores/salaryJobs'

const { t } = useI18n()
const store = useSalaryJobsStore()

const employerFormOpen = ref(false)
const editingEmployerId = ref(null)
const employerDraft = reactive({ name: '' })

const roleFormOpen = ref(false)
const roleEmployerId = ref(null)
const editingRoleId = ref(null)
const roleDraft = reactive({
  title: '',
  role: '',
  years: '',
  ms_gross: '',
})

const roleFormEmployerName = computed(
  () => store.employers.find((e) => e.id === roleEmployerId.value)?.name ?? '',
)

onMounted(() => {
  store.reload()
})

function openAddEmployer() {
  closeRoleForm()
  editingEmployerId.value = null
  employerDraft.name = ''
  employerFormOpen.value = true
}

function openEditEmployer(employer) {
  closeRoleForm()
  editingEmployerId.value = employer.id
  employerDraft.name = employer.name
  employerFormOpen.value = true
}

function closeEmployerForm() {
  employerFormOpen.value = false
  editingEmployerId.value = null
  employerDraft.name = ''
}

function submitEmployer() {
  if (editingEmployerId.value) {
    store.updateEmployer(editingEmployerId.value, { name: employerDraft.name })
  } else {
    store.addEmployer({ name: employerDraft.name })
  }
  closeEmployerForm()
}

function openAddRole(employer) {
  closeEmployerForm()
  roleEmployerId.value = employer.id
  editingRoleId.value = null
  Object.assign(roleDraft, { title: '', role: '', years: '', ms_gross: '' })
  roleFormOpen.value = true
}

function openEditRole(employer, job) {
  closeEmployerForm()
  roleEmployerId.value = employer.id
  editingRoleId.value = job.id
  Object.assign(roleDraft, {
    title: job.title,
    role: job.role,
    years: job.years,
    ms_gross: job.ms_gross,
  })
  roleFormOpen.value = true
}

function closeRoleForm() {
  roleFormOpen.value = false
  roleEmployerId.value = null
  editingRoleId.value = null
}

function submitRole() {
  if (!roleEmployerId.value) return
  const payload = { ...roleDraft }
  if (editingRoleId.value) {
    store.updateRole(roleEmployerId.value, editingRoleId.value, payload)
  } else {
    store.addRole(roleEmployerId.value, payload)
  }
  closeRoleForm()
}
</script>
