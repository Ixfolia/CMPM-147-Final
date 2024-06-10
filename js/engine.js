"use strict";

/* global p5 */
/* exported preload, setup, draw, mouseClicked */

// Project base code provided by {amsmith,ikarth}@ucsc.edu

let tile_width_step_main; // A width step is half a tile's width
let tile_height_step_main; // A height step is half a tile's height

// Global variables. These will mostly be overwritten in setup().
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

let currentKeyPressed = null; // Variable to track the currently pressed key

let farmer;
let walk_up;
let walk_down;
let walk_left;
let walk_right;
let idle_up;
let idle_down;
let idle_left;
let idle_right;
let lastPressedKey = 83;
// Define a cooldown period in milliseconds
const cooldownDuration = 100; // .1 second

// Define variables to track cooldown
let cooldownActive = false;
let cooldownStartTime = 0;

let obstacles = {};


let mainMenu;
let showText = true;
let startScreen = true;
let buildScreen = false;
let upgradeScreen = false;
let sellScreen = false;

let currentDay = 0; // Initialize day counter
let lastPhase = false; // Initialize to track the last phase of the cycle

// let boxes;
let inventory;

// variables for states
let createdBuildButtons = false;
let createdBuildingButtons = false;
let upgradeHouseButton;
let houseButton;
let farmTileButton;
let stonePathButton;
let fenceButton;
let pathButton;
let seedsButton;
let upgradeHouseButton2;
let houseButton2;
let farmTileButton2;
let stonePathButton2;
let fenceButton2;
let pathButton2;
let seedsButton2;
let xButton;
let building = false;
let cancelButton;
let state;

// variables for upgrading house
let createdUpgradeButtons = false;
let house1Button;
let house2Button;
let house3Button;
let checkButton;

let houseKey;
let houseType = null;
let houseNotChosen = false;

// variable for sell/inventory
let harvestedCropsTilesheet;
let createdSellButtons = false;
let beansButton;
let blueberryButton;
let carrotButton;
let cauliflowerButton;
let cornButton;
let eggplantButton;
let parsnipButton;
let potatoButton;
let pumpkinButton;
let radishButton;
let strawberryButton;
let tomatoButton;

let sellButton;
let sellingCrop;

// variables for text gen
let interactionText = '';
let interactionTextTimer = 0;
const interactionTextDuration = 100;

/////////////////////////////
// Transforms between coordinate systems
// These are actually slightly weirder than in full 3d...
/////////////////////////////
function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
  let x = world_x * tile_width_step_main - camera_x;
  let y = world_y * tile_height_step_main - camera_y;
  return [x, y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * tile_width_step_main;
  let j = world_y * tile_height_step_main;
  return [i, j];
}

function tileRenderingOrder(offset) {
  return [offset[1] - offset[0], offset[0] + offset[1]];
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
  let x = Math.floor((screen_x + camera_x) / tile_width_step_main);
  let y = Math.floor((screen_y + camera_y) / tile_height_step_main);
  return [x, y];
}

function cameraToWorldOffset([camera_x, camera_y]) {
  let world_x = camera_x / tile_width_step_main;
  let world_y = camera_y / tile_height_step_main;
  return { x: Math.round(world_x), y: Math.round(world_y) };
}

function worldOffsetToCamera([world_x, world_y]) {
  let camera_x = world_x * tile_width_step_main;
  let camera_y = world_y * tile_height_step_main;
  return new p5.Vector(camera_x, camera_y);
}

function preload() {
  if (window.p3_preload) {
    window.p3_preload();
  }

  walk_up = loadImage("./assets/farmer_movement.png");
  walk_down = loadImage("./assets/farmer_movement.png");
  walk_left = loadImage("./assets/farmer_movement.png");
  walk_right = loadImage("./assets/farmer_movement.png");
  idle_up = loadImage("./assets/farmer_movement.png");
  idle_down = loadImage("./assets/farmer_movement.png");
  idle_left = loadImage("./assets/farmer_movement.png");
  idle_right = loadImage("./assets/farmer_movement.png");

  harvestedCropsTilesheet = loadImage("./assets/buttons/harvestedCrops.png");

  mainMenu = loadImage("./assets/mainmenu.png");
}

function setup() {
  let canvas = createCanvas(800, 400);
  canvas.parent("container");
  canvas.elt.getContext("2d").imageSmoothingEnabled = false;

  // Center the camera offset
  camera_offset = new p5.Vector(width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  // Initialize player position
  player = createVector(width / 2, height / 2);
  playerPosition = screenToWorld(
    [player.x, player.y],
    [camera_offset.x, camera_offset.y]
  );

  if (window.p3_setup) {
    window.p3_setup();
  }

  // Create a container div for the select element
  // let selectContainer = createDiv();
  // selectContainer.parent("container"); // Append it to the same parent as the canvas

  //   // Create a select element
  //   let select = createSelect();
  //   select.parent(selectContainer);

  //   // Add options for each variable
  //   select.option('', '');
  //   select.option('House', 'placingHouse');
  //   select.option('Upgrade House', 'upgradeHouse');
  //   select.option('Path Tiles', 'placingPathTiles');
  //   select.option('Farm Tiles', 'placingFarmTiles');
  //   select.option('Fence', 'placingFence');
  //   select.option('Stone Path', 'placingStonePaths');
  //   select.option('Plant Seeds', 'planting');

  //   // Function to be called when selection changes
  //   function selectionChanged() {
  //     let selectedVariable = select.value();
  //     // Call your function based on the selected variable
  //     console.log(selectedVariable);
  //     action(selectedVariable); // Call test function with the selected value
  //   }

  //   // Add an event listener for selection change
  //   select.changed(selectionChanged);

  // // Get all the boxes
  // boxes = document.getElementsByClassName("box");

  // // Tracking last clicked box
  // let lastClickedBox = null;

  // // Mapping from box text content to newState values
  // let newStateMapping = {
  //   None: "",
  //   House: "placingHouse",
  //   "Upgrade House": "upgradeHouse",
  //   "Path Tiles": "placingPathTiles",
  //   "Farm Tiles": "placingFarmTiles",
  //   "Fence | 1x Wood": "placingFence",
  //   "Stone Paths | 1x Stone": "placingStonePaths",
  //   "Plant Seeds | 1x Seed": "planting",
  // };

  // for (var i = 0; i < boxes.length; i++) {
  //   // Add a click event listener to each box
  //   boxes[i].addEventListener("click", function () {
  //     // This function will be executed when the box is clicked
  //     // 'this' refers to the box that was clicked

  //     // If there was a last clicked box, change its background color back to white
  //     if (lastClickedBox) {
  //       lastClickedBox.style.backgroundColor = "white";
  //     }

  //     // Change the background color of the clicked box to yellow
  //     this.style.backgroundColor = "yellow";

  //     // Update the last clicked box
  //     lastClickedBox = this;

  //     // Get the newState value from the mapping
  //     var newState = newStateMapping[this.textContent.trim()];

  //     // Call the action function with the newState value
  //     action(newState);
  //   });
  // }

  // resetAction();

  let label = createP();
  label.html("World key: ");
  label.parent("paragraph-container");

  let input = createInput("xyzzy");
  input.parent(label);
  input.input(() => {
    rebuildWorld(input.value());
  });

  rebuildWorld(input.value());

  farmer = new Sprite(walk_down, width / 2, height / 2, 0);

  // inventory and build button
  let buildButton = createImg("./assets/buttons/buildButton.png", "build Button");
  buildButton.position(width - 16 - 4 + width/20, height + height/3.5 - 4 + height/3.5);
  buildButton.size(48, 48)
  buildButton.mouseClicked(() => {
    buildScreen = true;

    // remove sellScreen elements
    if (sellScreen) {
      xButton.elt.click();
    }

    // remove upgradeScreen elements
    if (upgradeScreen) {
      xButton.elt.click();
    }
    
    //remove building elements
    if (building) {
      cancelButton.elt.click();
      createdBuildingButtons = false;
    }
  });
  
  let inventoryButton = createImg("./assets/buttons/inventoryButton.png", "inventopry Button");
  inventoryButton.position(width - 16 - 4 * 2 - 48 + width/20, height + height/3.5 - 4 + height/3.5);
  inventoryButton.size(48, 48)
  inventoryButton.mouseClicked(() => {
    sellScreen = true;

    // remove upgradeScreen elements
    if (upgradeScreen) {
      xButton.elt.click();
    }

    // remove buildScreen elements
    if (buildScreen) {
      xButton.elt.click();
    }
  });

  strokeWeight(1);
}

function rebuildWorld(key) {
  if (window.p3_worldKeyChanged) {
    window.p3_worldKeyChanged(key);
  }
  tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
  tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 32;
  tile_columns = Math.ceil(width / tile_width_step_main);
  tile_rows = Math.ceil(height / tile_height_step_main);
}

function mouseClicked() {
  if (startScreen) {
    startScreen = false;
  }
  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );

  if (window.p3_tileClicked) {
    window.p3_tileClicked(world_pos[0], world_pos[1]);
  }
  return false;
}

function draw() {
  if (startScreen) {
    background(mainMenu);
  } else {
    setTimeout(() => {
      showText = false;
    }, 4000);
    updateGathering();

    // Calculate the center of the screen
    let screen_center_x = width / 2;
    let screen_center_y = height / 2;

    // Keyboard controls!
    let gatheringState = getResourceInfo();
    if (gatheringState[3] === false) {
      let unwalkableTiles = getResourceInfo();
      rocks = unwalkableTiles[4];
      trees = unwalkableTiles[5];
      deadtrees = unwalkableTiles[6];
      houses = unwalkableTiles[7];
      water = unwalkableTiles[8];
      fences = unwalkableTiles[9];

      if (!cooldownActive) {
        if (
          keyIsDown(65) &&
          !keyIsDown(68) &&
          !keyIsDown(83) &&
          !keyIsDown(87)
        ) {
          // A key (move left)
          let collisionDetected = false;

          for (let key in obstacles) {
            // Collision detection logic
            if (
              player.x - 32 < obstacles[key].x + 32 / 2 &&
              player.x + 0 + -8 > obstacles[key].x - 32 / 2 &&
              player.y - 32 + 8 < obstacles[key].y + 32 / 2 &&
              player.y + 0 + -8 > obstacles[key].y - 32 / 2
            ) {
              // fill(255, 0, 0);
              // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
              // noFill();
              // console.log("Collision detected!");
              camera_velocity.x = 0;
              collisionDetected = true;
              // Activate cooldown
              cooldownActive = true;
              cooldownStartTime = millis();
              break;
            }
          }

          if (!collisionDetected) {
            // Movement logic for the A key
            farmer.sheet = walk_left;
            farmer.row = 2;
            lastPressedKey = 65;
            camera_velocity.x = -3;
            camera_velocity.y = 0;
          }
        } else if (
          keyIsDown(68) &&
          !keyIsDown(65) &&
          !keyIsDown(83) &&
          !keyIsDown(87)
        ) {
          // D key (move right)
          let collisionDetected = false;

          for (let key in obstacles) {
            // Collision detection logic
            if (
              player.x - 32 + 8 < obstacles[key].x + 32 / 2 &&
              player.x + 0 > obstacles[key].x - 32 / 2 &&
              player.y - 32 + 8 < obstacles[key].y + 32 / 2 &&
              player.y + 0 + -8 > obstacles[key].y - 32 / 2
            ) {
              // fill(255, 0, 0);
              // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
              // noFill();
              // console.log("Collision detected!");
              camera_velocity.x = 0;
              collisionDetected = true;
              break;
            }
          }

          if (!collisionDetected) {
            // Movement logic for the D key
            farmer.sheet = walk_right;
            farmer.row = 3;
            lastPressedKey = 68;
            camera_velocity.x = 3;
            camera_velocity.y = 0;
          }
        } else if (
          keyIsDown(83) &&
          !keyIsDown(65) &&
          !keyIsDown(68) &&
          !keyIsDown(87)
        ) {
          // S key (move down)
          let collisionDetected = false;

          for (let key in obstacles) {
            // Collision detection logic
            if (
              player.x - 32 + 8 < obstacles[key].x + 32 / 2 &&
              player.x + 0 + -8 > obstacles[key].x - 32 / 2 &&
              player.y - 32 + 8 < obstacles[key].y + 32 / 2 &&
              player.y + 0 > obstacles[key].y - 32 / 2
            ) {
              // fill(255, 0, 0);
              // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
              // noFill();
              // console.log("Collision detected!");
              camera_velocity.y = 0;
              collisionDetected = true;
              break;
            }
          }

          if (!collisionDetected) {
            // Movement logic for the D key
            farmer.sheet = walk_down;
            farmer.row = 0;
            lastPressedKey = 83;
            camera_velocity.y = 3;
            camera_velocity.x = 0;
          }
        } else if (
          keyIsDown(87) &&
          !keyIsDown(65) &&
          !keyIsDown(68) &&
          !keyIsDown(83)
        ) {
          // W key (move up)
          let collisionDetected = false;

          for (let key in obstacles) {
            // Collision detection logic
            if (
              player.x - 32 + 8 < obstacles[key].x + 32 / 2 &&
              player.x + 0 + -8 > obstacles[key].x - 32 / 2 &&
              player.y - 32 < obstacles[key].y + 32 / 2 &&
              player.y + 0 + -8 > obstacles[key].y - 32 / 2
            ) {
              // fill(255, 0, 0);
              // rect(obstacles[key].x, obstacles[key].y, tile_width_step_main, tile_height_step_main);
              // noFill();
              // console.log("Collision detected!");
              camera_velocity.y = 0;
              collisionDetected = true;
              break;
            }
          }

          if (!collisionDetected) {
            // Movement logic for the D key
            farmer.sheet = walk_up;
            farmer.row = 1;
            lastPressedKey = 87;
            camera_velocity.y = -3;
            camera_velocity.x = 0;
          }
        } else {
          camera_velocity.x = 0;
          camera_velocity.y = 0;
          if (lastPressedKey === 65) {
            farmer.sheet = idle_left;
            farmer.row = 6;
          }
          if (lastPressedKey === 68) {
            farmer.sheet = idle_right;
            farmer.row = 7;
          }
          if (lastPressedKey === 83) {
            farmer.sheet = idle_down;
            farmer.row = 4;
          }
          if (lastPressedKey === 87) {
            farmer.sheet = idle_up;
            farmer.row = 5;
          }
        }
      } else {
        camera_velocity.x = 0;
        camera_velocity.y = 0;
        if (lastPressedKey === 65) {
          farmer.sheet = idle_left;
          farmer.row = 6;
        }
        if (lastPressedKey === 68) {
          farmer.sheet = idle_right;
          farmer.row = 7;
        }
        if (lastPressedKey === 83) {
          farmer.sheet = idle_down;
          farmer.row = 4;
        }
        if (lastPressedKey === 87) {
          farmer.sheet = idle_up;
          farmer.row = 5;
        }
      }

      // Check and update cooldown status
      if (cooldownActive) {
        const elapsedTime = millis() - cooldownStartTime;
        if (elapsedTime >= cooldownDuration) {
          // Cooldown period has elapsed, reset cooldown status
          cooldownActive = false;
        }
      }
    }

    // Update player's tile coordinates
    playerPosition = screenToWorld(
      [player.x, player.y],
      [camera_offset.x, camera_offset.y]
    );

    let camera_delta = new p5.Vector(0, 0);
    camera_velocity.add(camera_delta);
    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.9); // cheap easing
    if (camera_velocity.mag() < 0.01) {
      camera_velocity.setMag(0);
    }

    let world_pos = screenToWorld(
      [mouseX, mouseY], // Use screen center instead of mouse position
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    background(100);

    if (window.p3_drawBefore) {
      window.p3_drawBefore();
    }

    // Adjust the drawing boundaries to center the loaded area
    let y0 = Math.floor(
      (screen_center_y - height * 0.6) / tile_height_step_main
    ); // Adjust the factor to control the loaded area size
    let y1 = Math.ceil(
      (screen_center_y + height * 0.6) / tile_height_step_main
    );
    let x0 = Math.floor((screen_center_x - width * 0.6) / tile_width_step_main);
    let x1 = Math.ceil((screen_center_x + width * 0.6) / tile_width_step_main);

    // draw biome tiles
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(
          [x + world_offset.x, y + world_offset.y],
          [camera_offset.x, camera_offset.y]
        );
      }
    }

    // draw trees and stone (top)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTileAfter(
          [x + world_offset.x, y + world_offset.y],
          [camera_offset.x, camera_offset.y]
        );
      }
    }

    // Draw the player at the center of the screen
    farmer.draw();

    // Draw the player's rectangle
    // noFill()
    // stroke(255, 0, 0)
    // strokeWeight(3)
    // rect(player.x - tile_width_step_main / 2, player.y - tile_height_step_main / 2, tile_width_step_main, tile_height_step_main);  // hitbox

    // draw trees and stone (bot)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTileAfter2(
          [x + world_offset.x, y + world_offset.y],
          [camera_offset.x, camera_offset.y]
        );
      }
    }

    // Display the player's position at the top-left corner of the screen
    fill(0);
    text(`(${playerPosition[0]}, ${playerPosition[1]})`, 70, 30);

    // // gathering text
    // if (gathering) {
    //   fill(0);
    //   text("Gathering...", width / 2, 20);
    //   noFill();
    // }

    if (showText) {
      fill(0);
      textAlign(CENTER, TOP);
      textSize(14);
      text("Your grandpa passed, leaving you his farm. You honor him by farming just as he taught.", width / 2 - 10, height - 90);
    }

    if (interactionTextTimer > 0 && !showText) {
      console.log("Displaying interaction text:", interactionText);
      fill(0);
      textAlign(CENTER, TOP);
      textSize(12);
      text(interactionText, width / 2 - 10, height - 90);
      interactionTextTimer--;
    }

    // Display resources UI
    textSize(24);
    inventory = getResourceInfo();
    text(`x${inventory[0]}`, width - 30, 25);
    let wood = image(resourceTilesheet, width - 90, 10, 32, 32, 0, 0, 32, 32);
    text(`x${inventory[1]}`, width - 30, 65);
    let stone = image(resourceTilesheet, width - 90, 50, 32, 32, 32, 0, 32, 32);
    text(`x${inventory[2]}`, width - 30, 105);
    let seed = image(resourceTilesheet, width - 90, 90, 32, 32, 0, 32, 32, 32);
    text(`$${inventory[11]}`, width - 30, 145);

    noStroke();
    noFill();

    // Draw rectangles around rocks
    for (let key in rocks) {
      if (rocks[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around rock
        obstacles[key] = { x, y };
      }
    }

    // Draw rectangles around trees
    for (let key in trees) {
      if (trees[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around trees
        obstacles[key] = { x, y };
      }
    }

    // Draw rectangles around deadtrees
    for (let key in deadtrees) {
      if (deadtrees[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around deadtrees
        obstacles[key] = { x, y };
      }
    }

    // Draw rectangles around houses
    for (let key in houses) {
      if (houses[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around houses
        obstacles[key] = { x, y };
      }
    }

    // Draw rectangles around water
    for (let key in water) {
      if (water[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around water
        obstacles[key] = { x, y };
      }
    }

    // Draw rectangles around fences
    for (let key in fences) {
      if (fences[key]) {
        // Check if there is a rock at this position
        let position = key.split(",").map(Number); // Convert key to [x, y] array
        let x = position[0] * tile_width_step_main - camera_offset.x; // Calculate world x-coordinate adjusted by camera offset
        let y = position[1] * tile_height_step_main - camera_offset.y; // Calculate world y-coordinate adjusted by camera offset
        // noFill();
        // stroke(255, 0, 0);
        // strokeWeight(3);
        // rect(x, y, tile_width_step_main, tile_height_step_main); // Draw rectangle around fences
        obstacles[key] = { x, y };
      }
    }

    noStroke();

    //day/night cycle
    let dayColor = color(255, 255, 255, 0);
    let nightColor = color(0, 0, 0, 168);
    let currentColor;

    let timeInMinutes = 5;
    let cycleTime = timeInMinutes * 60 * 1000;

    // parts of the day/night are split into quarters
    if (millis() % cycleTime < cycleTime / 4) {
      //9am - 3pm
      currentColor = lerpColor(dayColor, dayColor, 1);
      if (lastPhase) {
        lastPhase = false;
        currentDay++;
        console.log("Day: " + currentDay);
        growCrops();
      }
    } else if (millis() % cycleTime < cycleTime / 2) {
      //3pm - 9pm
      dayColor = color(0, 0, 20, 0); // shade of blue before night
      currentColor = lerpColor(
        dayColor,
        nightColor,
        (millis() % (cycleTime / 4)) / (cycleTime / 4)
      );
    } else if (millis() % cycleTime < (cycleTime * 3) / 4) {
      //9pm - 3am
      currentColor = lerpColor(nightColor, nightColor, 1);
    } else {
      //3am - 9am
      dayColor = color(20, 20, 0, 0); // shade of yellow before morning
      currentColor = lerpColor(
        nightColor,
        dayColor,
        (millis() % (cycleTime / 4)) / (cycleTime / 4)
      );
      lastPhase = true;
    }

    background(currentColor);

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]); // Draw cursor on top

    // if (window.p3_drawAfter) {
    //   window.p3_drawAfter();
    // }
  }

  // build info
  if (building) {
    stroke(0, 0, 0);
    fill ("#AEAEAE");
    beginShape();
    strokeWeight(2);
    //translate(width - 16 - 4, height + height/3.5 - 4); // Center the tile around the cursor
    vertex((width - 114) + 0, (height - 118) + 0); // Top-left corner
    vertex((width - 114) + 100, (height - 118) + 0); // Top-right corner
    vertex((width - 114) + 100, (height - 118) + 48); // Bottom-right corner
    vertex((width - 114) + 0, (height - 118) + 48); // Bottom-left corner
    endShape(CLOSE);

    if (!createdBuildingButtons){
      createBuildingButtons();
    }

    strokeWeight(1);
    textAlign(CENTER, CENTER);
    textSize(24);
    noStroke();
    noFill();
  }

  // build Screen
  if (buildScreen) {
    stroke(0, 0, 0);
    fill ("#AEAEAE");
    beginShape();
    translate(width/8, height/8); // Center the tile around the cursor
    vertex(0, 0); // Top-left corner
    vertex(width - width/4, 0); // Top-right corner
    vertex(width - width/4, height - height/4); // Bottom-right corner
    vertex(0, height - height/4); // Bottom-left corner
    endShape(CLOSE);

    fill (0);
    text("Build", 48, height / 12);

    textSize(12);
    textAlign(LEFT, CENTER);
    text("Build House", 24, height/4 + 64)
    text("Upgrade\nHouse", 24 + 24 * 1 + 64 * 1, height/4 + 64)
    text("Path", 24 + 24 * 2 + 64 * 2, height/4 + 64)
    text("Farm\nTile", 24 + 24 * 2 + 12 + 64 * 3, height/4 + 64)
    text("Plant\nSeeds", 24 + 24 * 3 + 64 * 4, height/4 + 64)
    text("Fences", 24 + 24 * 3 + 12 + 64 * 5, height/4 + 64)
    text("Stone\nPaths", 24 + 24 * 4 + 12 + 64 * 6, height/4 + 64)

    textAlign(CENTER, CENTER);
    textSize(24);
    noStroke();
    noFill();

    if (!createdBuildButtons){
      createBuildButtons();
    }
  }

  // upgrade Screen
  if (upgradeScreen) {
    stroke(0, 0, 0);
    fill ("#AEAEAE");
    beginShape();
    translate(width/8, height/8); // Center the tile around the cursor
    vertex(0, 0); // Top-left corner
    vertex(width - width/4, 0); // Top-right corner
    vertex(width - width/4, height - height/4); // Bottom-right corner
    vertex(0, height - height/4); // Bottom-left corner
    endShape(CLOSE);

    fill (0);
    text("Cost: 10x Wood   10x Stone", width / 4 - 32, height / 12);
    if (inventory[0] < 15 && inventory[1] < 15) {
      fill(216, 0, 0);
      stroke(216, 0, 0);
      textSize(12);
      text("Not Enough Resources!", width/2 + width / 8, height/2 + height / 10);
      textSize(24);
      fill(0);
      stroke(0);
    }
    else if (houseNotChosen) {
      fill(216, 0, 0);
      stroke(216, 0, 0);
      textSize(12);
      text("Choose a House!", width/2 + width / 7, height/2 + height / 10);
      textSize(24);
      fill(0);
      stroke(0);
    }

    if (houseType === 1) {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/4 + 16, height/4 - 32); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(128 + 32, 0); // Top-right corner
      vertex(128 + 32, 128 + 32); // Bottom-right corner
      vertex(0, 128 + 32); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
    }

    else if (houseType === 2) {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/4 + 16 - width/4, height/4 - 32); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(128 + 32, 0); // Top-right corner
      vertex(128 + 32, 128 + 32); // Bottom-right corner
      vertex(0, 128 + 32); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
    }

    else if (houseType === 3) {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/4 + 16 + width/4, height/4 - 32); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(128 + 32, 0); // Top-right corner
      vertex(128 + 32, 128 + 32); // Bottom-right corner
      vertex(0, 128 + 32); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
    }
    else {
      beginShape();
      noFill();
      vertex(0, 0); // Top-left corner
      endShape(CLOSE);
    }

    noStroke();
    noFill();

    if (!createdUpgradeButtons){
      createUpgradeButtons();
    }
  }

  // sell/inventory Screen
  if (sellScreen) {
    stroke(0, 0, 0);
    fill ("#AEAEAE");
    beginShape();
    translate(width/8, height/8); // Center the tile around the cursor
    vertex(0, 0); // Top-left corner
    vertex(width - width/4, 0); // Top-right corner
    vertex(width - width/4, height - height/4); // Bottom-right corner
    vertex(0, height - height/4); // Bottom-left corner
    endShape(CLOSE);

    fill (0);
    text("Inventory", width / 10 - 12, height / 12);

    // inventory quantity
    let cropsInventory = getResourceInfo();
    let cropQuantity = cropsInventory[10]

    textSize(8)
    text(`${cropQuantity["beans"]}`, width/2 - 16 * 4 - 64 * 4 + 8, height - height/3 + 16 * 2 - 64 * 3 + 4);
    text(`${cropQuantity["blueberry"]}`, width/2 - 16 * 3 - 64 * 3 + 8, height - height/3 + 16 * 2 - 64 * 3 + 4);
    text(`${cropQuantity["carrot"]}`, width/2 - 16 * 2 - 64 * 2 + 8, height - height/3 + 16 * 2 - 64 * 3 + 4);
    text(`${cropQuantity["cauliflower"]}`, width/2 - 16 * 1 - 64 * 1 + 8, height - height/3 + 16 * 2 - 64 * 3 + 4);
    text(`${cropQuantity["corn"]}`, width/2 - 16 * 4 - 64 * 4 + 8, height - height/3 + 16 * 3 - 64 * 2 + 4);
    text(`${cropQuantity["eggplant"]}`, width/2 - 16 * 3 - 64 * 3 + 8, height - height/3 + 16 * 3 - 64 * 2 + 4);
    text(`${cropQuantity["parsnip"]}`, width/2 - 16 * 2 - 64 * 2 + 8, height - height/3 + 16 * 3 - 64 * 2 + 4);
    text(`${cropQuantity["potato"]}`, width/2 - 16 * 1 - 64 * 1 + 8, height - height/3 + 16 * 3 - 64 * 2 + 4);
    text(`${cropQuantity["pumpkin"]}`, width/2 - 16 * 4 - 64 * 4 + 8, height - height/3 + 16 * 4 - 64 * 1 + 4);
    text(`${cropQuantity["radish"]}`, width/2 - 16 * 3 - 64 * 3 + 8, height - height/3 + 16 * 4 - 64 * 1 + 4);
    text(`${cropQuantity["strawberry"]}`, width/2 - 16 * 2 - 64 * 2 + 8, height - height/3 + 16 * 4 - 64 * 1 + 4);
    text(`${cropQuantity["tomato"]}`, width/2 - 16 * 1 - 64 * 1 + 8, height - height/3 + 16 * 4 - 64 * 1 + 4);

    textSize(24)

    // box to contain item to sell
    beginShape();
    strokeWeight(2);
    noFill();
    translate(width/2 - 16, height/7 - 8) // Center the tile around the cursor
    vertex(0, 0); // Top-left corner
    vertex(192, 0); // Top-right corner
    vertex(192, 192); // Bottom-right corner
    vertex(0, 192); // Bottom-left corner
    endShape(CLOSE);
    strokeWeight(1);
    translate(-(width/2 - 16), -(height/7 - 8))

    // box to contain items
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/40, height/7 - 8); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(320, 0); // Top-right corner
      vertex(320, 232); // Bottom-right corner
      vertex(0, 232); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);

      if (cropQuantity[sellingCrop] <= 0) {
        fill(216, 0, 0);
        stroke(216, 0, 0);
        textSize(12);
        text("Not Enough \nItems To Sell", width/4 + width/4.6, height/2 + height / 20);
        textSize(24);
        fill(0);
        stroke(0);
      }

    if (sellingCrop === "beans") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 5 - 64 * 5 + 8, height/120 + 16 * 0); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44, 0, 192, 192, 2 * 16, 0 * 16, 16, 16);
    }

    else if (sellingCrop === "blueberry") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 4 - 64 * 4 + 8, height/120 + 16 * 0); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80, -4, 192, 192, 0 * 16, 2 * 16, 16, 16);
    }

    else if (sellingCrop === "carrot") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 3 - 64 * 3 + 8, height/120 + 16 * 0); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 2, -4, 192, 192, 0 * 16, 0 * 16, 16, 16);
    }

    else if (sellingCrop === "cauliflower") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 2 - 64 * 2 + 8, height/120 + 16 * 0); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 3, -4, 192, 192, 1 * 16, 0 * 16, 16, 16);
    }

    if (sellingCrop === "corn") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 5 - 64 * 5 + 8, height/120 + 16 * 1 + 64); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44, -80 - 4, 192, 192, 1 * 16, 2 * 16, 16, 16);
    }

    else if (sellingCrop === "eggplant") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 4 - 64 * 4 + 8, height/120 + 16 * 1 + 64); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80, -80 - 4, 192, 192, 2 * 16, 2 * 16, 16, 16);
    }

    else if (sellingCrop === "parsnip") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 3 - 64 * 3 + 8, height/120 + 16 * 1 + 64); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 2, -80 - 4, 192, 192, 0 * 16, 1 * 16, 16, 16);
    }

    else if (sellingCrop === "potato") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 2 - 64 * 2 + 8, height/120 + 16 * 1 + 64); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 3, -80 - 4, 192, 192, 1 * 16, 1 * 16, 16, 16);
    }

    if (sellingCrop === "pumpkin") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 5 - 64 * 5 + 8, height/120 + 16 * 2 + 64 * 2); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44, -80 * 2 - 4, 192, 192, 0 * 16, 3 * 16, 16, 16);
    }

    else if (sellingCrop === "radish") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 4 - 64 * 4 + 8, height/120 + 16 * 2 + 64 * 2); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80, -80 * 2 - 4, 192, 192, 1 * 16, 3 * 16, 16, 16);
    }

    else if (sellingCrop === "strawberry") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 3 - 64 * 3 + 8, height/120 + 16 * 2 + 64 * 2); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 2, -80 * 2 - 4, 192, 192, 2 * 16, 1 * 16, 16, 16);
    }

    else if (sellingCrop === "tomato") {
      beginShape();
      strokeWeight(2);
      noFill();
      translate(width/2 - 16 * 2 - 64 * 2 + 8, height/120 + 16 * 2 + 64 * 2); // Center the tile around the cursor
      vertex(0, 0); // Top-left corner
      vertex(64, 0); // Top-right corner
      vertex(64, 64); // Bottom-right corner
      vertex(0, 64); // Bottom-left corner
      endShape(CLOSE);
      strokeWeight(1);
      image(harvestedCropsTilesheet, width/2 - 44 - 80 * 3, -80 * 2 - 4, 192, 192, 2 * 16, 3 * 16, 16, 16);
    }
    else {
      beginShape();
      noFill();
      vertex(0, 0); // Top-left corner
      endShape(CLOSE);
    }

    noStroke();
    noFill();

    if (!createdSellButtons){
      createSellButtons();
    }
  }
}

function removeObstacle(key) {
  delete obstacles[key];
}

// Display a description of the tile at world_x, world_y.
function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  drawTileDescription([world_x, world_y], [screen_x, screen_y]);
}

function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawSelectedTile) {
    window.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Draw a tile, mostly by calling the user's drawing code.
function drawTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Draw a trees and stone
function drawTileAfter([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawAfter(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

function drawTileAfter2([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawAfter2(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Credits: https://www.youtube.com/watch?v=eE65ody9MdI
function Sprite(sheet, x, y, row) {
  this.sheet = sheet;
  this.scale = 1;
  this.x = x - 16;
  this.y = y - 16;
  this.h = sheet.height / 8; // Assuming totalRows is the number of rows in the spritesheet
  this.w = sheet.width / 4; // Assuming totalColumns is the number of columns in the spritesheet
  this.frame = 0;
  this.frames = 4; // Number of frames in a row
  this.row = row;

  this.draw = function () {
    // Calculate the x position on the spritesheet based on the current frame
    let sx = this.w * floor(this.frame);
    // Calculate the y position on the spritesheet based on the specified row
    let sy = this.h * this.row;
    image(
      this.sheet,
      this.x,
      this.y,
      this.w * this.scale,
      this.h * this.scale,
      sx,
      sy,
      this.w,
      this.h
    );
    this.frame += 0.1;
    if (this.frame >= this.frames) {
      this.frame = 0;
    }
  };
}

// function resetAction() {
//   boxes[0].click();
// }

function upgradeHouseUI(key) {
  upgradeScreen = true;
  houseKey = key;
}

function createBuildButtons() {
  createdBuildButtons = true;

  xButton = createImg("./assets/buttons/x.png", "x Button");
  xButton.position(width/2 + width/3 + 64, height + height/2.1);
  xButton.mouseClicked(() => {
    buildScreen = false;
    xButton.remove();
    houseButton.remove();
    upgradeHouseButton.remove();
    pathButton.remove();
    farmTileButton.remove();
    seedsButton.remove();
    fenceButton.remove();
    stonePathButton.remove();
    createdBuildButtons = false;
  });

  houseButton = createImg("./assets/buttons/house.png", "house Button");
  houseButton.position(width/4, height/20 + height);
  houseButton.mouseClicked(() => {
    action("placingHouse");
    state = "placingHouse";
    building = true;
    xButton.elt.click();
  });
  upgradeHouseButton = createImg("./assets/buttons/upgradeHouse.png", "upgradeHouse Button");
  upgradeHouseButton.position(width/4 + 16 * 1 + 64 * 1, height/20 + height);
  upgradeHouseButton.mouseClicked(() => {
    action("upgradeHouse");
    state = "upgradeHouse";
    building = true;
    xButton.elt.click();
  });
  pathButton = createImg("./assets/buttons/path.png", "path Button");
  pathButton.position(width/4 + 16 * 2 + 64 * 2, height/20 + height);
  pathButton.mouseClicked(() => {
    action("placingPathTiles");
    state = "placingPathTiles";
    building = true;
    xButton.elt.click();
  });
  farmTileButton = createImg("./assets/buttons/farmTile.png", "farmTile Button");
  farmTileButton.position(width/4 + 16 * 3 + 64 * 3, height/20 + height);
  farmTileButton.mouseClicked(() => {
    action("placingFarmTiles");
    state = "placingFarmTiles";
    building = true;
    xButton.elt.click();
  });
  seedsButton = createImg("./assets/buttons/seeds.png", "seeds Button");
  seedsButton.position(width/4 + 16 * 4 + 64 * 4, height/20 + height);
  seedsButton.mouseClicked(() => {
    action("planting");
    state = "planting";
    building = true;
    xButton.elt.click();
  });
  fenceButton = createImg("./assets/buttons/fence.png", "fence Button");
  fenceButton.position(width/4 + 16 * 5 + 64 * 5, height/20 + height);
  fenceButton.mouseClicked(() => {
    action("placingFence");
    state = "placingFence";
    building = true;
    xButton.elt.click();
  });
  stonePathButton = createImg("./assets/buttons/stonePath.png", "stonePath Button");
  stonePathButton.position(width/4 + 16 * 6 + 64 * 6, height/20 + height);
  stonePathButton.mouseClicked(() => {
    action("placingStonePaths");
    state = "placingStonePaths";
    building = true;
    xButton.elt.click();
  });
}

function createBuildingButtons() {
  createdBuildingButtons = true;

  if (state === "placingHouse") {
    houseButton2 = createImg("./assets/buttons/house.png", "house Button");
    houseButton2.size(48, 48)
    houseButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "upgradeHouse") {
    upgradeHouseButton2 = createImg("./assets/buttons/upgradeHouse.png", "upgradeHouse Button");
    upgradeHouseButton2.size(48, 48)
    upgradeHouseButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "placingPathTiles") {
    pathButton2 = createImg("./assets/buttons/path.png", "path Button");
    pathButton2.size(48, 48)
    pathButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "placingFarmTiles") {
    farmTileButton2 = createImg("./assets/buttons/farmTile.png", "farmTile Button");
    farmTileButton2.size(48, 48)
    farmTileButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "planting") {
    seedsButton2 = createImg("./assets/buttons/seeds.png", "seeds Button");
    seedsButton2.size(48, 48)
    seedsButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "placingFence") {
    fenceButton2 = createImg("./assets/buttons/fence.png", "fence Button");
    fenceButton2.size(48, 48)
    fenceButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  else if (state === "placingStonePaths") {
    stonePathButton2 = createImg("./assets/buttons/stonePath.png", "stonePath Button");
    stonePathButton2.size(48, 48)
    stonePathButton2.position(width - 32, height + height/1.77 - 10 - 48);
  }

  cancelButton = createImg("./assets/buttons/cancelButton.png", "cancel Button");
  cancelButton.position(width + 16, height + height/1.77 - 10 - 48);
  cancelButton.size(48, 48)
  cancelButton.mouseClicked(() => {
    cancelButton.remove();
    if (houseButton2) {
      houseButton2.remove();
    }
    if (upgradeHouseButton2) {
      upgradeHouseButton2.remove();
    }
    if (pathButton2) {
      pathButton2.remove();
    }
    if (farmTileButton2) {
      farmTileButton2.remove();
    }
    if (seedsButton2) {
      seedsButton2.remove();
    }
    if (fenceButton2) {
      fenceButton2.remove();
    }
    if (stonePathButton2) {
      stonePathButton2.remove();
    }
    building = false;
    createdBuildingButtons = false;
  });
}

function createUpgradeButtons() {
  createdUpgradeButtons = true;

  house1Button = createImg("./assets/buttons/house1.png", "house1 Button");
  house1Button.position(width/2 + 12, height + 24);
  house1Button.mouseClicked(() => houseType = 1);
  house2Button = createImg("./assets/buttons/house2.png", "house2 Button");
  house2Button.position(width/2 + 12 + width/4, height + 24);
  house2Button.mouseClicked(() => houseType = 3);
  house3Button = createImg("./assets/buttons/house3.png", "house3 Button");
  house3Button.position(width/2 + 12 - width/4, height + 24);
  house3Button.mouseClicked(() => houseType = 2);
  checkButton = createImg("./assets/buttons/check.png", "check Button");
  checkButton.position(width/2 + width/3 + 16, height + height/2.1);
  checkButton.size(36, 36)
  checkButton.mouseClicked(() => {
    if (houseType != null && inventory[0] >= 15 && inventory[1] >= 15) {
      upgradeScreen = false;
      checkButton.remove();
      xButton.remove();
      house1Button.remove();
      house2Button.remove();
      house3Button.remove();
      createdUpgradeButtons = false;
      setHouseType(houseKey, houseType);
      houseType = null;
      houseNotChosen = false;
      subtractHouseUpgradePayment();
    }
    else {
      houseNotChosen = true;
    }
  });
  xButton = createImg("./assets/buttons/x.png", "x Button");
  xButton.position(width/2 + width/3 + 64, height + height/2.1);
  xButton.mouseClicked(() => {
    upgradeScreen = false;
    checkButton.remove();
    xButton.remove();
    house1Button.remove();
    house2Button.remove();
    house3Button.remove();
    createdUpgradeButtons = false;
    houseType = null;
  });
}

function createSellButtons() {
  createdSellButtons = true;

  let cropsInventory = getResourceInfo();
  let cropQuantity = cropsInventory[10]

  sellButton = createImg("./assets/buttons/sellButton.png", "check Button");
  sellButton.position(width/2 + width/3.5, height + height/2.1);
  sellButton.mouseClicked(() => {
    if (cropQuantity[sellingCrop] > 0) {
      soldCrop(15, sellingCrop);
    }
  });
  beansButton = createImg("./assets/buttons/crops/beans.png", "beans Button");
  beansButton.position(width/2 - 16 * 4 - 64 * 2, height - height/3 + 16 * 0 + 64 * 2 - 8);
  beansButton.mouseClicked(() => sellingCrop = "beans");
  blueberryButton = createImg("./assets/buttons/crops/blueberry.png", "blueberry Button");
  blueberryButton.position(width/2 - 16 * 3 - 64 * 1, height - height/3 + 16 * 0 + 64 * 2 - 8);
  blueberryButton.mouseClicked(() => sellingCrop = "blueberry");
  carrotButton = createImg("./assets/buttons/crops/carrot.png", "carrot Button");
  carrotButton.position(width/2 - 16 * 2 - 64 * 0, height - height/3 + 16 * 0 + 64 * 2 - 8);
  carrotButton.mouseClicked(() => sellingCrop = "carrot");
  cauliflowerButton = createImg("./assets/buttons/crops/cauliflower.png", "cauliflower Button");
  cauliflowerButton.position(width/2 - 16 * 1 - 64 * -1, height - height/3 + 16 * 0 + 64 * 2 - 8);
  cauliflowerButton.mouseClicked(() => sellingCrop = "cauliflower");
  cornButton = createImg("./assets/buttons/crops/corn.png", "corn Button");
  cornButton.position(width/2 - 16 * 4 - 64 * 2, height - height/3 + 16 * 1 + 64 * 3 - 8);
  cornButton.mouseClicked(() => sellingCrop = "corn");
  eggplantButton = createImg("./assets/buttons/crops/eggplant.png", "eggplant Button");
  eggplantButton.position(width/2 - 16 * 3 - 64 * 1, height - height/3 + 16 * 1 + 64 * 3 - 8);
  eggplantButton.mouseClicked(() => sellingCrop = "eggplant");
  parsnipButton = createImg("./assets/buttons/crops/parsnip.png", "parsnip Button");
  parsnipButton.position(width/2 - 16 * 2 - 64 * 0, height - height/3 + 16 * 1 + 64 * 3 - 8);
  parsnipButton.mouseClicked(() => sellingCrop = "parsnip");
  potatoButton = createImg("./assets/buttons/crops/potato.png", "potato Button");
  potatoButton.position(width/2 - 16 * 1 - 64 * -1, height - height/3 + 16 * 1 + 64 * 3 - 8);
  potatoButton.mouseClicked(() => sellingCrop = "potato");
  pumpkinButton = createImg("./assets/buttons/crops/pumpkin.png", "pumpkin Button");
  pumpkinButton.position(width/2 - 16 * 4 - 64 * 2, height - height/3 + 16 * 2 + 64 * 4 - 8);
  pumpkinButton.mouseClicked(() => sellingCrop = "pumpkin");
  radishButton = createImg("./assets/buttons/crops/radish.png", "radish Button");
  radishButton.position(width/2 - 16 * 3 - 64 * 1, height - height/3 + 16 * 2 + 64 * 4 - 8);
  radishButton.mouseClicked(() => sellingCrop = "radish");
  strawberryButton = createImg("./assets/buttons/crops/strawberry.png", "strawberry Button");
  strawberryButton.position(width/2 - 16 * 2 - 64 * 0, height - height/3 + 16 * 2 + 64 * 4 - 8);
  strawberryButton.mouseClicked(() => sellingCrop = "strawberry");
  tomatoButton = createImg("./assets/buttons/crops/tomato.png", "tomato Button");
  tomatoButton.position(width/2 - 16 * 1 - 64 * -1, height - height/3 + 16 * 2 + 64 * 4 - 8);
  tomatoButton.mouseClicked(() => sellingCrop = "tomato");

  xButton = createImg("./assets/buttons/x.png", "x Button");
  xButton.position(width/2 + width/3 + 64, height + height/2.1);
  xButton.mouseClicked(() => {
    sellScreen = false;
    sellButton.remove();
    xButton.remove();
    beansButton.remove();
    blueberryButton.remove();
    carrotButton.remove();
    cauliflowerButton.remove();
    cornButton.remove();
    eggplantButton.remove();
    parsnipButton.remove();
    potatoButton.remove();
    pumpkinButton.remove();
    radishButton.remove();
    strawberryButton.remove();
    tomatoButton.remove();
    createdSellButtons = false;
  });
}


function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateInteraction(material) {
  const actions = {
      wood: ["chop down", "gather", "cut", "collect", "stack"],
      stone: ["mine", "quarry", "extract", "dig up", "gather"],
      seeds: ["plant", "sow", "scatter", "bury", "spread"]
  };

  const objects = {
      wood: ["a tree", "logs", "firewood", "timber", "branches"],
      stone: ["a boulder", "some rocks", "a slab of granite", "some limestone", "a chunk of marble"],
      seeds: ["tomato seeds", "corn seeds", "carrot seeds", "lettuce seeds", "pumpkin seeds"]
  };

  const results = {
      wood: ["you feel a sense of strength", "you recall grandpa's wisdom", "you remember cozy nights by the fire", "you feel connected to the land", "you are reminded of grandpa's hard work"],
      stone: ["you feel accomplished", "you recall grandpa's mining tales", "you remember grandpa's patience", "you feel like an explorer", "you feel a sense of discovery"],
      seeds: ["you feel hopeful for the harvest", "you remember grandpa's planting tips", "you are excited for new growth", "you feel a connection to the earth", "you remember grandpa's garden"]
  };

  const grandpaMemories = ["Grandpa would be proud.", "You recall grandpa's stories of the farm.", "Memories of grandpa fill your mind.", "You remember grandpa's wise words.", "Grandpa always knew the best spots."];

  let action, object, result;

  switch (material) {
      case 'wood':
          action = getRandomElement(actions.wood);
          object = getRandomElement(objects.wood);
          result = getRandomElement(results.wood);
          break;
      case 'stone':
          action = getRandomElement(actions.stone);
          object = getRandomElement(objects.stone);
          result = getRandomElement(results.stone);
          break;
      case 'seeds':
          action = getRandomElement(actions.seeds);
          object = getRandomElement(objects.seeds);
          result = getRandomElement(results.seeds);
          break;
      default:
          return "Invalid material type";
  }

  return `You ${action} ${object} and ${result}. ${getRandomElement(grandpaMemories)}`;
}