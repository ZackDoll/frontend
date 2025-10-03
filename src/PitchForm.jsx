// src/PitchForm.jsx
import { useState, useEffect } from "react";

function PitchForm({ updateCallback, onClose, sendData, existingPitch }) {
    const [inning, setInning] = useState("")
    const [balls, setBalls] = useState("")
    const [strikes, setStrikes] = useState("")
    const [outsWhenUp, setOutsWhenUp] = useState("")
    const [fldScore, setFldScore] = useState("")
    const [batScore, setBatScore] = useState("")
    const [stand, setStand] = useState("L")

    // Populate form if editing existing pitch
    useEffect(() => {
        if (existingPitch) {
            setInning(existingPitch.inning || "")
            setBalls(existingPitch.balls || "")
            setStrikes(existingPitch.strikes || "")
            setOutsWhenUp(existingPitch.outs_when_up || "")
            setFldScore(existingPitch.fld_score || "")
            setBatScore(existingPitch.bat_score || "")
            setStand(existingPitch.stand || "L")
        }
    }, [existingPitch])

    const handleSubmit = async (e) => {
        e.preventDefault()

        const payload = {
            inning: Number(inning) || 0,
            balls: Number(balls) || 0,
            strikes: Number(strikes) || 0,
            outsWhenUp: Number(outsWhenUp) || 0,
            fldScore: Number(fldScore) || 0,
            batScore: Number(batScore) || 0,
            stand: stand || "L"
        }

        console.log("Submitting payload:", payload)
        sendData(payload)

        try {
            let response;
            
            if (existingPitch) {
                // Update existing pitch
                response = await fetch(`https://baseball-backend-6eec.onrender.com/update_pitch/${existingPitch.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                // Add new pitch
                response = await fetch("https://baseball-backend-6eec.onrender.com/add_pitch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            let data;
            try { data = await response.json(); } catch { data = { message: "No JSON returned" }; }

            if (!response.ok) {
                alert(data.message || "Server error")
                return
            }

            if (typeof updateCallback === 'function') updateCallback()
            if (typeof onClose === 'function') onClose()
            
            // Clear form only if adding new pitch
            if (!existingPitch) {
                setInning(""); setBalls(""); setStrikes(""); setOutsWhenUp(""); 
                setFldScore(""); setBatScore(""); setStand("L")
            }
        } catch (err) {
            console.error("Operation failed:", err)
            alert("Network error")
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div style = {{color: "white"}}>
            <h3>{existingPitch ? "Edit Pitch" : "Add Pitch"}</h3>
            <label>Inning: <input type="number" value={inning} onChange={e => setInning(e.target.value)} /></label><br />
            <label>Balls: <input type="number" value={balls} onChange={e => setBalls(e.target.value)} /></label><br />
            <label>Strikes: <input type="number" value={strikes} onChange={e => setStrikes(e.target.value)} /></label><br />
            <label>Outs: <input type="number" value={outsWhenUp} onChange={e => setOutsWhenUp(e.target.value)} /></label><br />
            <label>Bat Score: <input type="number" value={batScore} onChange={e => setBatScore(e.target.value)} /></label><br />
            <label>Field Score: <input type="number" value={fldScore} onChange={e => setFldScore(e.target.value)} /></label><br />
            <label>Stand:
                <select value={stand} onChange={e => setStand(e.target.value)}>
                    <option value="L">Left</option>
                    <option value="R">Right</option>
                </select>
            </label><br />
            </div>
            <button type="submit">{existingPitch ? "Update Pitch" : "Add Pitch"}</button>
        </form>
    )
}

export default PitchForm
