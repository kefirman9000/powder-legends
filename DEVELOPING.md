# Developing Powder Legends

## Shipping an update

1. Edit the files in `src/` (see the layout below).
2. In `src/js/boot.js`, raise the version and write a one-line note players will see:
   ```js
   window.GAME_VERSION='1.5.1';
   window.GAME_NOTES='New level and smoother landings.';
   ```
3. Commit to `main` (or merge a pull request into `main`).

A GitHub Action rebuilds `index.html` from `src/`, GitHub Pages redeploys the site, and every downloaded copy
shows an install banner on its main menu. The version must go **up**, or players won't be offered it.

### How in-game updates work

The game reads `index.html` from this repo's `main` branch and compares its `GAME_VERSION`. When it's newer,
an install banner appears on the main menu (and **Settings → Check for updates** finds it too). Installing
saves the new build in the browser and restarts on it; **Undo update** rolls back. This works whether the
game was opened as a local file, from GitHub Pages, or anywhere else.

## Building

`python3 tools/build.py` writes the single-file `index.html` (no installs needed). If Node is installed it
also syntax-checks every script and refuses to write a broken build. `python3 tools/build.py --check`
reports whether `index.html` is up to date.

## Project layout

| File | What's in it |
|---|---|
| `src/index.template.html` | Page markup; `<!-- @include … -->` lines pull in the files below |
| `src/css/*.css` | Styles (game, touch devices, audio menu, updater) |
| `src/js/boot.js` | **Version number + release notes**, and the update bootloader |
| `src/js/setup.js` | Canvas, zoom, graphics quality levels, skier colors and customizer |
| `src/js/physics.js` | Terrain, skier body, joints, collisions, landing grades, the physics step |
| `src/js/hazards.js` | Fire walls, shark pool, lava, hazard bonuses |
| `src/js/camera.js` | Camera: follows the centre of mass, pulls back at speed and in the air |
| `src/js/render.js` | Drawing the world and the skier |
| `src/js/input.js` | Mouse, touch and keyboard controls |
| `src/js/hud.js` | Trick popups and score display |
| `src/js/haptics.js` | Phone vibration |
| `src/js/fx.js` | Fireworks and results-screen effects |
| `src/js/scenery.js` | Cached parallax mountains and falling snow / ash |
| `src/js/gear.js` | Unlockable gear: rules, customizer panel, effects |
| `src/js/windtrails.js` | Air wind trails |
| `src/js/ghost.js` | Best-run ghost: saving, loading, drawing |
| `src/js/props.js` | Trees, rocks, crates, replay recorder, saved scores |
| `src/js/skijump.js` | Ski Jump Hill: distance, hill record, markers |
| `src/js/endless.js` | Endless Run course generator |
| `src/js/levels.js` | **All levels** (terrain, obstacles, colors) |
| `src/js/menu.js` | Level select, grades, awards, results screen, progress |
| `src/js/intro.js` | Title screen (sunset + snow-gust title) |
| `src/js/main.js` | Game loop |
| `src/js/tutorial.js` | Ski School steps |
| `src/js/audio.js`, `debug.js`, `updater.js`, `settings.js` | Sound, debug mode, in-game updater, Settings screen |

## Hosting

**Settings → Pages → Deploy from a branch → `main` / root** serves the game at
`https://kefirman9000.github.io/powder-legends/`. Screenshots for the README live in `docs/screenshots/`.
