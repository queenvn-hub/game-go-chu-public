export function appendScreenResult(previous, result) {
  const next = { ...result };
  for (const key of ['score', 'completed', 'correctUnits', 'correctCharacters', 'attempts', 'mistakes', 'shots', 'elapsed']) {
    next[key] = Number(previous?.[key] || 0) + Number(result[key] || 0);
  }
  next.maxCombo = Math.max(previous?.maxCombo || 0, result.maxCombo || 0);
  next.durationMs = next.elapsed * 1000;
  next.accuracy = next.attempts ? Math.round(next.correctUnits / next.attempts * 100) : 100;
  next.wpm = Math.round((next.correctUnits / 5) / Math.max(1 / 60, next.elapsed / 60));
  next.shotsMatchCharacters = next.shots === next.correctCharacters;
  return next;
}
