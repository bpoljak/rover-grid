function makeGrid(width, height, tiles) {
  const cells = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells.push({ position: { x, y }, tile: tiles[`${x},${y}`] ?? 'empty' })
    }
  }
  return { width, height, cells }
}

function roverStart(x, y, direction = 'east') {
  return {
    position: { x, y },
    direction,
    collectedSamples: 0,
    stepCount: 0,
    missionStatus: 'idle',
  }
}

export const LEVELS = [
  {
    id: 'level-1',
    name: 'Level 1 - First Steps',
    order: 1,
    tutorialId: 'level1_welcome',
    grid: makeGrid(5, 5, {
      '0,0': 'start',
      '1,1': 'rock',
      '3,2': 'rock',
      '4,4': 'goal',
    }),
    roverStart: roverStart(0, 0, 'east'),
    objectives: [{ type: 'reach_goal' }],
  },
  {
    id: 'level-2',
    name: 'Level 2 - Sample Hunt',
    order: 2,
    grid: makeGrid(6, 6, {
      '0,0': 'start',
      '2,0': 'sample',
      '1,1': 'rock',
      '2,1': 'rock',
      '4,1': 'hazard',
      '5,2': 'sample',
      '0,3': 'rock',
      '3,3': 'hazard',
      '1,4': 'sample',
      '4,4': 'rock',
      '5,5': 'goal',
    }),
    roverStart: roverStart(0, 0, 'east'),
    objectives: [{ type: 'collect_and_reach', targetCount: 2 }],
  },
  {
    id: 'level-3',
    name: 'Level 3 - Obstacle Course',
    order: 3,
    grid: makeGrid(7, 5, {
      '0,0': 'start',
      '2,0': 'rock',
      '5,0': 'hazard',
      '3,1': 'rock',
      '6,1': 'sample',
      '0,2': 'rock',
      '2,2': 'sample',
      '4,2': 'rock',
      '1,3': 'hazard',
      '5,3': 'rock',
      '6,4': 'goal',
    }),
    roverStart: roverStart(0, 0, 'east'),
    objectives: [{ type: 'collect_and_reach', targetCount: 1 }],
  },
  {
    id: 'level-4',
    name: 'Level 4 - Loop Line',
    order: 4,
    tutorialId: 'level4_loops',
    grid: makeGrid(8, 3, {
      '0,1': 'start',
      '7,1': 'goal',
      '3,0': 'rock',
      '3,2': 'rock',
    }),
    roverStart: roverStart(0, 1, 'east'),
    objectives: [{ type: 'reach_goal' }],
  },
  {
    id: 'level-5',
    name: 'Level 5 - Survey Square',
    order: 5,
    grid: makeGrid(6, 6, {
      '1,1': 'start',
      '4,4': 'goal',
      '0,0': 'rock',
      '5,0': 'rock',
      '0,5': 'rock',
      '5,5': 'rock',
      '2,2': 'hazard',
      '3,3': 'hazard',
    }),
    roverStart: roverStart(1, 1, 'east'),
    objectives: [{ type: 'reach_goal' }],
  },
  {
    id: 'level-6',
    name: 'Level 6 - Until the Ridge',
    order: 6,
    grid: makeGrid(7, 4, {
      '0,1': 'start',
      '5,1': 'goal',
      '6,1': 'rock',
      '2,0': 'rock',
      '2,2': 'rock',
      '4,0': 'hazard',
      '4,2': 'hazard',
    }),
    roverStart: roverStart(0, 1, 'east'),
    objectives: [{ type: 'reach_goal' }],
  },
]

export function loadLevel(levelId, progressionState = null) {
  const level = LEVELS.find(l => l.id === levelId)
  if (!level) throw new Error(`Level "${levelId}" not found`)

  return {
    level: JSON.parse(JSON.stringify(level)),
    isLocked: progressionState ? progressionState.highestUnlockedLevel < level.order : false,
  }
}
