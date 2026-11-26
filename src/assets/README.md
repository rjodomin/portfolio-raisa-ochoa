# Recursos de la escena

La composición actual procede de la imagen de referencia aportada por la usuaria.
Se ha editado con image_gen integrada para retirar texto y controles, conservar
los objetos e introducir variantes de iluminación. No se ha usado CLI ni API propia.

Entregas:

- reference-room.webp: atardecer, estado inicial.
- reference-day.webp: día despejado.
- reference-cloudy.webp: luz difusa y exterior nublado.
- reference-night.webp: ciudad nocturna y luz interior cálida.
- reference-lamp-off.webp: lámpara sin emisión de luz.
- sleeve-*.webp: recortes de las seis carátulas para cada ambiente.

Los PNG originales se conservan. Los prompts están en reference.prompts.txt.
La conversión y los recortes deterministas se realizan en scripts/optimize-assets.mjs
mediante Canvas y el navegador local de QA, sin dependencias adicionales.

Las versiones interior-warm* y cover-* son recursos de la iteración anterior.
No se importan en la composición actual. Vite solo incluye recursos referenciados.
