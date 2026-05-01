import { useEffect, useState } from 'react'

interface Props { league: string; api: string }

function MatchCard({ m }: { m: any }) {
  const date = new Date(m.utc_date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const homeWon = m.home_score > m.away_score
  const awayWon = m.away_score > m.home_score

  return (
    <div className="match-card">
      <div className="match-date mono muted">{dateStr} · MD{m.matchday}</div>
      <div className="match-row">
        <div className={`match-team home ${homeWon ? 'winner' : ''}`}>
          <img src={m.home_crest} alt="" className="crest" onError={e => (e.currentTarget.style.display='none')} />
          <span>{m.home_team.replace(' FC', '')}</span>
        </div>
        <div className="match-score">
          <span className={homeWon ? 'score-win' : ''}>{m.home_score ?? '—'}</span>
          <span className="score-sep">:</span>
          <span className={awayWon ? 'score-win' : ''}>{m.away_score ?? '—'}</span>
        </div>
        <div className={`match-team away ${awayWon ? 'winner' : ''}`}>
          <span>{m.away_team.replace(' FC', '')}</span>
          <img src={m.away_crest} alt="" className="crest" onError={e => (e.currentTarget.style.display='none')} />
        </div>
      </div>
    </div>
  )
}

export default function Matches({ league, api }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${api}/matches/${league}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Failed to load matches.'); setLoading(false) })
  }, [league, api])

  if (loading) return <div className="loading"><span className="spinner" /> Loading matches...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!data.length) return <div className="error-msg">No matches available.</div>

  return (
    <div className="fade-up">
      <div className="section-title">Recent Matches</div>
      <div className="matches-grid">
        {data.map(m => <MatchCard key={m.match_id} m={m} />)}
      </div>
    </div>
  )
}
