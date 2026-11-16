export const workspaces = [
  { id: 'atlas', name: 'Atlas Partners', initials: 'AP' },
  { id: 'studio', name: 'Studio North', initials: 'SN' },
  { id: 'meridian', name: 'Meridian Capital', initials: 'MC' },
] as const

export type Workspace = typeof workspaces[number]
export const stages = ['Qualified', 'Proposal', 'Negotiation', 'Won'] as const
export type Stage = typeof stages[number]
export type Company = { id: string; name: string; industry: string }
export type Contact = { id: string; name: string; email: string; companyId: string }
export type Deal = { id: string; name: string; companyId: string; amount: number; stage: Stage }
export type Task = { id: string; name: string; done: boolean }
export type CRM = { companies: Company[]; contacts: Contact[]; deals: Deal[]; tasks: Task[] }

const accounts = [
  ['Layers', 'Quotient', 'Sisyphus', 'Catalog'],
  ['Forma', 'Common Ground', 'Fieldwork', 'Modular'],
  ['Northstar', 'Keystone', 'Vertex', 'Summit'],
]
const industries = ['Design software', 'Analytics', 'Financial services', 'Commerce']

function seed(workspace: Workspace): CRM {
  const index = workspaces.indexOf(workspace)
  const companies = accounts[index].map((name, i) => ({ id: 'company-' + i, name, industry: industries[i] }))
  return {
    companies,
    contacts: ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson'].map((name, i) => ({
      id: 'contact-' + i, name, companyId: companies[i].id,
      email: name.toLowerCase().replace(' ', '.') + '@' + companies[i].name.toLowerCase().replaceAll(' ', '') + '.example',
    })),
    deals: ['Platform expansion', 'Annual subscription', 'Enterprise onboarding', 'Pilot program', 'Team rollout', 'Renewal'].map((name, i) => ({
      id: 'deal-' + i, name, companyId: companies[i % companies.length].id,
      amount: [42000, 26500, 34000, 18000, 12500, 28000][i] + index * 2500,
      stage: stages[[2, 1, 0, 3, 0, 3][i]],
    })),
    tasks: ['Send the revised proposal', 'Schedule discovery call', 'Follow up on pilot feedback'].map((name, i) => ({
      id: 'task-' + i, name, done: i === 2,
    })),
  }
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem('clientos:' + key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem('clientos:' + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const crmKey = (workspace: Workspace) => 'crm:v1:' + workspace.id
export const loadCRM = (workspace: Workspace) => readLocal(crmKey(workspace), seed(workspace))
export const money = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value)
