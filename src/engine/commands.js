export const BASIC_COMMANDS = [
  'move_forward',
  'turn_left',
  'turn_right',
  'collect_sample',
]

export const COMMANDS = BASIC_COMMANDS

export const BUILTIN_CONDITIONS = [
  'path_ahead()',
  'sample_here()',
  'goal_here()',
]

const COMMENT_RE = /^\s*#/
const BLANK_RE = /^\s*$/
const COMMAND_CALL_RE = /^([a-z_][a-z0-9_]*)\(\)$/
const FOR_RE = /^for\s+[A-Za-z_][A-Za-z0-9_]*\s+in\s+range\((\d+)\):$/
const WHILE_RE = /^while\s+(.+):$/

function leadingSpaces(line) {
  const match = line.match(/^ */)
  return match ? match[0].length : 0
}

function parseCommandCall(token, lineNumber, errors) {
  const call = token.match(COMMAND_CALL_RE)
  if (call) {
    const name = call[1]
    if (BASIC_COMMANDS.includes(name)) return { name, sourceLine: lineNumber }
    errors.push(error('unknown_command', `Line ${lineNumber}: unknown command "${token}"`, lineNumber))
    return null
  }

  if (BASIC_COMMANDS.includes(token)) {
    errors.push(error('syntax_error', `Line ${lineNumber}: "${token}" must be called with parentheses, for example ${token}()`, lineNumber))
    return null
  }

  errors.push(error('unknown_command', `Line ${lineNumber}: unknown command "${token}"`, lineNumber))
  return null
}

function error(kind, message, line) {
  return { kind, message, line }
}

export function parseProgram(source, unlockedFeatures = []) {
  const statements = []
  const errors = []
  const lines = source.split('\n')
  const loopsUnlocked = unlockedFeatures.includes('loops')

  let i = 0
  while (i < lines.length) {
    const rawLine = lines[i]
    const lineNumber = i + 1

    if (BLANK_RE.test(rawLine) || COMMENT_RE.test(rawLine)) {
      i += 1
      continue
    }

    const indent = leadingSpaces(rawLine)
    const token = rawLine.trim()

    if (indent > 0) {
      errors.push(error('invalid_indentation', `Line ${lineNumber}: unexpected indentation outside a loop body`, lineNumber))
      i += 1
      continue
    }

    if (token.startsWith('for ') || token.startsWith('while ')) {
      if (!loopsUnlocked) {
        errors.push(error('locked_command', `Line ${lineNumber}: loop commands are locked until level 3 is completed`, lineNumber))
        i = skipIndentedBlock(lines, i)
        continue
      }

      const parsedLoop = parseLoop(lines, i, errors)
      if (parsedLoop.statement) statements.push(parsedLoop.statement)
      i = parsedLoop.nextIndex
      continue
    }

    const command = parseCommandCall(token, lineNumber, errors)
    if (command) statements.push(command)
    i += 1
  }

  const program = errors.length === 0 ? { statements } : null
  return {
    program,
    commands: program ? flattenStaticCommands(program) : [],
    errors,
  }
}

function skipIndentedBlock(lines, headerIndex) {
  const headerIndent = leadingSpaces(lines[headerIndex])
  let nextIndex = headerIndex + 1

  while (nextIndex < lines.length) {
    const rawLine = lines[nextIndex]
    if (BLANK_RE.test(rawLine) || COMMENT_RE.test(rawLine)) {
      nextIndex += 1
      continue
    }
    if (leadingSpaces(rawLine) <= headerIndent) break
    nextIndex += 1
  }

  return nextIndex
}

function parseLoop(lines, headerIndex, errors) {
  const headerLine = lines[headerIndex]
  const sourceLine = headerIndex + 1
  const headerToken = headerLine.trim()
  const headerIndent = leadingSpaces(headerLine)
  const body = []
  let statement = null
  let nextIndex = headerIndex + 1

  const forMatch = headerToken.match(FOR_RE)
  const whileMatch = headerToken.match(WHILE_RE)

  if (!forMatch && !whileMatch) {
    errors.push(error('syntax_error', `Line ${sourceLine}: invalid loop syntax`, sourceLine))
  } else if (whileMatch && !BUILTIN_CONDITIONS.includes(whileMatch[1].trim())) {
    errors.push(error('syntax_error', `Line ${sourceLine}: unsupported while condition "${whileMatch[1].trim()}"`, sourceLine))
  }

  while (nextIndex < lines.length) {
    const rawLine = lines[nextIndex]
    const lineNumber = nextIndex + 1

    if (BLANK_RE.test(rawLine) || COMMENT_RE.test(rawLine)) {
      nextIndex += 1
      continue
    }

    const indent = leadingSpaces(rawLine)
    if (indent <= headerIndent) break

    if (indent < headerIndent + 2) {
      errors.push(error('invalid_indentation', `Line ${lineNumber}: loop body must be indented by at least 2 spaces`, lineNumber))
      nextIndex += 1
      continue
    }

    const token = rawLine.trim()
    if (token.startsWith('for ') || token.startsWith('while ')) {
      errors.push(error('syntax_error', `Line ${lineNumber}: nested loops are not supported`, lineNumber))
      nextIndex += 1
      continue
    }

    const command = parseCommandCall(token, lineNumber, errors)
    if (command) body.push(command)
    nextIndex += 1
  }

  if (body.length === 0) {
    errors.push(error('invalid_indentation', `Line ${sourceLine}: loop body is missing or incorrectly indented`, sourceLine))
  }

  if (forMatch && body.length > 0) {
    statement = {
      type: 'for',
      iterations: Number(forMatch[1]),
      body,
      sourceLine,
    }
  }

  if (whileMatch && BUILTIN_CONDITIONS.includes(whileMatch[1].trim()) && body.length > 0) {
    statement = {
      type: 'while',
      condition: whileMatch[1].trim(),
      body,
      sourceLine,
    }
  }

  return { statement, nextIndex }
}

function flattenStaticCommands(program) {
  const commands = []
  for (const statement of program.statements) {
    if (statement.name) commands.push(statement.name)
    if (statement.type === 'for') {
      for (let i = 0; i < statement.iterations; i += 1) {
        for (const command of statement.body) commands.push(command.name)
      }
    }
  }
  return commands
}
