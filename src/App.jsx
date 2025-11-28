import { useState, useEffect, use } from 'react'
import './App.css'
import PitchList from './PitchList.jsx'
import PitchForm from './PitchForm.jsx'
import ZoneHeatmap from './heatmap.jsx'

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
  probabilities: Array(13).fill(0),  // 13 zones, all at 0%
  predicted_pitch_type: null,
  pitch_type_probabilities: Array(14).fill(0)  // 14 pitch types, all at 0%
})

    const fetchPitches = async () => {
    const response = await fetch("https://baseball-backend-6eec.onrender.com/pitches")
    const data = await response.json()
    setPitches(data.pitches)
    console.log(data.pitches)
  }
  const [currentPitch, setCurrentPitch] = useState(null)

const openEditModal = (pitch) => {
    setCurrentPitch(pitch)
    setIsModalOpen(true)
}
  useEffect(() => {
    fetchPitches()
  }, [])
  //to map pitch type numbers to names
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
      
      // Zone prediction
      const res = await fetch("https://baseball-backend-6eec.onrender.com/predict_zone", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(input)
      })
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`)
      }
      
      const zoneData = await res.json()
      console.log("Zone prediction result:", zoneData)
      
      // Pitch type prediction
      const rslt = await fetch("https://baseball-backend-6eec.onrender.com/predict_pitch_type", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(input)
      });
      
      if (!rslt.ok) {
        throw new Error(`Server responded with ${rslt.status}`)
      }
      
      const pitchData = await rslt.json()
      console.log("Pitch type result:", pitchData)
      
      // Combine both results
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

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openCreateModal = () => {
    if (!isModalOpen) setIsModalOpen(true)
  }
  return (
  <>
    
  {pitch && (
  <div style={{
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: 'white',
    marginLeft: '170px',
    width: 'fit-content'
  }}>
    <h3>Current Pitch Data:</h3>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
      <div>Inning: {pitch.inning}</div>
      <div>Balls: {pitch.balls}</div>
      <div>Strikes: {pitch.strikes}</div>
      <div>Outs: {pitch.outsWhenUp}</div>
      <div>Bat Score: {pitch.batScore}</div>
      <div>Field Score: {pitch.fldScore}</div>
      <div>Stand: {pitch.stand}</div>
    </div>
  </div>
)}

<button style={{marginLeft: 170}} onClick={openCreateModal}>
  {result ? "Update Data" : "Enter Data"}
</button>
    
    {result && (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        alignItems: 'flex-start',
        padding: '20px'
      }}>
        {/* Heatmap */}
        <div style={{ 
          position: 'relative', 
          width: '600px', 
          height: '600px'
        }}>
          
          {/* zones 1-9 (main grid) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 120px)',
            gridTemplateRows: 'repeat(3, 120px)',
            gap: '2px',
            zIndex: 10
          }}>
            {result.probabilities.slice(0, 9).map((prob, index) => {
              const isPredicted = result.predicted_zone === index;
              const intensity = Math.min(prob * 4, 1);
              const red = Math.round(255 * intensity);
              const blue = Math.round(255 * (1 - intensity));
              
              return (
                <div key={index} style={{
                  backgroundColor: `rgba(${red}, 100, ${blue}, ${0.3 + intensity * 0.5})`,
                  border: isPredicted ? '4px solid gold' : '2px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px black',
                  boxShadow: isPredicted ? '0 0 20px gold' : 'none'
                }}>
                  <div style={{ fontSize: '20px' }}>{index + 1}</div>
                  <div style={{ fontSize: '14px' }}>{(prob * 100).toFixed(1)}%</div>
                </div>
              );
            })}
          </div>

          {/* Corner Zones L-shapes */}
          {[
            { label: '11', top: '30px', left: '30px', index: 9, clipPath: 'polygon(0 0, 100% 0, 100% 25%, 25% 25%, 25% 100%, 0 100%)', textPos: { top: '15px', left: '15px' } },
            { label: '12', top: '30px', right: '30px', index: 10, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 75% 100%, 75% 25%, 0 25%)', textPos: { top: '15px', right: '15px' } },
            { label: '13', bottom: '30px', left: '30px', index: 11, clipPath: 'polygon(0 0, 25% 0, 25% 75%, 100% 75%, 100% 100%, 0 100%)', textPos: { bottom: '15px', left: '15px' } },
            { label: '14', bottom: '30px', right: '30px', index: 12, clipPath: 'polygon(75% 0, 100% 0, 100% 100%, 0 100%, 0 75%, 75% 75%)', textPos: { bottom: '15px', right: '15px' } }
          ].map((corner) => {
            const prob = result.probabilities[corner.index];
            const isPredicted = result.predicted_zone === corner.index;
            const intensity = Math.min(prob * 4, 1);
            const red = Math.round(255 * intensity);
            const blue = Math.round(255 * (1 - intensity));
            
            return (
              <div key={corner.index} style={{
                position: 'absolute',
                top: corner.top,
                bottom: corner.bottom,
                left: corner.left,
                right: corner.right,
                width: '240px',
                height: '240px'
              }}>
                {/* L shapes */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: `rgba(${red}, 100, ${blue}, ${0.3 + intensity * 0.5})`,
                  border: isPredicted ? '4px solid gold' : '2px solid rgba(255,255,255,0.3)',
                  clipPath: corner.clipPath,
                  boxShadow: isPredicted ? '0 0 20px gold' : 'none'
                }} />
                
                {/* text */}
                <div style={{
                  position: 'absolute',
                  ...corner.textPos,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px black',
                  zIndex: 1
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                    {corner.label}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* batter picture */}
          <img src="/Batter.png" alt="Batter" style={{ 
            position: 'absolute',
            top: 0,
            right: 400,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
            zIndex: 1,
            pointerEvents: 'none'
          }}/>
        </div>

        {/* Pitch type predictions */}
        {result.predicted_pitch_type !== undefined && (
          <div style={{
            padding: '20px',
            Color: 'white',
            backgroundColor: '#000000',
            borderRadius: '8px',
            width: '300px',
            flexShrink: 0
          }}>
            <h3 style={{ marginBottom: '15px', color:'white'}}>Top 3 Most Likely Pitches</h3>
            {result.pitch_type_probabilities
              .map((prob, index) => ({ pitch: index, probability: prob }))
              .sort((a, b) => b.probability - a.probability)
              .slice(0, 3)
              .map((item, rank) => {
                return (
                  <div key={rank} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    color: 'white',
                    marginBottom: '10px',
                    Color: 'white',
                    backgroundColor: rank === 0 ? '#ffd700' : 'black',
                    borderRadius: '5px',
                    fontWeight: rank === 0 ? 'bold' : 'normal'
                  }}>
                    <span>{rank + 1}. {pitchNames[item.pitch] || `Pitch ${item.pitch}`}</span>
                    <span>{(item.probability * 100).toFixed(2)}%</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    )}
    
    {isModalOpen && (
  <div className="modal" style={{zIndex: 100}}>
    <div className="modal-content">
      <span className="close" onClick={closeModal}>&times;</span>
      <PitchForm 
        onClose={closeModal} 
        sendData={sendData} 
        existingPitch={pitch}  
      />
    </div>
  </div>
)}
  </>
);
  }
  export default App;
