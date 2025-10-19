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

    // Fractal/geometric shapes with enhanced properties
    const shapes: Array<{
      x: number
      y: number
      size: number
      rotation: number
      rotationSpeed: number
      opacity: number
      baseOpacity: number
      type: 'triangle' | 'hexagon' | 'diamond' | 'circle' | 'line' | 'spiral'
      speed: number
      pulsePhase: number
      pulseSpeed: number
      color: string
    }> = []

    // Color palette inspired by your theme
    const colors = [
      'rgba(34, 197, 94, ', // green-500
      'rgba(99, 102, 241, ', // indigo-500  
      'rgba(139, 69, 19, ', // brown-600
      'rgba(101, 163, 13, ', // lime-600
      'rgba(6, 182, 212, ', // cyan-500
    ]

    // Initialize shapes with responsive sizing
    const initShapes = () => {
      shapes.length = 0
      const area = canvas.width * canvas.height
      const isMobile = window.innerWidth < 768
      const shapeCount = Math.floor(area / (isMobile ? 80000 : 50000))
      
      for (let i = 0; i < Math.min(shapeCount, isMobile ? 20 : 40); i++) {
        const baseOpacity = Math.random() * 0.05 + 0.008
        shapes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (isMobile ? 30 : 50) + (isMobile ? 8 : 12),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.008,
          opacity: baseOpacity,
          baseOpacity,
          type: ['triangle', 'hexagon', 'diamond', 'circle', 'line', 'spiral'][Math.floor(Math.random() * 6)] as any,
          speed: Math.random() * 0.25 + 0.02,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.012 + 0.002,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    // Draw connection lines between nearby shapes (optimized)
    const drawConnections = () => {
      const connectionDistance = window.innerWidth < 768 ? 80 : 120
      const maxConnections = window.innerWidth < 768 ? 15 : 30
      let connectionCount = 0
      
      for (let i = 0; i < shapes.length && connectionCount < maxConnections; i++) {
        for (let j = i + 1; j < shapes.length && connectionCount < maxConnections; j++) {
          const shape1 = shapes[i]
          const shape2 = shapes[j]
          const distance = Math.sqrt(
            Math.pow(shape1.x - shape2.x, 2) + Math.pow(shape1.y - shape2.y, 2)
          )
          
          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.02
            ctx.strokeStyle = `rgba(139, 69, 19, ${opacity})`
            ctx.lineWidth = 0.3
            ctx.beginPath()
            ctx.moveTo(shape1.x, shape1.y)
            ctx.lineTo(shape2.x, shape2.y)
            ctx.stroke()
            connectionCount++
          }
        }
      }
    }

    initShapes()

    // Enhanced draw functions for different shapes
    const drawTriangle = (x: number, y: number, size: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(0, -size / 2)
      ctx.lineTo(-size / 2, size / 2)
      ctx.lineTo(size / 2, size / 2)
      ctx.closePath()
      ctx.restore()
    }

    const drawHexagon = (x: number, y: number, size: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const pointX = Math.cos(angle) * size / 2
        const pointY = Math.sin(angle) * size / 2
        if (i === 0) {
          ctx.moveTo(pointX, pointY)
        } else {
          ctx.lineTo(pointX, pointY)
        }
      }
      ctx.closePath()
      ctx.restore()
    }

    const drawDiamond = (x: number, y: number, size: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(0, -size / 2)
      ctx.lineTo(size / 2, 0)
      ctx.lineTo(0, size / 2)
      ctx.lineTo(-size / 2, 0)
      ctx.closePath()
      ctx.restore()
    }

    const drawCircle = (x: number, y: number, size: number) => {
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    }

    const drawLine = (x: number, y: number, size: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(-size / 2, 0)
      ctx.lineTo(size / 2, 0)
      ctx.restore()
    }

    const drawSpiral = (x: number, y: number, size: number, rotation: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      const turns = 3
      const step = 0.1
      for (let angle = 0; angle < turns * Math.PI * 2; angle += step) {
        const radius = (angle / (turns * Math.PI * 2)) * size / 2
        const spiralX = Math.cos(angle) * radius
        const spiralY = Math.sin(angle) * radius
        if (angle === 0) {
          ctx.moveTo(spiralX, spiralY)
        } else {
          ctx.lineTo(spiralX, spiralY)
        }
      }
      ctx.restore()
    }

    // Animation loop with enhanced effects and performance optimization
    let animationId: number
    let time = 0
    let lastTime = 0
    const targetFPS = window.innerWidth < 768 ? 30 : 45 // Lower FPS on mobile
    const frameDuration = 1000 / targetFPS
    
    const animate = (currentTime: number = 0) => {
      if (currentTime - lastTime < frameDuration) {
        animationId = requestAnimationFrame(animate)
        return
      }
      
      lastTime = currentTime
      time += frameDuration / 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connection lines first (behind shapes) - only every other frame on mobile
      if (!window.matchMedia('(max-width: 768px)').matches || Math.floor(time * targetFPS) % 2 === 0) {
        drawConnections()
      }

      shapes.forEach(shape => {
        // Update position (slow scroll effect)
        shape.y -= shape.speed
        if (shape.y < -shape.size) {
          shape.y = canvas.height + shape.size
          shape.x = Math.random() * canvas.width
        }

        // Update rotation
        shape.rotation += shape.rotationSpeed

        // Update pulsing opacity
        shape.pulsePhase += shape.pulseSpeed
        const pulseMultiplier = 0.5 + 0.5 * Math.sin(shape.pulsePhase)
        shape.opacity = shape.baseOpacity * pulseMultiplier

        // Set dynamic styles with color variation
        const currentOpacity = shape.opacity * (0.8 + 0.2 * Math.sin(time * 2))
        ctx.strokeStyle = `${shape.color}${currentOpacity})`
        ctx.fillStyle = `${shape.color}${currentOpacity * 0.2})`
        ctx.lineWidth = Math.max(0.5, shape.size / 40)

        // Draw shape with glow effect
        ctx.shadowColor = shape.color + '0.3)'
        ctx.shadowBlur = shape.size / 8
        
        // Draw shape
        switch (shape.type) {
          case 'triangle':
            drawTriangle(shape.x, shape.y, shape.size, shape.rotation)
            break
          case 'hexagon':
            drawHexagon(shape.x, shape.y, shape.size, shape.rotation)
            break
          case 'diamond':
            drawDiamond(shape.x, shape.y, shape.size, shape.rotation)
            break
          case 'circle':
            drawCircle(shape.x, shape.y, shape.size)
            break
          case 'line':
            drawLine(shape.x, shape.y, shape.size, shape.rotation)
            break
          case 'spiral':
            drawSpiral(shape.x, shape.y, shape.size, shape.rotation)
            break
        }
        
        ctx.stroke()
        if (shape.type !== 'line' && shape.type !== 'spiral') {
          ctx.fill()
        }
        
        // Reset shadow
        ctx.shadowBlur = 0
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Static gradient fallback for performance */}
      <div 
        className="absolute inset-0 opacity-30 animate-pulse"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(139, 69, 19, 0.02) 0%, transparent 60%),
            linear-gradient(45deg, transparent 30%, rgba(101, 163, 13, 0.01) 50%, transparent 70%)
          `,
          animationDuration: '6s',
          animationDelay: '0s'
        }}
      />
      
      {/* Secondary moving gradient */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse at 70% 30%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(34, 197, 94, 0.02) 0%, transparent 50%)
          `,
          animation: 'breathe 10s ease-in-out infinite reverse'
        }}
      />
      
      {/* Animated canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          background: 'transparent',
          filter: 'blur(0.3px)',
          opacity: 0.8,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  )
}