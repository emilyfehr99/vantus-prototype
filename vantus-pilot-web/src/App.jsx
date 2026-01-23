import { useState, useRef, useEffect } from 'react'
import logo from './assets/logo.jpg'
import './index.css'

function App() {
    const [isStealth, setIsStealth] = useState(false)
    const [sliderX, setSliderX] = useState(0)
    const [badgeNumber, setBadgeNumber] = useState('') // [NEW] Badge State

    const isDragging = useRef(false)
    const sliderWidth = 280
    const handleWidth = 50
    const maxDrag = sliderWidth - handleWidth - 10

    const startPatrol = () => {
        if (!badgeNumber.trim()) {
            alert("Please enter Badge Number")
            return
        }

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((e) => console.log(e))
        }
        setIsStealth(true)
    }

    useEffect(() => {
        const handleUp = () => {
            if (!isDragging.current) return
            isDragging.current = false
            if (sliderX > maxDrag * 0.9) {
                setIsStealth(false)
                if (document.exitFullscreen) document.exitFullscreen().catch(e => { })
                setSliderX(0)
            } else {
                setSliderX(0)
            }
        }

        const handleMove = (e) => {
            if (!isDragging.current) return
            setSliderX(prev => {
                const next = prev + e.movementX
                return Math.max(0, Math.min(next, maxDrag))
            })
        }

        if (isStealth) {
            window.addEventListener('mouseup', handleUp)
            window.addEventListener('mousemove', handleMove)
        }

        return () => {
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('mousemove', handleMove)
        }
    }, [isStealth, sliderX, maxDrag])

    const handleMouseDown = (e) => {
        isDragging.current = true
    }

    if (isStealth) {
        return (
            <div className="stealth-container">
                <div className="slider-track">
                    <span className="slider-text">SLIDE TO END SHIFT</span>
                    <div
                        className="slider-handle"
                        style={{ transform: `translateX(${sliderX}px)` }}
                        onMouseDown={handleMouseDown}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="airlock-container light-theme">
            <div className="header">
                <img
                    src={logo}
                    alt="Vantus Logo"
                    className="logo-img"
                />
            </div>

            <div className="input-group">
                <input
                    type="number"
                    placeholder="Enter Badge Number"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="badge-input"
                />
            </div>

            <button
                className="patrol-btn"
                onClick={startPatrol}
                disabled={!badgeNumber}
                style={{ opacity: badgeNumber ? 1 : 0.5, cursor: badgeNumber ? 'pointer' : 'not-allowed' }}
            >
                START PATROL
            </button>

            <div className="footer-status">
                <p>SYSTEM STATUS: READINESS OK</p>
            </div>
        </div>
    )
}

export default App
