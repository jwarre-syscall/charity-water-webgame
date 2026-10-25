(() => {
  "use strict";

  const field = document.getElementById("playfield");
  const player = document.getElementById("player");
  const items = document.getElementById("game-items");
  const startScreen = document.getElementById("start-screen");
  const endScreen = document.getElementById("end-screen");
  const startButton = document.getElementById("start-button");
  const againButton = document.getElementById("again-button");
  const pauseButton = document.getElementById("pause-button");
  const scoreValue = document.getElementById("score-value");
  const scoreFill = document.getElementById("score-meter-fill");
  const livesView = document.getElementById("lives");
  const timerLabel = document.getElementById("timer-label");
  const gameStatus = document.getElementById("game-status");
  const statusText = document.getElementById("status-text");
  const toast = document.getElementById("toast");
  const soundToggle = document.getElementById("sound-toggle");
  const goal = 12;
  const duration = 60;

  let score = 0;
  let lives = 3;
  let remaining = duration;
  let playerX = 50;
  let drops = [];
  let active = false;
  let paused = false;
  let lastFrame = 0;
  let spawnClock = 0;
  let secondClock = 0;
  let toastClock = 0;
  let soundOn = false;
  let audioContext = null;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function setStatus(text, mode) {
    statusText.textContent = text;
    gameStatus.classList.remove("is-playing", "is-paused");
    if (mode) gameStatus.classList.add(mode);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastClock = 1.15;
  }

  function renderStats() {
    scoreValue.innerHTML = String(score) + '<span class="score-goal"> / ' + goal + '</span>';
    scoreFill.style.width = Math.min(100, score / goal * 100) + "%";
    livesView.setAttribute("aria-label", lives + (lives === 1 ? " life remaining" : " lives remaining"));
    Array.from(livesView.children).forEach((heart, index) => {
      heart.classList.toggle("is-lost", index >= lives);
    });
    timerLabel.textContent = formatTime(remaining);
  }

  function resetGame() {
    score = 0;
    lives = 3;
    remaining = duration;
    playerX = 50;
    drops = [];
    items.replaceChildren();
    player.style.left = playerX + "%";
    player.classList.remove("is-happy");
    renderStats();
  }

  function startGame() {
    resetGame();
    startScreen.hidden = true;
    endScreen.hidden = true;
    active = true;
    paused = false;
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
    lastFrame = 0;
    spawnClock = 0.4;
    secondClock = 0;
    setStatus("You’ve got this!", "is-playing");
    field.focus({ preventScroll: true });
    requestAnimationFrame(loop);
  }

  function finishGame(won, reason) {
    if (!active) return;
    active = false;
    paused = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    setStatus(won ? "A little more hope in the world" : "Round complete", "");
    document.getElementById("end-eyebrow").textContent = won ? "MISSION COMPLETE" : "ROUND COMPLETE";
    document.getElementById("end-title").textContent = won ? "You made waves!" : (reason === "time" ? "Time for a deep breath." : "Keep making waves.");
    document.getElementById("end-message").textContent = won
      ? "You caught " + score + " clean drops. That’s a lot of good."
      : (reason === "time" ? "You caught " + score + " of " + goal + " clean drops. Every drop counts." : "You caught " + score + " clean drops. Give it another go?");
    document.getElementById("end-illustration").textContent = won ? "✳" : "✦";
    endScreen.hidden = false;
    againButton.focus({ preventScroll: true });
  }

  function move(direction) {
    if (!active || paused) return;
    playerX = Math.max(8, Math.min(92, playerX + direction * 7));
    player.style.left = playerX + "%";
  }

  function createDrop() {
    const node = document.createElement("div");
    const dirty = Math.random() < 0.29;
    node.className = "drop " + (dirty ? "dirty" : "clean");
    node.innerHTML = '<svg viewBox="0 0 28 36" aria-hidden="true"><path d="M14 1.8C10 8.6 3.8 15.2 3.8 22a10.2 10.2 0 0 0 20.4 0C24.2 15.2 18 8.6 14 1.8Z"/>' +
      (dirty ? '<circle cx="11" cy="22" r="1.25" fill="#f6d9a6" stroke="none"/><circle cx="17" cy="25" r="1.4" fill="#f6d9a6" stroke="none"/>' : '<path d="M9 22c0 2.5 1.5 4.2 3.5 5" fill="none" stroke="#dffaff" stroke-width="1.5" stroke-linecap="round"/>') + '</svg>';
    node.setAttribute("data-kind", dirty ? "dirty" : "clean");
    const x = 8 + Math.random() * 84;
    node.style.left = x + "%";
    node.style.top = "-24px";
    items.appendChild(node);
    drops.push({ node, x, y: -24, speed: 115 + Math.random() * 55, dirty });
  }

  function playTone(frequency, length, type) {
    if (!soundOn) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + length);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + length);
    } catch (_) { /* Sound is optional; the game remains fully playable. */ }
  }

  function collect(drop) {
    if (drop.dirty) {
      lives = Math.max(0, lives - 1);
      showToast(lives ? "Muddy drop! Watch your step." : "That’s okay. Take another try.");
      playTone(155, .2, "triangle");
      renderStats();
      if (!lives) finishGame(false, "lives");
      return;
    }
    score += 1;
    player.classList.remove("is-happy");
    void player.offsetWidth;
    player.classList.add("is-happy");
    showToast(score >= goal ? "You brought clean water home!" : "Clean drop saved!");
    playTone(610 + score * 17, .12);
    renderStats();
    if (score >= goal) finishGame(true, "goal");
  }

  function loop(timestamp) {
    if (!active || paused) return;
    const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, .05);
    lastFrame = timestamp;
    spawnClock -= delta;
    secondClock += delta;
    if (spawnClock <= 0) {
      createDrop();
      spawnClock = Math.max(.48, 1.02 - (duration - remaining) * .007) + Math.random() * .3;
    }
    while (secondClock >= 1) {
      secondClock -= 1;
      remaining = Math.max(0, remaining - 1);
      renderStats();
      if (!remaining) {
        finishGame(score >= goal, "time");
        return;
      }
    }
    if (toastClock > 0) {
      toastClock -= delta;
      if (toastClock <= 0) toast.classList.remove("is-visible");
    }
    const fieldRect = field.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    const playerCenter = playerX / 100 * fieldRect.width;
    const catchY = fieldRect.height * .87;
    drops = drops.filter((drop) => {
      drop.y += drop.speed * delta;
      drop.node.style.top = drop.y + "px";
      if (drop.y >= catchY - 15 && drop.y <= catchY + 20 && Math.abs(drop.x / 100 * fieldRect.width - playerCenter) < playerRect.width * .47) {
        drop.node.remove();
        collect(drop);
        return active;
      }
      if (drop.y > fieldRect.height + 30) {
        drop.node.remove();
        return false;
      }
      return true;
    });
    if (active) requestAnimationFrame(loop);
  }

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", () => {
    if (!active) return;
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    setStatus(paused ? "Taking a breather" : "You’ve got this!", paused ? "is-paused" : "is-playing");
    if (!paused) {
      lastFrame = 0;
      requestAnimationFrame(loop);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) event.preventDefault();
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
    if (event.key === " " && !active) startGame();
    if (event.key === "Escape" && active) pauseButton.click();
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      move(Number(button.dataset.move));
    });
  });
  field.addEventListener("pointermove", (event) => {
    if (!active || paused || event.pointerType !== "touch" || event.buttons !== 1) return;
    const rect = field.getBoundingClientRect();
    playerX = Math.max(8, Math.min(92, (event.clientX - rect.left) / rect.width * 100));
    player.style.left = playerX + "%";
  });
  field.addEventListener("pointerdown", (event) => {
    if (!active || paused || event.pointerType !== "touch") return;
    const rect = field.getBoundingClientRect();
    playerX = Math.max(8, Math.min(92, (event.clientX - rect.left) / rect.width * 100));
    player.style.left = playerX + "%";
  });
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
    showToast(soundOn ? "Sound is on" : "Sound is off");
    if (soundOn) playTone(520, .12);
  });
  renderStats();
})();