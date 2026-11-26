// Reference: 1536 × 1024. Safety bounds include sleeves, platter and lamp.
// Reserve 84 px above the sleeves for navigation and 28 px below the lamp.
export const sceneBounds = { left: .48, right: .965, top: .145, bottom: .81 }
export const minimumSceneHeight = (width: number) =>
  Math.max(560, width / 1.5 * (sceneBounds.bottom - sceneBounds.top) + 112)

export function projectScene(width: number, height: number) {
  const scale = Math.max(width / 1536, height / 1024)
  const planeWidth = 1536 * scale
  const planeHeight = 1024 * scale
  const clamp = (value: number, lower: number, upper: number) =>
    Math.max(lower, Math.min(value, upper))
  return {
    width: planeWidth,
    height: planeHeight,
    left: clamp((width - planeWidth) / 2,
      Math.max(width - planeWidth, 12 - sceneBounds.left * planeWidth),
      Math.min(0, width - 12 - sceneBounds.right * planeWidth)),
    top: clamp((height - planeHeight) / 2,
      Math.max(height - planeHeight, 84 - sceneBounds.top * planeHeight),
      Math.min(0, height - 28 - sceneBounds.bottom * planeHeight)),
  }
}
