import { money, stages, type CRM } from './crm'

type Series = { label: string; value: number }

export type ChartVariant = 'columns' | 'donut' | 'bars'

const chartColors = ['--accent', '--stage-proposal', '--stage-negotiation', '--stage-won', '--chart-extra']

export function BrandChart({ series, currency = false, variant }: { series: Series[]; currency?: boolean; variant: ChartVariant }) {
  const max = Math.max(1, ...series.map(item => item.value))
  const total = series.reduce((sum, item) => sum + item.value, 0)
  const format = (value: number) => currency ? money(value) : value

  if (variant === 'donut') {
    let cumulative = 0
    const segments = series.flatMap(({ value }, index) => {
      if (!value) return []
      const start = 100 * cumulative / total
      cumulative += value
      return [`var(${chartColors[index]}) ${start}% ${100 * cumulative / total}%`]
    })
    return <div className="donut-chart" data-chart={variant}>
      <div className="donut-ring" style={{ background: total ? `conic-gradient(${segments.join(', ')})` : 'var(--subtle)' }}>
        <div className="donut-center"><strong>{format(total)}</strong><span>Total</span></div>
      </div>
      <ul className="donut-key">{series.map(({ label, value }, index) => <li key={label}>
        <span className="chart-swatch" aria-hidden="true" style={{ background: `var(${chartColors[index]})` }} />
        <span>{label}</span><strong>{format(value)}</strong>
      </li>)}</ul>
    </div>
  }

  return <div className={variant === 'columns' ? 'column-chart' : 'horizontal-chart'} data-chart={variant}>
    {series.map(({ label, value }, index) => <div className="column-item" key={label}>
      <div className="column-track" aria-hidden="true">
        <div className="column-fill" style={{
          background: `var(${chartColors[index]})`,
          ...(variant === 'columns' ? { height: 100 * value / max + '%' } : { width: 100 * value / max + '%' }),
        }} />
      </div>
      <strong>{format(value)}</strong>
      <span>{label}</span>
    </div>)}
  </div>
}

export function Analytics({ data, open, won, variant }: { data: CRM; open: number; won: number; variant: ChartVariant }) {
  const accounts = data.companies.map(company => {
    const deals = data.deals.filter(deal => deal.companyId === company.id)
    return { ...company, deals: deals.length, open: deals.filter(deal => deal.stage !== 'Won').reduce((sum, deal) => sum + deal.amount, 0), won: deals.filter(deal => deal.stage === 'Won').reduce((sum, deal) => sum + deal.amount, 0) }
  }).sort((a, b) => b.open - a.open || b.won - a.won)
  const wonCount = data.deals.filter(deal => deal.stage === 'Won').length
  const wonShare = data.deals.length ? Math.round(wonCount / data.deals.length * 100) : 0

  return <>
    <div className="metrics">
      <section className="card metric"><div className="metric-label">Open deal value</div><strong>{money(open)}</strong></section>
      <section className="card metric"><div className="metric-label">Won revenue</div><strong>{money(won)}</strong></section>
      <section className="card metric"><div className="metric-label">Won share of all deals</div><strong>{wonShare}%</strong></section>
      <section className="card metric"><div className="metric-label">Average won deal</div><strong>{money(wonCount ? won / wonCount : 0)}</strong></section>
    </div>
    <div className="overview-row">
      <section className="card panel"><h2>Open value by account</h2><p>Top five companies by active pipeline</p>
        <BrandChart variant={variant} currency series={accounts.slice(0, 5).map(account => ({ label: account.name, value: account.open }))} />
      </section>
      <section className="card panel"><h2>Deal count by stage</h2><p>All opportunities in this workspace</p>
        <BrandChart variant={variant} series={stages.map(stage => ({ label: stage, value: data.deals.filter(deal => deal.stage === stage).length }))} />
      </section>
    </div>
    <section className="card">
      <div className="table-heading"><h2>Account performance</h2><p>Open and won value for every company</p></div>
      <div className="table-scroll"><table><thead><tr>{['Company', 'Deals', 'Open value', 'Won revenue'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{accounts.map(account => <tr key={account.id}><td>{account.name}</td><td>{account.deals}</td><td>{money(account.open)}</td><td>{money(account.won)}</td></tr>)}</tbody>
      </table></div>
    </section>
  </>
}
