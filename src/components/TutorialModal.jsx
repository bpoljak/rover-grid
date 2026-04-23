const TUTORIALS = {
  level1_welcome: {
    title: 'Welcome to Rover',
    body: 'This is a coding puzzle game. Write commands to control the rover and solve the mission shown on the grid.',
  },
  level4_loops: {
    title: 'Loops Unlocked',
    body: 'Loops are now available. Use for when you know the repeat count, and while when the rover should continue while a condition stays true.',
  },
}

export default function TutorialModal({ tutorialId, onDismiss }) {
  const tutorial = TUTORIALS[tutorialId]
  if (!tutorial) return null

  return (
    <div className="overlay-backdrop">
      <div className="modal tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <h2 id="tutorial-title">{tutorial.title}</h2>
        <p>{tutorial.body}</p>
        <button className="btn primary" onClick={onDismiss}>Start Mission</button>
      </div>
    </div>
  )
}
