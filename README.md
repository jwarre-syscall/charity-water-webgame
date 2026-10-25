# World Wide Water

A responsive browser-game prototype inspired by the provided wireframe and charity: water's brand usage guide. This is an educational game concept, not an official charity: water product or donation mechanism.

## Game loop

- The title screen keeps the wireframe's centered title, play control, pond, and islands, with a small rotating planet.
- Move Jerry with the arrow keys or touch controls. Hold Space or Z to shoot.
- Collect clean blue drops to gain water charges and cleanse 12 dirty drops to complete the mission.
- Dirty drops that hit Jerry cause damage. Three hits end the round and show a loss screen with a replay button and a charity: water fact.
- Muddy cloud obstacles can lower the score and use a charge. Missed drops do not end the game.
- A charity: water fact appears on the short transition screen before each round.

## Brand assets

The horizontal charity: water lockup and standalone Jerry Can image in `assets/` are copied unchanged from the supplied `05-charity-water-game-prototype` repository. The Jerry Can mark is displayed at its original aspect ratio and colors on white. Do not redraw, recolor, stretch, or crop these images. Before using the logo outside this classroom prototype, follow charity: water's current [media and brand guidance](https://www.charitywater.org/about/media).

## Files

- `index.html` — title, gameplay, transition, loss, and success screens
- `styles.css` — responsive wireframe-led layout, HUD, scenery, and effects
- `script.js` — movement, shooting, collisions, score, sound, and replay
- `assets/` — unchanged charity: water image assets from the supplied prototype repository

## Run and publish

Open `index.html` in a browser, or enable GitHub Pages for this public repository and publish from the `main` branch root. The repository includes a GitHub Actions workflow for publishing the root files.
