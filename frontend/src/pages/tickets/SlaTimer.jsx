import { useState, useEffect } from 'react';
import { Timer, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * SLA Timer Component
 *
 * Props:
 *  - label: "First Response" or "Resolution"
 *  - createdAt: ISO timestamp string of ticket creation
 *  - completedAt: ISO timestamp string when SLA event happened (null if not yet)
 *  - slaMinutes: SLA target in minutes (e.g. 240 for 4 hours)
 *  - breached: boolean from backend
 */
export default function SlaTimer({ label, createdAt, completedAt, slaMinutes, breached }) {
  const [now, setNow] = useState(Date.now());

  // Live tick every second — only when the timer is still running
  useEffect(() => {
    if (completedAt) return; // Timer already stopped
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [completedAt]);

  const created = new Date(createdAt).getTime();
  const deadline = created + slaMinutes * 60 * 1000;

  const endTime = completedAt ? new Date(completedAt).getTime() : now;
  const elapsed = endTime - created;
  const remaining = deadline - endTime;

  // Determine status
  let status, color, bgColor, Icon;
  if (completedAt && !breached) {
    status = 'MET';
    color = '#10b981'; bgColor = '#ecfdf5';
    Icon = CheckCircle;
  } else if (completedAt && breached) {
    status = 'BREACHED';
    color = '#ef4444'; bgColor = '#fef2f2';
    Icon = XCircle;
  } else if (remaining <= 0) {
    status = 'OVERDUE';
    color = '#ef4444'; bgColor = '#fef2f2';
    Icon = XCircle;
  } else if (remaining < slaMinutes * 60 * 1000 * 0.25) {
    // Less than 25% time remaining
    status = 'AT RISK';
    color = '#f59e0b'; bgColor = '#fffbeb';
    Icon = AlertTriangle;
  } else {
    status = 'ON TRACK';
    color = '#10b981'; bgColor = '#ecfdf5';
    Icon = Timer;
  }

  // Format milliseconds into a human-friendly string
  const formatDuration = (ms) => {
    const abMs = Math.abs(ms);
    const totalMinutes = Math.floor(abMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.6rem 1rem',
      borderRadius: '8px',
      background: bgColor,
      border: `1px solid ${color}30`,
      flex: 1,
      minWidth: '220px',
    }}>
      <Icon size={20} color={color} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: '700', color }}>
          {completedAt ? (
            // Completed — show how long it took
            <>Took {formatDuration(elapsed)}</>
          ) : remaining > 0 ? (
            // Running — show time remaining
            <>{formatDuration(remaining)} remaining</>
          ) : (
            // Overdue — show how much over
            <>Overdue by {formatDuration(Math.abs(remaining))}</>
          )}
        </div>
      </div>
      <span style={{
        fontSize: '0.7rem',
        fontWeight: '800',
        color,
        background: `${color}15`,
        padding: '0.15rem 0.5rem',
        borderRadius: '4px',
        letterSpacing: '0.05em',
      }}>
        {status}
      </span>
    </div>
  );
}
