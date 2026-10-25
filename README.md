# World Wide Water

A responsive browser-game prototype inspired by the wireframe and charity: water's brand usage guide.

## Game loop

- The title screen shows the game name and a rotating planet. Play is its only interactive element.
- Move Jerry, a friendly water jug, with the arrow keys or touch controls.
- Collect clean blue drops to gain water charges.
- Press and hold Space or Z to shoot water shots at muddy drops arriving in readable waves. The pace rises gradually.
- Cleanse 12 dirty drops to complete the mission and see the well-building celebration.
- Dirty drops that hit Jerry cause damage. Three hits end the round and show a lose screen with a replay button and charity: water fact.
- Muddy cloud obstacles can lower the score and consume a charge. Missed drops do not end the game.
- A charity: water fact appears on the short transition screen before each round.

## Play

Open \`index.html\` in a browser, or enable GitHub Pages for this repository and publish from the branch root.

## Files

- \`index.html\` — title, planet, game, and celebration screens
- \`styles.css\` — responsive layout, planet animation, game scenery, and effects
- \`script.js\` — movement, shooting, collisions, score, charges, sound, and replay

## Design notes

The game uses charity: water-inspired yellow, water blue, navy, and mint with a clear, spacious, hopeful visual style. Gameplay combines collecting clean drops with shooting dirty drops. Cleansing progress is the win condition; three dirty-drop collisions trigger the loss screen. The end screen thanks the player, celebrates with confetti, shows a well, and links to charity: water.

This is an educational game concept and is not an official charity: water product or donation mechanism.