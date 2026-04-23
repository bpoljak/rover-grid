import { BASIC_COMMANDS } from '../engine/commands.js'

export default function EditorPanel({ source, onChange, errors, activeSourceLine, disabled }) {
  const lines = source.length > 0 ? source.split('\n') : ['']
  const errorLines = new Set(errors.map(error => error.line).filter(Boolean))

  return (
    <div className="editor-panel">
      <h2>PROGRAM EDITOR</h2>
      <div className="editor-shell">
        <div className="editor-line-layer" aria-hidden="true">
          {lines.map((_, i) => {
            const lineNumber = i + 1
            const classes = [
              'editor-line-mark',
              activeSourceLine === lineNumber ? 'active' : '',
              errorLines.has(lineNumber) ? 'parse-error' : '',
            ].filter(Boolean).join(' ')
            return <div className={classes} key={lineNumber}>{lineNumber}</div>
          })}
        </div>
        <textarea
          className="editor-textarea"
          value={source}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          placeholder={`# Write your rover program\n${BASIC_COMMANDS.map(command => `${command}()`).join('\n')}`}
          rows={10}
        />
      </div>
      {errors.length > 0 && (
        <div className="editor-errors">
          {errors.map((e, i) => (
            <div className={`editor-error ${e.kind}`} key={i}>{e.message ?? e}</div>
          ))}
        </div>
      )}
    </div>
  )
}
