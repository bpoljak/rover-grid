import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { parseProgram } from '../engine/commands.js'
import { createExecutionCursor, executeStep, resetMission } from '../engine/rover.js'
import {
  completeLevel,
  loadProgress,
  markTutorialSeen,
  PROGRESS_STORAGE_KEY,
  resetProgress,
  shouldShowTutorial,
} from '../engine/progression.js'
import { LEVELS, loadLevel } from '../data/levels.js'
import App, { RUN_STEP_DELAY_MS } from '../App.jsx'

function seedUnlockedProgress() {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
    highestUnlockedLevel: 6,
    completedLevels: ['level-1', 'level-2', 'level-3'],
    unlockedFeatures: ['loops'],
    seenTutorials: ['level1_welcome', 'level4_loops'],
  }))
}

describe('parseProgram', () => {
  it('parses canonical parenthesized commands with source lines', () => {
    const { program, errors } = parseProgram('move_forward()\nturn_left()\ncollect_sample()')
    expect(errors).toHaveLength(0)
    expect(program.statements).toEqual([
      { name: 'move_forward', sourceLine: 1 },
      { name: 'turn_left', sourceLine: 2 },
      { name: 'collect_sample', sourceLine: 3 },
    ])
  })

  it('rejects the old no-parentheses syntax', () => {
    const { program, errors } = parseProgram('move_forward')
    expect(program).toBeNull()
    expect(errors[0]).toMatchObject({ kind: 'syntax_error', line: 1 })
  })

  it('reports locked loops distinctly before unlock', () => {
    const { program, errors } = parseProgram('for i in range(3):\n  move_forward()')
    expect(program).toBeNull()
    expect(errors[0]).toMatchObject({ kind: 'locked_command', line: 1 })
  })

  it('parses for and while loops after unlock', () => {
    const source = [
      'for i in range(2):',
      '  move_forward()',
      'while path_ahead():',
      '  move_forward()',
    ].join('\n')
    const { program, errors } = parseProgram(source, ['loops'])
    expect(errors).toHaveLength(0)
    expect(program.statements[0]).toMatchObject({ type: 'for', iterations: 2, sourceLine: 1 })
    expect(program.statements[0].body[0]).toMatchObject({ name: 'move_forward', sourceLine: 2 })
    expect(program.statements[1]).toMatchObject({ type: 'while', condition: 'path_ahead()', sourceLine: 3 })
  })

  it('enforces indentation and supported while conditions', () => {
    const badIndent = parseProgram('for i in range(2):\n move_forward()', ['loops'])
    expect(badIndent.errors.some(error => error.kind === 'invalid_indentation')).toBe(true)

    const badCondition = parseProgram('while battery_ok():\n  move_forward()', ['loops'])
    expect(badCondition.errors[0]).toMatchObject({ kind: 'syntax_error', line: 1 })
  })
})

describe('executeStep', () => {
  let level, rover

  beforeEach(() => {
    const result = loadLevel('level-1')
    level = result.level
    rover = { ...level.roverStart }
  })

  it('moves, turns, and reports active source lines', () => {
    const { program } = parseProgram('move_forward()\nturn_right()')
    const step1 = executeStep(level, rover, program, createExecutionCursor())
    expect(step1.rover.position).toEqual({ x: 1, y: 0 })
    expect(step1.activeSourceLine).toBe(1)
    expect(step1.missionEnded).toBe(false)

    const step2 = executeStep(step1.level, step1.rover, program, step1.executionCursor)
    expect(step2.rover.direction).toBe('south')
    expect(step2.activeSourceLine).toBeNull()
    expect(step2.missionEnded).toBe(true)
  })

  it('blocks movement into a rock', () => {
    const r = { ...rover, position: { x: 0, y: 1 }, direction: 'east' }
    const { program } = parseProgram('move_forward()')
    const result = executeStep(level, r, program, createExecutionCursor())
    expect(result.missionEnded).toBe(true)
    expect(result.missionSuccess).toBe(false)
    expect(result.error).toMatch(/rock/)
  })

  it('collects a sample and updates the level tile', () => {
    const { level: level2 } = loadLevel('level-2')
    const r = { ...level2.roverStart, position: { x: 2, y: 0 } }
    const { program } = parseProgram('collect_sample()')
    const result = executeStep(level2, r, program, createExecutionCursor())
    expect(result.rover.collectedSamples).toBe(1)
    expect(result.level.grid.cells.find(cell => cell.position.x === 2 && cell.position.y === 0).tile).toBe('empty')
  })

  it('executes for loop body commands in order with body source lines', () => {
    const { program } = parseProgram('for i in range(2):\n  turn_left()\n  turn_right()', ['loops'])
    const step1 = executeStep(level, rover, program, createExecutionCursor())
    expect(step1.activeSourceLine).toBe(2)
    const step2 = executeStep(step1.level, step1.rover, program, step1.executionCursor)
    expect(step2.activeSourceLine).toBe(3)
    const step3 = executeStep(step2.level, step2.rover, program, step2.executionCursor)
    expect(step3.activeSourceLine).toBe(2)
  })

  it('executes while path_ahead progressively', () => {
    const testLevel = {
      id: 'while-test',
      name: 'While Test',
      order: 1,
      grid: {
        width: 4,
        height: 1,
        cells: [
          { position: { x: 0, y: 0 }, tile: 'start' },
          { position: { x: 1, y: 0 }, tile: 'empty' },
          { position: { x: 2, y: 0 }, tile: 'goal' },
          { position: { x: 3, y: 0 }, tile: 'rock' },
        ],
      },
      roverStart: { position: { x: 0, y: 0 }, direction: 'east', collectedSamples: 0, stepCount: 0, missionStatus: 'idle' },
      objectives: [{ type: 'reach_goal' }],
    }
    const { program } = parseProgram('while path_ahead():\n  move_forward()', ['loops'])
    const step1 = executeStep(testLevel, testLevel.roverStart, program, createExecutionCursor())
    expect(step1.rover.position).toEqual({ x: 1, y: 0 })
    expect(step1.activeSourceLine).toBe(2)
    const step2 = executeStep(step1.level, step1.rover, program, step1.executionCursor)
    expect(step2.rover.position).toEqual({ x: 2, y: 0 })
    expect(step2.missionSuccess).toBe(true)
  })
})

describe('progression', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads initial progress and saves completed levels', () => {
    expect(loadProgress()).toEqual({
      highestUnlockedLevel: 1,
      completedLevels: [],
      unlockedFeatures: [],
      seenTutorials: [],
    })

    const result = completeLevel('level-1', 1, loadProgress())
    expect(result.progressionState.highestUnlockedLevel).toBe(2)
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).completedLevels).toEqual(['level-1'])
  })

  it('unlocks loops after level 3 and enforces locked load status', () => {
    const result = completeLevel('level-3', 3, loadProgress())
    expect(result.progressionState.unlockedFeatures).toContain('loops')
    expect(result.newlyUnlockedFeatures).toEqual(['loops'])
    expect(loadLevel('level-4', loadProgress()).isLocked).toBe(false)
    expect(loadLevel('level-5', loadProgress()).isLocked).toBe(true)
  })

  it('persists and resets tutorial seen state', () => {
    let progress = loadProgress()
    expect(shouldShowTutorial('level1_welcome', progress)).toBe(true)
    progress = markTutorialSeen('level1_welcome', progress)
    expect(loadProgress().seenTutorials).toEqual(['level1_welcome'])
    expect(shouldShowTutorial('level1_welcome', progress)).toBe(false)
    expect(resetProgress().seenTutorials).toEqual([])
  })
})

describe('App execution controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    seedUnlockedProgress()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['empty program', ''],
    ['zero-iteration for loop', 'for i in range(0):\n  move_forward()'],
    ['initial-false while loop', 'while goal_here():\n  move_forward()'],
  ])('lets Step finalize a valid %s', async (_, source) => {
    render(createElement(App))
    if (source) {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: source } })
    }

    const stepButton = screen.getByRole('button', { name: 'Step' })
    expect(stepButton).toBeEnabled()
    fireEvent.click(stepButton)

    expect(await screen.findByText('No more commands. Mission incomplete.')).toBeInTheDocument()
  })

  it('lets Run finalize a valid program with no next command', async () => {
    vi.useFakeTimers()
    render(createElement(App))

    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await act(async () => {
      vi.advanceTimersByTime(RUN_STEP_DELAY_MS)
      await Promise.resolve()
    })

    expect(screen.getByText('No more commands. Mission incomplete.')).toBeInTheDocument()
  })
})

describe('levels and run support', () => {
  it('defines six linear levels with loop tutorials after level 3', () => {
    expect(LEVELS.map(level => level.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(LEVELS[3].tutorialId).toBe('level4_loops')
  })

  it('uses a clearly perceivable fixed run delay', () => {
    expect(RUN_STEP_DELAY_MS).toBeGreaterThanOrEqual(300)
  })

  it('resets mission execution cursor and line highlight', () => {
    const { level } = loadLevel('level-1')
    const reset = resetMission(level)
    expect(reset.executionCursor).toEqual(createExecutionCursor())
    expect(reset.activeSourceLine).toBeNull()
  })
})
