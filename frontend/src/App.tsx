import { useState, useEffect } from 'react'
import Standings from './components/Standings'
import Scorers from './components/Scorers'
import Matches from './components/Matches'
import './App.css'

const LEAGUES = [
  { code: 'PL',  name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',        flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',     flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',        flag: '🇮🇹' },
]

type Tab = 'standings' | 'scorers' | 'matches'

const API = 'http://localhost:8000'

export default function App() {
  const [league, setLeague] = useState('PL')
  const [tab, setTab] = useState<Tab>('standings')
  const [summary, setSummary] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    fetch(`${API}/stats/summary`)
      .then(r => r.json())
      .then(d => {
        setSummary(d)
        if (d.last_updated) {
          const dt = new Date(d.last_updated)
          setLastUpdated(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
        }
      })
      .catch(() => {})
  }, [])

  const currentLeague = LEAGUES.find(l => l.code === league)!

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo">STAT<span>FLOW</span></div>
          <div className="logo-sub">soccer intelligence</div>
        </div>
        {summary && (
          <div className="header-stats">
            <div className="hstat">
              <span className="hstat-num">{summary.teams_tracked}</span>
              <span className="hstat-label">teams</span>
            </div>
            <div className="hstat">
              <span className="hstat-num">{summary.scorers_tracked}</span>
              <span className="hstat-label">scorers</span>
            </div>
            <div className="hstat">
              <span className="hstat-num">{summary.matches_tracked}</span>
              <span className="hstat-label">matches</span>
            </div>
          </div>
        )}
        <div className="header-right">
          {lastUpdated && <span className="updated">updated {lastUpdated}</span>}
        </div>
      </header>

      {/* LEAGUE SELECTOR */}
      <div className="league-bar">
        {LEAGUES.map(l => (
          <button
            key={l.code}
            className={`league-btn ${league === l.code ? 'active' : ''}`}
            onClick={() => setLeague(l.code)}
          >
            <span className="league-flag">{l.flag}</span>
            <span className="league-name">{l.name}</span>
          </button>
        ))}
      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        <div className="tab-bar-inner">
          <div className="current-league">{currentLeague.flag} {currentLeague.name}</div>
          <div className="tabs">
            {(['standings', 'scorers', 'matches'] as Tab[]).map(t => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="main">
        {tab === 'standings' && <Standings league={league} api={API} />}
        {tab === 'scorers'   && <Scorers   league={league} api={API} />}
        {tab === 'matches'   && <Matches   league={league} api={API} />}
      </main>

      <footer className="footer">
        <span>StatFlow · data via football-data.org · </span>
        <a href="https://github.com/DanielAguilar112/statflow" target="_blank" rel="noreferrer">github</a>
      </footer>
    </div>
  )
}
