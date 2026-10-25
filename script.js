(() => {
  "use strict";

  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");
  const loseScreen = document.getElementById("lose-screen");
  const loadingScreen = document.getElementById("loading-screen");
  const playButton = document.getElementById("play-button");
  const resetButton = document.getElementById("reset-button");
  const replayButton = document.getElementById("replay-button");
  const loseReplayButton = document.getElementById("lose-replay-button");
  const arena = document.getElementById("arena");
  const jug = document.getElementById("player-jug");
  const actors = document.getElementById("actors");
  const shotsLayer = document.getElementById("shots");
  const particles = document.getElementById("particles");
  const cleanedCount = document.getElementById("cleaned-count");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.querySelector(".progress-track");
  const chargeCount = document.getElementById("charge-count");
  const healthLabel = document.getElementById("health-label");
  const healthHearts = document.getElementById("health-hearts");
  const arenaMessage = document.getElementById("arena-message");
  const fireButton = document.getElementById("fire-button");
  const goal = 12;
  const facts = [
    { text: "Private donors cover charity: water's operating costs, so 100% of public donations can fund clean water projects.", url: "https://www.charitywater.org/" },
    { text: "At a handpump, $1 provides an average of 1,100 liters of clean water—enough for one family for about 12.5 days.", url: "https://www.charitywater.org/stories/micro-price-points" },
    { text: "charity: water combines community evaluations with remote sensors on select handpumps to track water flow.", url: "https://www.charitywater.org/stories/micro-price-points" }
  ];

  let player = { x: 50, y: 79 };
  let cleaned = 0;
  let charges = 3;
  let health = 3;
  let damageCooldown = 0;
  let lastFactIndex = -1;
  let things = [];
  let bullets = [];
  let keys = new Set();
  let running = false;
  let lastFrame = 0;
  let spawnClock = 0;
  let shotClock = 0;
  let messageClock = 2.4;
  let shootHeld = false;
  let audioContext;
  let pointerMoving = false;
  let lastPointer = null;

  const keyMap = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", A: "left", d: "right", D: "right", w: "up", W: "up", s: "down", S: "down"
  };

  function updateHud() {
    cleanedCount.textContent = String(cleaned);
    chargeCount.textContent = String(charges);
    healthLabel.textContent = health === 1 ? "1 hit left" : health + " hits left";
    healthHearts.setAttribute("aria-label", health + (health === 1 ? " hit remaining" : " hits remaining"));
    Array.from(healthHearts.children).forEach((heart, index) => heart.classList.toggle("is-lost", index >= health));
    progressFill.style.width = Math.min(100, cleaned / goal * 100) + "%";
    progressBar.setAttribute("aria-valuenow", String(cleaned));
  }

  function say(message) {
    arenaMessage.textContent = message;
    arenaMessage.classList.remove("is-hidden");
    messageClock = 1.8;
  }

  function sound(frequency, duration, type) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(.045, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* Audio can be unavailable; visual play still works. */ }
  }

  function showFact(textId, linkId) {
    let index = Math.floor(Math.random() * facts.length);
    if (facts.length > 1 && index === lastFactIndex) index = (index + 1) % facts.length;
    lastFactIndex = index;
    const fact = facts[index];
    document.getElementById(textId).textContent = fact.text;
    document.getElementById(linkId).href = fact.url;
  }

  function startGame() {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
    } catch (_) { /* The game remains playable if audio is unavailable. */ }
    running = false;
    keys.clear();
    shootHeld = false;
    titleScreen.hidden = true;
    gameScreen.hidden = true;
    endScreen.hidden = true;
    loseScreen.hidden = true;
    loadingScreen.hidden = false;
    showFact("loading-fact", "loading-source");
    window.setTimeout(beginRound, 1650);
  }

  function beginRound() {
    loadingScreen.hidden = true;
    gameScreen.hidden = false;
    cleaned = 0;
    charges = 3;
    health = 3;
    damageCooldown = 0;
    player = { x: 50, y: 79 };
    things.forEach(item => item.node.remove());
    bullets.forEach(item => item.node.remove());
    things = [];
    bullets = [];
    keys.clear();
    running = true;
    lastFrame = 0;
    spawnClock = .5;
    shotClock = 0;
    messageClock = 3;
    arenaMessage.textContent = "Collect blue drops to power your water shots!";
    arenaMessage.classList.remove("is-hidden");
    moveJug();
    updateHud();
    arena.focus({ preventScroll: true });
    requestAnimationFrame(frame);
  }

  function finishWin() {
    if (!running) return;
    running = false;
    keys.clear();
    shootHeld = false;
    document.getElementById("final-score").textContent = String(cleaned);
    gameScreen.hidden = true;
    endScreen.hidden = false;
    makeConfetti();
    replayButton.focus({ preventScroll: true });
  }

  function finishLose() {
    if (!running) return;
    running = false;
    keys.clear();
    shootHeld = false;
    document.getElementById("lose-score").textContent = String(cleaned);
    showFact("lose-fact", "lose-source");
    gameScreen.hidden = true;
    loseScreen.hidden = false;
    loseReplayButton.focus({ preventScroll: true });
  }

  function moveJug() {
    jug.style.left = player.x + "%";
    jug.style.top = player.y + "%";
  }

  function move(direction, amount) {
    if (!running) return;
    const step = amount || 4.3;
    if (direction === "left") player.x -= step;
    if (direction === "right") player.x += step;
    if (direction === "up") player.y -= step;
    if (direction === "down") player.y += step;
    player.x = Math.max(6, Math.min(94, player.x));
    player.y = Math.max(17, Math.min(88, player.y));
    moveJug();
  }

  function createThing(kindOverride, xOverride, yOverride) {
    const kindRoll = Math.random();
    const kind = kindOverride || (kindRoll < .7 ? "dirty" : (kindRoll < .94 ? "clean" : "obstacle"));
    const node = document.createElement("div");
    const x = typeof xOverride === "number" ? xOverride : 7 + Math.random() * 86;
    const y = typeof yOverride === "number" ? yOverride : -24;
    if (kind === "obstacle") {
      node.className = "obstacle";
      node.textContent = "✹";
      node.setAttribute("aria-label", "Muddy cloud");
    } else {
      node.className = "drop " + kind;
      node.innerHTML = '<svg viewBox="0 0 28 36" aria-hidden="true"><path d="M14 1.8C10 8.6 3.8 15.2 3.8 22a10.2 10.2 0 0 0 20.4 0C24.2 15.2 18 8.6 14 1.8Z"/>' +
        (kind === "dirty" ? '<circle cx="11" cy="22" r="1.3" fill="#f5dab0" stroke="none"/><circle cx="17" cy="25" r="1.5" fill="#f5dab0" stroke="none"/>' : '<path d="M9 22c0 2.5 1.5 4.2 3.5 5" fill="none" stroke="#e1fbff" stroke-width="1.5" stroke-linecap="round"/>') + '</svg>';
    }
    node.style.left = x + "%";
    node.style.top = y + "%";
    actors.appendChild(node);
    things.push({ node, kind, x, y, speed: 58 + Math.random() * 34 + Math.min(30, cleaned * 1.5) });
  }

  function createWave() {
    const center = 18 + Math.random() * 64;
    const spread = cleaned < 4 ? 13 : 17;
    const offset = Math.random() < .5 ? spread : spread * .72;
    createThing("dirty", Math.max(7, center - offset), -24);
    createThing("dirty", Math.min(93, center + offset), -24);
    if (Math.random() < .38) createThing("dirty", center, -54);
    if (Math.random() < .55) createThing("clean", 8 + Math.random() * 84, -74);
    if (Math.random() < .22) createThing("obstacle", 8 + Math.random() * 84, -118);
  }
  function shoot() {
    if (!running || charges < 1 || shotClock > 0) return;
    charges -= 1;
    updateHud();
    const node = document.createElement("span");
    node.className = "shot";
    const y = player.y - 5.5;
    node.style.left = player.x + "%";
    node.style.top = y + "%";
    shotsLayer.appendChild(node);
    bullets.push({ node, x: player.x, y: y, speed: 53 });
    shotClock = .18;
    sound(540 + Math.random() * 100, .07);
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "particle";
      const angle = Math.PI * 2 * i / count;
      const distance = 16 + Math.random() * 23;
      dot.style.cssText = "position:absolute;left:" + x + "%;top:" + y + "%;width:" + (4 + Math.random() * 4) + "px;height:" + (4 + Math.random() * 4) + "px;border-radius:50%;background:" + color + ";--dx:" + Math.cos(angle) * distance + "px;--dy:" + Math.sin(angle) * distance + "px;animation:pop .55s ease-out forwards";
      particles.appendChild(dot);
      window.setTimeout(() => dot.remove(), 600);
    }
  }

  function cleanse(thing) {
    thing.node.remove();
    sound(850 + Math.random() * 220, .15, "triangle");
    burst(thing.x, thing.y, "#8fe9f2", 9);
    cleaned += 1;
    charges = Math.min(9, charges + 1);
    updateHud();
    say(cleaned >= goal ? "The water is clean. A well is on its way!" : "Cleaned! " + (goal - cleaned) + " more to go.");
    if (cleaned >= goal) finishWin();
  }

  function collect(thing) {
    thing.node.remove();
    charges = Math.min(9, charges + 2);
    updateHud();
    burst(thing.x, thing.y, "#54d8f0", 7);
    say("Fresh water collected. +2 shots!");
    sound(700, .14, "sine");
  }

  function hitObstacle(thing) {
    thing.node.remove();
    charges = Math.max(0, charges - 1);
    cleaned = Math.max(0, cleaned - 1);
    updateHud();
    burst(thing.x, thing.y, "#d69a67", 8);
    say("Muddy cloud! One point and one water charge lost.");
    sound(180, .2, "triangle");
  }

  function hitByDirtyDrop(thing) {
    thing.node.remove();
    if (damageCooldown > 0) return;
    health = Math.max(0, health - 1);
    damageCooldown = 1.05;
    jug.classList.remove("is-hit");
    void jug.offsetWidth;
    jug.classList.add("is-hit");
    window.setTimeout(() => jug.classList.remove("is-hit"), 620);
    burst(thing.x, thing.y, "#b87345", 12);
    updateHud();
    sound(135, .28, "triangle");
    if (health === 0) {
      say("Jerry took too many dirty water drops.");
      finishLose();
    } else {
      say("Dirty splash! " + health + (health === 1 ? " hit left." : " hits left."));
    }
  }

  function overlaps(a, b, radiusX, radiusY) {
    return Math.abs(a.x - b.x) < radiusX && Math.abs(a.y - b.y) < radiusY;
  }

  function frame(timestamp) {
    if (!running) return;
    const dt = Math.min((timestamp - (lastFrame || timestamp)) / 1000, .04);
    lastFrame = timestamp;
    if (keys.has("left")) move("left", 4.5 * dt * 60);
    if (keys.has("right")) move("right", 4.5 * dt * 60);
    if (keys.has("up")) move("up", 4.5 * dt * 60);
    if (keys.has("down")) move("down", 4.5 * dt * 60);
    if (shootHeld) shoot();
    shotClock = Math.max(0, shotClock - dt);
    damageCooldown = Math.max(0, damageCooldown - dt);
    spawnClock -= dt;
    messageClock -= dt;
    if (messageClock <= 0) arenaMessage.classList.add("is-hidden");
    if (spawnClock <= 0) {
      createWave();
      const pace = Math.min(.65, cleaned * .035);
      spawnClock = Math.max(.62, 1.42 - pace) + Math.random() * .28;
    }
    const arenaRect = arena.getBoundingClientRect();
    const width = arenaRect.width;
    const height = arenaRect.height;
    const px = player.x / 100 * width;
    const py = player.y / 100 * height;

    bullets = bullets.filter((bullet) => {
      bullet.y -= bullet.speed * dt;
      bullet.node.style.top = bullet.y + "%";
      let hitIndex = -1;
      for (let i = 0; i < things.length; i += 1) {
        if (things[i].kind === "dirty" && overlaps(bullet, things[i], 4.5, 4.7)) { hitIndex = i; break; }
      }
      if (hitIndex >= 0) {
        cleanse(things[hitIndex]);
        things.splice(hitIndex, 1);
        bullet.node.remove();
        return false;
      }
      if (bullet.y < -5) { bullet.node.remove(); return false; }
      return true;
    });
    if (!running) return;

    things = things.filter((thing) => {
      if (!running) { thing.node.remove(); return false; }
      thing.y += thing.speed * dt / height * 100;
      thing.node.style.top = thing.y + "%";
      const thingPx = thing.x / 100 * width;
      const thingPy = thing.y / 100 * height;
      if (thing.kind === "clean" && overlaps({ x: px, y: py }, { x: thingPx, y: thingPy }, 38, 39)) {
        collect(thing);
        return false;
      }
      if (thing.kind === "dirty" && overlaps({ x: px, y: py }, { x: thingPx, y: thingPy }, 34, 34)) {
        hitByDirtyDrop(thing);
        return false;
      }
      if (thing.kind === "obstacle" && overlaps({ x: px, y: py }, { x: thingPx, y: thingPy }, 38, 35)) {
        hitObstacle(thing);
        return false;
      }
      if (thing.y > 104) { thing.node.remove(); return false; }
      return true;
    });
    if (running) requestAnimationFrame(frame);
  }

  function makeConfetti() {
    const box = document.getElementById("confetti");
    box.replaceChildren();
    const colors = ["#ffc907", "#2e9df7", "#8bd1cb", "#4fbd72", "#f27b5c"];
    for (let i = 0; i < 76; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", (Math.random() * 140 - 70) + "px");
      piece.style.setProperty("--fall-time", (1.3 + Math.random() * 1.7) + "s");
      piece.style.animationDelay = (Math.random() * .8) + "s";
      box.appendChild(piece);
    }
    window.setTimeout(() => box.replaceChildren(), 3800);
  }

  playButton.addEventListener("click", startGame);
  replayButton.addEventListener("click", startGame);
  loseReplayButton.addEventListener("click", startGame);
  resetButton.addEventListener("click", startGame);

  document.addEventListener("keydown", (event) => {
    if (keyMap[event.key]) {
      event.preventDefault();
      keys.add(keyMap[event.key]);
    }
    if ((event.code === "Space" || event.key === "z" || event.key === "Z") && running) {
      event.preventDefault();
      shootHeld = true;
    }
  });
  document.addEventListener("keyup", (event) => {
    if (keyMap[event.key]) keys.delete(keyMap[event.key]);
    if (event.code === "Space" || event.key === "z" || event.key === "Z") shootHeld = false;
  });
  window.addEventListener("blur", () => { keys.clear(); shootHeld = false; });

  document.querySelectorAll("[data-direction]").forEach((button) => {
    const direction = button.dataset.direction;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys.add(direction);
      button.setPointerCapture(event.pointerId);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
      button.addEventListener(name, () => keys.delete(direction));
    });
  });
  fireButton.addEventListener("pointerdown", (event) => { event.preventDefault(); shootHeld = true; });
  ["pointerup", "pointercancel", "pointerleave"].forEach((name) => fireButton.addEventListener(name, () => { shootHeld = false; }));

  arena.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !running) return;
    pointerMoving = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    arena.setPointerCapture(event.pointerId);
  });
  arena.addEventListener("pointermove", (event) => {
    if (!pointerMoving || !lastPointer) return;
    const rect = arena.getBoundingClientRect();
    player.x = Math.max(6, Math.min(94, player.x + (event.clientX - lastPointer.x) / rect.width * 100));
    player.y = Math.max(17, Math.min(88, player.y + (event.clientY - lastPointer.y) / rect.height * 100));
    lastPointer = { x: event.clientX, y: event.clientY };
    moveJug();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
    arena.addEventListener(name, () => { pointerMoving = false; lastPointer = null; });
  });

  updateHud();
})();