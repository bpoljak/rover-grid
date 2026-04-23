import { useState, useCallback } from 'react'
import { parseProgram } from './engine/commands.js'
import { executeStep, resetMission } from './engine/rover.js'
import { loadLevel, LEVELS } from './data/levels.js'
import MissionPanel from './components/MissionPanel.jsx'
import GridPanel from './components/GridPanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import ExecutionLog from './components/ExecutionLog.jsx'
import Controls from './components/Controls.jsx'

function freshState(levelId) {
  const { level } = loadLevel(levelId)
  return {
    level,
    rover: { ...level.roverStart, missionStatus: 'idle' },
    currentCommandIndex: 0,
    log: [],
  }
}

export default function App() {
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id)
  const [source, setSource] = useState('')
  const [parseErrors, setParseErrors] = useState([])
  const [{ level, rover, currentCommandIndex, log }, setState] = useState(() =>
    freshState(LEVELS[0].id)
  )

  const isRunning = rover.missionStatus === 'running'
  const isDone = rover.missionStatus === 'success' || rover.missionStatus === 'failure'

  function getCommands() {
    const { commands, errors } = parseProgram(source)
    setParseErrors(errors)
    return errors.length > 0 ? null : commands
  }

  const handleStep = useCallback(() => {
    const commands = getCommands()
    if (!commands) return
    if (commands.length === 0) return

    const runningRover = rover.missionStatus === 'idle'
      ? { ...rover, missionStatus: 'running' }
      : rover

    const result = executeStep(level, runningRover, commands, currentCommandIndex)
    setState({
      level: result.level ?? level,
      rover: result.rover,
      currentCommandIndex: result.currentCommandIndex,
      log: [...log, result.logEntry],
    })
  }, [level, rover, currentCommandIndex, log, source])

  const handleRun = useCallback(() => {
    const commands = getCommands()
    if (!commands || commands.length === 0) return

    let curLevel = level
    let curRover = { ...rover, missionStatus: 'running' }
    let curIndex = currentCommandIndex
    let curLog = [...log]

    while (curIndex < commands.length) {
      const result = executeStep(curLevel, curRover, commands, curIndex)
      curLevel = result.level ?? curLevel
      curRover = result.rover
      curIndex = result.currentCommandIndex
      curLog = [...curLog, result.logEntry]
      if (result.missionEnded) break
    }

    setState({ level: curLevel, rover: curRover, currentCommandIndex: curIndex, log: curLog })
  }, [level, rover, currentCommandIndex, log, source])

  const handleReset = useCallback(() => {
    setParseErrors([])
    setState(freshState(selectedLevelId))
  }, [selectedLevelId])

  const handleLevelChange = useCallback((e) => {
    const id = e.target.value
    setSelectedLevelId(id)
    setSource('')
    setParseErrors([])
    setState(freshState(id))
  }, [])

  const { commands: parsedCommands, errors: liveErrors } = parseProgram(source)
  const canStep = !isDone && liveErrors.length === 0 && parsedCommands.length > 0 && currentCommandIndex < parsedCommands.length
  const canRun = !isDone && liveErrors.length === 0 && parsedCommands.length > 0 && currentCommandIndex < parsedCommands.length

  return (
    <div id="root">
      <header className="app-header">
        <h1>ROVER</h1>
        <select className="level-select" value={selectedLevelId} onChange={handleLevelChange}>
          {LEVELS.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </header>

      <div className="app-body">
        <MissionPanel level={level} rover={rover} />
        <GridPanel level={level} rover={rover} />
        <Controls
          onStep={handleStep}
          onRun={handleRun}
          onReset={handleReset}
          canStep={canStep}
          canRun={canRun}
          currentCommandIndex={currentCommandIndex}
          totalCommands={parsedCommands.length}
        />
        <div className="right-col">
          <EditorPanel
            source={source}
            onChange={setSource}
            errors={parseErrors}
            disabled={isRunning}
          />
          <ExecutionLog log={log} currentCommandIndex={currentCommandIndex} />
        </div>
      </div>
    </div>
  )
}
