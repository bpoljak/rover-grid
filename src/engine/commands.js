// Supported DSL commands
export const COMMANDS = [
  'move_forward',
  'turn_left',
  'turn_right',
  'collect_sample',
]

const COMMENT_RE = /^\s*#/
const BLANK_RE = /^\s*$/

export function parseProgram(source) {
  const commands = []
  const errors = []

  const lines = source.split('\n')
  lines.forEach((line, i) => {
    if (BLANK_RE.test(line) || COMMENT_RE.test(line)) return
    const token = line.trim()
    if (COMMANDS.includes(token)) {
      commands.push(token)
    } else {
      errors.push(`Line ${i + 1}: unknown command "${token}"`)
    }
  })

  return { commands, errors }
}
