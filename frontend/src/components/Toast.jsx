import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', iconColor: '#22c55e' },
  error: { icon: XCircle, bg: '#fef2f2', border: '#fecaca', color: '#991b1b', iconColor: '#ef4444' },
  warning: { icon: AlertTriangle, bg: '#fffbeb', border: '#fde68a', color: '#92400e', iconColor: '#f59e0b' },
  info: { icon: Info, bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', iconColor: '#3b82f6' },
}

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info
  const Icon = config.icon

  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
      maxWidth: '420px', width: '100%',
      animation: 'toastSlideIn 0.35s ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '1rem 1.25rem', borderRadius: '12px',
        background: config.bg, border: `1px solid ${config.border}`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
        color: config.color, fontSize: '0.9rem', lineHeight: 1.5,
      }}>
        <Icon size={20} color={config.iconColor} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ flex: 1, fontWeight: 600 }}>{message}</span>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: config.color, opacity: 0.6, padding: '2px', flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
