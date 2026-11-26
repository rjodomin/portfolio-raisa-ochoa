// Comprobación local con el protocolo de Edge/Chromium; sin dependencias extra.
// Arrancar Edge con --remote-debugging-port=9222 y Vite antes de ejecutar.
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { getAmbientMode } from '../src/data/ambient.ts'
import { minimumSceneHeight } from '../src/data/sceneLayout.ts'
import { sleevePlacement } from '../src/data/scene.ts'

for (const [hour, expected] of [[5, 'night'], [6, 'morning'], [10, 'morning'], [11, 'afternoon'], [12, 'afternoon'], [17, 'afternoon'], [18, 'sunset'], [20, 'sunset'], [21, 'night']]) {
  assert.equal(getAmbientMode(new Date(2026, 9, 31, hour)), expected)
}

const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const target = targets.find(item => item.type === 'page')
assert(target, 'Debe existir una pestaña del navegador')
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
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
  const request = pending.get(message.id)
  if (request) {
    pending.delete(message.id)
    if (message.error) request.reject(new Error(JSON.stringify(message.error)))
    else request.resolve(message.result)
  }
})
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
async function closeSelection() {
  await evaluate(`document.querySelector('[aria-label="Cerrar sección y retirar el vinilo"]').click(); new Promise((resolve, reject) => {
    const deadline = Date.now() + 4000;
    const check = () => !document.querySelector('[data-explorer]') ? resolve(true)
      : Date.now() > deadline ? reject(new Error('El panel no se ha cerrado')) : setTimeout(check, 30);
    check();
  })`)
}
async function screenshot(name) {
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`)
  const metrics = await send('Page.getLayoutMetrics')
  const size = metrics.cssContentSize
  const result = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
  })
  await writeFile(`output/qa/${name}.png`, Buffer.from(result.data, 'base64'))
}
async function settleLayout(width, height) {
  // Las unidades de contenedor se recalculan después del resize y del panel.
  // Esperar geometría estable evita leer el fotograma del viewport anterior.
  await evaluate(`new Promise((resolve, reject) => {
    const deadline = Date.now() + 4000;
    let previous = '', stable = 0;
    const check = () => {
      const room = document.querySelector('[data-ambient]');
      const r = room.getBoundingClientRect();
      const available = room.parentElement.getBoundingClientRect();
      const signature = [innerWidth, innerHeight, r.width.toFixed(1), r.height.toFixed(1), r.top.toFixed(1), r.left.toFixed(1)].join(':');
      stable = signature === previous ? stable + 1 : 0;
      previous = signature;
      const fits = ${width} > 900 && ${height} > 600
        ? r.width <= available.width + 1 && r.height <= available.height + 1
        : document.documentElement.scrollWidth <= ${width} + 1;
      if (stable >= 3 && fits && Math.abs(innerWidth - ${width}) <= 1 && Math.abs(innerHeight - ${height}) <= 1) resolve(true);
      else if (Date.now() > deadline) reject(new Error('Layout no estable: ' + signature));
      else setTimeout(check, 32);
    }; check();
  })`)
}
try {
  await mkdir('output/qa', { recursive: true })
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1024, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await evaluate(`new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const check = () => {
      const image = document.querySelector('main img');
      if (image?.complete && image.naturalWidth && document.querySelector('#record-web')) resolve(true);
      else if (Date.now() > deadline) reject(new Error('La escena no ha cargado'));
      else setTimeout(check, 100);
    }; check();
  })`)
  assert.equal(await evaluate(`document.querySelectorAll('[id^="record-"]').length`), 6)
  assert.equal(await evaluate(`document.querySelector('select').value`), 'auto', 'La selección inicial usa la hora local')
  assert.equal(await evaluate(`document.querySelector('[data-ambient]').dataset.ambient`), await evaluate(`(() => { const h = new Date().getHours(); return h < 6 || h >= 21 ? 'night' : h < 11 ? 'morning' : h < 18 ? 'afternoon' : 'sunset'; })()`), 'El ambiente inicial corresponde al dispositivo')
  for (const mode of ['morning', 'afternoon', 'sunset', 'night', 'cloudy']) {
    await evaluate(`document.querySelector('select').value = '${mode}'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
    assert.equal(await evaluate(`document.querySelector('[data-ambient]').dataset.ambient`), mode)
  }
  await evaluate(`document.querySelector('select').value = 'sunset'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  await screenshot('desktop-sunset')
  assert.equal(await evaluate(`[...document.querySelectorAll('[id^="record-"] img')].every(img => img.complete && img.naturalWidth > 0)`), true, 'Carátulas fotográficas cargadas')
  await evaluate(`document.querySelector('select').value = 'cloudy'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true})); new Promise(resolve => setTimeout(resolve, 1100))`)
  await screenshot('desktop-cloudy')
  await evaluate(`document.querySelector('select').value = 'sunset'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  await evaluate(`document.querySelector('#record-web').click()`)
  assert.equal(await evaluate(`document.querySelector('#record-web').getAttribute('aria-pressed')`), 'true')
  assert.match(await evaluate(`document.querySelector('[role="status"]').textContent`), /Proyectos DAW/)
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).animationPlayState`), 'running')
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`)
  const firstAngle = await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).transform`)
  await evaluate(`new Promise(resolve => setTimeout(resolve, 120))`)
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).transform`), firstAngle, 'El vinilo gira realmente entre fotogramas')
  await evaluate(`document.querySelector('[aria-label="Pausar giro del vinilo"]').click()`)
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).animationPlayState`), 'paused')
  await evaluate(`document.querySelector('[aria-label="Luz de la lámpara"]').focus()`)
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  assert.equal(await evaluate(`document.querySelector('[data-lamp]').dataset.lamp`), 'off')
  await evaluate(`document.querySelector('[aria-label="Luz de la lámpara"]').click(); document.querySelector('select').value = 'night'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  assert.equal(await evaluate(`document.querySelector('[data-ambient]').dataset.ambient`), 'night')
  // Esperar la transición visual real antes de capturar.
  await evaluate(`new Promise(resolve => setTimeout(resolve, 1300))`)
  await screenshot('desktop-night')
  await evaluate(`document.querySelector('[aria-label="Luz de la lámpara"]').click(); new Promise(resolve => setTimeout(resolve, 1100))`)
  assert.equal(await evaluate(`document.querySelector('[data-lamp]').dataset.lamp`), 'off')
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-lamp]')).getPropertyValue('--lamp-gain').trim()`), '.55')
  await screenshot('desktop-night-lamp-off')
  await evaluate(`document.querySelector('[aria-label="Luz de la lámpara"]').click()`)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).animationName`), 'none')
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`)
  await evaluate(`document.querySelector('select').value = 'morning'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Sin desbordamiento horizontal en móvil')
  assert.equal(await evaluate(`[...document.querySelectorAll('[id^="record-"]')].every(el => el.getBoundingClientRect().width >= 44 && el.getBoundingClientRect().height >= 44)`), true, 'Carátulas con área táctil suficiente')
  await screenshot('mobile-morning')
  await closeSelection()
  assert.equal(await evaluate(`document.querySelector('#record-web').getAttribute('aria-pressed')`), 'false')
  assert.equal(await evaluate(`document.activeElement.id`), 'record-web')
  for (const width of [320, 760, 768, 1024]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 760 })
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, `Sin desbordamiento a ${width}px`)
  }
  await evaluate(`document.querySelector('[class*="explore"]').click()`)
  assert.equal(await evaluate(`document.activeElement.matches('[data-explorer]')`), true)

  // Matriz solicitada: comprobar ancho Y alto, sin esconder el desbordamiento.
  await closeSelection()
  await evaluate(`document.querySelector('select').value = 'sunset'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  const report = []
  for (const [width, height] of [[2560, 1440], [1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [820, 1180], [768, 1024], [430, 932], [390, 844], [375, 667], [320, 568], [1100, 650], [1200, 480], [700, 500], [1920, 600], [1024, 1366]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 })
    await settleLayout(width, height)
    await evaluate(`window.scrollTo(0, 0)`)
    const layout = await evaluate(`(() => {
      const room = document.querySelector('[data-ambient]');
      const rect = room.getBoundingClientRect();
      const plane = room.querySelector('[data-scene-plane]').getBoundingClientRect();
      const image = room.querySelector('img');
      const footer = document.querySelector('footer').getBoundingClientRect();
      const controls = [...document.querySelectorAll('[id^="record-"], [aria-label="Luz de la lámpara"]')].map(el => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { id: el.id || 'lamp', width: r.width, height: r.height, visible: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, hit: hit?.closest('button') === el };
      });
      return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, room: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }, plane: {left: plane.left, top: plane.top, right: plane.right, bottom: plane.bottom, width: plane.width, height: plane.height}, layout: room.parentElement.dataset.layout, footerBottom: footer.bottom, imageFit: getComputedStyle(image).objectFit, controls };
    })()`)
    assert(layout.documentWidth <= width + 1, `Sin scroll horizontal a ${width}×${height}: ${JSON.stringify(layout)}`)
    const desktop = layout.layout === 'panoramic' || layout.layout === 'compact'
    if (desktop) {
      const fitsViewport = minimumSceneHeight(width) + 32 <= height
      if (fitsViewport) {
        assert(layout.documentHeight <= height + 1, `Sin scroll vertical a ${width}×${height}: ${JSON.stringify(layout)}`)
        assert(layout.footerBottom <= height + 1, 'El pie también cabe')
        assert(layout.controls.every(control => control.visible && control.hit), 'Controles completos y pulsables')
      }
      assert(Math.abs(layout.room.width - layout.documentWidth) < 1, 'La escena llena todo el ancho, sin bandas')
      assert(layout.room.height >= height - 33, 'La escena aprovecha toda la altura disponible')
      assert(Math.abs(layout.plane.width / layout.plane.height - 1.5) < .002, 'El plano fotográfico mantiene 3:2 sin deformarse')
      assert(layout.plane.left <= layout.room.left + 1 && layout.plane.right >= layout.room.right - 1 && layout.plane.top <= layout.room.top + 1 && layout.plane.bottom >= layout.room.bottom - 1, 'La fotografía cubre la escena sin huecos')
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-layout]'), '::before').content`), 'none', 'No hay relleno desenfocado')
      assert(await evaluate(`getComputedStyle(document.querySelector('header')).position`) === 'absolute', 'La poca altura no activa la composición móvil')
      assert(await evaluate(`(() => {
        const plane = document.querySelector('[data-scene-plane]').getBoundingClientRect();
        const scene = document.querySelector('[data-ambient]').getBoundingClientRect();
        return [...document.querySelectorAll('[id^="record-"], [aria-label="Luz de la lámpara"]')].every(el => {
          const r = el.getBoundingClientRect();
          return r.left >= scene.left && r.right <= scene.right + 1 && r.top >= scene.top && r.bottom <= scene.bottom + 1;
        }) && Math.abs(document.querySelector('main img').getBoundingClientRect().width - plane.width) < 1;
      })()`), 'El recorte protege los objetos completos, incluso con scroll en escritorio compacto')
      assert(await evaluate(`(() => {
        const plane = document.querySelector('[data-scene-plane]').getBoundingClientRect();
        const placement = ${JSON.stringify(sleevePlacement)};
        return Object.entries(placement).every(([id, p]) => {
          const r = document.querySelector('#record-' + id).getBoundingClientRect();
          return Math.abs(r.left - (plane.left + plane.width * p.x / 100)) < 1
            && Math.abs(r.top - (plane.top + plane.height * p.y / 100)) < 1
            && Math.abs(r.width - plane.width * p.width / 100) < 1
            && Math.abs(r.height - plane.height * p.height / 100) < 1;
        });
      })()`), 'Las seis carátulas comparten exactamente la proyección de la fotografía')
    } else {
      assert(layout.controls.every(control => control.width >= 44 && control.height >= 44), 'Áreas táctiles de al menos 44 px')
      assert(await evaluate(`getComputedStyle(document.querySelector('[class*="description"]')).fontSize`).then(size => parseFloat(size) >= 15), 'Presentación legible en móvil/tablet vertical')
    }
    await screenshot(`responsive-${width}x${height}`)
    // Abrir información conserva exactamente el tamaño de la escena.
    await evaluate(`document.querySelector('#record-web').click()`)
    await settleLayout(width, height)
    if (desktop && minimumSceneHeight(width) + 32 <= height) {
      assert(await evaluate(`document.documentElement.scrollHeight <= innerHeight + 1`), 'El panel abierto mantiene el ajuste vertical')
      assert(await evaluate(`document.querySelector('[data-ambient]').getBoundingClientRect().bottom <= innerHeight`), 'La escena sigue completa con el panel abierto')
      assert(await evaluate(`Math.abs(document.querySelector('[data-ambient]').getBoundingClientRect().width - ${layout.room.width}) < 1`), 'Abrir el panel no encoge la habitación')
      assert(await evaluate(`['#record-web', '[data-explorer] [aria-label="Apagar lámpara desde el panel"]', '[aria-label="Pausar ambos tocadiscos"]'].every(selector => {
        const element = document.querySelector(selector);
        const r = element.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === element;
      })`), 'El explorador mantiene accesibles la selección, la lámpara y la reproducción')
      if (width === 1280) await screenshot('responsive-1280x720-selected')
    }
    await closeSelection()
    report.push({ viewport: `${width}×${height}`, layout: layout.layout, scene: `${layout.room.width.toFixed(1)}×${layout.room.height.toFixed(1)}`, plane: `${layout.plane.width.toFixed(1)}×${layout.plane.height.toFixed(1)}`, pageHeight: layout.documentHeight, desktopFits: desktop ? layout.documentHeight <= height + 1 : null })
  }
  // Redimensionar conservando la selección y el giro, también entre modos de layout.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await evaluate(`document.querySelector('#record-music').click()`)
  for (const [width, height] of [[1600, 900], [1100, 650], [700, 500], [390, 844], [1920, 1080]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 })
    await settleLayout(width, height)
    assert.equal(await evaluate(`document.querySelector('#record-music').getAttribute('aria-pressed')`), 'true')
    assert.match(await evaluate(`document.querySelector('[role="status"]').textContent`), /Música/)
    const before = await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).transform`)
    await evaluate(`new Promise(resolve => setTimeout(resolve, 120))`)
    assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('[class*="disc"]')).transform`), before, 'El giro sigue activo después de redimensionar')
  }
  await closeSelection()
  // Cada carátula responde a un toque real después de desplazarla al viewport.
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, deviceScaleFactor: 1, mobile: true })
  await settleLayout(320, 568)
  for (const id of ['about', 'web', 'film', 'music', 'cv', 'contact']) {
    const point = await evaluate(`(() => {
      const el = document.querySelector('#record-${id}');
      el.scrollIntoView({block: 'center'});
      const r = el.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2};
    })()`)
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await evaluate(`new Promise(resolve => setTimeout(resolve, 100))`)
    assert.equal(await evaluate(`document.querySelector('#record-${id}').getAttribute('aria-pressed')`), 'true', `Toque en ${id}`)
    await closeSelection()
  }
  await writeFile('output/qa/responsive-report.json', JSON.stringify(report, null, 2))
  console.table(report)
  assert.deepEqual(errors, [], 'Sin excepciones JavaScript')
  console.log('OK: seis discos, selección, giro/pausa, lámpara con teclado, ambiente, movimiento reducido, móvil, CTA y retorno del foco.')
} catch (error) {
  console.error(await evaluate(`JSON.stringify([...document.querySelectorAll('body, #root, main, main > div, [data-ambient]')].map(el => { const c = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName, class: el.className, width: r.width, left: r.left, display: c.display, cssWidth: c.width, container: c.containerType }; }))`))
  await screenshot('responsive-failure')
  throw error
} finally {
  socket.close()
}
