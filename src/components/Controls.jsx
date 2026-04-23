export default function Controls({
  onStep,
  onRun,
  onReset,
  canStep,
  canRun,
  currentCommandIndex,
  totalCommands,
}) {
  return (
    <div className="controls-panel">
      <button className="btn primary" onClick={onRun} disabled={!canRun}>Run</button>
      <button className="btn" onClick={onStep} disabled={!canStep}>Step</button>
      <button className="btn danger" onClick={onReset}>Reset</button>
      <span className="step-info">
        {totalCommands > 0
          ? `cmd ${Math.min(currentCommandIndex, totalCommands)} / ${totalCommands}`
          : 'no program'}
      </span>
    </div>
  )
}
