// Convierte recursos locales a WebP con Canvas en el navegador de QA ya abierto.
// No cambia la composición; reduce el peso y el tamaño de entrega de las carátulas.
import { access, writeFile } from 'node:fs/promises'
import { sleevePlacement } from '../src/data/scene.ts'

const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.addEventListener('message', event => {
  const response = JSON.parse(event.data)
  if (pending.has(response.id)) {
    pending.get(response.id)(response)
    pending.delete(response.id)
  }
})
function send(method, params) {
  return new Promise(resolve => {
    pending.set(++id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })
}
try {
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  for (const [name, width] of [['reference-room', 1536], ['reference-day', 1536], ['reference-cloudy', 1536], ['reference-night', 1536], ['reference-lamp-off', 1536]]) {
    try { await access(`src/assets/${name}.png`) } catch { continue }
    const expression = `(async () => {
      const image = new Image();
      image.src = '/src/assets/${name}.png';
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = ${width};
      canvas.height = Math.round(image.naturalHeight * ${width} / image.naturalWidth);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', .86).split(',')[1];
    })()`
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (response.error || response.result.exceptionDetails) throw new Error(JSON.stringify(response.error ?? response.result.exceptionDetails))
    const bytes = Buffer.from(response.result.result.value, 'base64')
    await writeFile(`src/assets/${name}.webp`, bytes)
    console.log(`${name}.webp: ${Math.round(bytes.length / 1024)} KiB`)
  }
  for (const variant of ['room', 'day', 'cloudy', 'night']) {
  for (const [section, placement] of Object.entries(sleevePlacement)) {
    const expression = `(async () => {
      const image = new Image();
      image.src = '/src/assets/reference-${variant}.png';
      await image.decode();
      const canvas = document.createElement('canvas');
      const p = ${JSON.stringify(placement)};
      const width = image.naturalWidth * p.width / 100;
      const height = image.naturalHeight * p.height / 100;
      canvas.width = Math.round(width * 2);
      canvas.height = Math.round(height * 2);
      canvas.getContext('2d').drawImage(image, image.naturalWidth * p.x / 100, image.naturalHeight * p.y / 100, width, height, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', .94).split(',')[1];
    })()`
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (response.error || response.result.exceptionDetails) throw new Error(JSON.stringify(response.error ?? response.result.exceptionDetails))
    const bytes = Buffer.from(response.result.result.value, 'base64')
    const filename = variant === 'room' ? `sleeve-${section}` : `sleeve-${variant}-${section}`
    await writeFile(`src/assets/${filename}.webp`, bytes)
    console.log(`${filename}.webp: ${Math.round(bytes.length / 1024)} KiB`)
  }
  }
} finally {
  socket.close()
}
