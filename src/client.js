// Game state
const gameState = {
  happiness: 100,
  hunger: 100,
  energy: 100,
  inventory: [
    { id: "food", name: "Food", count: "∞", icon: "🍖" },
    { id: "toy", name: "Toy", count: "∞", icon: "🎾" },
    { id: "treat", name: "Treat", count: "∞", icon: "🍪" },
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
let environmentItems = []; // Array to store environment items

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

  // Add OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Add smooth damping
  controls.dampingFactor = 0.05;
  controls.minDistance = 3; // Minimum zoom distance
  controls.maxDistance = 10; // Maximum zoom distance
  controls.maxPolarAngle = Math.PI / 2; // Prevent camera going below ground
  controls.enablePan = false; // Disable panning for simplicity

  // Enhanced Lighting System
  // Ambient light for general illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(5, 5, 2);
  directionalLight.castShadow = true;

  // Improve shadow quality
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.bias = -0.0001;
  scene.add(directionalLight);

  // Add point lights around the scene for local illumination
  const pointLights = [
    { position: [3, 2, 3], color: 0xffcc77, intensity: 0.3 },
    { position: [-3, 2, -3], color: 0x77ccff, intensity: 0.3 },
    { position: [3, 2, -3], color: 0xff77cc, intensity: 0.3 },
    { position: [-3, 2, 3], color: 0x77ffcc, intensity: 0.3 },
  ];

  pointLights.forEach((light) => {
    const pointLight = new THREE.PointLight(light.color, light.intensity, 6);
    pointLight.position.set(...light.position);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 512;
    pointLight.shadow.mapSize.height = 512;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 10;
    scene.add(pointLight);

    // Add light helper sphere (optional, for debugging)
    // const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    // const sphereMaterial = new THREE.MeshBasicMaterial({ color: light.color });
    // const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // sphere.position.copy(pointLight.position);
    // scene.add(sphere);
  });

  // Configure renderer for better shadows
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  // Ground - with grass texture
  const textureLoader = new THREE.TextureLoader();

  // Load grass textures
  const grassTexture = textureLoader.load(
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/terrain/grasslight-big.jpg"
  );
  const grassNormal = textureLoader.load(
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/terrain/grasslight-big-nm.jpg"
  );

  // Configure texture wrapping and repeat
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(4, 4);

  grassNormal.wrapS = THREE.RepeatWrapping;
  grassNormal.wrapT = THREE.RepeatWrapping;
  grassNormal.repeat.set(4, 4);

  const groundGeometry = new THREE.PlaneGeometry(10, 10, 32, 32);
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.6,
    metalness: 0.1,
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
  // Create dog-related items in the scene
  const items = [
    {
      geometry: new THREE.SphereGeometry(0.15, 16, 16),
      color: 0xff6b6b,
      type: "ball",
      animation: "bounce",
      scale: 1,
    },
    {
      geometry: new THREE.CylinderGeometry(0.2, 0.3, 0.15, 16),
      color: 0xe3dac9,
      type: "bowl",
      animation: "static",
      scale: 1,
    },
    {
      geometry: new THREE.BoxGeometry(0.4, 0.2, 0.15),
      color: 0xf5d0c5,
      type: "bone",
      animation: "spin",
      scale: 1,
    },
    {
      geometry: new THREE.ConeGeometry(0.15, 0.3, 16),
      color: 0x4a90e2,
      type: "toy",
      animation: "float",
      scale: 1,
    },
    {
      geometry: new THREE.BoxGeometry(0.25, 0.25, 0.25),
      color: 0x7bed9f,
      type: "treat",
      animation: "rotate",
      scale: 0.8,
    },
  ];

  // Create multiple items at random positions
  for (let i = 0; i < 20; i++) {
    const itemType = items[i % items.length];
    const material = new THREE.MeshStandardMaterial({
      color: itemType.color,
      emissive: itemType.color,
      emissiveIntensity: 0.1,
      roughness: 0.3,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(itemType.geometry, material);

    // Random position within a circle
    const radius = 4;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius * Math.random();
    const z = Math.sin(angle) * radius * Math.random();

    mesh.position.set(x, 0.25, z);
    mesh.scale.multiplyScalar(itemType.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = itemType.type;
    mesh.userData.animation = itemType.animation;
    mesh.userData.startY = mesh.position.y;
    mesh.userData.startTime = Math.random() * Math.PI * 2;
    mesh.userData.rotationSpeed = 0.5 + Math.random();

    scene.add(mesh);
    environmentItems.push(mesh);
  }

  // Create a dog house
  const houseWidth = 1.5;
  const houseHeight = 1.2;
  const houseDepth = 1.5;

  const dogHouse = new THREE.Group();

  // Main house body
  const houseGeometry = new THREE.BoxGeometry(
    houseWidth,
    houseHeight,
    houseDepth
  );
  const houseMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.2,
  });
  const house = new THREE.Mesh(houseGeometry, houseMaterial);
  house.position.y = houseHeight / 2;
  house.castShadow = true;
  house.receiveShadow = true;

  // Roof
  const roofGeometry = new THREE.ConeGeometry(
    houseWidth * 0.7,
    houseHeight * 0.5,
    4
  );
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x654321,
    roughness: 0.9,
    metalness: 0.1,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = houseHeight + houseHeight * 0.25;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;

  // Door frame
  const doorWidth = houseWidth * 0.4;
  const doorHeight = houseHeight * 0.6;
  const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.7,
    metalness: 0.3,
  });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, doorHeight / 2, houseDepth / 2);

  dogHouse.add(house);
  dogHouse.add(roof);
  dogHouse.add(door);

  // Position the dog house
  dogHouse.position.set(-3, 0, -3);
  scene.add(dogHouse);
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

  // Update controls
  controls.update();

  // Animate environment items
  const time = Date.now() * 0.001;
  environmentItems.forEach((item) => {
    switch (item.userData.animation) {
      case "bounce":
        item.position.y =
          item.userData.startY +
          Math.abs(Math.sin(time + item.userData.startTime)) * 0.5;
        item.rotation.y += 0.02;
        break;
      case "static":
        // No animation for static items like the bowl
        break;
      case "spin":
        item.rotation.z = time * item.userData.rotationSpeed;
        item.position.y =
          item.userData.startY + Math.sin(time + item.userData.startTime) * 0.1;
        break;
      case "float":
        item.position.y =
          item.userData.startY + Math.sin(time + item.userData.startTime) * 0.3;
        item.rotation.x = Math.sin(time + item.userData.startTime) * 0.2;
        item.rotation.z = Math.cos(time + item.userData.startTime) * 0.2;
        break;
      case "rotate":
        item.rotation.y = time * item.userData.rotationSpeed;
        item.position.y =
          item.userData.startY + Math.sin(time + item.userData.startTime) * 0.2;
        break;
    }
  });

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
      // Random wandering movement
      const wanderRadius = 3;
      const wanderSpeed = 0.3;

      // Calculate target position using time-based sine waves with different frequencies
      const targetX =
        Math.sin(time * 0.4) * Math.cos(time * 0.3) * wanderRadius;
      const targetZ =
        Math.cos(time * 0.3) * Math.sin(time * 0.5) * wanderRadius;

      // Smoothly move towards target
      dog.position.x += (targetX - dog.position.x) * 0.02;
      dog.position.z += (targetZ - dog.position.z) * 0.02;
      dog.position.y = baseHeight + Math.sin(time * 2) * 0.05; // Gentle bobbing

      // Rotate to face movement direction
      const angle = Math.atan2(
        targetX - dog.position.x,
        targetZ - dog.position.z
      );
      dog.rotation.y = angle;
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
  if (item) {
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
