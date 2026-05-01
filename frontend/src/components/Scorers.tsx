import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { league: string; api: string }

export default function Scorers({ league, api }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${api}/scorers/${league}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Failed to load scorers.'); setLoading(false) })
  }, [league, api])

  if (loading) return <div className="loading"><span className="spinner" /> Loading scorers...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!data.length) return <div className="error-msg">No data available.</div>

  const chartData = data.slice(0, 10).map(s => ({
    name: s.player_name.split(' ').pop(),
    goals: s.goals,
    assists: s.assists ?? 0,
  }))

  return (
    <div className="fade-up">
      <div className="section-title">Top Scorers</div>

      <div className="chart-card">
        <div className="chart-label">goals + assists — top 10</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: '#5a6080', fontSize: 10, fontFamily: 'DM Mono' }} />
            <YAxis tick={{ fill: '#5a6080', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#0d1017', border: '1px solid #1c2230', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#f0f2f8' }}
            />
            <Bar dataKey="goals" name="Goals" radius={[2, 2, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#ffd700' : '#4488ff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="data-table" style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Team</th>
            <th>Nationality</th>
            <th>Goals</th>
            <th>Assists</th>
            <th>Penalties</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.player_id}>
              <td className="mono muted">{s.rank}</td>
              <td style={{ fontWeight: 500 }}>{s.player_name}</td>
              <td>
                <div className="team-cell">
                  <img src={s.team_crest} alt="" className="crest" onError={e => (e.currentTarget.style.display = 'none')} />
                  {s.team_name.replace(' FC', '')}
                </div>
              </td>
              <td className="muted">{s.nationality}</td>
              <td className="mono" style={{ color: 'var(--gold)', fontWeight: 600 }}>{s.goals}</td>
              <td className="mono" style={{ color: 'var(--accent)' }}>{s.assists ?? '—'}</td>
              <td className="mono muted">{s.penalties ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
