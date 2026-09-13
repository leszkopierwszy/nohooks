/** Legacy employment history shown on Finance → Salary (Bartosz / first user only). */
export const LEGACY_SALARY_EMPLOYERS = [
  {
    id: 'emp_novo',
    name: 'Novo Nordisk',
    roles: [
      {
        id: 'role_novo_1',
        title: 'IT Operations Analyst',
        role: 'Support, Operations',
        years: '',
        ms_gross: '',
      },
      {
        id: 'role_novo_2',
        title: 'IT Support Analyst',
        role: 'Support',
        years: '',
        ms_gross: '',
      },
      {
        id: 'role_novo_3',
        title: 'IT Supporter',
        role: 'Support',
        years: '',
        ms_gross: '',
      },
    ],
  },
  {
    id: 'emp_jnj',
    name: 'Johnson and Johnson',
    roles: [
      {
        id: 'role_jnj_1',
        title: '2nd Level on-site IT Support',
        role: 'Member',
        years: '',
        ms_gross: '',
      },
    ],
  },
  {
    id: 'emp_imperium_1',
    name: 'Imperium Szkoleniowe',
    roles: [
      {
        id: 'role_imp_1',
        title: 'VP, User Experience',
        role: 'Member',
        years: '',
        ms_gross: '',
      },
      {
        id: 'role_imp_2',
        title: 'VP, Human Resources',
        role: 'Admin',
        years: '',
        ms_gross: '',
      },
      {
        id: 'role_imp_3',
        title: 'Senior Developer',
        role: 'Member',
        years: '',
        ms_gross: '',
      },
    ],
  },
]

export function cloneLegacySalaryEmployers() {
  return structuredClone(LEGACY_SALARY_EMPLOYERS)
}
