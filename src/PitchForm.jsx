import { useState, useEffect } from "react"
import './App.css'

function PitchForm({ onClose, sendData, existingPitch }) {
  const [inning,     setInning]     = useState("")
  const [balls,      setBalls]      = useState("")
  const [strikes,    setStrikes]    = useState("")
  const [outsWhenUp, setOutsWhenUp] = useState("")
  const [fldScore,   setFldScore]   = useState("")
  const [batScore,   setBatScore]   = useState("")
  const [stand,      setStand]      = useState("L")
  const [errors,     setErrors]     = useState({})

  useEffect(() => {
    if (existingPitch) {
      setInning(existingPitch.inning ?? "")
      setBalls(existingPitch.balls ?? "")
      setStrikes(existingPitch.strikes ?? "")
      setOutsWhenUp(existingPitch.outsWhenUp ?? "")
      setFldScore(existingPitch.fldScore ?? "")
      setBatScore(existingPitch.batScore ?? "")
      setStand(existingPitch.stand ?? "L")
    }
  }, [existingPitch])

  const validateField = (name, value) => {
    const num = Number(value)
    let error = null

    switch (name) {
      case 'inning':
        if (value === '' || num < 1 || num > 20) error = 'Inning must be 1–20'
        break
      case 'balls':
        if (value === '' || num < 0 || num > 3) error = 'Balls must be 0–3'
        break
      case 'strikes':
        if (value === '' || num < 0 || num > 2) error = 'Strikes must be 0–2'
        break
      case 'outsWhenUp':
        if (value === '' || num < 0 || num > 2) error = 'Outs must be 0–2'
        break
      case 'batScore':
      case 'fldScore':
        if (value === '' || num < 0) error = 'Score must be 0 or greater'
        break
    }

    setErrors(prev => ({ ...prev, [name]: error }))
    return error === null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validations = {
      inning:     validateField('inning',     inning),
      balls:      validateField('balls',      balls),
      strikes:    validateField('strikes',    strikes),
      outsWhenUp: validateField('outsWhenUp', outsWhenUp),
      batScore:   validateField('batScore',   batScore),
      fldScore:   validateField('fldScore',   fldScore),
    }

    if (Object.values(validations).includes(false)) return

    const payload = {
      inning:     Number(inning),
      balls:      Number(balls),
      strikes:    Number(strikes),
      outsWhenUp: Number(outsWhenUp),
      fldScore:   Number(fldScore),
      batScore:   Number(batScore),
      stand,
    }

    sendData(payload)
    if (typeof onClose === 'function') onClose()
  }

  const fields = [
    { name: 'inning',     label: 'Inning',          value: inning,     set: setInning,     min: 1, max: 20 },
    { name: 'balls',      label: 'Balls',            value: balls,      set: setBalls,      min: 0, max: 3  },
    { name: 'strikes',    label: 'Strikes',          value: strikes,    set: setStrikes,    min: 0, max: 2  },
    { name: 'outsWhenUp', label: 'Outs',             value: outsWhenUp, set: setOutsWhenUp, min: 0, max: 2  },
    { name: 'batScore',   label: 'Batting Score',    value: batScore,   set: setBatScore,   min: 0          },
    { name: 'fldScore',   label: 'Fielding Score',   value: fldScore,   set: setFldScore,   min: 0          },
  ]

  return (
    <form className="pitch-form" onSubmit={handleSubmit}>
      <h2 className="form-title">
        {existingPitch ? "Modify Game State" : "Enter Game State"}
      </h2>

      <div className="form-grid">
        {fields.map(({ name, label, value, set, min, max }) => (
          <div key={name} className="field-group">
            <label className="field-label" htmlFor={`field-${name}`}>{label}</label>
            <input
              id={`field-${name}`}
              type="number"
              value={value}
              onChange={e => set(e.target.value)}
              onBlur={e => validateField(name, e.target.value)}
              className={`field-input${errors[name] ? ' field-input--error' : ''}`}
              min={min}
              max={max}
            />
            {errors[name] && <div className="field-error">{errors[name]}</div>}
          </div>
        ))}
      </div>

      <div className="field-group field-group--full">
        <label className="field-label" htmlFor="field-stand">Batter Handedness</label>
        <select
          id="field-stand"
          value={stand}
          onChange={e => setStand(e.target.value)}
          className="field-input"
        >
          <option value="L">Left</option>
          <option value="R">Right</option>
        </select>
      </div>

      <button type="submit" className="btn-submit">
        {existingPitch ? "Update" : "Predict"}
      </button>
    </form>
  )
}

export default PitchForm
