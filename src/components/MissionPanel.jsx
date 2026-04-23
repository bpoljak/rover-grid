export default function MissionPanel({ level, rover }) {
  const statusClass =
    rover.missionStatus === 'success' ? 'success' :
    rover.missionStatus === 'failure' ? 'failure' :
    rover.missionStatus === 'running' ? 'running' : null

  const statusLabel =
    rover.missionStatus === 'success' ? 'MISSION SUCCESS' :
    rover.missionStatus === 'failure' ? 'MISSION FAILED' :
    rover.missionStatus === 'running' ? 'EXECUTING...' : null

  return (
    <div className="panel mission-panel">
      <h2>MISSION</h2>
      <div className="mission-name">{level.name}</div>

      {level.objectives.map((obj, i) => (
        <div className="objective" key={i}>
          {objectiveLabel(obj, rover)}
        </div>
      ))}

      {statusLabel && (
        <div className={`mission-status ${statusClass}`}>{statusLabel}</div>
      )}

      <div className="rover-stats">
        Position: <span>({rover.position.x}, {rover.position.y})</span><br />
        Facing: <span>{rover.direction}</span><br />
        Samples: <span>{rover.collectedSamples}</span><br />
        Steps: <span>{rover.stepCount}</span>
      </div>

      <div className="tile-legend">
        <div>🟢 <span>Start</span></div>
        <div>🟠 <span>Goal</span></div>
        <div>🔵 <span>Sample</span></div>
        <div>⬛ <span>Rock</span></div>
        <div>🔴 <span>Hazard</span></div>
        <div>🤖 <span>Rover</span></div>
      </div>
    </div>
  )
}

function objectiveLabel(obj, rover) {
  if (obj.type === 'reach_goal') return 'Reach the goal tile'
  if (obj.type === 'collect_samples') {
    const n = obj.targetCount ?? 1
    return `Collect ${rover.collectedSamples}/${n} sample${n > 1 ? 's' : ''}`
  }
  if (obj.type === 'collect_and_reach') {
    const n = obj.targetCount ?? 1
    return `Collect ${rover.collectedSamples}/${n} sample${n > 1 ? 's' : ''} and reach goal`
  }
  return obj.type
}
