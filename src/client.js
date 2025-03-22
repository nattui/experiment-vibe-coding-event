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

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Ground
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.2,
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create dog
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
  // Create a simple dog model using basic geometries
  const body = new THREE.BoxGeometry(1, 0.5, 2);
  const head = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const leg1 = new THREE.BoxGeometry(0.2, 1, 0.2);
  const leg2 = new THREE.BoxGeometry(0.2, 1, 0.2);
  const leg3 = new THREE.BoxGeometry(0.2, 1, 0.2);
  const leg4 = new THREE.BoxGeometry(0.2, 1, 0.2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.7,
    metalness: 0.3,
  });

  dog = new THREE.Group();

  const bodyMesh = new THREE.Mesh(body, material);
  const headMesh = new THREE.Mesh(head, material);
  const leg1Mesh = new THREE.Mesh(leg1, material);
  const leg2Mesh = new THREE.Mesh(leg2, material);
  const leg3Mesh = new THREE.Mesh(leg3, material);
  const leg4Mesh = new THREE.Mesh(leg4, material);

  bodyMesh.position.y = 0.75;
  headMesh.position.set(1, 1.1, 0);
  leg1Mesh.position.set(-0.4, 0, -0.8);
  leg2Mesh.position.set(0.4, 0, -0.8);
  leg3Mesh.position.set(-0.4, 0, 0.8);
  leg4Mesh.position.set(0.4, 0, 0.8);

  dog.add(bodyMesh);
  dog.add(headMesh);
  dog.add(leg1Mesh);
  dog.add(leg2Mesh);
  dog.add(leg3Mesh);
  dog.add(leg4Mesh);

  dog.castShadow = true;
  dog.receiveShadow = true;
  scene.add(dog);
}

function createItems() {
  // Create some interactive items in the scene
  const items = [
    {
      geometry: new THREE.SphereGeometry(0.3, 16, 16),
      color: 0xff0000,
      type: "toy",
    },
    {
      geometry: new THREE.BoxGeometry(0.5, 0.5, 0.5),
      color: 0x00ff00,
      type: "food",
    },
    {
      geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16),
      color: 0x0000ff,
      type: "treat",
    },
  ];

  items.forEach((item, index) => {
    const material = new THREE.MeshStandardMaterial({ color: item.color });
    const mesh = new THREE.Mesh(item.geometry, material);
    mesh.position.set((index - 1) * 3, 0.5, (index - 1) * 2);
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

  // Rotate camera around the scene
  const time = Date.now() * 0.001;
  camera.position.x = Math.sin(time * 0.5) * 10;
  camera.position.z = Math.cos(time * 0.5) * 10;
  camera.lookAt(0, 0, 0);

  // Animate dog based on current animation
  animateDog();

  renderer.render(scene, camera);
}

function animateDog() {
  const time = Date.now() * 0.001;
  switch (gameState.currentAnimation) {
    case "idle":
      dog.rotation.y = Math.sin(time) * 0.1;
      break;
    case "happy":
      dog.rotation.y = Math.sin(time * 2) * 0.3;
      dog.position.y = Math.sin(time * 4) * 0.2 + 0.75;
      break;
    case "eating":
      dog.rotation.y = Math.sin(time * 3) * 0.2;
      dog.position.y = Math.sin(time * 6) * 0.1 + 0.75;
      break;
    case "playing":
      dog.rotation.y = Math.sin(time * 4) * 0.5;
      dog.position.y = Math.sin(time * 8) * 0.3 + 0.75;
      break;
    case "sleeping":
      dog.rotation.y = 0;
      dog.position.y = 0.75;
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
