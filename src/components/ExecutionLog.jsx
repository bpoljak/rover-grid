import { useEffect, useRef } from 'react'

export default function ExecutionLog({ log, currentCommandIndex }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  return (
    <div className="log-panel">
      <h2>EXECUTION LOG</h2>
      <div className="log-entries">
        {log.length === 0 && <div style={{ color: 'var(--muted)' }}>No output yet.</div>}
        {log.map((entry, i) => {
          const isLast = i === log.length - 1
          const isError = entry.includes('error') || entry.includes('Blocked') || entry.includes('Hazard') || entry.includes('failed')
          const isSuccess = entry.includes('Mission success') || entry.includes('success!')
          const cls = isSuccess ? 'success' : isError ? 'error' : isLast ? 'current' : ''
          return (
            <div key={i} className={`log-entry ${cls}`}>{entry}</div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
