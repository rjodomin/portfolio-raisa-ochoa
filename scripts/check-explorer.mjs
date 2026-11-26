import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { browserClient } from './browser-client.mjs'

const browser = await browserClient()
const { send, evaluate, until, screenshot, errors } = browser
const wait = milliseconds => evaluate(`new Promise(resolve => setTimeout(resolve, ${milliseconds}))`)
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
const active = () => evaluate(`document.querySelector('[data-project][aria-pressed="true"]').dataset.project`)
async function closePanel() {
  await click('[aria-label="Cerrar sección y retirar el vinilo"]')
  await until(`!document.querySelector('[data-explorer]')`)
}
async function key(key, code, keyCode) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode })
}
async function point(selector) {
  return evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    el.scrollIntoView({block: 'nearest', inline: 'nearest'});
    const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 };
  })()`)
}
async function tap(selector) {
  const p = await point(selector)
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] })
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await wait(100)
}
async function assertBoth(state) {
  assert.deepEqual(await evaluate(`[
    getComputedStyle(document.querySelector('main [class*="disc"]')).animationPlayState,
    getComputedStyle(document.querySelector('[data-mini-disc]')).animationPlayState
  ]`), [state, state], 'Los dos tocadiscos comparten reproducción')
}

try {
  await mkdir('output/qa', { recursive: true })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await until(`document.querySelector('#record-web') && document.querySelector('main img')?.complete`)
  const before = await evaluate(`document.querySelector('[data-scene-plane]').getBoundingClientRect().toJSON()`)
  await click('#record-web')
  await until(`document.querySelector('[data-project="aula-circular"]') && document.activeElement.matches('[data-explorer]')`)
  await wait(450)
  assert.deepEqual(await evaluate(`document.querySelector('[data-scene-plane]').getBoundingClientRect().toJSON()`), before, 'Abrir no modifica la escena')
  assert.equal(await evaluate(`document.querySelector('[data-explorer]').parentElement === document.body`), true, 'El panel no hereda la escala ni el recorte fotográfico')
  assert.equal(await evaluate(`document.querySelectorAll('[data-project]').length`), 3)
  assert.equal(await active(), 'aula-circular')
  await assertBoth('running')
  const angle = await evaluate(`getComputedStyle(document.querySelector('[data-mini-disc]')).transform`)
  await wait(120)
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('[data-mini-disc]')).transform`), angle)
  await click('[aria-label="Pausar ambos tocadiscos"]')
  await assertBoth('paused')
  await click('[aria-label="Reanudar giro del vinilo"]')
  await assertBoth('running')
  await click('[aria-label="Carátula siguiente"]')
  assert.equal(await active(), 'framework')
  assert.match(await evaluate(`document.querySelector('[data-explorer] h3').textContent`), /FRAMEWORK/)
  await click('[aria-label="Proyecto siguiente"]')
  assert.equal(await active(), 'portfolio')
  assert.match(await evaluate(`document.querySelector('[role="status"]').textContent`), /Portfolio interactivo/)
  await click('[aria-label="Ir a Aula Circular"]')
  assert.equal(await active(), 'aula-circular')
  await evaluate(`document.querySelector('[data-project="aula-circular"]').focus()`)
  await key('ArrowRight', 'ArrowRight', 39)
  assert.equal(await active(), 'framework')
  assert.equal(await evaluate(`document.activeElement.dataset.project`), 'framework')
  await key('End', 'End', 35)
  assert.equal(await active(), 'portfolio')
  await click('[data-open-detail]')
  await until(`document.querySelector('dialog')?.open`)
  assert.match(await evaluate(`document.querySelector('dialog').textContent`), /React/)
  assert.equal(await evaluate(`document.querySelectorAll('dialog a').length`), 0, 'No hay enlaces inventados')
  assert.equal(await evaluate(`!!document.activeElement.closest('dialog')`), true, 'El diálogo recibe el foco')
  await screenshot('explorer-detail-portfolio')
  await key('Escape', 'Escape', 27)
  await until(`!document.querySelector('dialog')`)
  assert.equal(await evaluate(`!!document.querySelector('[data-explorer]')`), true, 'Escape en ficha no cierra la colección')
  await click('[data-open-catalogue]')
  await until(`document.querySelector('dialog')?.open`)
  assert.equal(await evaluate(`document.querySelectorAll('dialog li button').length`), 3)
  await screenshot('explorer-catalogue')
  await evaluate(`document.querySelector('dialog li button').click()`)
  await until(`document.querySelector('dialog').textContent.includes('Contenido provisional')`)
  assert.equal(await active(), 'aula-circular')
  await click('[aria-label="Cerrar ficha"]')
  await until(`!document.querySelector('dialog')`)
  for (const mode of ['morning', 'afternoon', 'cloudy', 'sunset', 'night', 'auto']) {
    await evaluate(`document.querySelector('select').value = '${mode}'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
    assert.equal(await evaluate(`document.querySelector('[data-explorer]').dataset.ambient === document.querySelector('main [data-ambient]').dataset.ambient`), true)
  }
  await evaluate(`document.querySelector('select').value = 'night'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  await click('[aria-label="Apagar lámpara desde el panel"]')
  assert.equal(await evaluate(`document.querySelector('[data-lamp]').dataset.lamp`), 'off')
  await wait(1100)
  await screenshot('explorer-night-lamp-off')
  await click('[aria-label="Encender lámpara desde el panel"]')
  await evaluate(`document.querySelector('select').value = 'sunset'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
  await wait(1100)

  const report = []
  for (const [width, height] of [[2560,1440],[1920,1080],[1600,900],[1366,768],[1280,720],[1024,768],[820,1180],[768,1024],[430,932],[390,844],[375,667],[320,568],[1200,480]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 })
    await wait(450)
    await evaluate(`window.scrollTo(0,0); document.querySelector('[data-explorer]').scrollTop = 0`)
    const layout = await evaluate(`(() => {
      const panel = document.querySelector('[data-explorer]');
      const r = panel.getBoundingClientRect();
      const cover = panel.querySelector('[data-project]').getBoundingClientRect();
      return { viewport: innerWidth + '×' + innerHeight, pageWidth: document.documentElement.scrollWidth,
        panel: { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom },
        cover: {width:cover.width,height:cover.height}, font: parseFloat(getComputedStyle(panel.querySelector('h3')).fontSize),
        scroll: panel.scrollHeight > panel.clientHeight, mini: !!panel.querySelector('[data-mini-disc]') };
    })()`)
    assert(layout.pageWidth <= width + 1, `Sin scroll horizontal: ${JSON.stringify(layout)}`)
    assert(layout.panel.x >= 0 && layout.panel.y >= 0 && layout.panel.right <= width + 1 && layout.panel.bottom <= height + 1, 'El panel completo cabe en viewport')
    assert(layout.cover.width >= 140 && Math.abs(layout.cover.width - layout.cover.height) < 1, 'Carátulas cuadradas y legibles')
    assert(layout.font >= 15, 'Texto independiente del escalado de la habitación')
    if (width > 1000) assert(layout.panel.width >= width * .7, 'Panel con presencia, al menos 70% del viewport')
    assert(layout.mini)
    await screenshot(`explorer-${width}x${height}`)
    await assertBoth('running')
    report.push(layout)
  }
  // Touch: select directly, then swipe the horizontal track rather than the page.
  await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true })
  await wait(450)
  await tap('[aria-label="Carátula siguiente"]')
  assert.equal(await active(), 'framework')
  await tap('[data-project="portfolio"]')
  assert.equal(await active(), 'portfolio')
  await tap('[aria-label="Ir a Aula Circular"]')
  await wait(450)
  const start = await point('[data-project="aula-circular"]')
  await send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[start] })
  for (let i=1; i<=8; i++) {
    await send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:start.x-i*18,y:start.y}] })
    await wait(20)
  }
  await send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] })
  await wait(850)
  assert.notEqual(await active(), 'aula-circular', 'El swipe actualiza la selección')
  await tap('[aria-label="Pausar ambos tocadiscos"]')
  await assertBoth('paused')
  // Reduced motion stops both rotations without changing playback state.
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] })
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-mini-disc]')).animationName`), 'none')
  await closePanel()
  assert.equal(await evaluate(`document.activeElement.id`), 'record-web')
  for (const id of ['about','film','music','cv','contact','web']) {
    await click(`#record-${id}`)
    assert.equal(await evaluate(`document.querySelector('#record-${id}').getAttribute('aria-pressed')`), 'true')
    assert.equal(await evaluate(`document.querySelectorAll('[data-explorer]').length`), 1, 'Una sola selección de sección')
    await key('Escape','Escape',27)
    await until(`!document.querySelector('[data-explorer]')`)
    assert.equal(await evaluate(`document.activeElement.id`), `record-${id}`)
  }
  assert.equal(await evaluate(`document.querySelectorAll('audio, video').length`), 0, 'No se reproduce audio automáticamente')
  assert.deepEqual(errors, [], 'Sin excepciones JavaScript')
  await writeFile('output/qa/explorer-report.json', JSON.stringify(report,null,2))
  console.table(report.map(item => ({viewport:item.viewport,panel:`${item.panel.width.toFixed(0)}×${item.panel.height.toFixed(0)}`,internalScroll:item.scroll})))
  console.log('OK: carátulas, catálogo, ficha, flechas, indicadores, teclado, toque/swipe, sincronización, luces, resize, cierre/foco y movimiento reducido.')
} catch(error) {
  await screenshot('explorer-failure')
  throw error
} finally { browser.close() }
