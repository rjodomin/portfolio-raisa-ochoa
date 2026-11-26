// Small CDP client for local browser QA; uses Node's built-in WebSocket.
import { writeFile } from 'node:fs/promises'

export async function browserClient() {
  const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
  const target = targets.find(item => item.type === 'page')
  if (!target) throw new Error('No hay una pestaña de Edge/Chromium en el puerto 9222')
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map()
  const errors = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
    const request = pending.get(message.id)
    if (request) {
      pending.delete(message.id)
      clearTimeout(request.timeout)
      if (message.error) request.reject(new Error(JSON.stringify(message.error)))
      else request.resolve(message.result)
    }
  })
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)) }, 20_000)
      pending.set(id, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }
  async function until(expression) {
    const deadline = Date.now() + 6000
    while (!await evaluate(expression)) {
      if (Date.now() > deadline) throw new Error(`No se cumple: ${expression}`)
      await new Promise(resolve => setTimeout(resolve, 40))
    }
  }
  async function screenshot(name) {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(`output/qa/${name}.png`, Buffer.from(result.data, 'base64'))
  }
  return { send, evaluate, until, screenshot, errors, close: () => socket.close() }
}
