export const ambientModes = [
  { id: 'morning', label: 'Mañana', symbol: '◔' },
  { id: 'afternoon', label: 'Día', symbol: '☀' },
  { id: 'sunset', label: 'Atardecer', symbol: '◒' },
  { id: 'night', label: 'Noche', symbol: '☾' },
  { id: 'cloudy', label: 'Nublado', symbol: '☁' },
] as const

export type AmbientMode = (typeof ambientModes)[number]['id']
export type AmbientPreference = AmbientMode | 'auto'

// Local device hours. Ordered boundaries also cover the night across midnight.
export const ambientSchedule: ReadonlyArray<{ fromHour: number; mode: AmbientMode }> = [
  { fromHour: 0, mode: 'night' },
  { fromHour: 6, mode: 'morning' },
  { fromHour: 11, mode: 'afternoon' },
  { fromHour: 18, mode: 'sunset' },
  { fromHour: 21, mode: 'night' },
]

export function getAmbientMode(date = new Date()): AmbientMode {
  const hour = date.getHours()
  let mode: AmbientMode = 'night'
  for (const period of ambientSchedule) {
    if (hour < period.fromHour) break
    mode = period.mode
  }
  return mode
}
