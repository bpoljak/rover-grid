import { COMMANDS } from '../engine/commands.js'

export default function EditorPanel({ source, onChange, errors, disabled }) {
  return (
    <div className="editor-panel">
      <h2>PROGRAM EDITOR</h2>
      <textarea
        className="editor-textarea"
        value={source}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        placeholder={`# Write your rover program\n# Available commands:\n${COMMANDS.join('\n')}`}
        rows={10}
      />
      {errors.length > 0 && (
        <div className="editor-errors">
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}
    </div>
  )
}
