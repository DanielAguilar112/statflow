import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import '../../../../App.css'

interface Props { league: string; api: string }

export default function Standings({ league, api }: Props) {
  interface Standing {
  team_id: number; team_name: string; team_crest: string;
  position: number; played: number; won: number; draw: number;
  lost: number; goals_for: number; goals_against: number;
  goal_difference: number; points: number;
}
const [data, setData] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
  let cancelled = false
  const load = async () => {
    try {
      const r = await fetch(`${api}/standings/${league}`)
      const d = await r.json()
      if (!cancelled) { setData(Array.isArray(d) ? d : []); setLoading(false) }
    } catch {
      if (!cancelled) { setError('Failed to load standings.'); setLoading(false) }
    }
  }
  load()
  return () => { cancelled = true }
}, [league, api])

  if (loading) return <div className="loading"><span className="spinner" /> Loading standings...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!data.length) return <div className="error-msg">No data available.</div>

  const chartData = data.slice(0, 10).map(t => ({
    name: t.team_name.replace(' FC', '').replace(' United', ' Utd').slice(0, 12),
    points: t.points,
    pos: t.position,
  }))

  return (
    <div className="fade-up">
      <div className="section-title">Standings</div>

      {/* POINTS CHART */}
      <div className="chart-card">
        <div className="chart-label">top 10 — points</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: '#5a6080', fontSize: 10, fontFamily: 'DM Mono' }} />
            <YAxis tick={{ fill: '#5a6080', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#0d1017', border: '1px solid #1c2230', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#f0f2f8' }}
            />
            <Bar dataKey="points" radius={[2, 2, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#00e676' : i < 4 ? '#4488ff' : '#1c2230'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLE */}
      <table className="data-table" style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t => {
            const isTop4 = t.position <= 4
            const isRel = t.position >= data.length - 2
            return (
              <tr key={t.team_id} className={isTop4 ? 'top-4' : isRel ? 'relegation' : ''}>
                <td className="mono muted">{t.position}</td>
                <td>
                  <div className="team-cell">
                    <img src={t.team_crest} alt="" className="crest" onError={e => (e.currentTarget.style.display = 'none')} />
                    {t.team_name.replace(' FC', '')}
                  </div>
                </td>
                <td className="mono">{t.played}</td>
                <td className="mono" style={{ color: 'var(--green)' }}>{t.won}</td>
                <td className="mono muted">{t.draw}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{t.lost}</td>
                <td className="mono">{t.goals_for}</td>
                <td className="mono">{t.goals_against}</td>
                <td className="mono" style={{ color: t.goal_difference > 0 ? 'var(--green)' : t.goal_difference < 0 ? 'var(--red)' : 'inherit' }}>
                  {t.goal_difference > 0 ? '+' : ''}{t.goal_difference}
                </td>
                <td className="mono" style={{ fontWeight: 600, color: 'var(--gold)' }}>{t.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: 11, color: 'var(--muted2)' }}>
        <span><span style={{ color: 'var(--accent)' }}>■</span> Champions League</span>
        <span><span style={{ color: 'var(--red)' }}>■</span> Relegation</span>
      </div>
    </div>
  )
}
