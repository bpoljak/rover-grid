import { BASIC_COMMANDS, BUILTIN_CONDITIONS } from '../engine/commands.js'

const BASIC_HELP = {
  move_forward: {
    syntax: 'move_forward()',
    explanation: 'Move one tile in the direction the rover is facing.',
  },
  turn_left: {
    syntax: 'turn_left()',
    explanation: 'Rotate the rover 90 degrees left without changing tiles.',
  },
  turn_right: {
    syntax: 'turn_right()',
    explanation: 'Rotate the rover 90 degrees right without changing tiles.',
  },
  collect_sample: {
    syntax: 'collect_sample()',
    explanation: 'Collect a sample from the rover current tile when one is present.',
  },
}

export default function HelpBookModal({ unlockedFeatures, onClose }) {
  const loopsUnlocked = unlockedFeatures.includes('loops')

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="modal-header">
          <h2 id="help-title">Help Book</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close help book">x</button>
        </div>

        <div className="help-list">
          {BASIC_COMMANDS.map(command => (
            <div className="help-entry" tabIndex={0} key={command}>
              <div>
                <strong>{BASIC_HELP[command].syntax}</strong>
                <span>{BASIC_HELP[command].explanation}</span>
              </div>
            </div>
          ))}

          {loopsUnlocked && (
            <>
              <div className="help-entry loop-entry" tabIndex={0}>
                <div>
                  <strong>for i in range(N):</strong>
                  <span>Repeat an indented command body a fixed number of times.</span>
                  <code>  move_forward()</code>
                </div>
              </div>
              <div className="help-entry loop-entry" tabIndex={0}>
                <div>
                  <strong>while path_ahead():</strong>
                  <span>Repeat an indented command body while a condition is true.</span>
                  <code>  move_forward()</code>
                </div>
              </div>
              <div className="conditions-list">
                <strong>Conditions</strong>
                {BUILTIN_CONDITIONS.map(condition => <code key={condition}>{condition}</code>)}
                <p>Loop bodies use at least 2 spaces of indentation. Loop bodies can contain basic commands only.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
