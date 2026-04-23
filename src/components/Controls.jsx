export default function Controls({
  onStep,
  onRun,
  onReset,
  onHelp,
  canStep,
  canRun,
  isAutoRunning,
  currentCommandIndex,
  totalCommands,
}) {
  return (
    <div className="controls-panel">
      <button className="btn primary" onClick={onRun} disabled={!canRun}>{isAutoRunning ? 'Running' : 'Run'}</button>
      <button className="btn" onClick={onStep} disabled={!canStep}>Step</button>
      <button className="btn danger" onClick={onReset}>Reset</button>
      <button className="btn" onClick={onHelp}>Help Book</button>
      <span className="step-info">
        {totalCommands === null
          ? `step ${currentCommandIndex}`
          : totalCommands > 0
          ? `cmd ${Math.min(currentCommandIndex, totalCommands)} / ${totalCommands}`
          : 'no program'}
      </span>
    </div>
  )
}
