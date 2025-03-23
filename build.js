import { copyFile, mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

async function build() {
  try {
    // Create dist directory if it doesn't exist
    await mkdir("dist", { recursive: true });
    await mkdir("dist/assets", { recursive: true });

    // Read the HTML file
    let htmlContent = await readFile("index.html", "utf-8");

    // Update script sources to use the built files
    htmlContent = htmlContent
      .replace(
        'src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"',
        'src="https://unpkg.com/three@0.128.0/build/three.min.js"'
      )
      .replace(
        'src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"',
        'src="https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js"'
      )
      .replace(
        'src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"',
        'src="https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"'
      )
      .replace('src="./src/client.js"', 'src="./client.js"');

    // Write the modified HTML file
    await writeFile("dist/index.html", htmlContent);

    // Copy assets
    await copyFile("assets/dog.glb", "dist/assets/dog.glb");

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
