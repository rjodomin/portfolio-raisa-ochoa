# Portfolio de Raisa Ochoa

React + TypeScript + Vite. Homepage construida a partir de la referencia visual
aportada: ventana urbana al atardecer, sofá oliva con gato y auriculares, plantas,
mesa redonda, estantes con seis vinilos, tocadiscos y lámpara ondulada.

## Desarrollo

Comprobado con Node.js 24.21.0 y npm 11.19.0.

```sh
npm install
npm run dev
npm run build
npm run lint
```

Abre la URL indicada por Vite, normalmente http://localhost:5173. Ctrl+C detiene
el servidor. `build` comprueba TypeScript y genera dist/. `npm run preview` sirve
esa compilación localmente; no publica el proyecto.

## Composición y componentes

El interior conserva el encuadre y los objetos físicos de la referencia. Se ha
preparado una base fotográfica sin navegación, presentación ni etiquetas impresas.
Estos elementos son HTML real, accesible e independiente de la imagen.

- `HomePage`: selección, pausa, lámpara y preferencia de ambiente.
- `Introduction`: nombre, presentación, párrafo y CTA con jerarquía de la referencia.
- `AmbientScene`: capas fotográficas y transiciones globales de luz.
- `AmbientControls`: selector discreto con icono de sol en la esquina superior.
- `RecordShelf` / `VinylCover`: botones sobre los seis vinilos de la referencia.
- `Turntable`: disco animado registrado sobre el tocadiscos fotográfico.
- `Lamp`: botón sobre la lámpara fotografiada; controla su imagen y la luz global.
- `SelectionPanel`: explorador de colecciones con carátulas, mini tocadiscos y fichas.

`src/data/scene.ts` define las coordenadas porcentuales de las seis carátulas en
un lienzo de 1536 × 1024. `scripts/optimize-assets.mjs` obtiene los recortes de cada
ambiente con Canvas y los comprime a WebP. Las carátulas coinciden con la imagen
en reposo y se elevan ligeramente en hover/selección. El material del disco y la
tapa translúcida pertenecen a la fotografía; la capa que gira es CSS.

No hay dependencias nuevas. Las versiones PNG originales y los recursos de la
iteración anterior se conservan; Vite solo entrega los WebP importados.
Los prompts de la herramienta image_gen están en `src/assets/reference.prompts.txt`.

## Interacciones

Tab recorre los botones y Enter/Espacio los activan. `aria-pressed` expresa la
selección y la luz; una región de estado anuncia el disco. El CTA selecciona
Proyectos DAW y lleva el foco al explorador. Cerrar el panel retira la selección
y devuelve el foco. El giro se pausa manteniendo el ángulo, y se desactiva con
`prefers-reduced-motion`. La reproducción es visual, sin audio.

En móvil, la presentación precede a una versión recortada por la derecha de la
misma escena. Las coordenadas de los controles se transforman con el mismo factor
de recorte para seguir coincidiendo con los objetos físicos. El escritorio
conserva el sofá, el gato y la composición completa.

## Iluminación

El estado inicial es Hora local · automático. El selector ofrece mañana,
tarde/día, atardecer, noche y nublado, además de hora local automática. Las imágenes
alternativas conservan el encuadre y cambian la vista urbana, el cielo y la luz
interior. Las carátulas usan también recortes propios de cada ambiente.

La lámpara apagada tiene una variante fotográfica que se mezcla solo en su región;
se retira el resplandor cálido y se reduce la luz global, especialmente de noche.
Las transiciones respetan la preferencia de movimiento reducido.

El modo automático usa `new Date()` y la zona horaria local del dispositivo:
06:00–10:59 mañana; 11:00–17:59 día; 18:00–20:59 atardecer; 21:00–05:59 noche.
Los límites están centralizados en `ambientSchedule`, en `src/data/ambient.ts`.
Se actualiza cada minuto mientras la pestaña está visible y también al recuperar
foco o visibilidad. Elegir un ambiente manual detiene el intervalo y elimina los
listeners; volver a automático consulta la hora inmediatamente y reactiva la
sincronización. React conserva el estado si el ambiente calculado no cambia.
Habitación y explorador comparten el mismo ambiente; la lámpara conserva su estado
independiente. El selector anuncia «Automático · [ambiente]». Son intervalos editoriales,
no un cálculo astronómico. Nublado es una selección visual manual: todavía no
hay API meteorológica ni acceso a ubicación.

`node scripts/check-ambient.mjs` comprueba los 1440 minutos del día y simula
el reloj en Edge/Chromium para verificar el inicio automático, cambios horarios,
foco/visibilidad, selección manual, retorno a automático, lámpara independiente y
limpieza de intervalo/listeners, incluido StrictMode. Requiere Vite y el navegador
local de depuración descrito abajo. Guarda `output/qa/ambient-report.json` y restaura
el reloj real antes de que otros scripts reutilicen la pestaña.

## Verificación de navegador

Con Vite en http://127.0.0.1:5173 y Edge/Chromium en modo de depuración local
`--remote-debugging-port=9222`, ejecuta:

```sh
node scripts/check-browser.mjs
```

Comprueba seis carátulas, carga de recursos, selección, pausa, teclado, retorno
del foco, CTA, ambientes, movimiento reducido y desbordamiento responsive.
Las capturas quedan en `output/qa/`, excluido de Git junto al perfil temporal
`.browser-check/`. Ambas carpetas están excluidas de la vigilancia de Vite.

Consulta AGENTS.md y .codex/config.toml para las reglas del proyecto.

## Ajuste inmersivo al viewport

La escena visible llena todo el ancho y alto disponibles después del pie. Ya no
se limita su anchura con `min(ancho, alto × 1.5)` ni se añaden bandas desenfocadas.
Se conservan los mismos recursos fotográficos, colores y objetos.

### Dos capas y una proyección compartida

`ResponsiveScene` observa el contenedor real mediante `ResizeObserver` y expone
las dimensiones y el desplazamiento del plano físico. `sceneLayout.ts` calcula
una escala uniforme `max(ancho / 1536, alto / 1024)` y limita el desplazamiento
para proteger los objetos interactivos. La fotografía llena ese plano sin
cambiar su proporción; no depende de un `object-fit: cover` desconectado de los
controles. El observador se desconecta al desmontarse.

`AmbientScene` coloca todas las fotografías, la máscara de la lámpara, las luces,
las seis carátulas y el tocadiscos en `physicalPlane`. Comparten ancho, alto,
traslación y coordenadas porcentuales. La escena exterior recorta el perímetro
decorativo. La navegación, presentación y selector ambiental son HTML independiente,
sin escalado global; la presentación acompaña el desplazamiento horizontal de la
pared. Cambiar de ambiente o apagar la lámpara conserva exactamente la proyección.

Los límites protegidos están definidos en `sceneLayout.ts`: se reservan 84 px por
encima de las carátulas y 28 px por debajo de la lámpara. La altura mínima se deriva
de esos límites y del ancho real del contenedor, con un mínimo de 560 px para la
presentación. Al abrir contenido, el explorador se superpone mediante un portal
al viewport y no modifica la proyección. Los controles de lámpara y reproducción
están también disponibles en el panel cuando cubre los objetos inferiores.

### Composiciones

- Escritorio panorámico: imagen nítida hasta los bordes, con recorte controlado
  principalmente arriba y abajo. Estantería, lámpara y plato permanecen completos.
- Escritorio compacto: mantiene la misma habitación y presentación a la izquierda.
  Si falta altura, la altura mínima produce scroll vertical; una ventana baja no
  activa la composición móvil. En 1200×480 y 1920×600 este scroll es intencional.
- Tablet: hasta 900 px de ancho o en ventanas con proporción de 23:20 o inferior,
  navegación y presentación preceden a la habitación. Se conserva el recorte de la
  parte derecha y el mapa de coordenadas móvil existente.
- Móvil: hasta 600 px, el mismo flujo vertical con tipografía y controles táctiles.
  Se permite scroll vertical y el pie puede envolver sus textos.

No se oculta el desbordamiento horizontal del documento. El recorte se realiza
exclusivamente en el marco fotográfico, con todos los objetos usando su proyección.

### Validación local

Con Vite y Edge en depuración local, `node scripts/check-browser.mjs` comprueba:
2560×1440, 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 1024×768,
820×1180, 768×1024, 430×932, 390×844, 375×667, 320×568, 1100×650,
1200×480, 700×500, 1920×600 y 1024×1366.

Verifica cobertura del marco sin bandas, proporción del plano, geometría exacta
de las seis carátulas, controles completos, pulsación, ausencia de scroll horizontal,
altura de escritorio, panel abierto, teclado, foco, ambientes, giro y pausa, movimiento
reducido, giro activo tras redimensionar y toques en las seis carátulas. Guarda
capturas y medidas en `output/qa/responsive-*.png` y `responsive-report.json`.

Se cambia repetidamente el viewport de una misma pestaña de Edge mediante CDP.
Esto no es una prueba en Safari/iOS ni en dispositivos físicos, ni un arrastre
manual de una ventana. `npm run build` y `npm run lint` completan los controles.

### Límites de la fotografía actual

Llenar otras proporciones con la misma foto sin deformación requiere recortar el
perímetro. En panorámico se ve menos decoración superior y mesa inferior; en
portrait se conserva el recorte lateral móvil. La ventana, el sofá, los seis
vinilos, el plato y la lámpara siguen presentes en escritorio. No se han generado
extensiones de imagen ni cambiado los recursos para inventar más habitación.

Las interacciones existentes se mantienen: elevación de carátulas al seleccionar,
aparición del disco, giro/pausa y luces. No existía una secuencia animada de vuelo
del disco ni movimiento del brazo; esta corrección responsive no la implementa.
## Explorador de proyectos en vinilo

Al seleccionar una de las seis carátulas de la estantería, `HomePage` guarda una
única selección `{ record, entryId }` y activa el giro. Tanto el tocadiscos principal
como `MiniVinylPlayer` reciben el mismo booleano `playing`; cambiar de proyecto
actualiza el color de ambos discos y la información del panel, sin reiniciar ni
desincronizar la reproducción. No hay audio ni llamadas a servicios externos.
La hora ambiental se resuelve una sola vez en HomePage y se comparte con la escena
y el panel, incluido el modo automático.

`SelectionPanel` usa `createPortal(document.body)` para quedar fuera del plano
fotográfico y de sus contenedores. Es un panel fijo del 82 % del ancho (máximo
1900 px), con tres zonas, fondo cálido translúcido y `backdrop-filter`, y fondo más
opaco como alternativa. De noche aumenta la opacidad para conservar el contraste;
apagar la lámpara no oscurece el texto. No escala el texto ni las carátulas junto
con la fotografía. En escritorio puede cubrir muebles inferiores; incorpora un
control de lámpara y el mini reproductor para mantener accesibles sus funciones.

El carrusel `ProjectCarousel` utiliza una lista horizontal con scroll-snap y
carátulas cuadradas de al menos 140 px. Flechas, indicadores y botones anterior /
siguiente del mini tocadiscos comparten la selección de HomePage. Soporta clic,
Tab/Enter/Espacio, flechas izquierda/derecha, Inicio/Fin y desplazamiento táctil.
Tras un swipe selecciona la carátula más cercana al centro. Observa el ancho del
carrusel para mantener la selección visible al redimensionar, sin desplazar la
habitación. El mini disco gira a una velocidad propia y se pausa conservando el
ángulo. El brazo decorativo se coloca según el estado de reproducción.

En tablet el panel reorganiza sus zonas mediante una container query de 760 px.
Hasta 700 px adopta una hoja inferior, con controles de cierre y luz accesibles
al desplazar el contenido. En pantallas pequeñas o bajas permite scroll interno,
con alturas limitadas por `dvh` y márgenes seguros; no reduce toda la interfaz.
Las animaciones de entrada/salida son solo del panel. Al cerrar, se detiene la
reproducción; al finalizar la salida se retira la selección y se devuelve el foco
a la carátula original, sin mover el scroll. Escape también cierra. Con movimiento
reducido se desactivan los giros y las transiciones se resuelven inmediatamente.

`ProjectDetail` usa el diálogo nativo: foco modal, fondo inerte y cierre con Escape.
Permite abrir una ficha o ver el catálogo completo; Escape dentro de la ficha
mantiene abierto el explorador. El cierre devuelve el foco a su control de origen.

### Datos y contenido pendiente

`src/data/collections.ts` separa el contenido de los componentes. La colección DAW
contiene Aula Circular, FRAMEWORK — Production Management y Portfolio interactivo
de vinilos. Los dos primeros solo contienen los nombres facilitados, arte provisional
identificado y fichas pendientes: no se han leído sus proyectos ni inventado
tecnologías, clientes, resultados o enlaces. La ficha del portfolio describe
únicamente las tecnologías e interacciones presentes en este checkout.

El resto de secciones incluye los datos confirmados o contenido marcado como
provisional. Sustituir las imágenes y completar las fichas requiere editar esos
datos; no hay enlaces vacíos, URLs ficticias ni botones de demo inactivos.

### Verificación del explorador

Con Vite y Edge/Chromium en el puerto 9222, ejecutar en secuencia:

```sh
npm run build
npm run lint
node scripts/check-browser.mjs
node scripts/check-explorer.mjs
```

No ejecutar los dos scripts de navegador en paralelo: utilizan la misma pestaña.
El segundo verifica las tres entradas DAW y las seis secciones, catálogo, ficha,
foco modal, retorno del foco, flechas, indicadores, teclado, toque y swipe reales,
giro/pausa sincronizados en ambas direcciones, ambientes incluido automático,
lámpara, resize, ausencia de audio y movimiento reducido. Comprueba que abrir
el portal no modifica la proyección ni las dimensiones de la habitación.

Genera capturas del panel en 2560×1440, 1920×1080, 1600×900, 1366×768,
1280×720, 1024×768, 820×1180, 768×1024, 430×932, 390×844, 375×667,
320×568 y 1200×480. `output/qa/explorer-report.json` contiene las medidas y
`explorer-*.png` las capturas del viewport, catálogo, ficha y noche sin lámpara.
La validación se realiza en Edge local; Safari y dispositivos físicos no están
cubiertos. No se han instalado dependencias ni modificado recursos fotográficos.
