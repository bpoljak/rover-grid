export const PROGRESS_STORAGE_KEY = 'rover.progress.v2.2'
export const INITIAL_PROGRESS = {
  highestUnlockedLevel: 1,
  completedLevels: [],
  unlockedFeatures: [],
  seenTutorials: [],
}

function storageAvailable() {
  return typeof window !== 'undefined' && window.localStorage
}

function normalizeProgress(value) {
  return {
    highestUnlockedLevel: Number.isFinite(value?.highestUnlockedLevel)
      ? Math.max(1, value.highestUnlockedLevel)
      : INITIAL_PROGRESS.highestUnlockedLevel,
    completedLevels: Array.isArray(value?.completedLevels) ? value.completedLevels : [],
    unlockedFeatures: Array.isArray(value?.unlockedFeatures) ? value.unlockedFeatures : [],
    seenTutorials: Array.isArray(value?.seenTutorials) ? value.seenTutorials : [],
  }
}

export function loadProgress() {
  if (!storageAvailable()) return { ...INITIAL_PROGRESS }

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    return raw ? normalizeProgress(JSON.parse(raw)) : { ...INITIAL_PROGRESS }
  } catch {
    return { ...INITIAL_PROGRESS }
  }
}

export function saveProgress(progressionState) {
  if (!storageAvailable()) return false
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progressionState)))
  return true
}

export function resetProgress() {
  if (storageAvailable()) window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
  return { ...INITIAL_PROGRESS }
}

export function completeLevel(levelId, levelOrder, progressionState) {
  const completedLevels = progressionState.completedLevels.includes(levelId)
    ? progressionState.completedLevels
    : [...progressionState.completedLevels, levelId]

  const previouslyUnlocked = progressionState.highestUnlockedLevel
  const highestUnlockedLevel = Math.max(previouslyUnlocked, levelOrder + 1)
  const newlyUnlockedFeatures = []
  let unlockedFeatures = progressionState.unlockedFeatures

  if (levelOrder === 3 && !unlockedFeatures.includes('loops')) {
    unlockedFeatures = [...unlockedFeatures, 'loops']
    newlyUnlockedFeatures.push('loops')
  }

  const nextProgress = {
    ...progressionState,
    highestUnlockedLevel,
    completedLevels,
    unlockedFeatures,
  }

  saveProgress(nextProgress)

  return {
    progressionState: nextProgress,
    newlyUnlockedLevel: highestUnlockedLevel > previouslyUnlocked ? levelOrder + 1 : null,
    newlyUnlockedFeatures,
  }
}

export function shouldShowTutorial(tutorialId, progressionState) {
  return Boolean(tutorialId && !progressionState.seenTutorials.includes(tutorialId))
}

export function markTutorialSeen(tutorialId, progressionState) {
  if (!tutorialId || progressionState.seenTutorials.includes(tutorialId)) return progressionState

  const nextProgress = {
    ...progressionState,
    seenTutorials: [...progressionState.seenTutorials, tutorialId],
  }
  saveProgress(nextProgress)
  return nextProgress
}
