/**
 * World Management Module
 * Handles map generation, world mechanics, entity placement, and pathfinding
 */

// ======================== MAP INITIALIZATION ========================

function initializeMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
}

/**
 * Generates procedural paths using a random walk algorithm.
 * @param {number} steps - The number of steps for the random walk.
 */
function generatePaths(steps) {
    console.log('Starting map generation:', { steps, mapWidth: dynamicMapWidth, mapHeight: dynamicMapHeight });
    
    // Initialize starting point in the middle
    let currentX = Math.floor(dynamicMapWidth / 2);
    let currentY = Math.floor(dynamicMapHeight / 2);

    currentX = Math.max(1, Math.min(dynamicMapWidth - 2, currentX));
    currentY = Math.max(1, Math.min(dynamicMapHeight - 2, currentY));

    // Create initial map
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Start with a floor tile in the middle
    gameMap[currentY][currentX] = TILE_FLOOR;

    // Generate paths
    for (let i = 0; i < steps; i++) {
        // Pick a random direction (0: up, 1: right, 2: down, 3: left)
        const direction = Math.floor(Math.random() * 4);
        let nextX = currentX;
        let nextY = currentY;

        switch (direction) {
            case 0: // up
                nextY = Math.max(1, currentY - 1);
                break;
            case 1: // right
                nextX = Math.min(dynamicMapWidth - 2, currentX + 1);
                break;
            case 2: // down
                nextY = Math.min(dynamicMapHeight - 2, currentY + 1);
                break;
            case 3: // left
                nextX = Math.max(1, currentX - 1);
                break;
        }

        gameMap[nextY][nextX] = TILE_FLOOR;
        currentX = nextX;
        currentY = nextY;
    }
}

// ======================== WORLD MANAGEMENT ========================

function getCurrentWorld() {
    return WORLDS[currentWorld];
}

/**
 * Checks if a world can be unlocked based on total score
 * @param {number} worldNumber - The world number to check
 * @returns {boolean} True if the world can be unlocked
 */
function canUnlockWorld(worldNumber) {
    if (!WORLDS[worldNumber]) return false;
    return totalPlayerScore >= WORLDS[worldNumber].unlockRequirement;
}

/**
 * Unlocks worlds based on current total score
 */
function checkAndUnlockWorlds() {
    for (let worldNum in WORLDS) {
        const worldNumber = parseInt(worldNum);
        if (!unlockedWorlds.includes(worldNumber) && canUnlockWorld(worldNumber)) {
            unlockedWorlds.push(worldNumber);
            console.log(`World ${worldNumber} (${WORLDS[worldNumber].name}) unlocked!`);
        }
    }
}

/**
 * Sets up colors for the current world
 */
function setupWorldColors() {
    const world = getCurrentWorld();
    COLOR_FLOOR = world.colors.floor;
    COLOR_WALL = world.colors.wall;
    FIXED_COLOR_STAIRS = world.colors.stairs;
    FIXED_COLOR_PLAYER = world.colors.player;
    FIXED_COLOR_ENEMY = world.colors.enemy;
    
    // Update the background color to match the world's wall color
    updateBackgroundColor();
}

/**
 * Updates the game wrapper background color to match the current world theme
 */
function updateBackgroundColor() {
    const world = getCurrentWorld();
    const gameWrapper = document.querySelector('.game-wrapper');
    if (gameWrapper) {
        gameWrapper.style.backgroundColor = world.colors.wall;
    }
}

// ======================== WORLD-SPECIFIC GENERATORS ========================

function generateBasicMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create main long hallway running horizontally through the center
    const hallwayY = Math.floor(dynamicMapHeight / 2);
    const hallwayWidth = 3; // 3-tile wide hallway
    
    // Create the main hallway
    for (let y = hallwayY - 1; y <= hallwayY + 1; y++) {
        for (let x = 2; x < dynamicMapWidth - 2; x++) {
            if (y >= 0 && y < dynamicMapHeight) {
                gameMap[y][x] = TILE_FLOOR;
            }
        }
    }
    
    // Add side chambers branching off the main hallway
    const numChambers = Math.floor(dynamicMapWidth / 8); // One chamber every 8 tiles
    
    for (let i = 0; i < numChambers; i++) {
        const chamberCenterX = 8 + i * Math.floor((dynamicMapWidth - 16) / numChambers);
        const side = i % 2 === 0 ? -1 : 1; // Alternate sides
        
        const chamberWidth = 4 + Math.floor(Math.random() * 3); // Width 4-6
        const chamberHeight = 3 + Math.floor(Math.random() * 3); // Height 3-5
        
        // Create connecting corridor from hallway to chamber
        const corridorLength = 2 + Math.floor(Math.random() * 3); // Length 2-4
        for (let c = 1; c <= corridorLength; c++) {
            const corridorY = hallwayY + (side * c);
            if (corridorY >= 0 && corridorY < dynamicMapHeight) {
                gameMap[corridorY][chamberCenterX] = TILE_FLOOR;
            }
        }
        
        // Create the chamber
        const chamberY = hallwayY + (side * (corridorLength + Math.floor(chamberHeight / 2)));
        for (let dy = -Math.floor(chamberHeight / 2); dy <= Math.floor(chamberHeight / 2); dy++) {
            for (let dx = -Math.floor(chamberWidth / 2); dx <= Math.floor(chamberWidth / 2); dx++) {
                const x = chamberCenterX + dx;
                const y = chamberY + dy;
                if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                    gameMap[y][x] = TILE_FLOOR;
                }
            }
        }
    }
}

function generateDesertMap() {
    // Ant colony style - multiple chambers connected by narrow tunnels
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    const numChambers = Math.max(6, Math.floor(dynamicMapWidth * dynamicMapHeight / 30));
    const chambers = [];
    
    // Create main chambers (ant colony rooms)
    for (let i = 0; i < numChambers; i++) {
        let attempts = 0;
        let chamberX, chamberY;
        
        do {
            chamberX = 4 + Math.floor(Math.random() * (dynamicMapWidth - 8));
            chamberY = 4 + Math.floor(Math.random() * (dynamicMapHeight - 8));
            attempts++;
        } while (attempts < 50 && chambers.some(chamber => 
            Math.abs(chamber.x - chamberX) < 8 || Math.abs(chamber.y - chamberY) < 8
        ));
        
        const chamberType = Math.random();
        let width, height;
        
        if (chamberType < 0.3) {
            // Large nursery chamber
            width = 6 + Math.floor(Math.random() * 3);
            height = 6 + Math.floor(Math.random() * 3);
        } else if (chamberType < 0.6) {
            // Medium storage chamber
            width = 4 + Math.floor(Math.random() * 2);
            height = 4 + Math.floor(Math.random() * 2);
        } else {
            // Small worker chamber
            width = 3 + Math.floor(Math.random() * 2);
            height = 3 + Math.floor(Math.random() * 2);
        }
        
        chambers.push({ x: chamberX, y: chamberY, width, height, type: chamberType });
        
        // Create oval-shaped chamber
        for (let dy = -Math.floor(height/2); dy <= Math.floor(height/2); dy++) {
            for (let dx = -Math.floor(width/2); dx <= Math.floor(width/2); dx++) {
                const normalizedX = dx / (width/2);
                const normalizedY = dy / (height/2);
                const distance = normalizedX * normalizedX + normalizedY * normalizedY;
                
                if (distance <= 1.0 + Math.random() * 0.2) { // Slightly irregular edges
                    const x = chamberX + dx;
                    const y = chamberY + dy;
                    if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                        gameMap[y][x] = TILE_FLOOR;
                    }
                }
            }
        }
    }
    
    // Create tunnel network connecting all chambers
    const tunnelNetwork = [];
    
    // Connect each chamber to at least 2 others for redundancy (like real ant colonies)
    for (let i = 0; i < chambers.length; i++) {
        const chamber = chambers[i];
        const connections = [];
        
        // Find 2-3 closest chambers to connect to
        const otherChambers = chambers.filter((_, idx) => idx !== i);
        otherChambers.sort((a, b) => {
            const distA = Math.abs(a.x - chamber.x) + Math.abs(a.y - chamber.y);
            const distB = Math.abs(b.x - chamber.x) + Math.abs(b.y - chamber.y);
            return distA - distB;
        });
        
        // Connect to 2-3 nearest chambers
        const numConnections = Math.min(2 + Math.floor(Math.random() * 2), otherChambers.length);
        for (let j = 0; j < numConnections; j++) {
            connections.push(otherChambers[j]);
        }
        
        // Create narrow tunnels (1 tile wide like ant tunnels)
        connections.forEach(targetChamber => {
            let currentX = chamber.x;
            let currentY = chamber.y;
            
            // Create winding tunnel path
            while (currentX !== targetChamber.x || currentY !== targetChamber.y) {
                if (currentX >= 0 && currentX < dynamicMapWidth && 
                    currentY >= 0 && currentY < dynamicMapHeight) {
                    gameMap[currentY][currentX] = TILE_FLOOR;
                }
                
                // Add some randomness to create more natural ant-like tunnels
                if (Math.random() < 0.7) {
                    // Move toward target most of the time
                    if (Math.abs(currentX - targetChamber.x) > Math.abs(currentY - targetChamber.y)) {
                        currentX += currentX < targetChamber.x ? 1 : -1;
                    } else {
                        currentY += currentY < targetChamber.y ? 1 : -1;
                    }
                } else {
                    // Occasionally take a random direction for more organic paths
                    if (Math.random() < 0.5 && currentX !== targetChamber.x) {
                        currentX += currentX < targetChamber.x ? 1 : -1;
                    } else if (currentY !== targetChamber.y) {
                        currentY += currentY < targetChamber.y ? 1 : -1;
                    }
                }
            }
        });
    }
    
    // Add some dead-end tunnels for authenticity (ant colonies have many dead ends)
    const numDeadEnds = Math.floor(chambers.length / 2);
    for (let i = 0; i < numDeadEnds; i++) {
        const chamber = chambers[Math.floor(Math.random() * chambers.length)];
        const direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left
        const length = 2 + Math.floor(Math.random() * 4);
        
        let currentX = chamber.x;
        let currentY = chamber.y;
        
        for (let step = 0; step < length; step++) {
            switch(direction) {
                case 0: currentY--; break;
                case 1: currentX++; break;
                case 2: currentY++; break;
                case 3: currentX--; break;
            }
            
            if (currentX >= 0 && currentX < dynamicMapWidth && 
                currentY >= 0 && currentY < dynamicMapHeight) {
                gameMap[currentY][currentX] = TILE_FLOOR;
            }
        }
    }
}

/**
 * Generates an ice-themed map with extremely narrow caves
 */
function generateIceMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create extremely narrow cave system - mostly 1-tile wide passages
    const numMainPaths = Math.max(3, Math.floor(dynamicMapWidth * dynamicMapHeight / 100));
    const paths = [];
    
    // Start from random positions along edges
    for (let i = 0; i < numMainPaths; i++) {
        let startX, startY;
        const edge = Math.floor(Math.random() * 4);
        
        switch(edge) {
            case 0: // Top edge
                startX = Math.floor(Math.random() * dynamicMapWidth);
                startY = 1;
                break;
            case 1: // Right edge
                startX = dynamicMapWidth - 2;
                startY = Math.floor(Math.random() * dynamicMapHeight);
                break;
            case 2: // Bottom edge
                startX = Math.floor(Math.random() * dynamicMapWidth);
                startY = dynamicMapHeight - 2;
                break;
            case 3: // Left edge
                startX = 1;
                startY = Math.floor(Math.random() * dynamicMapHeight);
                break;
        }
        
        paths.push({ x: startX, y: startY });
        
        // Create winding narrow cave from this starting point
        let currentX = startX;
        let currentY = startY;
        const pathLength = Math.floor(dynamicMapWidth * dynamicMapHeight / 8);
        let direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left
        
        for (let step = 0; step < pathLength; step++) {
            // Place floor tile
            if (currentX >= 0 && currentX < dynamicMapWidth && 
                currentY >= 0 && currentY < dynamicMapHeight) {
                gameMap[currentY][currentX] = TILE_FLOOR;
            }
            
            // Randomly change direction to create winding paths
            if (Math.random() < 0.15) {
                direction = Math.floor(Math.random() * 4);
            }
            
            // Move in current direction
            let nextX = currentX;
            let nextY = currentY;
            
            switch(direction) {
                case 0: nextY--; break; // Up
                case 1: nextX++; break; // Right
                case 2: nextY++; break; // Down
                case 3: nextX--; break; // Left
            }
            
            // Check bounds and change direction if hitting edge
            if (nextX <= 0 || nextX >= dynamicMapWidth - 1 || 
                nextY <= 0 || nextY >= dynamicMapHeight - 1) {
                direction = (direction + 1 + Math.floor(Math.random() * 2)) % 4;
                continue;
            }
            
            currentX = nextX;
            currentY = nextY;
            
            // Occasionally create very small alcoves (1-2 tiles)
            if (Math.random() < 0.08) {
                const alcoveDirection = (direction + 1 + Math.floor(Math.random() * 2)) % 4;
                let alcoveX = currentX;
                let alcoveY = currentY;
                
                switch(alcoveDirection) {
                    case 0: alcoveY--; break;
                    case 1: alcoveX++; break;
                    case 2: alcoveY++; break;
                    case 3: alcoveX--; break;
                }
                
                if (alcoveX > 0 && alcoveX < dynamicMapWidth - 1 && 
                    alcoveY > 0 && alcoveY < dynamicMapHeight - 1) {
                    gameMap[alcoveY][alcoveX] = TILE_FLOOR;
                    
                    // Rarely add a second tile to the alcove
                    if (Math.random() < 0.3) {
                        switch(alcoveDirection) {
                            case 0: alcoveY--; break;
                            case 1: alcoveX++; break;
                            case 2: alcoveY++; break;
                            case 3: alcoveX--; break;
                        }
                        
                        if (alcoveX > 0 && alcoveX < dynamicMapWidth - 1 && 
                            alcoveY > 0 && alcoveY < dynamicMapHeight - 1) {
                            gameMap[alcoveY][alcoveX] = TILE_FLOOR;
                        }
                    }
                }
            }
        }
    }
    
    // Create connections between paths where they get close
    for (let y = 1; y < dynamicMapHeight - 1; y++) {
        for (let x = 1; x < dynamicMapWidth - 1; x++) {
            if (gameMap[y][x] === TILE_FLOOR) {
                // Look for nearby floor tiles to potentially connect to
                const searchRadius = 3;
                for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                        if (Math.abs(dx) + Math.abs(dy) === searchRadius && // Only check at exact distance
                            Math.random() < 0.1) { // Low chance to keep caves narrow
                            
                            const checkX = x + dx;
                            const checkY = y + dy;
                            
                            if (checkX > 0 && checkX < dynamicMapWidth - 1 && 
                                checkY > 0 && checkY < dynamicMapHeight - 1 && 
                                gameMap[checkY][checkX] === TILE_FLOOR) {
                                
                                // Create narrow connecting tunnel
                                let connectX = x;
                                let connectY = y;
                                
                                while (connectX !== checkX || connectY !== checkY) {
                                    if (connectX !== checkX) {
                                        connectX += connectX < checkX ? 1 : -1;
                                    } else if (connectY !== checkY) {
                                        connectY += connectY < checkY ? 1 : -1;
                                    }
                                    
                                    if (connectX > 0 && connectX < dynamicMapWidth - 1 && 
                                        connectY > 0 && connectY < dynamicMapHeight - 1) {
                                        gameMap[connectY][connectX] = TILE_FLOOR;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Generates a forest-themed map with lots of tiny rooms
 */
function generateForestMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create many tiny rooms (like clearings in a dense forest)
    const numTinyRooms = Math.floor(dynamicMapWidth * dynamicMapHeight / 15); // Many small rooms
    const rooms = [];
    
    for (let i = 0; i < numTinyRooms; i++) {
        let attempts = 0;
        let roomX, roomY;
        let roomSize;
        
        do {
            roomX = 2 + Math.floor(Math.random() * (dynamicMapWidth - 4));
            roomY = 2 + Math.floor(Math.random() * (dynamicMapHeight - 4));
            roomSize = 1 + Math.floor(Math.random() * 2); // Size 1-2 (very tiny!)
            attempts++;
        } while (attempts < 30 && rooms.some(room => 
            Math.abs(room.x - roomX) < 4 && Math.abs(room.y - roomY) < 4
        ));
        
        if (attempts < 30) {
            rooms.push({ x: roomX, y: roomY, size: roomSize });
            
            // Create tiny circular room
            for (let dy = -roomSize; dy <= roomSize; dy++) {
                for (let dx = -roomSize; dx <= roomSize; dx++) {
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance <= roomSize) {
                        const x = roomX + dx;
                        const y = roomY + dy;
                        if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                            gameMap[y][x] = TILE_FLOOR;
                        }
                    }
                }
            }
        }
    }
    
    // Create a network of narrow paths connecting the tiny rooms
    // Sort rooms by distance to create a minimum spanning tree-like connection
    const connected = new Set();
    const connections = [];
    
    if (rooms.length > 0) {
        connected.add(0); // Start with first room
        
        while (connected.size < rooms.length) {
            let minDistance = Infinity;
            let bestConnection = null;
            
            // Find closest unconnected room to any connected room
            for (let connectedIdx of connected) {
                for (let i = 0; i < rooms.length; i++) {
                    if (!connected.has(i)) {
                        const distance = Math.abs(rooms[connectedIdx].x - rooms[i].x) + 
                                       Math.abs(rooms[connectedIdx].y - rooms[i].y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestConnection = { from: connectedIdx, to: i };
                        }
                    }
                }
            }
            
            if (bestConnection) {
                connected.add(bestConnection.to);
                connections.push(bestConnection);
            } else {
                break; // No more connections possible
            }
        }
    }
    
    // Create the connecting paths
    connections.forEach(connection => {
        const startRoom = rooms[connection.from];
        const endRoom = rooms[connection.to];
        
        let currentX = startRoom.x;
        let currentY = startRoom.y;
        
        // Create narrow winding path
        while (currentX !== endRoom.x || currentY !== endRoom.y) {
            if (currentX >= 0 && currentX < dynamicMapWidth && 
                currentY >= 0 && currentY < dynamicMapHeight) {
                gameMap[currentY][currentX] = TILE_FLOOR;
            }
            
            // Add organic curves to paths
            if (Math.random() < 0.8) {
                // Move toward target most of the time
                if (Math.abs(currentX - endRoom.x) > Math.abs(currentY - endRoom.y)) {
                    currentX += currentX < endRoom.x ? 1 : -1;
                } else {
                    currentY += currentY < endRoom.y ? 1 : -1;
                }
            } else {
                // Occasionally take a detour for natural feel
                const randomDir = Math.floor(Math.random() * 4);
                switch(randomDir) {
                    case 0: if (currentY > 1) currentY--; break;
                    case 1: if (currentX < dynamicMapWidth - 2) currentX++; break;
                    case 2: if (currentY < dynamicMapHeight - 2) currentY++; break;
                    case 3: if (currentX > 1) currentX--; break;
                }
            }
        }
    });
    
    // Add some additional random connections for redundancy (like animal trails)
    const numExtraConnections = Math.floor(rooms.length / 4);
    for (let i = 0; i < numExtraConnections; i++) {
        const room1 = rooms[Math.floor(Math.random() * rooms.length)];
        const room2 = rooms[Math.floor(Math.random() * rooms.length)];
        
        if (room1 !== room2) {
            const distance = Math.abs(room1.x - room2.x) + Math.abs(room1.y - room2.y);
            
            // Only connect if reasonably close
            if (distance < Math.min(dynamicMapWidth, dynamicMapHeight) / 2) {
                let currentX = room1.x;
                let currentY = room1.y;
                
                while (currentX !== room2.x || currentY !== room2.y) {
                    if (currentX >= 0 && currentX < dynamicMapWidth && 
                        currentY >= 0 && currentY < dynamicMapHeight) {
                        gameMap[currentY][currentX] = TILE_FLOOR;
                    }
                    
                    if (Math.abs(currentX - room2.x) > Math.abs(currentY - room2.y)) {
                        currentX += currentX < room2.x ? 1 : -1;
                    } else {
                        currentY += currentY < room2.y ? 1 : -1;
                    }
                }
            }
        }
    }
}

/**
 * Generates a crystal-themed map with village/town layout
 */
function generateCrystalMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create a village/town layout with many house-like rectangular structures
    const numHouses = Math.max(8, Math.floor(dynamicMapWidth * dynamicMapHeight / 25));
    const houses = [];
    
    for (let i = 0; i < numHouses; i++) {
        let attempts = 0;
        let houseX, houseY, houseWidth, houseHeight;
        
        do {
            houseX = 2 + Math.floor(Math.random() * (dynamicMapWidth - 8));
            houseY = 2 + Math.floor(Math.random() * (dynamicMapHeight - 8));
            houseWidth = 3 + Math.floor(Math.random() * 4); // Width 3-6
            houseHeight = 3 + Math.floor(Math.random() * 4); // Height 3-6
            attempts++;
        } while (attempts < 50 && houses.some(house => 
            !(houseX + houseWidth + 2 < house.x || 
              house.x + house.width + 2 < houseX || 
              houseY + houseHeight + 2 < house.y || 
              house.y + house.height + 2 < houseY)
        ));
        
        if (attempts < 50 && 
            houseX + houseWidth < dynamicMapWidth - 1 && 
            houseY + houseHeight < dynamicMapHeight - 1) {
            
            houses.push({ 
                x: houseX, 
                y: houseY, 
                width: houseWidth, 
                height: houseHeight 
            });
            
            // Create rectangular house structure
            for (let dy = 0; dy < houseHeight; dy++) {
                for (let dx = 0; dx < houseWidth; dx++) {
                    const x = houseX + dx;
                    const y = houseY + dy;
                    
                    if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                        gameMap[y][x] = TILE_FLOOR;
                    }
                }
            }
            
            // Add some internal structure to larger houses
            if (houseWidth >= 5 && houseHeight >= 5) {
                // Add internal walls to create rooms
                const numInternalWalls = 1 + Math.floor(Math.random() * 2);
                
                for (let w = 0; w < numInternalWalls; w++) {
                    if (Math.random() < 0.5 && houseWidth >= 5) {
                        // Vertical internal wall
                        const wallX = houseX + 2 + Math.floor(Math.random() * (houseWidth - 4));
                        for (let dy = 1; dy < houseHeight - 1; dy++) {
                            const y = houseY + dy;
                            if (Math.random() < 0.7) { // Leave some gaps for doors
                                gameMap[y][wallX] = TILE_WALL;
                            }
                        }
                    }
                    
                    if (Math.random() < 0.5 && houseHeight >= 5) {
                        // Horizontal internal wall
                        const wallY = houseY + 2 + Math.floor(Math.random() * (houseHeight - 4));
                        for (let dx = 1; dx < houseWidth - 1; dx++) {
                            const x = houseX + dx;
                            if (Math.random() < 0.7) { // Leave some gaps for doors
                                gameMap[wallY][x] = TILE_WALL;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Create street/path network connecting houses
    // First, create main streets (horizontal and vertical)
    const numMainStreets = Math.max(2, Math.floor(Math.max(dynamicMapWidth, dynamicMapHeight) / 15));
    
    // Vertical main streets
    for (let i = 0; i < Math.floor(numMainStreets / 2); i++) {
        const streetX = Math.floor((i + 1) * dynamicMapWidth / (Math.floor(numMainStreets / 2) + 1));
        
        for (let y = 0; y < dynamicMapHeight; y++) {
            if (streetX >= 0 && streetX < dynamicMapWidth) {
                // Only place street if not inside a house
                let insideHouse = false;
                for (let house of houses) {
                    if (streetX >= house.x && streetX < house.x + house.width &&
                        y >= house.y && y < house.y + house.height) {
                        insideHouse = true;
                        break;
                    }
                }
                
                if (!insideHouse) {
                    gameMap[y][streetX] = TILE_FLOOR;
                }
            }
        }
    }
    
    // Horizontal main streets
    for (let i = 0; i < Math.ceil(numMainStreets / 2); i++) {
        const streetY = Math.floor((i + 1) * dynamicMapHeight / (Math.ceil(numMainStreets / 2) + 1));
        
        for (let x = 0; x < dynamicMapWidth; x++) {
            if (streetY >= 0 && streetY < dynamicMapHeight) {
                // Only place street if not inside a house
                let insideHouse = false;
                for (let house of houses) {
                    if (x >= house.x && x < house.x + house.width &&
                        streetY >= house.y && streetY < house.y + house.height) {
                        insideHouse = true;
                        break;
                    }
                }
                
                if (!insideHouse) {
                    gameMap[streetY][x] = TILE_FLOOR;
                }
            }
        }
    }
    
    // Connect each house to the nearest street with a path
    houses.forEach(house => {
        const houseCenterX = house.x + Math.floor(house.width / 2);
        const houseCenterY = house.y + Math.floor(house.height / 2);
        
        // Find nearest street tile
        let nearestStreetX = houseCenterX;
        let nearestStreetY = houseCenterY;
        let minDistance = Infinity;
        
        for (let y = 0; y < dynamicMapHeight; y++) {
            for (let x = 0; x < dynamicMapWidth; x++) {
                if (gameMap[y][x] === TILE_FLOOR) {
                    // Check if this is a street (not inside any house)
                    let isStreet = true;
                    for (let otherHouse of houses) {
                        if (x >= otherHouse.x && x < otherHouse.x + otherHouse.width &&
                            y >= otherHouse.y && y < otherHouse.y + otherHouse.height) {
                            isStreet = false;
                            break;
                        }
                    }
                    
                    if (isStreet) {
                        const distance = Math.abs(x - houseCenterX) + Math.abs(y - houseCenterY);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestStreetX = x;
                            nearestStreetY = y;
                        }
                    }
                }
            }
        }
        
        // Create path from house to nearest street
        let currentX = houseCenterX;
        let currentY = houseCenterY;
        
        while (currentX !== nearestStreetX || currentY !== nearestStreetY) {
            if (currentX >= 0 && currentX < dynamicMapWidth && 
                currentY >= 0 && currentY < dynamicMapHeight) {
                gameMap[currentY][currentX] = TILE_FLOOR;
            }
            
            if (Math.abs(currentX - nearestStreetX) > Math.abs(currentY - nearestStreetY)) {
                currentX += currentX < nearestStreetX ? 1 : -1;
            } else {
                currentY += currentY < nearestStreetY ? 1 : -1;
            }
        }
    });
}

/**
 * Generates a volcano-themed map with spiral lava tubes
 */
function generateVolcanoMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create spiral lava tubes emanating from central chambers
    const numSpiralCenters = Math.max(2, Math.floor(Math.min(dynamicMapWidth, dynamicMapHeight) / 20));
    const spiralCenters = [];
    
    for (let i = 0; i < numSpiralCenters; i++) {
        const centerX = Math.floor(dynamicMapWidth * (0.2 + Math.random() * 0.6));
        const centerY = Math.floor(dynamicMapHeight * (0.2 + Math.random() * 0.6));
        
        spiralCenters.push({ x: centerX, y: centerY });
        
        // Create central magma chamber
        const chamberSize = 3 + Math.floor(Math.random() * 3); // Size 3-5
        for (let dy = -chamberSize; dy <= chamberSize; dy++) {
            for (let dx = -chamberSize; dx <= chamberSize; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= chamberSize * (0.8 + Math.random() * 0.4)) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                        gameMap[y][x] = TILE_FLOOR;
                    }
                }
            }
        }
        
        // Create multiple spiral tubes from this center
        const numSpirals = 2 + Math.floor(Math.random() * 3); // 2-4 spirals per center
        
        for (let s = 0; s < numSpirals; s++) {
            const startAngle = (s / numSpirals) * 2 * Math.PI + Math.random() * 0.5; // Offset each spiral
            const spiralDirection = Math.random() < 0.5 ? 1 : -1; // Clockwise or counterclockwise
            const spiralTightness = 0.05 + Math.random() * 0.05; // How tight the spiral is
            const maxRadius = Math.min(dynamicMapWidth, dynamicMapHeight) / 3;
            
            let currentAngle = startAngle;
            let currentRadius = 2;
            
            while (currentRadius < maxRadius) {
                const x = Math.floor(centerX + Math.cos(currentAngle) * currentRadius);
                const y = Math.floor(centerY + Math.sin(currentAngle) * currentRadius);
                
                if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                    gameMap[y][x] = TILE_FLOOR;
                    
                    // Make the tube slightly wider occasionally
                    if (Math.random() < 0.3) {
                        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                        for (let [dx, dy] of directions) {
                            const wideX = x + dx;
                            const wideY = y + dy;
                            if (wideX >= 0 && wideX < dynamicMapWidth && 
                                wideY >= 0 && wideY < dynamicMapHeight && 
                                Math.random() < 0.5) {
                                gameMap[wideY][wideX] = TILE_FLOOR;
                            }
                        }
                    }
                    
                    // Occasionally create small side chambers
                    if (Math.random() < 0.08 && currentRadius > 5) {
                        const sideAngle = currentAngle + (Math.PI / 2) * (Math.random() < 0.5 ? 1 : -1);
                        const sideDistance = 2 + Math.floor(Math.random() * 3);
                        
                        for (let d = 1; d <= sideDistance; d++) {
                            const sideX = Math.floor(x + Math.cos(sideAngle) * d);
                            const sideY = Math.floor(y + Math.sin(sideAngle) * d);
                            
                            if (sideX >= 0 && sideX < dynamicMapWidth && 
                                sideY >= 0 && sideY < dynamicMapHeight) {
                                gameMap[sideY][sideX] = TILE_FLOOR;
                                
                                // Create small chamber at the end
                                if (d === sideDistance) {
                                    const chamberRadius = 1 + Math.floor(Math.random() * 2);
                                    for (let cdy = -chamberRadius; cdy <= chamberRadius; cdy++) {
                                        for (let cdx = -chamberRadius; cdx <= chamberRadius; cdx++) {
                                            if (Math.abs(cdx) + Math.abs(cdy) <= chamberRadius) {
                                                const cx = sideX + cdx;
                                                const cy = sideY + cdy;
                                                if (cx >= 0 && cx < dynamicMapWidth && 
                                                    cy >= 0 && cy < dynamicMapHeight) {
                                                    gameMap[cy][cx] = TILE_FLOOR;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Advance the spiral
                currentAngle += spiralDirection * spiralTightness;
                currentRadius += 0.3; // Gradual radius increase
            }
        }
    }
    
    // Connect spiral centers with direct lava tubes if they're not too far apart
    for (let i = 0; i < spiralCenters.length - 1; i++) {
        const center1 = spiralCenters[i];
        const center2 = spiralCenters[i + 1];
        
        const distance = Math.sqrt((center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2);
        
        if (distance < Math.min(dynamicMapWidth, dynamicMapHeight) * 0.6) {
            // Create connecting lava tube
            let currentX = center1.x;
            let currentY = center1.y;
            
            while (currentX !== center2.x || currentY !== center2.y) {
                // Create wider connecting tube
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const x = currentX + dx;
                        const y = currentY + dy;
                        if (x >= 0 && x < dynamicMapWidth && y >= 0 && y < dynamicMapHeight) {
                            gameMap[y][x] = TILE_FLOOR;
                        }
                    }
                }
                
                // Move towards target with some randomness
                if (Math.random() < 0.8) {
                    if (Math.abs(currentX - center2.x) > Math.abs(currentY - center2.y)) {
                        currentX += currentX < center2.x ? 1 : -1;
                    } else {
                        currentY += currentY < center2.y ? 1 : -1;
                    }
                } else {
                    // Random movement for more organic tubes
                    const randomDir = Math.floor(Math.random() * 4);
                    switch(randomDir) {
                        case 0: if (currentY > 1) currentY--; break;
                        case 1: if (currentX < dynamicMapWidth - 2) currentX++; break;
                        case 2: if (currentY < dynamicMapHeight - 2) currentY++; break;
                        case 3: if (currentX > 1) currentX--; break;
                    }
                }
            }
        }
    }
}

/**
 * Generates a cyber-themed map with circuit board pattern
 */
function generateCyberMap() {
    gameMap = Array(dynamicMapHeight).fill(0).map(() => Array(dynamicMapWidth).fill(TILE_WALL));
    
    // Create a circuit board-like pattern with components and traces
    const componentSpacing = 8;
    const components = [];
    
    // Place circuit components (CPU, RAM, etc.) in a grid-like pattern
    for (let y = componentSpacing / 2; y < dynamicMapHeight - componentSpacing / 2; y += componentSpacing) {
        for (let x = componentSpacing / 2; x < dynamicMapWidth - componentSpacing / 2; x += componentSpacing) {
            if (Math.random() < 0.7) { // Not every grid position gets a component
                const componentType = Math.random();
                let componentWidth, componentHeight;
                
                if (componentType < 0.3) {
                    // Large CPU-like component
                    componentWidth = 4 + Math.floor(Math.random() * 2); // 4-5 wide
                    componentHeight = 4 + Math.floor(Math.random() * 2); // 4-5 tall
                } else if (componentType < 0.6) {
                    // Medium RAM-like component
                    componentWidth = 2 + Math.floor(Math.random() * 2); // 2-3 wide
                    componentHeight = 3 + Math.floor(Math.random() * 3); // 3-5 tall
                } else {
                    // Small chip component
                    componentWidth = 2 + Math.floor(Math.random() * 2); // 2-3 wide
                    componentHeight = 2 + Math.floor(Math.random() * 2); // 2-3 tall
                }
                
                // Center the component at the grid position
                const compX = x - Math.floor(componentWidth / 2);
                const compY = y - Math.floor(componentHeight / 2);
                
                if (compX >= 0 && compY >= 0 && 
                    compX + componentWidth < dynamicMapWidth && 
                    compY + componentHeight < dynamicMapHeight) {
                    
                    components.push({
                        x: compX,
                        y: compY,
                        width: componentWidth,
                        height: componentHeight,
                        centerX: x,
                        centerY: y,
                        type: componentType < 0.3 ? 'cpu' : (componentType < 0.6 ? 'ram' : 'chip')
                    });
                    
                    // Create the component area
                    for (let dy = 0; dy < componentHeight; dy++) {
                        for (let dx = 0; dx < componentWidth; dx++) {
                            gameMap[compY + dy][compX + dx] = TILE_FLOOR;
                        }
                    }
                }
            }
        }
    }
    
    // Create circuit traces (paths) connecting components
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        
        // Connect to 1-3 nearby components
        const connections = [];
        const otherComponents = components.filter((_, idx) => idx !== i);
        otherComponents.sort((a, b) => {
            const distA = Math.abs(a.centerX - component.centerX) + Math.abs(a.centerY - component.centerY);
            const distB = Math.abs(b.centerX - component.centerX) + Math.abs(b.centerY - component.centerY);
            return distA - distB;
        });
        
        const numConnections = Math.min(1 + Math.floor(Math.random() * 3), otherComponents.length);
        for (let j = 0; j < numConnections; j++) {
            connections.push(otherComponents[j]);
        }
        
        // Create circuit traces to connected components
        connections.forEach(targetComponent => {
            let currentX = component.centerX;
            let currentY = component.centerY;
            
            // Create straight-line traces like real circuit boards
            while (currentX !== targetComponent.centerX || currentY !== targetComponent.centerY) {
                if (currentX >= 0 && currentX < dynamicMapWidth && 
                    currentY >= 0 && currentY < dynamicMapHeight) {
                    gameMap[currentY][currentX] = TILE_FLOOR;
                }
                
                // Move in Manhattan pattern (horizontal first, then vertical)
                if (currentX !== targetComponent.centerX) {
                    currentX += currentX < targetComponent.centerX ? 1 : -1;
                } else if (currentY !== targetComponent.centerY) {
                    currentY += currentY < targetComponent.centerY ? 1 : -1;
                }
            }
        });
    }
}

function generateMarbleMap() {
    initializeMap();
    generatePaths(dynamicMapWidth * dynamicMapHeight * 0.25);
}

/**
 * Generates a void-themed map with scattered platforms and teleporter pads
 */
function generateVoidMap() {
    initializeMap();
    generatePaths(dynamicMapWidth * dynamicMapHeight * 0.25);
}

function generateWorldMap() {
    const world = getCurrentWorld();
    console.log('generateWorldMap() - Current world:', world ? world.name : 'undefined', 'Using original random walk generator for all worlds');
    
    // Use the original random walk algorithm for all worlds
    initializeMap();
    generatePaths(dynamicMapWidth * dynamicMapHeight * 0.25);
}

// ======================== ENTITY SPAWNING ========================

function spawnEnemies(levelHealthBonus = 0, playerAverageFlow = 0) {
    enemies = [];
    const totalHealthForLevel = currentLevel + levelHealthBonus;

    let actualNumEnemies;
    if (currentLevel === 1) {
        actualNumEnemies = 1; // For level 1, always spawn exactly one enemy
    } else {
        const maxPossibleEnemies = Math.max(1, Math.min(totalHealthForLevel, 7));
        actualNumEnemies = getRandomInt(1, maxPossibleEnemies);
    }

    let remainingHealthToDistribute = totalHealthForLevel;

    for (let i = 0; i < actualNumEnemies; i++) {
        const excludeList = [player, stairs, ...enemies]; // Ensure stairs is in the exclude list for spawning
        
        // Also exclude remote control if it exists and hasn't been collected
        if (key && !key.collected) {
            excludeList.push(key);
        }
        
        const enemyPos = findEmptyFloorTile(excludeList);

        if (enemyPos) {
            // For very small maps (4x4 or smaller), skip chokepoint validation entirely
            // as it's nearly impossible to avoid chokepoints on such small spaces
            const isVerySmallMap = dynamicMapWidth <= 4 && dynamicMapHeight <= 4;
            
            if (!isVerySmallMap) {
                // Only do chokepoint checking on larger maps
                const reachableWithEnemy = countReachableTiles(gameMap, dynamicMapWidth, dynamicMapHeight, player.x, player.y, [...enemies, enemyPos]);
                const totalFloorTiles = countTotalFloorAndStairs(gameMap, dynamicMapWidth, dynamicMapHeight);
                
                // Allow up to 1 unreachable tile as acceptable (less strict)
                if (reachableWithEnemy < totalFloorTiles - 1) {
                    console.log(`Enemy position would create major chokepoint - trying once more`);
                    // Try one more position before giving up
                    const alternativePos = findEmptyFloorTile([player, stairs, ...enemies, enemyPos]);
                    if (alternativePos) {
                        const altReachable = countReachableTiles(gameMap, dynamicMapWidth, dynamicMapHeight, player.x, player.y, [...enemies, alternativePos]);
                        if (altReachable >= totalFloorTiles - 1) {
                            enemyPos.x = alternativePos.x;
                            enemyPos.y = alternativePos.y;
                        }
                    }
                    // If alternative doesn't work, still place the enemy - better than no enemy
                }
            }
            
            let role;
            const roleRoll = Math.random();
            if (roleRoll < 0.4) {
                role = 'hunter';
            } else if (roleRoll < 0.7) {
                role = 'guard';
            } else {
                role = 'tracker';
            }

            // Temporary health for initial flow calculation (will be updated after distribution)
            const tempEnemyHealth = 1;

            // Calculate initial enemy flow based on player's average flow and inverse health bias
            let initialEnemyFlowForThisEnemy = 0;
            if (playerAverageFlow > 0) {
                const healthNormalized = tempEnemyHealth / ENEMY_VISUAL_HEALTH_THRESHOLD;
                // Bias the random factor: lower healthNormalized (lower health) means randomFactor biases towards 0
                // Higher healthNormalized (higher health) means randomFactor biases towards 1
                let effectiveRandomFactor = Math.random() * healthNormalized;
                initialEnemyFlowForThisEnemy = playerAverageFlow * effectiveRandomFactor;
            }

            const baseStepsForFlow = 5; // Use a base number of steps to avoid very high flow from 1 damage / 1 step
            const initialEnemyDamageDealt = initialEnemyFlowForThisEnemy * baseStepsForFlow;
            const initialEnemyStepsTaken = initialEnemyFlowForThisEnemy > 0 ? baseStepsForFlow : 0;

            const enemy = {
                x: enemyPos.x,
                y: enemyPos.y,
                health: tempEnemyHealth, // Will be updated after health distribution
                maxHealth: tempEnemyHealth, // Will be updated after health distribution
                role: role,
                damageDealt: initialEnemyDamageDealt,
                stepsTaken: initialEnemyStepsTaken,
                currentFlow: initialEnemyFlowForThisEnemy,
                lastX: enemyPos.x,
                lastY: enemyPos.y,
                pathToPlayer: [],
                lastPathCalculation: 0,
                name: getRandomCreatureName()
            };

            enemies.push(enemy);
        } else {
            console.warn(`Could not find an empty floor tile for enemy ${i + 1}`);
            break; // Stop if no more spots can be found
        }
    }

    // Distribute health among enemies
    for (let i = 0; i < enemies.length; i++) {
        let healthForThisEnemy;
        if (i === enemies.length - 1) {
            // Last enemy gets all remaining health
            healthForThisEnemy = remainingHealthToDistribute;
        } else {
            // Other enemies get a random portion of remaining health
            healthForThisEnemy = getRandomInt(1, Math.max(1, Math.floor(remainingHealthToDistribute / (enemies.length - i))));
        }
        
        enemies[i].health = healthForThisEnemy;
        enemies[i].maxHealth = healthForThisEnemy;
        remainingHealthToDistribute -= healthForThisEnemy;
    }

    console.log(`Spawned ${enemies.length} enemies with health distribution:`, enemies.map(e => e.health));
}

function spawnPickups() {
    // Filter out previous level's static pickups, keep only enemy drops (if any are left uncollected)
    staticDamageNumbers = staticDamageNumbers.filter(item => item.isEnemyDrop);

    let pointsToDistribute = currentLevel;
    let numPickupsToSpawn = 0;

    if (currentLevel === 1) {
        numPickupsToSpawn = 1; // For level 1, always spawn exactly one pickup
    } else {
        // For other levels, distribute points among multiple pickups as before
        // This logic can be refined if you want a specific number of pickups per level
        // For now, it will try to create pickups with values up to currentLevel,
        // resulting in a variable number of pickups.
        numPickupsToSpawn = currentLevel; // A rough estimate, actual number depends on random values
    }

    for (let i = 0; i < numPickupsToSpawn && pointsToDistribute > 0; i++) {
        const excludeList = [player, stairs, ...enemies, ...staticDamageNumbers.map(s => ({x: s.x, y: s.y}))];
        const pickupPos = findEmptyFloorTile(excludeList);

        if (pickupPos) {
            let pickupValue;
            if (currentLevel === 1) {
                pickupValue = pointsToDistribute; // For level 1, the single pickup gets all points
            } else {
                // Determine the maximum value for the current pickup.
                // It should be at least 1, not more than the remaining points.
                const maxPickupValue = pointsToDistribute;
                pickupValue = getRandomInt(1, maxPickupValue);
            }
            
            staticDamageNumbers.push({
                x: pickupPos.x,
                y: pickupPos.y,
                parts: [{ content: { type: 'number', value: pickupValue }, offsetX: 0, offsetY: 0 }],
                isEnemyDrop: false // Mark as a static pickup
            });
            pointsToDistribute = pointsToDistribute - pickupValue; // Explicit assignment
        } else {
            console.warn(`Could not place a pickup with ${pointsToDistribute} points. Remaining: ${pointsToDistribute}.`);
            break; // Stop if no more spots can be found
        }
    }
}

// ======================== ENTITY PLACEMENT ========================

/**
 * Optimized helper function to find an empty floor tile with caching
 */
function findEmptyFloorTile(excludeEntities = []) {
    // Safety check for circular dependency: player position may not be set during initial map generation
    const hasValidPlayerPosition = player && 
        typeof player.x === 'number' && typeof player.y === 'number' && 
        !isNaN(player.x) && !isNaN(player.y);
    
    if (!hasValidPlayerPosition) {
        console.warn("Player position invalid, using fallback tile placement without reachability check");
        let attempts = 0;
        const MAX_FALLBACK_ATTEMPTS = 100; // Reduced for efficiency
        while (attempts < MAX_FALLBACK_ATTEMPTS) {
            const randX = getRandomInt(0, dynamicMapWidth - 1);
            const randY = getRandomInt(0, dynamicMapHeight - 1);
            if (gameMap[randY][randX] === TILE_FLOOR &&
                !excludeEntities.some(e => e.x === randX && e.y === randY)) {
                console.log(`Found floor tile at (${randX}, ${randY}) using simple placement (no reachability check)`);
                return { x: randX, y: randY };
            }
            attempts++;
        }
        console.error("Failed to find any floor tile even with simple placement");
        return null;
    }

    // Player position is valid - use full pathfinding for reachability checks
    // Pre-compute exclude positions for faster lookup
    const excludeSet = new Set();
    for (let i = 0; i < excludeEntities.length; i++) {
        const e = excludeEntities[i];
        excludeSet.add(`${e.x},${e.y}`);
    }

    const potentialTiles = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    // Optimized double loop with early exit conditions
    for (let y = 0; y < dynamicMapHeight; y++) {
        for (let x = 0; x < dynamicMapWidth; x++) {
            if (gameMap[y][x] === TILE_FLOOR && !excludeSet.has(`${x},${y}`)) {
                // Quick wall neighbor check
                let wallNeighbors = 0;
                for (let i = 0; i < 4; i++) {
                    const dx = directions[i][0];
                    const dy = directions[i][1];
                    const checkX = x + dx;
                    const checkY = y + dy;

                    if (checkX >= 0 && checkX < dynamicMapWidth && checkY >= 0 && checkY < dynamicMapHeight) {
                        if (gameMap[checkY][checkX] === TILE_WALL) {
                            wallNeighbors++;
                        }
                    } else {
                        wallNeighbors++; // Out of bounds treated as wall
                    }
                }

                // Prefer tiles with fewer wall neighbors (more open areas)
                potentialTiles.push({ x, y, wallNeighbors });
            }
        }
    }

    // Sort by wall neighbors (ascending = more open areas first)
    potentialTiles.sort((a, b) => a.wallNeighbors - b.wallNeighbors);

    // Test reachability for the best candidates
    for (let i = 0; i < Math.min(potentialTiles.length, 20); i++) {
        const tile = potentialTiles[i];
        
        // Quick reachability test
        const path = findPathBasic(player.x, player.y, tile.x, tile.y, gameMap, dynamicMapWidth, dynamicMapHeight, excludeEntities);
        if (path && path.length > 0) {
            console.log(`Found reachable floor tile at (${tile.x}, ${tile.y}) with ${tile.wallNeighbors} wall neighbors`);
            return tile;
        }
    }

    console.error("Failed to find a reachable floor tile after checking candidates");
    return potentialTiles.length > 0 ? potentialTiles[0] : null;
}

function placeStairsOppositeCorner() {
    // Debug output reduced for performance
    let found = false;
    let attempts = 0;
    const MAX_PLACEMENT_ATTEMPTS = 1000;
    const MIN_OPEN_NEIGHBORS_FOR_STAIRS = 2; // Minimum number of adjacent floor tiles for stairs

    const searchStartX = Math.floor(dynamicMapWidth * 3 / 4);
    const searchStartY = Math.floor(dynamicMapHeight * 3 / 4);

    let validStairsCandidates = [];
    const cardinalDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    // First, try to find candidates with enough open neighbors that don't break connectivity
    for (let y = searchStartY; y < dynamicMapHeight; y++) {
        for (let x = searchStartX; x < dynamicMapWidth; x++) {
            if (y >= 0 && y < dynamicMapHeight && x >= 0 && x < dynamicMapWidth &&
                gameMap[y][x] === TILE_FLOOR && (x !== player.x || y !== player.y)) {

                let openNeighbors = 0;
                for (const [dx, dy] of cardinalDirections) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    if (checkX >= 0 && checkX < dynamicMapWidth && checkY >= 0 && checkY < dynamicMapHeight &&
                        gameMap[checkY][checkX] === TILE_FLOOR) {
                        openNeighbors++;
                    }
                }

                if (openNeighbors >= MIN_OPEN_NEIGHBORS_FOR_STAIRS) {
                    // Test placing stairs here and check if connectivity is maintained
                    const originalTile = gameMap[y][x];
                    gameMap[y][x] = TILE_STAIRS;
                    
                    if (checkConnectivity(player.x, player.y, gameMap)) {
                        validStairsCandidates.push({ x, y, openNeighbors });
                    }
                    
                    // Restore original tile
                    gameMap[y][x] = originalTile;
                }
            }
        }
    }

    // Sort candidates by openNeighbors in descending order
    validStairsCandidates.sort((a, b) => b.openNeighbors - a.openNeighbors);

    if (validStairsCandidates.length > 0) {
        // Pick from best candidates and validate connectivity until we find one that doesn't create chokepoints
        const bestCandidatesSlice = validStairsCandidates.slice(0, Math.min(5, validStairsCandidates.length));
        
        for (const candidate of bestCandidatesSlice) {
            stairs.x = candidate.x;
            stairs.y = candidate.y;
            gameMap[candidate.y][candidate.x] = TILE_STAIRS;
            
            // Final connectivity check
            if (checkConnectivity(player.x, player.y, gameMap)) {
                found = true;
                console.log(`Stairs placed at (${candidate.x}, ${candidate.y}) with ${candidate.openNeighbors} open neighbors`);
                break;
            } else {
                // Restore and try next candidate
                gameMap[candidate.y][candidate.x] = TILE_FLOOR;
            }
        }
    }

    // Fallback placement if no good candidates found
    if (!found) {
        console.warn("Using fallback stairs placement");
        // Place stairs at any available floor tile, starting from opposite corner
        for (let y = dynamicMapHeight - 1; y >= 0; y--) {
            for (let x = dynamicMapWidth - 1; x >= 0; x--) {
                if (gameMap[y][x] === TILE_FLOOR && (x !== player.x || y !== player.y)) {
                    stairs.x = x;
                    stairs.y = y;
                    gameMap[y][x] = TILE_STAIRS;
                    found = true;
                    console.log(`Fallback stairs placed at (${x}, ${y})`);
                    break;
                }
            }
            if (found) break;
        }
    }

    if (!found) {
        console.error("Failed to place stairs even with fallback method");
    }

    return found;
}

function placeKey() {
    let found = false;
    let attempts = 0;
    const MAX_PLACEMENT_ATTEMPTS = 1000;

    while (!found && attempts < MAX_PLACEMENT_ATTEMPTS) {
        const randX = Math.floor(Math.random() * dynamicMapWidth);
        const randY = Math.floor(Math.random() * dynamicMapHeight);

        // Place key on floor tiles, but not on player, stairs, or enemy positions
        if (gameMap[randY][randX] === TILE_FLOOR && 
            (randX !== player.x || randY !== player.y) && 
            (randX !== stairs.x || randY !== stairs.y)) {
            
            // Check if any enemy is on this position
            let enemyOnTile = false;
            for (let enemy of enemies) {
                if (enemy.x === randX && enemy.y === randY) {
                    enemyOnTile = true;
                    break;
                }
            }

            if (!enemyOnTile) {
                key.x = randX;
                key.y = randY;
                key.collected = false;
                found = true;
                console.log(`Key placed at (${randX}, ${randY})`);
                
                // Double-check: if any enemy somehow ended up on the key position, move them away
                enemies.forEach(enemy => {
                    if (enemy.x === key.x && enemy.y === key.y) {
                        console.log(`Moving enemy away from key position (${key.x}, ${key.y})`);
                        // Find a new position for this enemy
                        const newPos = findEmptyFloorTile([player, stairs, key, ...enemies.filter(e => e !== enemy)]);
                        if (newPos) {
                            enemy.x = newPos.x;
                            enemy.y = newPos.y;
                            console.log(`Enemy moved to (${newPos.x}, ${newPos.y})`);
                        }
                    }
                });
            }
        }
        attempts++;
    }

    if (!found) {
        console.error("Failed to find a valid key position after many attempts. Forcing placement.");
        // Find any available floor tile
        for (let y = 0; y < dynamicMapHeight; y++) {
            for (let x = 0; x < dynamicMapWidth; x++) {
                if (gameMap[y][x] === TILE_FLOOR) {
                    key.x = x;
                    key.y = y;
                    key.collected = false;
                    found = true;
                    console.log(`Key force-placed at (${x}, ${y})`);
                    break;
                }
            }
            if (found) break;
        }
    }

    return found;
}

// ======================== PATHFINDING ========================

function findPathBasic(startX, startY, endX, endY, map, mapWidth, mapHeight, entitiesToStrictlyAvoid = []) {
    // Create a set of positions to avoid for faster lookup
    const avoidSet = new Set();
    entitiesToStrictlyAvoid.forEach(entity => {
        if (entity && typeof entity.x === 'number' && typeof entity.y === 'number') {
            avoidSet.add(`${entity.x},${entity.y}`);
        }
    });

    const openList = [];
    const closedSet = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    const startKey = `${startX},${startY}`;
    const endKey = `${endX},${endY}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, endX, endY));
    openList.push({ x: startX, y: startY, f: fScore.get(startKey) });

    while (openList.length > 0) {
        // Find node with lowest f score
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift();
        const currentKey = `${current.x},${current.y}`;

        if (current.x === endX && current.y === endY) {
            // Reconstruct path
            const path = [];
            let pathKey = currentKey;
            while (pathKey) {
                const [x, y] = pathKey.split(',').map(Number);
                path.unshift({ x, y });
                pathKey = cameFrom.get(pathKey);
            }
            return path;
        }

        closedSet.add(currentKey);

        // Check all neighbors
        const neighbors = [
            { x: current.x, y: current.y - 1 }, // up
            { x: current.x + 1, y: current.y }, // right
            { x: current.x, y: current.y + 1 }, // down
            { x: current.x - 1, y: current.y }  // left
        ];

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;

            // Skip if out of bounds
            if (neighbor.x < 0 || neighbor.x >= mapWidth || neighbor.y < 0 || neighbor.y >= mapHeight) {
                continue;
            }

            // Skip if wall
            if (map[neighbor.y][neighbor.x] === TILE_WALL) {
                continue;
            }

            // Skip if this position should be strictly avoided (unless it's the end goal)
            if (avoidSet.has(neighborKey) && neighborKey !== endKey) {
                continue;
            }

            // Skip if already in closed set
            if (closedSet.has(neighborKey)) {
                continue;
            }

            const tentativeGScore = gScore.get(currentKey) + 1;

            // Check if this path to neighbor is better than any previous one
            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeGScore);
                const f = tentativeGScore + heuristic(neighbor.x, neighbor.y, endX, endY);
                fScore.set(neighborKey, f);

                // Add to open list if not already there
                if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openList.push({ x: neighbor.x, y: neighbor.y, f });
                }
            }
        }
    }

    return null; // No path found
}

function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance
}

// ======================== EXPORTS ========================

// Export all functions to global scope for backward compatibility
if (typeof window !== 'undefined') {
    // Map initialization
    window.initializeMap = initializeMap;
    window.generatePaths = generatePaths;
    
    // World management
    window.getCurrentWorld = getCurrentWorld;
    window.canUnlockWorld = canUnlockWorld;
    window.checkAndUnlockWorlds = checkAndUnlockWorlds;
    window.setupWorldColors = setupWorldColors;
    window.updateBackgroundColor = updateBackgroundColor;
    
    // World generators
    window.generateBasicMap = generateBasicMap;
    window.generateDesertMap = generateDesertMap;
    window.generateIceMap = generateIceMap;
    window.generateForestMap = generateForestMap;
    window.generateCrystalMap = generateCrystalMap;
    window.generateVolcanoMap = generateVolcanoMap;
    window.generateCyberMap = generateCyberMap;
    window.generateMarbleMap = generateMarbleMap;
    window.generateVoidMap = generateVoidMap;
    window.generateWorldMap = generateWorldMap;
    
    // Entity placement
    window.findEmptyFloorTile = findEmptyFloorTile;
    window.placeStairsOppositeCorner = placeStairsOppositeCorner;
    window.placeKey = placeKey;
    
    // Entity spawning
    window.spawnEnemies = spawnEnemies;
    window.spawnPickups = spawnPickups;
    
    // Pathfinding
    window.findPathBasic = findPathBasic;
    window.heuristic = heuristic;
}