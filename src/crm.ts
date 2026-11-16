export const workspaces = [
  { id: 'atlas', name: 'Atlas Partners' },
  { id: 'studio', name: 'Studio North' },
  { id: 'meridian', name: 'Meridian Capital' },
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
  ['Layers', 'Quotient', 'Sisyphus', 'Catalog', 'Evergreen Systems', 'Lattice Works', 'Copperline', 'Juniper Labs'],
  ['Forma', 'Common Ground', 'Fieldwork', 'Modular', 'Soft Focus', 'Good Measure', 'Frame House', 'Off Grid'],
  ['Northstar', 'Keystone', 'Vertex', 'Summit', 'Harbor Trust', 'Cedar Mutual', 'Crestline', 'Sterling Exchange'],
]
const industries = ['Design software', 'Analytics', 'Financial services', 'Commerce', 'Operations', 'Professional services', 'Technology', 'Logistics']

function seed(workspace: Workspace): CRM {
  const index = workspaces.indexOf(workspace)
  const companies = accounts[index].map((name, i) => ({ id: 'company-' + i, name, industry: industries[i] }))
  return {
    companies,
    contacts: ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Elliot Chen', 'Maya Patel', 'Noah Das', 'Sofia Reyes'].map((name, i) => ({
      id: 'contact-' + i, name, companyId: companies[i].id,
      email: name.toLowerCase().replace(' ', '.') + '@' + companies[i].name.toLowerCase().replaceAll(' ', '') + '.example',
    })),
    deals: ['Platform expansion', 'Annual subscription', 'Enterprise onboarding', 'Pilot program', 'Team rollout', 'Renewal', 'Regional rollout', 'Data integration', 'Partner pilot', 'Support upgrade', 'New division rollout', 'Multi-year agreement'].map((name, i) => ({
      id: 'deal-' + i, name, companyId: companies[[0, 1, 2, 3, 0, 1, 6, 7, 4, 5, 6, 7][i]].id,
      amount: [42000, 26500, 34000, 18000, 12500, 28000, 56000, 22000, 15500, 9400, 48500, 71000][i] + index * 2500,
      stage: stages[[2, 1, 0, 3, 0, 3, 1, 2, 0, 3, 2, 3][i]],
    })),
    tasks: ['Send the revised proposal', 'Schedule discovery call', 'Follow up on pilot feedback', 'Confirm rollout scope', 'Review integration requirements', 'Share onboarding plan', 'Prepare renewal call'].map((name, i) => ({
      id: 'task-' + i, name, done: i === 2 || i === 5,
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
function addNewSamples<T extends { id: string }>(records: T[], samples: T[]) {
  const existing = new Set(records.map(record => record.id))
  return [...records, ...samples.filter(sample => !existing.has(sample.id))]
}

export function loadCRM(workspace: Workspace): CRM {
  const samples = seed(workspace)
  const saved = readLocal<CRM | null>(crmKey(workspace), null)
  if (!saved) return samples
  return {
    companies: addNewSamples(saved.companies, samples.companies.slice(4)),
    contacts: addNewSamples(saved.contacts, samples.contacts.slice(4)),
    deals: addNewSamples(saved.deals, samples.deals.slice(6)),
    tasks: addNewSamples(saved.tasks, samples.tasks.slice(3)),
  }
}
export const money = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value)
