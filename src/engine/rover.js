const DIRECTIONS = ['north', 'east', 'south', 'west']

function dirIndex(dir) {
  return DIRECTIONS.indexOf(dir)
}

function move(position, direction) {
  const deltas = {
    north: { x: 0, y: -1 },
    east:  { x: 1,  y: 0 },
    south: { x: 0, y: 1 },
    west:  { x: -1, y: 0 },
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

export function executeStep(level, rover, commands, currentCommandIndex) {
  if (currentCommandIndex >= commands.length) {
    return {
      rover,
      level,
      currentCommandIndex,
      logEntry: 'No more commands.',
      missionEnded: true,
      missionSuccess: checkSuccess(level, rover),
      error: null,
    }
  }

  const cmd = commands[currentCommandIndex]
  let next = { ...rover, stepCount: rover.stepCount + 1 }
  let logEntry = `[${currentCommandIndex + 1}] ${cmd}`
  let error = null
  let missionEnded = false
  let missionSuccess = false

  switch (cmd) {
    case 'move_forward': {
      const newPos = move(rover.position, rover.direction)
      const tile = tileAt(level, newPos)
      if (tile === null || tile === 'rock') {
        error = tile === null
          ? `Blocked: out of bounds at (${newPos.x}, ${newPos.y})`
          : `Blocked: rock at (${newPos.x}, ${newPos.y})`
        logEntry += ` — ${error}`
        missionEnded = true
        missionSuccess = false
      } else if (tile === 'hazard') {
        next.position = newPos
        error = `Hazard hit at (${newPos.x}, ${newPos.y}) — mission failed`
        logEntry += ` — ${error}`
        missionEnded = true
        missionSuccess = false
      } else {
        next.position = newPos
        logEntry += ` → (${newPos.x}, ${newPos.y})`
        if (tile === 'goal') {
          missionEnded = true
          missionSuccess = checkSuccess(level, next)
          logEntry += missionSuccess ? ' — Goal reached! Mission success!' : ' — Goal reached (objectives incomplete)'
        }
      }
      break
    }

    case 'turn_left': {
      const idx = (dirIndex(rover.direction) + 3) % 4
      next.direction = DIRECTIONS[idx]
      logEntry += ` → facing ${next.direction}`
      break
    }

    case 'turn_right': {
      const idx = (dirIndex(rover.direction) + 1) % 4
      next.direction = DIRECTIONS[idx]
      logEntry += ` → facing ${next.direction}`
      break
    }

    case 'collect_sample': {
      const tile = tileAt(level, rover.position)
      if (tile === 'sample') {
        next.collectedSamples = rover.collectedSamples + 1
        // mark tile as collected
        level = {
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
        logEntry += ` — sample collected (total: ${next.collectedSamples})`
      } else {
        logEntry += ` — no sample here`
      }
      break
    }

    default:
      error = `Unknown command: ${cmd}`
      logEntry += ` — error: ${error}`
      missionEnded = true
  }

  const newIndex = currentCommandIndex + 1

  if (!missionEnded && newIndex >= commands.length) {
    missionEnded = true
    missionSuccess = checkSuccess(level, next)
    if (missionSuccess) {
      logEntry += ' — All commands done. Mission success!'
    } else {
      logEntry += ' — All commands done. Mission incomplete.'
    }
  }

  next.missionStatus = missionEnded
    ? (missionSuccess ? 'success' : 'failure')
    : 'running'

  return {
    rover: next,
    level,
    currentCommandIndex: newIndex,
    logEntry,
    missionEnded,
    missionSuccess,
    error,
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
    currentCommandIndex: 0,
    log: [],
  }
}
