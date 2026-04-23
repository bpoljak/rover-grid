import { useState, useCallback, useEffect } from 'react'
import { parseProgram } from './engine/commands.js'
import { createExecutionCursor, executeStep, resetMission } from './engine/rover.js'
import {
  completeLevel,
  loadProgress,
  markTutorialSeen,
  resetProgress,
  shouldShowTutorial,
} from './engine/progression.js'
import { loadLevel, LEVELS } from './data/levels.js'
import MissionPanel from './components/MissionPanel.jsx'
import GridPanel from './components/GridPanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import ExecutionLog from './components/ExecutionLog.jsx'
import Controls from './components/Controls.jsx'
import HelpBookModal from './components/HelpBookModal.jsx'
import TutorialModal from './components/TutorialModal.jsx'
import LevelCompleteOverlay from './components/LevelCompleteOverlay.jsx'

const RUN_STEP_DELAY_MS = 450

function freshState(levelId, progression) {
  const { level } = loadLevel(levelId, progression)
  return {
    level,
    rover: { ...level.roverStart, missionStatus: 'idle' },
    executionCursor: createExecutionCursor(),
    currentCommandIndex: 0,
    activeSourceLine: null,
    log: [],
  }
}

function hasDynamicWhile(program) {
  return Boolean(program?.statements.some(statement => statement.type === 'while'))
}

export default function App() {
  const [progression, setProgression] = useState(() => loadProgress())
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id)
  const [source, setSource] = useState('')
  const [parseErrors, setParseErrors] = useState([])
  const [executionProgram, setExecutionProgram] = useState(null)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [pendingTutorialId, setPendingTutorialId] = useState(null)
  const [completionFeedback, setCompletionFeedback] = useState(null)
  const [lockedMessage, setLockedMessage] = useState('')
  const [{ level, rover, executionCursor, currentCommandIndex, activeSourceLine, log }, setState] = useState(() =>
    freshState(LEVELS[0].id, progression)
  )

  const isDone = rover.missionStatus === 'success' || rover.missionStatus === 'failure'
  const liveParse = parseProgram(source, progression.unlockedFeatures)
  const activeProgram = executionProgram ?? liveParse.program
  const totalCommands = activeProgram && !hasDynamicWhile(activeProgram) ? liveParse.commands.length : null

  useEffect(() => {
    if (level.tutorialId && shouldShowTutorial(level.tutorialId, progression)) {
      setPendingTutorialId(level.tutorialId)
    }
  }, [level.id, level.tutorialId, progression])

  useEffect(() => {
    if (rover.missionStatus !== 'success' || completionFeedback) return

    const result = completeLevel(level.id, level.order, progression)
    setProgression(result.progressionState)
    setCompletionFeedback({
      levelId: level.id,
      newlyUnlockedLevel: result.newlyUnlockedLevel,
      newlyUnlockedFeatures: result.newlyUnlockedFeatures,
    })
  }, [rover.missionStatus, completionFeedback, level, progression])

  const applyStepResult = useCallback((result) => {
    setState({
      level: result.level ?? level,
      rover: result.rover,
      executionCursor: result.executionCursor,
      currentCommandIndex: result.currentCommandIndex,
      activeSourceLine: result.activeSourceLine,
      log: [...log, result.logEntry],
    })
    if (result.missionEnded) setIsAutoRunning(false)
  }, [level, log])

  const getProgramForExecution = useCallback(() => {
    if (executionProgram) return executionProgram

    const { program, errors } = parseProgram(source, progression.unlockedFeatures)
    setParseErrors(errors)
    if (errors.length > 0 || !program) return null
    setExecutionProgram(program)
    return program
  }, [executionProgram, progression.unlockedFeatures, source])

  const handleStep = useCallback(() => {
    const program = getProgramForExecution()
    if (!program) return

    const runningRover = rover.missionStatus === 'idle'
      ? { ...rover, missionStatus: 'running' }
      : rover

    const result = executeStep(level, runningRover, program, executionCursor)
    applyStepResult(result)
  }, [applyStepResult, executionCursor, getProgramForExecution, level, rover])

  useEffect(() => {
    if (!isAutoRunning || pendingTutorialId || completionFeedback) return

    const timer = window.setTimeout(() => {
      const program = getProgramForExecution()
      if (!program) {
        setIsAutoRunning(false)
        return
      }
      const runningRover = rover.missionStatus === 'idle'
        ? { ...rover, missionStatus: 'running' }
        : rover
      applyStepResult(executeStep(level, runningRover, program, executionCursor))
    }, RUN_STEP_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [
    applyStepResult,
    completionFeedback,
    executionCursor,
    getProgramForExecution,
    isAutoRunning,
    level,
    pendingTutorialId,
    rover,
  ])

  const handleRun = useCallback(() => {
    const program = getProgramForExecution()
    if (!program) return
    setIsAutoRunning(true)
  }, [getProgramForExecution])

  const handleReset = useCallback(() => {
    setIsAutoRunning(false)
    setParseErrors([])
    setExecutionProgram(null)
    setCompletionFeedback(null)
    setState(freshState(selectedLevelId, progression))
  }, [progression, selectedLevelId])

  const loadMission = useCallback((id, nextProgress = progression) => {
    const target = LEVELS.find(l => l.id === id)
    if (!target) return

    if (nextProgress.highestUnlockedLevel < target.order) {
      setLockedMessage(`Complete level ${target.order - 1} to unlock ${target.name}.`)
      return
    }

    setLockedMessage('')
    setIsAutoRunning(false)
    setSelectedLevelId(id)
    setSource('')
    setParseErrors([])
    setExecutionProgram(null)
    setCompletionFeedback(null)
    setState(freshState(id, nextProgress))
  }, [progression])

  const handleLevelChange = useCallback((e) => {
    loadMission(e.target.value)
  }, [loadMission])

  const handleDismissTutorial = useCallback(() => {
    const nextProgress = markTutorialSeen(pendingTutorialId, progression)
    setProgression(nextProgress)
    setPendingTutorialId(null)
  }, [pendingTutorialId, progression])

  const handleResetProgress = useCallback(() => {
    const nextProgress = resetProgress()
    setProgression(nextProgress)
    setSource('')
    setParseErrors([])
    setExecutionProgram(null)
    setCompletionFeedback(null)
    setLockedMessage('')
    setIsAutoRunning(false)
    setSelectedLevelId(LEVELS[0].id)
    setState(freshState(LEVELS[0].id, nextProgress))
  }, [])

  const handleCloseCompletion = useCallback(() => {
    setCompletionFeedback(null)
    setExecutionProgram(null)
    setState(freshState(selectedLevelId, progression))
  }, [progression, selectedLevelId])

  const canExecuteProgram = Boolean(activeProgram) && liveParse.errors.length === 0
  const canStep = !isAutoRunning && !isDone && canExecuteProgram
  const canRun = !isAutoRunning && !isDone && canExecuteProgram

  return (
    <div id="root">
      <header className="app-header">
        <h1>ROVER</h1>
        <select className="level-select" value={selectedLevelId} onChange={handleLevelChange} disabled={isAutoRunning}>
          {LEVELS.map(l => (
            <option key={l.id} value={l.id} disabled={progression.highestUnlockedLevel < l.order}>
              {progression.highestUnlockedLevel < l.order ? `Locked - ${l.name}` : l.name}
            </option>
          ))}
        </select>
        <button className="btn danger small" onClick={handleResetProgress} disabled={isAutoRunning}>Reset Progress</button>
        {lockedMessage && <span className="locked-message">{lockedMessage}</span>}
      </header>

      <div className="app-body">
        <MissionPanel level={level} rover={rover} />
        <GridPanel level={level} rover={rover} />
        <Controls
          onStep={handleStep}
          onRun={handleRun}
          onReset={handleReset}
          onHelp={() => setHelpOpen(true)}
          canStep={canStep}
          canRun={canRun}
          isAutoRunning={isAutoRunning}
          currentCommandIndex={currentCommandIndex}
          totalCommands={totalCommands}
        />
        <div className="right-col">
          <EditorPanel
            source={source}
            onChange={(nextSource) => {
              setSource(nextSource)
              setParseErrors([])
              setExecutionProgram(null)
              setState(current => ({ ...current, executionCursor: createExecutionCursor(), currentCommandIndex: 0, activeSourceLine: null, log: [] }))
            }}
            errors={parseErrors.length > 0 ? parseErrors : liveParse.errors}
            activeSourceLine={activeSourceLine}
            disabled={isAutoRunning || rover.missionStatus === 'running'}
          />
          <ExecutionLog log={log} currentCommandIndex={currentCommandIndex} />
        </div>
      </div>

      {helpOpen && <HelpBookModal unlockedFeatures={progression.unlockedFeatures} onClose={() => setHelpOpen(false)} />}
      {pendingTutorialId && <TutorialModal tutorialId={pendingTutorialId} onDismiss={handleDismissTutorial} />}
      <LevelCompleteOverlay
        feedback={completionFeedback}
        levels={LEVELS}
        onNextLevel={loadMission}
        onLevelSelect={handleCloseCompletion}
      />
    </div>
  )
}

export { RUN_STEP_DELAY_MS }
