# Powder Legends — Ski Stunt Simulator

A browser ski-stunt game by PJ, built for anyone who lives for powder days, big air and stomped landings. Open `index.html` in any browser to play.

## How in-game updates work

The game checks this repo (`kefirman9000/powder-legends`, branch `main`) for a newer `index.html`.
When one exists, the **⬆ Update** button in the menu shows a **NEW** badge. Pressing it shows the
version and release notes; choosing **Install** saves the new version in the browser and restarts the
game on it. Players can roll back with **Undo update** in the same dialog.

This works whether the game is opened as a local file, from GitHub Pages, or any other host.

## Shipping an update

1. Edit `index.html`.
2. Near the top, bump the version and write a note:
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
