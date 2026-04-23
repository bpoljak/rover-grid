const DIRECTIONS = ['north', 'east', 'south', 'west']
export const MAX_EXECUTION_STEPS = 500

function dirIndex(dir) {
  return DIRECTIONS.indexOf(dir)
}

function move(position, direction) {
  const deltas = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 },
  }
  const d = deltas[direction]
  return { x: position.x + d.x, y: position.y + d.y }
}

function cellAt(level, pos) {
  return level.grid.cells.find(c => c.position.x === pos.x && c.position.y === pos.y)
}

function tileAt(level, pos) {
  const cell = cellAt(level, pos)
  return cell ? cell.tile : null
}

export function createExecutionCursor(stepIndex = 0) {
  return {
    statementIndex: 0,
    loop: null,
    stepIndex,
  }
}

function normalizeProgram(programOrCommands) {
  if (programOrCommands?.statements) return programOrCommands
  return {
    statements: (programOrCommands ?? []).map(name => ({ name, sourceLine: null })),
  }
}

function normalizeCursor(cursorOrIndex) {
  if (typeof cursorOrIndex === 'number') {
    return {
      statementIndex: cursorOrIndex,
      loop: null,
      stepIndex: cursorOrIndex,
    }
  }
  return cursorOrIndex ?? createExecutionCursor()
}

export function canExecuteNext(level, rover, programOrCommands, cursorOrIndex) {
  const program = normalizeProgram(programOrCommands)
  const cursor = normalizeCursor(cursorOrIndex)
  return Boolean(findNextCommand(level, rover, program, cursor).command)
}

export function executeStep(level, rover, programOrCommands, cursorOrIndex) {
  const program = normalizeProgram(programOrCommands)
  const cursor = normalizeCursor(cursorOrIndex)

  if ((cursor.stepIndex ?? 0) >= MAX_EXECUTION_STEPS) {
    return endWithError(level, rover, cursor, `Execution stopped after ${MAX_EXECUTION_STEPS} steps.`)
  }

  const nextCommand = findNextCommand(level, rover, program, cursor)
  if (!nextCommand.command) {
    const missionSuccess = checkSuccess(level, rover)
    return {
      rover: { ...rover, missionStatus: missionSuccess ? 'success' : 'failure' },
      level,
      executionCursor: nextCommand.cursor,
      currentCommandIndex: nextCommand.cursor.stepIndex,
      stepIndex: nextCommand.cursor.stepIndex,
      activeSourceLine: null,
      logEntry: missionSuccess ? 'No more commands. Mission success!' : 'No more commands. Mission incomplete.',
      missionEnded: true,
      missionSuccess,
      error: null,
    }
  }

  const command = nextCommand.command
  const executedStepIndex = nextCommand.cursor.stepIndex ?? 0
  let next = { ...rover, stepCount: rover.stepCount + 1 }
  let nextLevel = level
  let logEntry = `[${executedStepIndex + 1}] ${command.name}()`
  let error = null
  let missionEnded = false
  let missionSuccess = false

  switch (command.name) {
    case 'move_forward': {
      const newPos = move(rover.position, rover.direction)
      const tile = tileAt(level, newPos)
      if (tile === null || tile === 'rock') {
        error = tile === null
          ? `Blocked: out of bounds at (${newPos.x}, ${newPos.y})`
          : `Blocked: rock at (${newPos.x}, ${newPos.y})`
        logEntry += ` - ${error}`
        missionEnded = true
      } else if (tile === 'hazard') {
        next.position = newPos
        error = `Hazard hit at (${newPos.x}, ${newPos.y}) - mission failed`
        logEntry += ` - ${error}`
        missionEnded = true
      } else {
        next.position = newPos
        logEntry += ` -> (${newPos.x}, ${newPos.y})`
        if (tile === 'goal') {
          missionEnded = true
          missionSuccess = checkSuccess(level, next)
          logEntry += missionSuccess ? ' - Goal reached! Mission success!' : ' - Goal reached (objectives incomplete)'
        }
      }
      break
    }

    case 'turn_left': {
      const idx = (dirIndex(rover.direction) + 3) % 4
      next.direction = DIRECTIONS[idx]
      logEntry += ` -> facing ${next.direction}`
      break
    }

    case 'turn_right': {
      const idx = (dirIndex(rover.direction) + 1) % 4
      next.direction = DIRECTIONS[idx]
      logEntry += ` -> facing ${next.direction}`
      break
    }

    case 'collect_sample': {
      const tile = tileAt(level, rover.position)
      if (tile === 'sample') {
        next.collectedSamples = rover.collectedSamples + 1
        nextLevel = {
          ...level,
          grid: {
            ...level.grid,
            cells: level.grid.cells.map(c =>
              c.position.x === rover.position.x && c.position.y === rover.position.y
                ? { ...c, tile: 'empty' }
                : c
            ),
          },
        }
        logEntry += ` - sample collected (total: ${next.collectedSamples})`
      } else {
        logEntry += ' - no sample here'
      }
      break
    }

    default:
      error = `Unknown command: ${command.name}`
      logEntry += ` - error: ${error}`
      missionEnded = true
  }

  const advancedCursor = advanceCursor(program, nextCommand.cursor)

  if (!missionEnded && !canExecuteNext(nextLevel, next, program, advancedCursor)) {
    missionEnded = true
    missionSuccess = checkSuccess(nextLevel, next)
    logEntry += missionSuccess ? ' - All commands done. Mission success!' : ' - All commands done. Mission incomplete.'
  }

  next.missionStatus = missionEnded
    ? (missionSuccess ? 'success' : 'failure')
    : 'running'

  return {
    rover: next,
    level: nextLevel,
    executionCursor: advancedCursor,
    currentCommandIndex: advancedCursor.stepIndex,
    stepIndex: advancedCursor.stepIndex,
    activeSourceLine: missionEnded ? null : command.sourceLine,
    logEntry,
    missionEnded,
    missionSuccess,
    error,
  }
}

function findNextCommand(level, rover, program, cursor) {
  let nextCursor = cloneCursor(cursor)

  while (nextCursor.statementIndex < program.statements.length) {
    const statement = program.statements[nextCursor.statementIndex]

    if (statement.name) {
      return { command: statement, cursor: nextCursor }
    }

    if (statement.type === 'for') {
      const loop = nextCursor.loop?.statementIndex === nextCursor.statementIndex
        ? nextCursor.loop
        : { statementIndex: nextCursor.statementIndex, iteration: 0, bodyIndex: 0 }

      if (statement.iterations <= 0 || statement.body.length === 0 || loop.iteration >= statement.iterations) {
        nextCursor = { ...nextCursor, statementIndex: nextCursor.statementIndex + 1, loop: null }
        continue
      }

      return { command: statement.body[loop.bodyIndex], cursor: { ...nextCursor, loop } }
    }

    if (statement.type === 'while') {
      const loop = nextCursor.loop?.statementIndex === nextCursor.statementIndex
        ? nextCursor.loop
        : { statementIndex: nextCursor.statementIndex, bodyIndex: null }

      const bodyIndex = loop.bodyIndex ?? 0
      if (loop.bodyIndex === null && !conditionHolds(statement.condition, level, rover)) {
        nextCursor = { ...nextCursor, statementIndex: nextCursor.statementIndex + 1, loop: null }
        continue
      }

      if (statement.body.length === 0) {
        nextCursor = { ...nextCursor, statementIndex: nextCursor.statementIndex + 1, loop: null }
        continue
      }

      return { command: statement.body[bodyIndex], cursor: { ...nextCursor, loop: { ...loop, bodyIndex } } }
    }

    nextCursor = { ...nextCursor, statementIndex: nextCursor.statementIndex + 1, loop: null }
  }

  return { command: null, cursor: nextCursor }
}

function advanceCursor(program, cursor) {
  const statement = program.statements[cursor.statementIndex]
  const nextStep = (cursor.stepIndex ?? 0) + 1

  if (!statement || statement.name) {
    return {
      statementIndex: cursor.statementIndex + 1,
      loop: null,
      stepIndex: nextStep,
    }
  }

  if (statement.type === 'for') {
    const loop = cursor.loop ?? { statementIndex: cursor.statementIndex, iteration: 0, bodyIndex: 0 }
    const nextBodyIndex = loop.bodyIndex + 1
    if (nextBodyIndex < statement.body.length) {
      return { ...cursor, stepIndex: nextStep, loop: { ...loop, bodyIndex: nextBodyIndex } }
    }

    const nextIteration = loop.iteration + 1
    if (nextIteration < statement.iterations) {
      return { ...cursor, stepIndex: nextStep, loop: { ...loop, iteration: nextIteration, bodyIndex: 0 } }
    }

    return {
      statementIndex: cursor.statementIndex + 1,
      loop: null,
      stepIndex: nextStep,
    }
  }

  if (statement.type === 'while') {
    const loop = cursor.loop ?? { statementIndex: cursor.statementIndex, bodyIndex: 0 }
    const nextBodyIndex = loop.bodyIndex + 1
    if (nextBodyIndex < statement.body.length) {
      return { ...cursor, stepIndex: nextStep, loop: { ...loop, bodyIndex: nextBodyIndex } }
    }

    return {
      ...cursor,
      loop: { statementIndex: cursor.statementIndex, bodyIndex: null },
      stepIndex: nextStep,
    }
  }

  return {
    statementIndex: cursor.statementIndex + 1,
    loop: null,
    stepIndex: nextStep,
  }
}

function cloneCursor(cursor) {
  return {
    statementIndex: cursor.statementIndex ?? 0,
    loop: cursor.loop ? { ...cursor.loop } : null,
    stepIndex: cursor.stepIndex ?? 0,
  }
}

function conditionHolds(condition, level, rover) {
  if (condition === 'path_ahead()') {
    const pos = move(rover.position, rover.direction)
    const tile = tileAt(level, pos)
    return tile !== null && tile !== 'rock' && tile !== 'hazard'
  }

  if (condition === 'sample_here()') return tileAt(level, rover.position) === 'sample'
  if (condition === 'goal_here()') return tileAt(level, rover.position) === 'goal'
  return false
}

function endWithError(level, rover, cursor, message) {
  return {
    rover: { ...rover, missionStatus: 'failure' },
    level,
    executionCursor: cursor,
    currentCommandIndex: cursor.stepIndex,
    stepIndex: cursor.stepIndex,
    activeSourceLine: null,
    logEntry: message,
    missionEnded: true,
    missionSuccess: false,
    error: message,
  }
}

function checkSuccess(level, rover) {
  for (const obj of level.objectives) {
    if (obj.type === 'reach_goal') {
      const tile = tileAt(level, rover.position)
      if (tile !== 'goal') return false
    }
    if (obj.type === 'collect_samples') {
      if (rover.collectedSamples < (obj.targetCount ?? 1)) return false
    }
    if (obj.type === 'collect_and_reach') {
      const tile = tileAt(level, rover.position)
      if (tile !== 'goal') return false
      if (rover.collectedSamples < (obj.targetCount ?? 1)) return false
    }
  }
  return true
}

export function resetMission(level) {
  return {
    rover: { ...level.roverStart, missionStatus: 'idle' },
    executionCursor: createExecutionCursor(),
    currentCommandIndex: 0,
    activeSourceLine: null,
    log: [],
  }
}
