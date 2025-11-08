/**
 * INPUT HANDLER MODULE
 * Handles all user input including keyboard, gamepad, and automated movement systems
 */

/**
 * Emergency teleport function - costs health but moves player to random safe location
 */
function emergencyTeleport() {
    if (gameOver) return;

    // Check if player has enough health to use teleport (need more than 1 health)
    if (player.health <= 1) {
        console.log("Not enough health to use emergency teleport!");
        addEventMessage("Not enough health to teleport!", false, `${player.name} needs more than 1 health to use emergency teleport`);
        return;
    }

    // Find all empty floor tiles
    const emptyTiles = [];
    for (let y = 0; y < dynamicMapHeight; y++) {
        for (let x = 0; x < dynamicMapWidth; x++) {
            if (gameMap[y][x] === TILE_FLOOR) {
                // Check if tile is not occupied by an enemy
                const isOccupied = enemies.some(enemy => enemy.x === x && enemy.y === y);
                // Don't teleport to current position
                const isCurrentPosition = (x === player.x && y === player.y);
                // Don't teleport to stairs or key position
                const isStairs = (stairs.x === x && stairs.y === y);
                const isKey = (key && !key.collected && key.x === x && key.y === y);
                
                if (!isOccupied && !isCurrentPosition && !isStairs && !isKey) {
                    emptyTiles.push({ x, y });
                }
            }
        }
    }

    if (emptyTiles.length === 0) {
        console.log("No safe teleport locations available!");
        addEventMessage("No safe teleport locations!", false, `${player.name} cannot find a safe place to teleport`);
        return;
    }

    // Calculate health cost (half of current health, rounded up, minimum 1)
    const healthCost = Math.max(1, Math.ceil(player.health / 2));
    const oldHealth = player.health;
    const oldX = player.x;
    const oldY = player.y;

    // Apply health cost
    player.health -= healthCost;
    hitsTaken += 1; // Count as taking a hit for statistics

    // Pick random empty tile
    const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    
    // Start teleport animation
    teleportStartPos = { x: oldX, y: oldY };
    teleportEndPos = { x: randomTile.x, y: randomTile.y };
    teleportAnimationProgress = 0;
    teleportAnimationActive = true;

    // Update player position
    player.x = randomTile.x;
    player.y = randomTile.y;

    updateCameraPosition();
    console.log(`Emergency teleported from (${oldX}, ${oldY}) to (${player.x}, ${player.y}) for ${healthCost} health`);
    addEventMessage("Emergency teleport activated!", true, `${player.name} teleported to safety, losing ${healthCost} health`);
}

/**
 * Stops any active automated movement
 */
function stopAutomatedMovement() {
    if (autoMoveTimeoutId) {
        clearTimeout(autoMoveTimeoutId);
        autoMoveTimeoutId = null;
    }
    autoMode = null;
    autoMovePath = [];
    currentPathIndex = 0;
}

/**
 * Finds the closest entity from a list to the player, optionally within a radius.
 * @param {object[]} entities - The list of entities ({x, y}).
 * @param {object} playerPos - The player's current position {x, y}.
 * @param {number} radius - Optional maximum distance to consider. Defaults to Infinity.
 * @returns {object|null} The closest entity, or null if none found within radius.
 */
function getClosestEntity(entities, playerPos, radius = Infinity) {
    let closest = null;
    let minDist = Infinity;
    entities.forEach(entity => {
        if (entity && typeof entity.x === 'number' && typeof entity.y === 'number') {
            const dist = getDistance(playerPos, entity);
            if (dist <= radius && dist < minDist) {
                minDist = dist;
                closest = entity;
            }
        }
    });
    return closest;
}

/**
 * Starts the appropriate automated movement mode (H for high score).
 * This function determines the target based on the active autoMode and initiates the pathfinding.
 */
function startAutomatedMovement() {
    if (gameOver) {
        stopAutomatedMovement();
        return;
    }
    if (autoMode === null) return;

    // Set speed for H mode
    AUTO_MOVE_SPEED = DEFAULT_AUTO_MOVE_SPEED;

    if (autoMoveTimeoutId) {
        clearTimeout(autoMoveTimeoutId);
        autoMoveTimeoutId = null;
    }

    let targetEntity = null;

    if (autoMode === 'highScore') {
        // High score mode: prioritize key > stairs > closest enemy
        if (key && !key.collected) {
            targetEntity = key;
        } else if (stairs) {
            targetEntity = stairs;
        } else {
            const visibleEnemies = enemies.filter(enemy => enemy !== null);
            targetEntity = getClosestEntity(visibleEnemies, player);
        }
    }

    if (!targetEntity) {
        stopAutomatedMovement();
        return;
    }

    // Generate path to target
    autoMovePath = findPath(player, targetEntity, gameMap, dynamicMapWidth, dynamicMapHeight, enemies);
    currentPathIndex = 0;

    if (autoMovePath && autoMovePath.length > 0) {
        // Remove first element if it's the player's current position
        if (autoMovePath[0].x === player.x && autoMovePath[0].y === player.y) {
            autoMovePath.shift();
            currentPathIndex = 0;
        }
        autoMoveTimeoutId = setTimeout(executeAutoMoveStep, AUTO_MOVE_SPEED);
    } else {
        stopAutomatedMovement();
    }
}

/**
 * Executes one step of automated movement
 */
function executeAutoMoveStep() {
    if (gameOver || autoMode === null) {
        stopAutomatedMovement();
        return;
    }

    if (!autoMovePath || autoMovePath.length === 0 || currentPathIndex >= autoMovePath.length) {
        // If path is exhausted or invalid, try to find a new path (e.g., if new enemies spawned)
        autoMoveTimeoutId = setTimeout(startAutomatedMovement, AUTO_MOVE_SPEED);
        return;
    }

    const nextPos = autoMovePath[currentPathIndex];
    const dx = nextPos.x - player.x;
    const dy = nextPos.y - player.y;

    const combatOccurred = movePlayer(dx, dy);

    if (gameOver) {
        stopAutomatedMovement();
        return;
    }

    const delay = combatOccurred ? COMBAT_MOVE_DELAY : AUTO_MOVE_SPEED;

    // Check if we need to recalculate path
    let shouldRecalculate = false;
    
    if (player.x !== nextPos.x || player.y !== nextPos.y || combatOccurred) {
        shouldRecalculate = true;
    }

    if (shouldRecalculate) {
        autoMoveTimeoutId = setTimeout(startAutomatedMovement, delay);
        return;
    }

    currentPathIndex = currentPathIndex + 1; // Explicit assignment
    autoMoveTimeoutId = setTimeout(executeAutoMoveStep, delay);
}

/**
 * Detects connected gamepad
 */
function detectGamepad() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            gamepadIndex = i;
            console.log(`Gamepad connected: ${gamepads[i].id}`);
            break;
        }
    }
}

/**
 * Handles gamepad input polling
 */
function handleGamepadInput() {
    if (gamepadIndex === -1) return;

    const gamepad = navigator.getGamepads()[gamepadIndex];
    if (!gamepad) {
        gamepadIndex = -1;
        return;
    }

    // Handle D-pad and analog stick movement
    let dx = 0;
    let dy = 0;

    // D-pad (buttons 12, 13, 14, 15 are standard D-pad)
    if (gamepad.buttons[12] && gamepad.buttons[12].pressed) dy = -1; // Up
    if (gamepad.buttons[13] && gamepad.buttons[13].pressed) dy = 1;  // Down
    if (gamepad.buttons[14] && gamepad.buttons[14].pressed) dx = -1; // Left
    if (gamepad.buttons[15] && gamepad.buttons[15].pressed) dx = 1;  // Right

    // Left analog stick (axes 0 and 1)
    if (Math.abs(gamepad.axes[0]) > GAMEPAD_DEADZONE) {
        if (gamepad.axes[0] > GAMEPAD_DEADZONE) dx = 1;
        else if (gamepad.axes[0] < -GAMEPAD_DEADZONE) dx = -1;
    }
    if (Math.abs(gamepad.axes[1]) > GAMEPAD_DEADZONE) {
        if (gamepad.axes[1] > GAMEPAD_DEADZONE) dy = 1;
        else if (gamepad.axes[1] < -GAMEPAD_DEADZONE) dy = -1;
    }

    // Only move if there's input and it's different from last frame
    if ((dx !== 0 || dy !== 0) && !gameOver) {
        const currentInput = `${dx},${dy}`;
        const lastInput = `${lastGamepadState.dx || 0},${lastGamepadState.dy || 0}`;
        
        // Only process movement if it's a new input or enough time has passed
        if (currentInput !== lastInput || !lastGamepadState.lastMoveTime || 
            performance.now() - lastGamepadState.lastMoveTime > 150) {
            
            movePlayer(dx, dy);
            lastGamepadState = { dx, dy, lastMoveTime: performance.now() };
        }
    }

    // Handle other gamepad buttons
    // Button A (0) for teleport
    if (gamepad.buttons[0] && gamepad.buttons[0].pressed && !lastGamepadState.buttonA) {
        emergencyTeleport();
    }
    lastGamepadState.buttonA = gamepad.buttons[0] && gamepad.buttons[0].pressed;
}

/**
 * Starts gamepad polling
 */
function startGamepadPolling() {
    setInterval(() => {
        if (gamepadIndex === -1) {
            detectGamepad();
        } else {
            handleGamepadInput();
        }
    }, GAMEPAD_POLL_INTERVAL);
}

/**
 * Sets up gamepad event listeners
 */
function setupGamepadEventListeners() {
    // Gamepad connection event listeners
    window.addEventListener('gamepadconnected', (e) => {
        console.log(`Gamepad connected: ${e.gamepad.id}`);
        gamepadIndex = e.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        console.log(`Gamepad disconnected: ${e.gamepad.id}`);
        if (e.gamepad.index === gamepadIndex) {
            gamepadIndex = -1;
        }
    });
}

/**
 * Handles keyboard input for player movement.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleKeyDown(event) {
    // Block all input if inputLocked is true
    if (typeof inputLocked !== 'undefined' && inputLocked) {
        event.preventDefault();
        return;
    }
    // If the game start overlay is active, any key press will dismiss it
    if (gameStartedOverlayActive) {
        gameStartedOverlayActive = false;
        event.preventDefault();
        return;
    }

    // Only process game input if the game is running
    if (!isGameRunning) {
        return;
    }

    // Always handle space bar for teleport
    if (event.key === ' ') {
        event.preventDefault();
        if (!gameOver) {
            emergencyTeleport();
        }
        return;
    }

    // Stop auto mode on any key press except H
    if (autoMode !== null && event.key !== 'h' && event.key !== 'H') {
        stopAutomatedMovement();
    }

    if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        if (autoMode === 'highScore') {
            stopAutomatedMovement();
        } else {
            stopAutomatedMovement();
            autoMode = 'highScore';
            startAutomatedMovement();
        }
        return;
    }

    // World switching controls (1-9 keys)
    if (['1','2','3','4','5','6','7','8','9'].includes(event.key)) {
        event.preventDefault();
        const worldNumber = parseInt(event.key);
        if (WORLDS[worldNumber] && worldNumber !== currentWorld) {
            currentWorld = worldNumber;
            unlockedWorlds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            setupWorldColors();
            initGame(true, false);
            console.log(`Switched to world ${worldNumber}: ${WORLDS[worldNumber].name}`);
        }
        return;
    }

    // Other movement and input handling
    if (gameOver) return;

    let dx = 0;
    let dy = 0;

    switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            dy = -1;
            break;
        case 's':
        case 'S':
        case 'ArrowDown':
            dy = 1;
            break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
            dx = -1;
            break;
        case 'd':
        case 'D':
        case 'ArrowRight':
            dx = 1;
            break;
        case 'q':
        case 'Q':
            dx = -1; dy = -1;
            break;
        case 'e':
        case 'E':
            dx = 1; dy = -1;
            break;
        case 'z':
        case 'Z':
            dx = -1; dy = 1;
            break;
        case 'c':
        case 'C':
            dx = 1; dy = 1;
            break;
        default:
            return; // Don't prevent default for unhandled keys
    }

    if (dx !== 0 || dy !== 0) {
        event.preventDefault();
        movePlayer(dx, dy);
    }
}

/**
 * Initialize input handling system
 */
function initializeInputHandler() {
    // Set up keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Set up gamepad support
    setupGamepadEventListeners();
    startGamepadPolling();
}