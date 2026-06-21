type ManualRecurringSummary = {
  categoryName: string
  nextOccurrence: string | null
}

type DetectedRecurringSummary = {
  categoryName: string | null
  cadence: string
  nextOccurrence: string
}

type GoalSummary = {
  progress: number
}

export function summarizeManualRecurring(items: ManualRecurringSummary[]) {
  return items
    .slice(0, 3)
    .map(
      (item) =>
        `${item.categoryName} (jadwal ${item.nextOccurrence ?? "belum ditentukan"})`
    )
    .join(", ")
}

export function summarizeDetectedRecurring(items: DetectedRecurringSummary[]) {
  if (items.length === 0) {
    return "Belum ada pola recurring terdeteksi"
  }

  return items
    .slice(0, 3)
    .map(
      (item) =>
        `${item.categoryName ?? "Kategori lain"} (${item.cadence}, jatuh tempo ${item.nextOccurrence})`
    )
    .join(", ")
}

export function summarizeGoal(goal: GoalSummary | undefined) {
  return goal
    ? `Ada target aktif dengan progres ${Math.round(goal.progress * 100)}%`
    : "Belum ada target aktif"
}
