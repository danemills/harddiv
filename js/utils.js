// Utility functions

/**
 * Converts a hexadecimal color string to HSL (Hue, Saturation, Lightness) values.
 * @param {string} hex - The hexadecimal color string (e.g., "#RRGGBB").
 * @returns {Array<number>} An array containing [h, s, l] where h is 0-360 and s, l are 0-100.
 */
function hexToHsl(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

/**
 * Converts HSL (Hue, Saturation, Lightness) values to a hexadecimal color string.
 * @param {number} h - Hue (0-360).
 * @param {number} s - Saturation (0-100).
 * @param {number} l - Lightness (0-100).
 * @returns {string} The hexadecimal color string (e.g., "#RRGGBB").
 */
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0'); // convert to Hex and pad with 0
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Calculates an interpolated color based on a base hexadecimal color and a health ratio.
 * Color becomes darker and muted with lower health ratio, and bright and rich (not lightened) with higher health ratio.
 * @param {string} baseHexColor - The base hexadecimal color (e.g., "#0000CC").
 * @param {number} currentValue - The current health value.
 * @param {number} thresholdValue - The value at which visual effects reach 100%.
 * @returns {string} The interpolated hexadecimal color.
 */
function getHealthColor(baseHexColor, currentValue, thresholdValue) {
    const [h, s_base_original, l_base_original] = hexToHsl(baseHexColor);

    // Calculate ratio, capping at 1.0 to ensure visuals don't exceed 100% intensity
    const clampedRatio = Math.max(0, Math.min(1, currentValue / thresholdValue));

    // Define ranges for saturation and lightness based on desired effect
    // Low power: darker and muted (low saturation, low lightness)
    // High power: bright and rich (high saturation, mid lightness, not lightened)

    const minSaturation = 20; // Muted
    const maxSaturation = 90; // Bright/Rich (e.g., fire engine red would be high sat)

    const minLightness = 15; // Darker at low power
    const maxLightness = 50; // Mid-range for rich colors (like fire engine red)

    // Interpolate saturation: from muted to rich
    const s = minSaturation + (maxSaturation - minSaturation) * clampedRatio;

    // Interpolate lightness: from darker to mid-range.
    // When clampedRatio is 0, l = minLightness (15).
    // When clampedRatio is 1, l = maxLightness (50).
    const l = minLightness + (maxLightness - minLightness) * clampedRatio;

    return hslToHex(h, s, l);
}

/**
 * Calculates an interpolated font weight based on a value.
 * Font becomes thinner with lower value and thicker with higher value.
 * @param {number} currentValue - The current value (health, level, pickup amount).
 * @param {number} thresholdValue - The value at which visual effects reach 100%.
 * @returns {number} The interpolated font weight (100-900).
 */
function getFontWeight(currentValue, thresholdValue) {
    // Normalize value relative to the scaling range (MIN_HEALTH_FOR_VISUAL_EFFECTS to thresholdValue)
    const normalizedValue = Math.max(0, Math.min(1, (currentValue - MIN_HEALTH_FOR_VISUAL_EFFECTS) / (thresholdValue - MIN_HEALTH_FOR_VISUAL_EFFECTS)));

    const minWeight = 100; // Very thin
    const maxWeight = 900; // Full thickness (Black/Heavy)
    return Math.floor(minWeight + (maxWeight - minWeight) * normalizedValue);
}

/**
 * Calculates the distance between two points.
 * @param {object} p1 - First point {x, y}.
 * @param {object} p2 - Second point {x, y}.
 * @returns {number} The distance between the two points.
 */
function getDistance(p1, p2) {
    if (!p1 || !p2) {
        console.error("Attempted to calculate distance with null or undefined point:", p1, p2);
        return Infinity;
    }
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer.
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets the closest entity from an array to a target entity.
 * @param {Array} entities - Array of entities to search through.
 * @param {object} target - Target entity with x, y coordinates.
 * @returns {object|null} The closest entity or null if none found.
 */
function getClosestEntity(entities, target) {
    if (!entities || entities.length === 0 || !target) {
        return null;
    }
    
    let closest = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const distance = getDistance(entity, target);
        if (distance < minDistance) {
            minDistance = distance;
            closest = entity;
        }
    }
    
    return closest;
}

/**
 * Counts reachable tiles from a starting position avoiding certain entities.
 * @param {Array} map - 2D game map array.
 * @param {number} mapWidth - Width of the map.
 * @param {number} mapHeight - Height of the map.
 * @param {number} startX - Starting X coordinate.
 * @param {number} startY - Starting Y coordinate.
 * @param {Array} enemiesToAvoid - Array of entities to treat as obstacles.
 * @returns {number} Number of reachable floor tiles.
 */
function countReachableTiles(map, mapWidth, mapHeight, startX, startY, enemiesToAvoid = []) {
    const visited = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(false));
    const stack = [{x: startX, y: startY}];
    let reachableCount = 0;
    
    // Create a set of enemy positions for faster lookup
    const enemyPositions = new Set();
    enemiesToAvoid.forEach(enemy => {
        enemyPositions.add(`${enemy.x},${enemy.y}`);
    });
    
    while (stack.length > 0) {
        const {x, y} = stack.pop();
        
        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight || 
            visited[y][x] || map[y][x] === TILE_WALL ||
            enemyPositions.has(`${x},${y}`)) {
            continue;
        }
        
        visited[y][x] = true;
        if (map[y][x] === TILE_FLOOR || map[y][x] === TILE_STAIRS) {
            reachableCount++;
        }
        
        // Add neighbors
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dx, dy]) => {
            stack.push({x: x + dx, y: y + dy});
        });
    }
    
    return reachableCount;
}

/**
 * Counts total floor and stairs tiles in the map.
 * @param {Array} map - 2D game map array.
 * @param {number} mapWidth - Width of the map.
 * @param {number} mapHeight - Height of the map.
 * @returns {number} Total number of floor and stairs tiles.
 */
function countTotalFloorAndStairs(map, mapWidth, mapHeight) {
    let count = 0;
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (map[y][x] === TILE_FLOOR || map[y][x] === TILE_STAIRS) {
                count++;
            }
        }
    }
    return count;
}