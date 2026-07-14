# Achievements Terrarium (disabled legacy JavaScript)

The Achievements Terrarium is intentionally excluded from the active application. Its JavaScript remains unconverted and unimported so the feature can be studied or restored later without reimplementing it.

The preserved controller is `assets/betTerrariumController.js`. It previously shared the Bet Terrarium rendering stack and mirrored selected rewards into the Achievements panel. Its companion preference module is `assets/achievementsTerrariumPreferences.js`. The shared legacy stack consists of `assets/fluidSpirePreferences.js`, every `assets/fluidTerrarium*.js` module, `scripts/features/towers/shinTower.js`, and the fractal/Voronoi helpers those modules import. Terrarium artwork remains under `assets/sprites/spires/betSpire/terrarium/`.

The former integration supplied Achievements Terrarium DOM elements to `createBetTerrariumController`, initialized the controller during startup, forwarded achievement reward events to it, and resized or stopped it with the active Spire lifecycle. Those imports, DOM nodes, callbacks, listeners, timers, and animation-frame entry points are absent from the current application.

Restoration must be explicit: recreate an isolated Achievements-only controller, audit every shared Bet dependency, add the required DOM and accessibility structure, and restore lifecycle cleanup tests. Do not import this legacy stack directly from `assets/main.js`.
