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
    idle: "idle",
    happy: "happy",
    eating: "eating",
    playing: "playing",
    sleeping: "sleeping",
  },
  currentAnimation: "idle",
};

// Three.js setup
let scene, camera, renderer, dog, ground, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2c2137);

  // Add menu toggle functionality
  const menuToggle = document.getElementById("menu-toggle");
  const uiOverlay = document.getElementById("ui-overlay");
  let isMenuVisible = true;

  menuToggle.addEventListener("click", () => {
    isMenuVisible = !isMenuVisible;
    uiOverlay.classList.toggle("hidden");
    menuToggle.textContent = isMenuVisible ? "☰" : "☰";
  });

  // Camera setup - adjusted for watch screen
  camera = new THREE.PerspectiveCamera(
    60, // narrower field of view
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 3, 5); // closer to the scene
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // enable transparency
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // increased ambient light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // increased direct light
  directionalLight.position.set(3, 3, 3);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Ground - smaller size for watch
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.2,
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create dog using GLB model
  createDog();

  // Add some toys and food items
  createItems();

  // Event listeners
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("click", onMouseClick, false);
  window.addEventListener("mousemove", onMouseMove, false);

  // Start animation loop
  animate();
}

function createDog() {
  const loader = new THREE.GLTFLoader();

  loader.load(
    "./assets/dog.glb",
    function (gltf) {
      dog = gltf.scene;

      // Scale the model to fit the scene
      dog.scale.set(2, 2, 2);

      // Position the dog - raised above ground
      dog.position.set(0, 0.5, 0);

      // Enable shadows
      dog.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      scene.add(dog);
    },
    // Progress callback
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // Error callback
    function (error) {
      console.error("Error loading dog model:", error);
    }
  );
}

function createItems() {
  // Create some interactive items in the scene - smaller size
  const items = [
    {
      geometry: new THREE.SphereGeometry(0.15, 16, 16),
      color: 0xff0000,
      type: "toy",
    },
    {
      geometry: new THREE.BoxGeometry(0.25, 0.25, 0.25),
      color: 0x00ff00,
      type: "food",
    },
    {
      geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.25, 16),
      color: 0x0000ff,
      type: "treat",
    },
  ];

  items.forEach((item, index) => {
    const material = new THREE.MeshStandardMaterial({ color: item.color });
    const mesh = new THREE.Mesh(item.geometry, material);
    mesh.position.set((index - 1) * 1.5, 0.25, (index - 1) * 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = item.type;
    scene.add(mesh);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.userData.type) {
      useItem(object.userData.type);
    }
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate camera around the scene - slower rotation for watch
  const time = Date.now() * 0.001;
  camera.position.x = Math.sin(time * 0.3) * 5;
  camera.position.z = Math.cos(time * 0.3) * 5;
  camera.lookAt(0, 0, 0);

  // Animate dog based on current animation
  animateDog();

  renderer.render(scene, camera);
}

function animateDog() {
  const time = Date.now() * 0.001;
  if (!dog) return; // Skip animation if dog model isn't loaded yet

  const baseHeight = 0.5; // Base height to keep dog above ground

  switch (gameState.currentAnimation) {
    case "idle":
      dog.rotation.y = Math.sin(time) * 0.1;
      dog.position.y = baseHeight;
      break;
    case "happy":
      dog.rotation.y = Math.sin(time * 2) * 0.3;
      dog.position.y = Math.sin(time * 4) * 0.2 + baseHeight;
      break;
    case "eating":
      dog.rotation.y = Math.sin(time * 3) * 0.2;
      dog.position.y = Math.sin(time * 6) * 0.1 + baseHeight;
      break;
    case "playing":
      dog.rotation.y = Math.sin(time * 4) * 0.5;
      dog.position.y = Math.sin(time * 8) * 0.3 + baseHeight;
      break;
    case "sleeping":
      dog.rotation.y = 0;
      dog.position.y = baseHeight;
      break;
  }
}

// Game actions
function play() {
  if (gameState.energy >= 20) {
    gameState.happiness = Math.min(100, gameState.happiness + 15);
    gameState.energy = Math.max(0, gameState.energy - 20);
    gameState.hunger = Math.max(0, gameState.hunger - 10);
    gameState.currentAnimation = "playing";

    setTimeout(() => {
      gameState.currentAnimation = "idle";
    }, 2000);

    updateStatus();
  }
}

function feed() {
  if (gameState.hunger < 100) {
    gameState.hunger = Math.min(100, gameState.hunger + 30);
    gameState.energy = Math.min(100, gameState.energy + 10);
    gameState.happiness = Math.min(100, gameState.happiness + 5);
    gameState.currentAnimation = "eating";

    setTimeout(() => {
      gameState.currentAnimation = "idle";
    }, 2000);

    updateStatus();
  }
}

function sleep() {
  if (gameState.energy < 100) {
    gameState.energy = Math.min(100, gameState.energy + 40);
    gameState.hunger = Math.max(0, gameState.hunger - 10);
    gameState.happiness = Math.max(0, gameState.happiness - 5);
    gameState.currentAnimation = "sleeping";

    setTimeout(() => {
      gameState.currentAnimation = "idle";
    }, 2000);

    updateStatus();
  }
}

function pet() {
  gameState.happiness = Math.min(100, gameState.happiness + 10);
  gameState.energy = Math.min(100, gameState.energy + 5);
  gameState.currentAnimation = "happy";

  setTimeout(() => {
    gameState.currentAnimation = "idle";
  }, 2000);

  updateStatus();
}

function walk() {
  if (gameState.energy >= 30) {
    gameState.happiness = Math.min(100, gameState.happiness + 20);
    gameState.energy = Math.max(0, gameState.energy - 30);
    gameState.hunger = Math.max(0, gameState.hunger - 20);
    gameState.currentAnimation = "playing";

    setTimeout(() => {
      gameState.currentAnimation = "idle";
    }, 2000);

    updateStatus();
  }
}

function train() {
  if (gameState.energy >= 40) {
    gameState.happiness = Math.min(100, gameState.happiness + 25);
    gameState.energy = Math.max(0, gameState.energy - 40);
    gameState.hunger = Math.max(0, gameState.hunger - 30);
    gameState.currentAnimation = "happy";

    setTimeout(() => {
      gameState.currentAnimation = "idle";
    }, 2000);

    updateStatus();
  }
}

// Update status display
function updateStatus() {
  document.getElementById("happiness").textContent = `${gameState.happiness}%`;
  document.getElementById("hunger").textContent = `${gameState.hunger}%`;
  document.getElementById("energy").textContent = `${gameState.energy}%`;
}

// Update inventory display
function updateInventory() {
  const inventoryElement = document.getElementById("inventory");
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

// Status decay over time
setInterval(() => {
  gameState.happiness = Math.max(0, gameState.happiness - 1);
  gameState.hunger = Math.max(0, gameState.hunger - 1);
  gameState.energy = Math.max(0, gameState.energy - 1);
  updateStatus();
}, 10000);

// Initialize the game
init();
updateStatus();
updateInventory();
