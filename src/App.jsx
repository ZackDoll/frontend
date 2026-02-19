import { useState } from 'react'
import './App.css'
import PitchForm from './PitchForm.jsx'

function App() {
  const [pitch, setPitch] = useState({
    inning: 1,
    balls: 0,
    strikes: 0,
    outsWhenUp: 0,
    fldScore: 0,
    batScore: 0,
    stand: "L"
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState({
    predicted_zone: null,
    probabilities: Array(13).fill(0),
    predicted_pitch_type: null,
    pitch_type_probabilities: Array(14).fill(0)
  })

  const pitchNames = {
    0: "Change-up",
    1: "Curveball",
    2: "Cutter",
    3: "Four-Seam Fastball",
    4: "Screwball",
    5: "Sinker",
    6: "Slider",
    7: "Splitter",
    8: "Sweeper",
    9: "Eephus",
    10: "Slurve",
    11: "Knuckleball",
    12: "Knuckle-curve",
    13: "Forkball"
  }

  const sendData = async (payload) => {
    setPitch(payload)
    try {
      const input = {
        features: [
          payload.inning,
          payload.outsWhenUp,
          payload.balls,
          payload.strikes,
          payload.batScore,
          payload.fldScore,
          payload.stand === "L" ? 1 : 0
        ]
      }

      const res = await fetch("https://baseball-backend-6eec.onrender.com/predict_zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      const zoneData = await res.json()

      const rslt = await fetch("https://baseball-backend-6eec.onrender.com/predict_pitch_type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
      if (!rslt.ok) throw new Error(`Server responded with ${rslt.status}`)
      const pitchData = await rslt.json()

      setResult({
        predicted_zone: zoneData.predicted_zone,
        probabilities: zoneData.probabilities,
        predicted_pitch_type: pitchData.predicted_pitch_type,
        pitch_type_probabilities: pitchData.probabilities
      })
    } catch (error) {
      console.error("Error during prediction:", error)
    }
  }

  const closeModal = () => setIsModalOpen(false)
  const openCreateModal = () => { if (!isModalOpen) setIsModalOpen(true) }

  const cornerZones = [
    { label: '11', top: '30px',    left: '30px',  index: 9,  clipPath: 'polygon(0 0, 100% 0, 100% 25%, 25% 25%, 25% 100%, 0 100%)',   textPos: { top: '15px',    left: '15px'  } },
    { label: '12', top: '30px',    right: '30px', index: 10, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 75% 100%, 75% 25%, 0 25%)',    textPos: { top: '15px',    right: '15px' } },
    { label: '13', bottom: '30px', left: '30px',  index: 11, clipPath: 'polygon(0 0, 25% 0, 25% 75%, 100% 75%, 100% 100%, 0 100%)',   textPos: { bottom: '15px', left: '15px'  } },
    { label: '14', bottom: '30px', right: '30px', index: 12, clipPath: 'polygon(75% 0, 100% 0, 100% 100%, 0 100%, 0 75%, 75% 75%)',   textPos: { bottom: '15px', right: '15px' } },
  ]

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Pitch Predictor</h1>
        <p className="page-subtitle">ML-Powered Pitch Prediction</p>
      </header>

      {pitch && (
        <div className="game-state-panel">
          <div className="panel-label">Current Game State</div>
          <div className="stat-grid">
            {[
              { label: 'Inning',       value: pitch.inning },
              { label: 'Balls',        value: pitch.balls },
              { label: 'Strikes',      value: pitch.strikes },
              { label: 'Outs',         value: pitch.outsWhenUp },
              { label: 'Bat Score',    value: pitch.batScore },
              { label: 'Field Score',  value: pitch.fldScore },
              { label: 'Stand',        value: pitch.stand === 'L' ? 'Left' : 'Right' },
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-bar">
        <button className="btn-primary" onClick={openCreateModal}>
          {pitch.inning ? 'Modify Game State' : 'Enter Game State'}
        </button>
      </div>

      {result && (
        <div className="results-container">
          {/* Strike zone heatmap */}
          <div className="heatmap-wrapper">
            {/* Zones 1–9 (main grid) */}
            <div className="zone-grid">
              {result.probabilities.slice(0, 9).map((prob, index) => {
                const isPredicted = result.predicted_zone === index
                const intensity = Math.min(prob * 4, 1)
                const red = Math.round(255 * intensity)
                const blue = Math.round(255 * (1 - intensity))
                return (
                  <div
                    key={index}
                    className={`zone-cell${isPredicted ? ' zone-cell--predicted' : ''}`}
                    style={{ backgroundColor: `rgba(${red}, 100, ${blue}, ${0.3 + intensity * 0.5})` }}
                  >
                    <div className="zone-number">{index + 1}</div>
                    <div className="zone-prob">{(prob * 100).toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>

            {/* Corner zones (L-shapes, zones 11–14) */}
            {cornerZones.map((corner) => {
              const prob = result.probabilities[corner.index]
              const isPredicted = result.predicted_zone === corner.index
              const intensity = Math.min(prob * 4, 1)
              const red = Math.round(255 * intensity)
              const blue = Math.round(255 * (1 - intensity))
              return (
                <div
                  key={corner.index}
                  className="corner-zone"
                  style={{ top: corner.top, bottom: corner.bottom, left: corner.left, right: corner.right }}
                >
                  <div
                    className={`corner-shape${isPredicted ? ' corner-shape--predicted' : ''}`}
                    style={{
                      backgroundColor: `rgba(${red}, 100, ${blue}, ${0.3 + intensity * 0.5})`,
                      clipPath: corner.clipPath,
                    }}
                  />
                  <div className="corner-label" style={corner.textPos}>
                    <div className="zone-number">{corner.label}</div>
                    <div className="corner-prob">{(prob * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )
            })}

            <img src="/Batter.png" alt="Batter" className="batter-img" />
          </div>

          {/* Pitch type predictions */}
          {result.predicted_pitch_type !== undefined && (
            <div className="pitch-panel">
              <div className="pitch-panel-title">Top 3 Likely Pitches</div>
              {result.pitch_type_probabilities
                .map((prob, index) => ({ pitch: index, probability: prob }))
                .sort((a, b) => b.probability - a.probability)
                .slice(0, 3)
                .map((item, rank) => (
                  <div key={rank} className={`pitch-item${rank === 0 ? ' pitch-item--top' : ''}`}>
                    <span className="pitch-name">
                      {rank + 1}. {pitchNames[item.pitch] ?? `Pitch ${item.pitch}`}
                    </span>
                    <span className="pitch-prob">{(item.probability * 100).toFixed(1)}%</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="close" onClick={closeModal}>&times;</button>
            <PitchForm
              onClose={closeModal}
              sendData={sendData}
              existingPitch={pitch}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default App
