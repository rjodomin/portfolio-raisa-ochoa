import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { getAmbientMode } from '../src/data/ambient.ts'
import { browserClient } from './browser-client.mjs'

// Check every minute, including all exact boundaries, using local Date fields.
for (let minute = 0; minute < 1440; minute++) {
  const hour = Math.floor(minute / 60)
  const expected = hour < 6 || hour >= 21 ? 'night' : hour < 11 ? 'morning' : hour < 18 ? 'afternoon' : 'sunset'
  assert.equal(getAmbientMode(new Date(2026, 10, 5, hour, minute % 60)), expected)
}

const b = await browserClient()
const { send, evaluate, until } = b
const report = []
async function check(name, preference, mode) {
  await until(`document.querySelector('select')?.value === '${preference}' && document.querySelector('main [data-ambient]')?.dataset.ambient === '${mode}'`)
  report.push({ check: name, preference, mode })
}
async function select(value) {
  await evaluate(`document.querySelector('select').value = '${value}'; document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}))`)
}
async function resources(expected) {
  assert.deepEqual(await evaluate(`({timers: __ambientTest.timers.size, visibility: __ambientTest.visibility.size, focus: __ambientTest.focus.size})`),
    { timers: expected, visibility: expected, focus: expected }, 'Intervalo y listeners: sin duplicados y con limpieza al pasar a manual')
}
let injection
try {
  await mkdir('output/qa', { recursive: true })
  await send('Page.enable')
  await send('Runtime.enable')
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    (() => {
      const NativeDate = Date;
      const state = window.__ambientTest = {
        now: new NativeDate(2026, 10, 5, 10, 59).getTime(), visible: true,
        timers: new Map(), visibility: new Set(), focus: new Set(),
        setClock(hour, minute = 0) { this.now = new NativeDate(2026, 10, 5, hour, minute).getTime(); },
        tick() { this.timers.forEach(callback => callback()); }
      };
      window.Date = class extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [state.now])); }
        static now() { return state.now; }
      };
      Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => state.visible ? 'visible' : 'hidden'});
      const setIntervalNative = window.setInterval.bind(window);
      const clearIntervalNative = window.clearInterval.bind(window);
      window.setInterval = (callback, delay, ...args) => {
        const id = setIntervalNative(callback, delay, ...args);
        if (delay === 60000) state.timers.set(id, () => callback(...args));
        return id;
      };
      window.clearInterval = id => { state.timers.delete(id); clearIntervalNative(id); };
      for (const [target, type, listeners] of [[document, 'visibilitychange', state.visibility], [window, 'focus', state.focus]]) {
        const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
        target.addEventListener = (name, listener, options) => { if (name === type) listeners.add(listener); return add(name, listener, options); };
        target.removeEventListener = (name, listener, options) => { if (name === type) listeners.delete(listener); return remove(name, listener, options); };
      }
    })();
  ` })
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await check('Primera carga a las 10:59', 'auto', 'morning')
  await until(`__ambientTest.timers.size === 1`)
  await resources(1)
  assert.match(await evaluate(`document.querySelector('#ambient-current').textContent`), /Automático.*Mañana/)
  await evaluate(`__ambientTest.setClock(11); __ambientTest.tick()`)
  await check('Cambio horario por intervalo a las 11:00', 'auto', 'afternoon')
  await evaluate(`document.querySelector('#record-web').click()`)
  await until(`!!document.querySelector('[data-explorer]')`)
  assert.equal(await evaluate(`document.querySelector('[data-explorer]').dataset.ambient`), 'afternoon', 'El explorador recibe el mismo ambiente')

  await select('night')
  await check('Selección manual', 'night', 'night')
  await resources(0)
  await evaluate(`__ambientTest.setClock(6); __ambientTest.tick(); window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange'))`)
  await check('La hora y el foco no sobrescriben el manual', 'night', 'night')
  await select('cloudy')
  await check('Nublado manual', 'cloudy', 'cloudy')
  await select('auto')
  await check('Volver a automático recalcula sin esperar al intervalo', 'auto', 'morning')
  await until(`__ambientTest.timers.size === 1`)
  await resources(1)
  await evaluate(`__ambientTest.setClock(18); window.dispatchEvent(new Event('focus'))`)
  await check('Recuperar foco a las 18:00', 'auto', 'sunset')
  await evaluate(`__ambientTest.visible = false; __ambientTest.setClock(21); __ambientTest.tick(); document.dispatchEvent(new Event('visibilitychange'))`)
  await check('La pestaña oculta no actualiza innecesariamente', 'auto', 'sunset')
  await evaluate(`__ambientTest.visible = true; document.dispatchEvent(new Event('visibilitychange'))`)
  await check('Volver a pestaña visible a las 21:00', 'auto', 'night')
  assert.equal(await evaluate(`document.querySelector('[data-explorer]').dataset.ambient`), 'night')

  for (const [hour, mode] of [[22, 'night'], [12, 'afternoon']]) {
    await evaluate(`__ambientTest.setClock(${hour}); __ambientTest.tick()`)
    await check('Lámpara independiente en ' + mode, 'auto', mode)
    await evaluate(`document.querySelector('[aria-label="Apagar lámpara desde el panel"]').click()`)
    assert.equal(await evaluate(`document.querySelector('[data-lamp]').dataset.lamp`), 'off')
    assert.equal(await evaluate(`document.querySelector('main [data-ambient]').dataset.ambient`), mode)
    await evaluate(`document.querySelector('[aria-label="Encender lámpara desde el panel"]').click()`)
    assert.equal(await evaluate(`document.querySelector('[data-lamp]').dataset.lamp`), 'on')
  }
  for (const mode of ['morning', 'afternoon', 'sunset', 'night', 'cloudy']) {
    await select(mode)
    await check('Opción manual ' + mode, mode, mode)
    await resources(0)
  }
  await select('auto')
  await check('Reactivación final', 'auto', 'afternoon')
  await resources(1)
  assert.deepEqual(b.errors, [], 'Sin errores de renderizado')
  await writeFile('output/qa/ambient-report.json', JSON.stringify(report, null, 2))
  console.table(report)
  console.log('OK: 1440 minutos, inicio automático, intervalo, foco/visibilidad, manual, reactivación, lámpara independiente y limpieza de recursos.')
} finally {
  if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier })
  // Restore the actual clock before other browser checks reuse the same tab.
  await send('Page.navigate', { url: 'about:blank' })
  b.close()
}
