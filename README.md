# Powder Legends — Ski Stunt Simulator

A browser ski-stunt game by PJ, built for anyone who lives for powder days, big air and stomped landings. Open `index.html` in any browser to play.

## How in-game updates work

The game checks this repo (`kefirman9000/powder-legends`, branch `main`) for a newer `index.html`.
When one exists, the **⬆ Update** button in the menu shows a **NEW** badge. Pressing it shows the
version and release notes; choosing **Install** saves the new version in the browser and restarts the
game on it. Players can roll back with **Undo update** in the same dialog.

This works whether the game is opened as a local file, from GitHub Pages, or any other host.

## Shipping an update

1. Edit the files in `src/` (see Project layout below).
2. In `src/js/boot.js`, bump the version and write a note:
   ```js
   window.GAME_VERSION='1.0.1';
   window.GAME_NOTES='New level and smoother landings.';
   ```
3. Commit to `main` (or merge a pull request into `main`).

That's it: as soon as the change lands on `main`, every player gets the update offer.
The version must go **up** (e.g. `1.0.0` → `1.0.1` → `1.1.0`), or players won't be offered it.

## Optional: play online

Repo **Settings → Pages → Deploy from branch → `main` / root** puts the game at
`https://kefirman9000.github.io/powder-legends/`.

## Project layout

The game is edited as separate files in `src/` and built into the single `index.html` that players download and GitHub Pages serves.

| File | What's in it |
|---|---|
| `src/index.template.html` | Page markup; `<!-- @include … -->` lines pull in the files below |
| `src/js/boot.js` | **Version number + release notes**, and the update bootloader |
| `src/js/setup.js` | Canvas, zoom, skier colors and customizer |
| `src/js/physics.js` | Terrain, skier body, joints, collisions, the physics step |
| `src/js/hazards.js` | Fire walls, shark pool, hazard bonuses |
| `src/js/camera.js` | Speed-aware camera |
| `src/js/render.js` | Drawing the world and the skier |
| `src/js/input.js` | Mouse and touch controls |
| `src/js/hud.js` | Trick popups and score display |
| `src/js/haptics.js` | Phone vibration |
| `src/js/fx.js` | Fireworks and results-screen effects |
| `src/js/scenery.js` | Parallax mountains and falling snow / ash |
| `src/js/gear.js` | Unlockable special gear: unlock rules, customizer panel, effects |
| `src/js/skijump.js` | Ski Jump Hill: distance measuring, hill record, markers |
| `src/js/props.js` | Trees, rocks, crates, replay recorder |
| `src/js/levels.js` | **All levels** (terrain + obstacles) |
| `src/js/menu.js` | Level select, grades, awards, results screen |
| `src/js/tutorial.js` | First-run tutorial |
| `src/js/main.js` | Game loop |
| `src/js/audio.js`, `debug.js`, `updater.js` | Sound, debug mode, in-game updater |

**Build:** `python3 tools/build.py` (no installs needed; if Node is installed it also syntax-checks the game and refuses to write a broken build). A GitHub Action also rebuilds `index.html`
automatically whenever `src/` changes on `main`, so editing on github.com works too.
