'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Venom-style chaotic lines interface
    interface Line {
      x1: number
      y1: number
      x2: number
      y2: number
      thickness: number
      opacity: number
      speed: number
      angle: number
      rotationSpeed: number
      color: string
    }

    const lines: Line[] = []
    const lineCount = 120 // Lots of chaotic lines like Venom

    // Color palette - green/brown theme
    const colors = [
      'rgba(34, 197, 94, ', // green-500
      'rgba(16, 185, 129, ', // green-600
      'rgba(5, 150, 105, ', // green-700
      'rgba(139, 69, 19, ', // brown
      'rgba(101, 163, 13, ', // lime
      'rgba(30, 30, 30, ', // almost black
    ]

    // Initialize chaotic lines
    const initLines = () => {
      lines.length = 0
      for (let i = 0; i < lineCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const length = Math.random() * 250 + 40
        const x1 = Math.random() * canvas.width
        const y1 = Math.random() * canvas.height
        
        lines.push({
          x1,
          y1,
          x2: x1 + Math.cos(angle) * length,
          y2: y1 + Math.sin(angle) * length,
          thickness: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.05,
          speed: Math.random() * 0.4 + 0.1,
          angle,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    initLines()

    // Animation loop
    let animationFrameId: number

    const animate = () => {
      // Clear canvas with slight trail effect (creates that Venom smear)
      ctx.fillStyle = 'rgba(3, 7, 18, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update lines
      lines.forEach(line => {
        // Slowly rotate the line
        line.angle += line.rotationSpeed
        
        // Calculate new endpoints based on rotation
        const length = Math.sqrt(
          Math.pow(line.x2 - line.x1, 2) + 
          Math.pow(line.y2 - line.y1, 2)
        )
        
        line.x2 = line.x1 + Math.cos(line.angle) * length
        line.y2 = line.y1 + Math.sin(line.angle) * length

        // Slowly drift the line (organic movement)
        line.x1 += (Math.random() - 0.5) * line.speed
        line.y1 += (Math.random() - 0.5) * line.speed
        line.x2 += (Math.random() - 0.5) * line.speed
        line.y2 += (Math.random() - 0.5) * line.speed

        // Wrap around edges
        if (line.x1 < -100) line.x1 = canvas.width + 100
        if (line.x1 > canvas.width + 100) line.x1 = -100
        if (line.y1 < -100) line.y1 = canvas.height + 100
        if (line.y1 > canvas.height + 100) line.y1 = -100
        
        if (line.x2 < -100) line.x2 = canvas.width + 100
        if (line.x2 > canvas.width + 100) line.x2 = -100
        if (line.y2 < -100) line.y2 = canvas.height + 100
        if (line.y2 > canvas.height + 100) line.y2 = -100

        // Draw the line with glow effect
        ctx.strokeStyle = line.color + line.opacity + ')'
        ctx.lineWidth = line.thickness
        ctx.lineCap = 'round'
        
        // Outer glow
        ctx.shadowBlur = 8
        ctx.shadowColor = line.color + '0.4)'
        
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()

        // Reset shadow
        ctx.shadowBlur = 0
      })

      // Draw connections between nearby line endpoints (Venom web effect)
      const maxDistance = 100
      ctx.lineWidth = 0.5

      for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
          const line1 = lines[i]
          const line2 = lines[j]

          // Check distance between endpoints
          const dx = line1.x2 - line2.x1
          const dy = line1.y2 - line2.y1
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15
            ctx.strokeStyle = `rgba(34, 197, 94, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(line1.x2, line1.y2)
            ctx.lineTo(line2.x1, line2.y1)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 0,
        background: 'linear-gradient(to bottom, rgb(3, 7, 18), rgb(6, 15, 25))'
      }}
    />
  )
}
