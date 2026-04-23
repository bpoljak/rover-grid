export default function LevelCompleteOverlay({ feedback, levels, onNextLevel, onLevelSelect }) {
  if (!feedback) return null

  const nextLevel = feedback.newlyUnlockedLevel
    ? levels.find(level => level.order === feedback.newlyUnlockedLevel)
    : null

  return (
    <div className="overlay-backdrop">
      <div className="modal complete-modal" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <h2 id="complete-title">Mission Complete</h2>
        {nextLevel ? (
          <p>{nextLevel.name} is now unlocked.</p>
        ) : (
          <p>This level is complete.</p>
        )}
        {feedback.newlyUnlockedFeatures.includes('loops') && (
          <p className="unlock-callout">Loop commands are now unlocked: for and while.</p>
        )}
        <div className="modal-actions">
          {nextLevel && <button className="btn primary" onClick={() => onNextLevel(nextLevel.id)}>Next Level</button>}
          <button className="btn" onClick={onLevelSelect}>Level Select</button>
        </div>
      </div>
    </div>
  )
}
