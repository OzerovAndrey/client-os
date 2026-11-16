import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDownRight, ArrowRight, BarChart3, Building2, Check, ChevronDown, CircleDollarSign, ClipboardList, Columns3, LayoutDashboard, Menu, Moon, Plus, Search, Sun, Users, X } from 'lucide-react'
import { crmKey, loadCRM, money, readLocal, stages, workspaces, writeLocal, type CRM, type Deal, type Stage, type Workspace } from './crm'
import { createRoot } from 'react-dom/client'
import { Analytics, BarChart } from './Analytics'
import './tokens.css'
import './styles.css'

const screens = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Companies', icon: Building2 },
  { name: 'Contacts', icon: Users },
  { name: 'Pipeline', icon: Columns3 },
  { name: 'Tasks', icon: ClipboardList },
  { name: 'Analytics', icon: BarChart3 },
] as const
type Screen = typeof screens[number]['name']
type Editor = { kind: 'company' | 'contact' | 'deal' | 'task'; deal?: Deal }
const screenTitles: Record<Screen, string> = {
  Overview: 'Workspace overview', Companies: 'Companies', Contacts: 'Contacts',
  Pipeline: 'Sales pipeline', Tasks: 'Tasks', Analytics: 'Sales analytics',
}
const descriptions: Record<Screen, string> = {
  Overview: 'Track deals, accounts, and follow-ups across your workspace.',
  Companies: 'Manage the accounts your team works with.',
  Contacts: 'Find the people connected to your accounts.',
  Pipeline: 'Track opportunities from qualification to close.',
  Tasks: 'Keep your next steps in one place.',
  Analytics: 'Compare deal stages and see which accounts drive pipeline and revenue.',
}
const editors: Record<Exclude<Screen, 'Analytics'>, Editor['kind']> = {
  Overview: 'deal', Companies: 'company', Contacts: 'contact', Pipeline: 'deal', Tasks: 'task',
}

function App() {
  const [workspace, setWorkspace] = useState(() => workspaces.find(item => item.id === readLocal<string>('workspace', 'atlas')) ?? workspaces[0])
  const [theme, setTheme] = useState(() => readLocal<string>('theme', 'light') === 'dark' ? 'dark' : 'light')
  const [screen, setScreen] = useState<Screen>('Overview')
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.brand = workspace.id
    document.documentElement.dataset.theme = theme
    writeLocal('workspace', workspace.id)
    writeLocal('theme', theme)
  }, [workspace, theme])

  return <div className="shell">
    <aside className={menu ? 'sidebar expanded' : 'sidebar'} id="sidebar">
      <div className="product"><span className="product-mark"><Columns3 size={21} /></span>ClientOS</div>
      <nav aria-label="Workspace navigation">
        <span className="nav-heading">Workspace</span>
        {screens.map(({ name, icon: Icon }) => <button key={name} aria-current={screen === name ? 'page' : undefined} onClick={() => { setScreen(name); setMenu(false) }}>
          <Icon size={18} />{name}
        </button>)}
      </nav>
      <div className="profile"><span className="profile-avatar">AM</span><div><strong>Alex Morgan</strong><small>Demo workspace</small></div></div>
    </aside>
    <div className="body">
      <header className="topbar">
        <button className="icon-button menu-toggle" aria-label="Toggle navigation" aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Menu size={20} /></button>
        <span className="breadcrumb">{workspace.name} <span>/</span> <strong>{screen}</strong></span>
        <button className="icon-button theme-toggle" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </header>
      <WorkspaceView key={workspace.id} workspace={workspace} screen={screen} navigate={setScreen} />
    </div>
    <label className="workspace-select">
      <span className="workspace-avatar">{workspace.initials}</span>
      <span className="workspace-caption">Demo brand</span>
      <span className="workspace-name" aria-hidden="true">{workspace.name}</span>
      <select aria-label="Workspace" value={workspace.id} onChange={event => {
        setWorkspace(workspaces.find(item => item.id === event.target.value) ?? workspaces[0])
        setMenu(false)
      }}>
        {workspaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <ChevronDown size={15} />
    </label>
  </div>
}

function WorkspaceView({ workspace, screen, navigate }: { workspace: Workspace; screen: Screen; navigate: (screen: Screen) => void }) {
  const [data, setData] = useState(() => loadCRM(workspace))
  const [accountId, setAccountId] = useState<string>()
  const [editor, setEditor] = useState<Editor>()
  const [searches, setSearches] = useState<Partial<Record<Screen, string>>>({})
  const query = searches[screen] ?? ''
  const [dragged, setDragged] = useState<string>()
  const [dropStage, setDropStage] = useState<Stage>()
  const [persistenceError, setPersistenceError] = useState(false)
  const companyName = (id: string) => data.companies.find(company => company.id === id)?.name ?? 'Unassigned'

  function update(next: CRM) {
    setData(next)
    setPersistenceError(!writeLocal(crmKey(workspace), next))
  }

  function moveDeal(id: string, stage: Stage) {
    update({ ...data, deals: data.deals.map(deal => deal.id === id ? { ...deal, stage } : deal) })
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) return
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    if (!name) {
      const input = event.currentTarget.elements.namedItem('name') as HTMLInputElement
      input.setCustomValidity('Enter a name.')
      input.reportValidity()
      return
    }
    const id = editor.deal?.id ?? crypto.randomUUID()
    const companyId = String(fields.get('companyId') ?? '')
    switch (editor.kind) {
      case 'company':
        update({ ...data, companies: [...data.companies, { id, name, industry: String(fields.get('industry')).trim() }] })
        break
      case 'contact':
        update({ ...data, contacts: [...data.contacts, { id, name, companyId, email: String(fields.get('email')) }] })
        break
      case 'deal': {
        const deal = { id, name, companyId, amount: Number(fields.get('amount')), stage: fields.get('stage') as Stage }
        update({ ...data, deals: editor.deal ? data.deals.map(item => item.id === id ? deal : item) : [...data.deals, deal] })
        break
      }
      case 'task':
        update({ ...data, tasks: [...data.tasks, { id, name, done: false }] })
        break
    }
    setEditor(undefined)
  }

  function toggleTask(id: string) {
    update({ ...data, tasks: data.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task) })
  }

  const matches = (...values: string[]) => values.some(value => value.toLowerCase().includes(query.trim().toLowerCase()))
  const taskList = (preview: boolean) => {
    const tasks = preview ? data.tasks.filter(task => !task.done).slice(0, 4) : data.tasks.filter(task => matches(task.name))
    return tasks.length ? <ul className="task-list">{tasks.map(task => <li key={task.id}><label>
      <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
      <span className={task.done ? 'done' : ''}>{task.name}</span>
    </label></li>)}</ul> : <p className="empty">{preview ? 'You’re caught up.' : 'No matching tasks.'}</p>
  }
  const totals = stages.map(stage => data.deals.filter(deal => deal.stage === stage).reduce((sum, deal) => sum + deal.amount, 0))
  const openValue = totals.slice(0, -1).reduce((sum, value) => sum + value, 0)
  const account = data.companies.find(company => company.id === accountId)
  const accountContacts = data.contacts.filter(contact => contact.companyId === accountId)
  const accountDeals = data.deals.filter(deal => deal.companyId === accountId)
  const openCount = data.deals.filter(deal => deal.stage !== 'Won').length
  const stats = [
    { label: 'Open pipeline', value: money(openValue), detail: openCount + ' open opportunities', icon: CircleDollarSign },
    { label: 'Won revenue', value: money(totals[3]), detail: (data.deals.length - openCount) + ' closed deals', icon: Check },
    { label: 'Companies', value: data.companies.length, detail: data.contacts.length + ' linked contacts', icon: Building2 },
    { label: 'Open tasks', value: data.tasks.filter(task => !task.done).length, detail: data.tasks.filter(task => task.done).length + ' completed tasks', icon: ClipboardList },
  ]

  return <main>
    <div className="page-heading">
      <div><h1>{screenTitles[screen]}</h1><p>{descriptions[screen]}</p></div>
      {screen !== 'Analytics' && <button className="primary" onClick={() => setEditor({ kind: editors[screen] })}><Plus size={17} />New {editors[screen]}</button>}
    </div>
    {persistenceError && <p role="status">Browser storage is unavailable. Changes will last until you leave this workspace.</p>}
    {screen === 'Analytics' ? <Analytics data={data} open={openValue} won={totals[3]} /> : screen === 'Overview' ? <>
      <div className="metrics">{stats.map(({ label, value, detail, icon: Icon }) => <section className="card metric" key={label}>
        <div className="metric-label"><span>{label}</span><Icon size={19} /></div><strong>{value}</strong><small>{detail}</small>
      </section>)}</div>
      <div className="overview-row">
        <section className="card panel"><div className="panel-heading"><div><h2>Pipeline by stage</h2><p>Total deal value in USD</p></div><button className="text-button" onClick={() => navigate('Analytics')}>View analytics <ArrowRight size={15} /></button></div>
          <BarChart currency series={stages.map((stage, index) => ({ label: stage, value: totals[index] }))} />
        </section>
        <section className="card panel"><div className="panel-heading"><div><h2>Upcoming tasks</h2><p>Open follow-ups</p></div><button className="icon-button" aria-label="View all tasks" onClick={() => navigate('Tasks')}><ArrowDownRight size={19} /></button></div>{taskList(true)}</section>
      </div>
      <section className="card"><div className="panel-heading table-heading"><div><h2>Recent deals</h2><p>Latest opportunities in this workspace</p></div><button className="text-button" onClick={() => navigate('Pipeline')}>View all <ArrowRight size={15} /></button></div>
        <Table headings={['Deal', 'Company', 'Stage', 'Value']} rows={data.deals.slice(-4).reverse().map(deal => ({
          id: deal.id, cells: [<button className="record-button" onClick={() => setEditor({ kind: 'deal', deal })}>{deal.name}</button>, companyName(deal.companyId), <span className="badge">{deal.stage}</span>, money(deal.amount)],
        }))} />
      </section>
    </> : <>
      <label className="search"><Search size={17} /><input key={screen} type="search" aria-label={'Search ' + screen.toLowerCase()} placeholder={'Search ' + screen.toLowerCase() + '…'} value={query} onChange={event => setSearches({ ...searches, [screen]: event.target.value })} /></label>
      {screen === 'Companies' && <section className="card"><Table headings={['Company', 'Industry', 'Contacts']} rows={data.companies.filter(company => matches(company.name, company.industry)).map(company => ({
        id: company.id, cells: [<button className="record-button" onClick={() => setAccountId(company.id)}>{company.name}</button>, company.industry || '—', data.contacts.filter(contact => contact.companyId === company.id).length],
      }))} /></section>}
      {screen === 'Contacts' && <section className="card"><Table headings={['Name', 'Company', 'Email']} rows={data.contacts.filter(contact => matches(contact.name, contact.email, companyName(contact.companyId))).map(contact => ({
        id: contact.id, cells: [<strong>{contact.name}</strong>, companyName(contact.companyId), contact.email],
      }))} /></section>}
      {screen === 'Tasks' && <section className="card panel">{taskList(false)}</section>}
      {screen === 'Pipeline' && <div className="board">{stages.map((stage, index) => {
        const deals = data.deals.filter(deal => deal.stage === stage && matches(deal.name, companyName(deal.companyId)))
        return <section key={stage} className={'lane' + (dropStage === stage ? ' drop' : '')} onDragOver={event => {
          if (dragged) { event.preventDefault(); setDropStage(stage) }
        }} onDrop={event => {
          event.preventDefault()
          if (dragged) moveDeal(dragged, stage)
          setDragged(undefined)
          setDropStage(undefined)
        }}>
          <h2><span className={'dot stage-' + index} />{stage}<span className="lane-count">{deals.length}</span></h2>
          <p>{money(deals.reduce((sum, deal) => sum + deal.amount, 0))}</p>
          {deals.length === 0 && <p className="empty">No deals</p>}
          {deals.map(deal => <article className="card deal" key={deal.id} draggable onDragStart={event => {
            event.dataTransfer.setData('text/plain', deal.id)
            event.dataTransfer.effectAllowed = 'move'
            setDragged(deal.id)
          }} onDragEnd={() => { setDragged(undefined); setDropStage(undefined) }}>
            <button className="record-button" onClick={() => setEditor({ kind: 'deal', deal })}>{deal.name}</button>
            <p>{companyName(deal.companyId)}</p><strong>{money(deal.amount)}</strong>
            <select aria-label={'Stage for ' + deal.name} value={deal.stage} onChange={event => moveDeal(deal.id, event.target.value as Stage)}>
              {stages.map(option => <option key={option}>{option}</option>)}
            </select>
          </article>)}
        </section>
      })}</div>}
    </>}
    {account && <Dialog title={account.name} close={() => setAccountId(undefined)}>
      <p>{account.industry || 'Industry unspecified'}</p>
      <section className="account-section">
        <h2>Contacts <small>{accountContacts.length}</small></h2>
        {accountContacts.length ? <ul>{accountContacts.map(contact => <li key={contact.id}><strong>{contact.name}</strong><span>{contact.email}</span></li>)}</ul> : <p>No linked contacts.</p>}
      </section>
      <section className="account-section">
        <h2>Deals <small>{accountDeals.length}</small></h2>
        {accountDeals.length ? <ul>{accountDeals.map(deal => <li key={deal.id}>
          <button className="record-button" onClick={() => { setAccountId(undefined); setEditor({ kind: 'deal', deal }) }}>{deal.name}</button>
          <span>{deal.stage} · {money(deal.amount)}</span>
        </li>)}</ul> : <p>No linked deals.</p>}
      </section>
    </Dialog>}
    {editor && <EditorDialog title={(editor.deal ? 'Edit ' : 'New ') + editor.kind} close={() => setEditor(undefined)} save={save}>
      <label>Name<input name="name" required maxLength={100} defaultValue={editor.deal?.name} onInput={event => event.currentTarget.setCustomValidity('')} /></label>
      {editor.kind === 'company' && <label>Industry<input name="industry" maxLength={100} /></label>}
      {editor.kind === 'contact' && <label>Email<input name="email" type="email" required maxLength={160} /></label>}
      {(editor.kind === 'contact' || editor.kind === 'deal') && <label><span id="company-label">Company</span><select aria-labelledby="company-label" name="companyId" required defaultValue={editor.deal?.companyId ?? ''}>
        <option value="" disabled>Select company</option>
        {data.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
      </select></label>}
      {editor.kind === 'deal' && <>
        <label>Value (USD)<input name="amount" required type="number" min="0" max="999999999" step="1" defaultValue={editor.deal?.amount} /></label>
        <label><span id="stage-label">Stage</span><select aria-labelledby="stage-label" name="stage" defaultValue={editor.deal?.stage ?? stages[0]}>{stages.map(stage => <option key={stage}>{stage}</option>)}</select></label>
      </>}
    </EditorDialog>}
  </main>
}

function Table({ headings, rows }: { headings: string[]; rows: { id: string; cells: ReactNode[] }[] }) {
  return <div className="table-scroll"><table><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>{row.cells.map((cell, index) => <td key={headings[index]}>{cell}</td>)}</tr>)}
      {!rows.length && <tr><td colSpan={headings.length} className="empty">No matching records.</td></tr>}
    </tbody></table></div>
}

function EditorDialog({ title, close, save, children }: { title: string; close: () => void; save: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return <Dialog title={title} close={close}>
    <form onSubmit={save}>
      <div className="fields">{children}</div>
      <div className="actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" type="submit">Save</button></div>
    </form>
  </Dialog>
}

function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="panel-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Close" onClick={close}><X size={19} /></button></div>
    {children}
  </dialog>
}

createRoot(document.getElementById('root')!).render(<App />)
