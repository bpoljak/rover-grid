export const LEVELS = [
  {
    id: 'level-1',
    name: 'Level 1 — First Steps',
    grid: {
      width: 5,
      height: 5,
      cells: [
        // Row 0
        { position: { x: 0, y: 0 }, tile: 'start' },
        { position: { x: 1, y: 0 }, tile: 'empty' },
        { position: { x: 2, y: 0 }, tile: 'empty' },
        { position: { x: 3, y: 0 }, tile: 'empty' },
        { position: { x: 4, y: 0 }, tile: 'empty' },
        // Row 1
        { position: { x: 0, y: 1 }, tile: 'empty' },
        { position: { x: 1, y: 1 }, tile: 'rock' },
        { position: { x: 2, y: 1 }, tile: 'empty' },
        { position: { x: 3, y: 1 }, tile: 'empty' },
        { position: { x: 4, y: 1 }, tile: 'empty' },
        // Row 2
        { position: { x: 0, y: 2 }, tile: 'empty' },
        { position: { x: 1, y: 2 }, tile: 'empty' },
        { position: { x: 2, y: 2 }, tile: 'empty' },
        { position: { x: 3, y: 2 }, tile: 'rock' },
        { position: { x: 4, y: 2 }, tile: 'empty' },
        // Row 3
        { position: { x: 0, y: 3 }, tile: 'empty' },
        { position: { x: 1, y: 3 }, tile: 'empty' },
        { position: { x: 2, y: 3 }, tile: 'empty' },
        { position: { x: 3, y: 3 }, tile: 'empty' },
        { position: { x: 4, y: 3 }, tile: 'empty' },
        // Row 4
        { position: { x: 0, y: 4 }, tile: 'empty' },
        { position: { x: 1, y: 4 }, tile: 'empty' },
        { position: { x: 2, y: 4 }, tile: 'empty' },
        { position: { x: 3, y: 4 }, tile: 'empty' },
        { position: { x: 4, y: 4 }, tile: 'goal' },
      ],
    },
    roverStart: {
      position: { x: 0, y: 0 },
      direction: 'east',
      collectedSamples: 0,
      stepCount: 0,
      missionStatus: 'idle',
    },
    objectives: [{ type: 'reach_goal' }],
  },
  {
    id: 'level-2',
    name: 'Level 2 — Sample Hunt',
    grid: {
      width: 6,
      height: 6,
      cells: [
        { position: { x: 0, y: 0 }, tile: 'start' },
        { position: { x: 1, y: 0 }, tile: 'empty' },
        { position: { x: 2, y: 0 }, tile: 'sample' },
        { position: { x: 3, y: 0 }, tile: 'empty' },
        { position: { x: 4, y: 0 }, tile: 'empty' },
        { position: { x: 5, y: 0 }, tile: 'empty' },

        { position: { x: 0, y: 1 }, tile: 'empty' },
        { position: { x: 1, y: 1 }, tile: 'rock' },
        { position: { x: 2, y: 1 }, tile: 'rock' },
        { position: { x: 3, y: 1 }, tile: 'empty' },
        { position: { x: 4, y: 1 }, tile: 'hazard' },
        { position: { x: 5, y: 1 }, tile: 'empty' },

        { position: { x: 0, y: 2 }, tile: 'empty' },
        { position: { x: 1, y: 2 }, tile: 'empty' },
        { position: { x: 2, y: 2 }, tile: 'empty' },
        { position: { x: 3, y: 2 }, tile: 'empty' },
        { position: { x: 4, y: 2 }, tile: 'empty' },
        { position: { x: 5, y: 2 }, tile: 'sample' },

        { position: { x: 0, y: 3 }, tile: 'rock' },
        { position: { x: 1, y: 3 }, tile: 'empty' },
        { position: { x: 2, y: 3 }, tile: 'empty' },
        { position: { x: 3, y: 3 }, tile: 'hazard' },
        { position: { x: 4, y: 3 }, tile: 'empty' },
        { position: { x: 5, y: 3 }, tile: 'empty' },

        { position: { x: 0, y: 4 }, tile: 'empty' },
        { position: { x: 1, y: 4 }, tile: 'sample' },
        { position: { x: 2, y: 4 }, tile: 'empty' },
        { position: { x: 3, y: 4 }, tile: 'empty' },
        { position: { x: 4, y: 4 }, tile: 'rock' },
        { position: { x: 5, y: 4 }, tile: 'empty' },

        { position: { x: 0, y: 5 }, tile: 'empty' },
        { position: { x: 1, y: 5 }, tile: 'empty' },
        { position: { x: 2, y: 5 }, tile: 'empty' },
        { position: { x: 3, y: 5 }, tile: 'empty' },
        { position: { x: 4, y: 5 }, tile: 'empty' },
        { position: { x: 5, y: 5 }, tile: 'goal' },
      ],
    },
    roverStart: {
      position: { x: 0, y: 0 },
      direction: 'east',
      collectedSamples: 0,
      stepCount: 0,
      missionStatus: 'idle',
    },
    objectives: [{ type: 'collect_and_reach', targetCount: 2 }],
  },
  {
    id: 'level-3',
    name: 'Level 3 — Obstacle Course',
    grid: {
      width: 7,
      height: 5,
      cells: [
        { position: { x: 0, y: 0 }, tile: 'start' },
        { position: { x: 1, y: 0 }, tile: 'empty' },
        { position: { x: 2, y: 0 }, tile: 'rock' },
        { position: { x: 3, y: 0 }, tile: 'empty' },
        { position: { x: 4, y: 0 }, tile: 'empty' },
        { position: { x: 5, y: 0 }, tile: 'hazard' },
        { position: { x: 6, y: 0 }, tile: 'empty' },

        { position: { x: 0, y: 1 }, tile: 'empty' },
        { position: { x: 1, y: 1 }, tile: 'empty' },
        { position: { x: 2, y: 1 }, tile: 'empty' },
        { position: { x: 3, y: 1 }, tile: 'rock' },
        { position: { x: 4, y: 1 }, tile: 'empty' },
        { position: { x: 5, y: 1 }, tile: 'empty' },
        { position: { x: 6, y: 1 }, tile: 'sample' },

        { position: { x: 0, y: 2 }, tile: 'rock' },
        { position: { x: 1, y: 2 }, tile: 'empty' },
        { position: { x: 2, y: 2 }, tile: 'sample' },
        { position: { x: 3, y: 2 }, tile: 'empty' },
        { position: { x: 4, y: 2 }, tile: 'rock' },
        { position: { x: 5, y: 2 }, tile: 'empty' },
        { position: { x: 6, y: 2 }, tile: 'empty' },

        { position: { x: 0, y: 3 }, tile: 'empty' },
        { position: { x: 1, y: 3 }, tile: 'hazard' },
        { position: { x: 2, y: 3 }, tile: 'empty' },
        { position: { x: 3, y: 3 }, tile: 'empty' },
        { position: { x: 4, y: 3 }, tile: 'empty' },
        { position: { x: 5, y: 3 }, tile: 'rock' },
        { position: { x: 6, y: 3 }, tile: 'empty' },

        { position: { x: 0, y: 4 }, tile: 'empty' },
        { position: { x: 1, y: 4 }, tile: 'empty' },
        { position: { x: 2, y: 4 }, tile: 'empty' },
        { position: { x: 3, y: 4 }, tile: 'empty' },
        { position: { x: 4, y: 4 }, tile: 'empty' },
        { position: { x: 5, y: 4 }, tile: 'empty' },
        { position: { x: 6, y: 4 }, tile: 'goal' },
      ],
    },
    roverStart: {
      position: { x: 0, y: 0 },
      direction: 'east',
      collectedSamples: 0,
      stepCount: 0,
      missionStatus: 'idle',
    },
    objectives: [{ type: 'collect_and_reach', targetCount: 1 }],
  },
]

export function loadLevel(levelId) {
  const level = LEVELS.find(l => l.id === levelId)
  if (!level) throw new Error(`Level "${levelId}" not found`)
  // deep clone so mutation of cells (collect_sample) doesn't affect original
  return { level: JSON.parse(JSON.stringify(level)) }
}
