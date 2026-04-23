import { describe, it, expect, beforeEach } from 'vitest'
import { parseProgram } from '../engine/commands.js'
import { executeStep, resetMission } from '../engine/rover.js'
import { loadLevel } from '../data/levels.js'

describe('parseProgram', () => {
  it('parses valid commands', () => {
    const { commands, errors } = parseProgram('move_forward\nturn_left\ncollect_sample')
    expect(commands).toEqual(['move_forward', 'turn_left', 'collect_sample'])
    expect(errors).toHaveLength(0)
  })

  it('ignores blank lines and comments', () => {
    const { commands, errors } = parseProgram('# comment\n\nmove_forward\n  \nturn_right')
    expect(commands).toEqual(['move_forward', 'turn_right'])
    expect(errors).toHaveLength(0)
  })

  it('reports unknown commands', () => {
    const { commands, errors } = parseProgram('move_forward\nfly\nturn_left')
    expect(commands).toEqual(['move_forward', 'turn_left'])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/fly/)
  })

  it('returns empty for empty input', () => {
    const { commands, errors } = parseProgram('')
    expect(commands).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

describe('executeStep — movement', () => {
  let level, rover

  beforeEach(() => {
    const result = loadLevel('level-1')
    level = result.level
    rover = { ...level.roverStart }
  })

  it('moves forward east', () => {
    const cmds = ['move_forward', 'move_forward']
    const result = executeStep(level, rover, cmds, 0)
    expect(result.rover.position).toEqual({ x: 1, y: 0 })
    expect(result.missionEnded).toBe(false)
  })

  it('turns right from east to south', () => {
    const cmds = ['turn_right', 'move_forward']
    const result = executeStep(level, rover, cmds, 0)
    expect(result.rover.direction).toBe('south')
  })

  it('turns left from east to north', () => {
    const cmds = ['turn_left', 'move_forward']
    const result = executeStep(level, rover, cmds, 0)
    expect(result.rover.direction).toBe('north')
  })

  it('blocks movement into a rock', () => {
    // rover at (0,0) facing south → (0,1) is empty, (1,0) facing east then south hits rock at (1,1)
    const r = { ...rover, position: { x: 0, y: 1 }, direction: 'east' }
    const result = executeStep(level, r, ['move_forward'], 0)
    // (1,1) is a rock
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.error).toMatch(/rock/)
  })

  it('blocks movement out of bounds', () => {
    const r = { ...rover, direction: 'north' } // (0,0) north → y=-1
    const result = executeStep(level, r, ['move_forward'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.error).toMatch(/out of bounds/)
  })

  it('ends mission on hazard', () => {
    const { level: level2 } = loadLevel('level-2')
    // hazard at (4,1)
    const r = { ...level2.roverStart, position: { x: 4, y: 0 }, direction: 'south' }
    const result = executeStep(level2, r, ['move_forward'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.error).toMatch(/hazard/i)
  })
})

describe('executeStep — collect_sample', () => {
  it('collects a sample when standing on one', () => {
    const { level: level2 } = loadLevel('level-2')
    const r = { ...level2.roverStart, position: { x: 2, y: 0 } } // sample tile
    const result = executeStep(level2, r, ['collect_sample'], 0)
    expect(result.rover.collectedSamples).toBe(1)
  })

  it('does nothing when no sample', () => {
    const { level } = loadLevel('level-1')
    const r = { ...level.roverStart }
    const result = executeStep(level, r, ['collect_sample'], 0)
    expect(result.rover.collectedSamples).toBe(0)
    expect(result.error).toBeNull()
  })
})

describe('executeStep — mission success', () => {
  it('succeeds when rover reaches goal on level-1', () => {
    const { level } = loadLevel('level-1')
    const r = { ...level.roverStart, position: { x: 3, y: 4 }, direction: 'east' }
    const result = executeStep(level, r, ['move_forward'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(true)
  })
})

describe('executeStep — collect_and_reach objective', () => {
  // Minimal inline level: start(0,0) → sample(1,0) → goal(2,0), objective collect_and_reach targetCount:1
  const testLevel = {
    id: 'test-car',
    name: 'Test collect_and_reach',
    grid: {
      width: 3,
      height: 1,
      cells: [
        { position: { x: 0, y: 0 }, tile: 'start' },
        { position: { x: 1, y: 0 }, tile: 'sample' },
        { position: { x: 2, y: 0 }, tile: 'goal' },
      ],
    },
    roverStart: { position: { x: 0, y: 0 }, direction: 'east', collectedSamples: 0, stepCount: 0, missionStatus: 'idle' },
    objectives: [{ type: 'collect_and_reach', targetCount: 1 }],
  }

  it('succeeds when rover collects required sample then reaches goal', () => {
    // Rover starts at (1,0) which has a sample; collect then move to goal
    const r = { ...testLevel.roverStart, position: { x: 1, y: 0 } }
    const step1 = executeStep(testLevel, r, ['collect_sample', 'move_forward'], 0)
    expect(step1.rover.collectedSamples).toBe(1)
    expect(step1.missionEnded).toBe(false)

    const step2 = executeStep(step1.level, step1.rover, ['collect_sample', 'move_forward'], step1.currentCommandIndex)
    expect(step2.missionEnded).toBe(true)
    expect(step2.missionSuccess).toBe(true)
  })

  it('does not succeed when rover reaches goal without collecting required samples', () => {
    // Rover at (1,0) facing east — skip collect and move straight to goal
    const r = { ...testLevel.roverStart, position: { x: 1, y: 0 } }
    const result = executeStep(testLevel, r, ['move_forward'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
  })

  it('does not succeed when rover collects sample but commands exhaust before reaching goal', () => {
    // Rover at (1,0), only command is collect_sample — never reaches goal
    const r = { ...testLevel.roverStart, position: { x: 1, y: 0 } }
    const result = executeStep(testLevel, r, ['collect_sample'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
  })
})

describe('executeStep — collect_samples objective', () => {
  const testLevel = {
    id: 'test-cs',
    name: 'Test collect_samples',
    grid: {
      width: 2,
      height: 1,
      cells: [
        { position: { x: 0, y: 0 }, tile: 'sample' },
        { position: { x: 1, y: 0 }, tile: 'empty' },
      ],
    },
    roverStart: { position: { x: 0, y: 0 }, direction: 'east', collectedSamples: 0, stepCount: 0, missionStatus: 'idle' },
    objectives: [{ type: 'collect_samples', targetCount: 1 }],
  }

  it('succeeds when rover collects enough samples and commands exhaust', () => {
    const result = executeStep(testLevel, testLevel.roverStart, ['collect_sample'], 0)
    expect(result.rover.collectedSamples).toBe(1)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(true)
  })

  it('does not succeed when rover has not collected enough samples', () => {
    const result = executeStep(testLevel, testLevel.roverStart, ['move_forward'], 0)
    expect(result.rover.collectedSamples).toBe(0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
  })
})

describe('executeStep — commands exhausted without success', () => {
  it('ends mission as incomplete when all commands run and objective unmet', () => {
    const { level } = loadLevel('level-1') // objective: reach_goal
    const r = { ...level.roverStart } // at (0,0), far from goal at (4,4)
    // single turn command — will never reach goal
    const result = executeStep(level, r, ['turn_right'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.logEntry).toMatch(/Mission incomplete/)
  })
})

describe('executeStep — no commands remaining (early-return guard)', () => {
  it('returns full contract-compliant shape when currentCommandIndex >= commands.length', () => {
    const { level } = loadLevel('level-1')
    const rover = { ...level.roverStart }
    const commands = ['turn_right']
    const result = executeStep(level, rover, commands, 1) // index past end
    expect(result).toHaveProperty('rover')
    expect(result).toHaveProperty('level')
    expect(result).toHaveProperty('currentCommandIndex', 1)
    expect(result).toHaveProperty('logEntry', 'No more commands.')
    expect(result).toHaveProperty('missionEnded', true)
    expect(result).toHaveProperty('missionSuccess')
    expect(result).toHaveProperty('error', null)
  })
})

describe('executeStep — unknown command', () => {
  it('ends mission immediately on an unknown command', () => {
    const { level } = loadLevel('level-1')
    const result = executeStep(level, level.roverStart, ['bogus_command'], 0)
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.error).toMatch(/Unknown command/)
  })
})

describe('resetMission', () => {
  it('resets rover to start position', () => {
    const { level } = loadLevel('level-1')
    const { rover, currentCommandIndex, log } = resetMission(level)
    expect(rover.position).toEqual(level.roverStart.position)
    expect(rover.direction).toBe(level.roverStart.direction)
    expect(rover.collectedSamples).toBe(0)
    expect(rover.missionStatus).toBe('idle')
    expect(currentCommandIndex).toBe(0)
    expect(log).toHaveLength(0)
  })
})

describe('loadLevel', () => {
  it('throws for unknown level', () => {
    expect(() => loadLevel('nope')).toThrow()
  })

  it('returns deep clones so mutations do not affect source', () => {
    const { level: a } = loadLevel('level-1')
    const { level: b } = loadLevel('level-1')
    a.grid.cells[0].tile = 'mutated'
    expect(b.grid.cells[0].tile).toBe('start')
  })
})
