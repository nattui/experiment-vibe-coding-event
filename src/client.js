// Game state
const gameState = {
  happiness: 100,
  hunger: 100,
  energy: 100,
  inventory: [
    { id: "food", name: "Food", count: 5, icon: "🍖" },
    { id: "toy", name: "Toy", count: 3, icon: "🎾" },
    { id: "treat", name: "Treat", count: 2, icon: "🍪" },
  ],
  animations: {
    idle: "🐕",
    happy: "🐕‍🦺",
    eating: "🐶",
    playing: "🦮",
    sleeping: "💤",
  },
  currentAnimation: "idle",
};

// DOM Elements
const petElement = document.getElementById("pet");
const happinessElement = document.getElementById("happiness");
const hungerElement = document.getElementById("hunger");
const energyElement = document.getElementById("energy");
const inventoryElement = document.getElementById("inventory");

// Update status display
function updateStatus() {
  happinessElement.textContent = `${gameState.happiness}%`;
  hungerElement.textContent = `${gameState.hunger}%`;
  energyElement.textContent = `${gameState.energy}%`;
}

// Update inventory display
function updateInventory() {
  inventoryElement.innerHTML = gameState.inventory
    .map(
      (item) => `
            <div class="item" onclick="useItem('${item.id}')">
                <div style="font-size: 24px;">${item.icon}</div>
                <div style="font-size: 10px;">${item.name}</div>
                <div style="font-size: 10px;">x${item.count}</div>
            </div>
        `
    )
    .join("");
}

// Use an item from inventory
function useItem(itemId) {
  const item = gameState.inventory.find((i) => i.id === itemId);
  if (item && item.count > 0) {
    item.count--;
    switch (itemId) {
      case "food":
        feed();
        break;
      case "toy":
        play();
        break;
      case "treat":
        pet();
        break;
    }
    updateInventory();
  }
}

// Game actions
function play() {
  if (gameState.energy >= 20) {
    gameState.happiness = Math.min(100, gameState.happiness + 15);
    gameState.energy = Math.max(0, gameState.energy - 20);
    gameState.hunger = Math.max(0, gameState.hunger - 10);

    // Animate
    petElement.textContent = gameState.animations.playing;
    petElement.style.transform = "scale(1.1)";
    setTimeout(() => {
      petElement.style.transform = "scale(1)";
      petElement.textContent = gameState.animations.idle;
    }, 200);

    updateStatus();
  }
}

function feed() {
  if (gameState.hunger < 100) {
    gameState.hunger = Math.min(100, gameState.hunger + 30);
    gameState.energy = Math.min(100, gameState.energy + 10);
    gameState.happiness = Math.min(100, gameState.happiness + 5);

    // Animate
    petElement.textContent = gameState.animations.eating;
    petElement.style.transform = "translateY(-10px)";
    setTimeout(() => {
      petElement.style.transform = "translateY(0)";
      petElement.textContent = gameState.animations.idle;
    }, 200);

    updateStatus();
  }
}

function sleep() {
  if (gameState.energy < 100) {
    gameState.energy = Math.min(100, gameState.energy + 40);
    gameState.hunger = Math.max(0, gameState.hunger - 10);
    gameState.happiness = Math.max(0, gameState.happiness - 5);

    // Animate
    petElement.textContent = gameState.animations.sleeping;
    petElement.style.transform = "rotate(90deg)";
    setTimeout(() => {
      petElement.style.transform = "rotate(0deg)";
      petElement.textContent = gameState.animations.idle;
    }, 500);

    updateStatus();
  }
}

function pet() {
  gameState.happiness = Math.min(100, gameState.happiness + 10);
  gameState.energy = Math.min(100, gameState.energy + 5);

  // Animate
  petElement.textContent = gameState.animations.happy;
  petElement.style.transform = "scale(1.05)";
  setTimeout(() => {
    petElement.style.transform = "scale(1)";
    petElement.textContent = gameState.animations.idle;
  }, 200);

  updateStatus();
}

function walk() {
  if (gameState.energy >= 30) {
    gameState.happiness = Math.min(100, gameState.happiness + 20);
    gameState.energy = Math.max(0, gameState.energy - 30);
    gameState.hunger = Math.max(0, gameState.hunger - 20);

    // Animate
    petElement.textContent = gameState.animations.playing;
    petElement.style.transform = "translateX(20px)";
    setTimeout(() => {
      petElement.style.transform = "translateX(-20px)";
      petElement.textContent = gameState.animations.idle;
    }, 500);

    updateStatus();
  }
}

function train() {
  if (gameState.energy >= 40) {
    gameState.happiness = Math.min(100, gameState.happiness + 25);
    gameState.energy = Math.max(0, gameState.energy - 40);
    gameState.hunger = Math.max(0, gameState.hunger - 30);

    // Animate
    petElement.textContent = gameState.animations.happy;
    petElement.style.transform = "rotate(360deg)";
    setTimeout(() => {
      petElement.style.transform = "rotate(0deg)";
      petElement.textContent = gameState.animations.idle;
    }, 500);

    updateStatus();
  }
}

// Status decay over time
setInterval(() => {
  gameState.happiness = Math.max(0, gameState.happiness - 1);
  gameState.hunger = Math.max(0, gameState.hunger - 1);
  gameState.energy = Math.max(0, gameState.energy - 1);
  updateStatus();
}, 10000);

// Initialize the game
updateStatus();
updateInventory();
