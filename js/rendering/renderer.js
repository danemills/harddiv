/**
 * Rendering System Module
 * Handles all visual rendering, animations, and UI drawing operations
 */

// ======================== UTILITY FUNCTIONS ========================

/**
 * Draws an off-screen indicator for an entity.
 * @param {object} entity - The entity ({x, y}) to draw an indicator for.
 * @param {string} color - The color of the indicator.
 * @param {number} offsetX - The camera's X offset.
 * @param {number} offsetY - The camera's Y offset.
 * @param {number} opacity - The opacity of the indicator.
 */
function drawOffScreenIndicator(entity, color, offsetX, offsetY, opacity) {
    const minIndicatorSize = dynamicTileSize * 0.3;
    const maxIndicatorSize = dynamicTileSize;

    const entityPixelX = entity.x * dynamicTileSize + offsetX;
    const entityPixelY = entity.y * dynamicTileSize + offsetY;

    const distFromLeft = Math.max(0, -entityPixelX);
    const distFromRight = Math.max(0, entityPixelX - gameCanvas.width); // Distance entity extends beyond right edge
    const distFromTop = Math.max(0, -entityPixelY);
    const distFromBottom = Math.max(0, entityPixelY - gameCanvas.height); // Distance entity extends beyond bottom edge

    const distanceOffScreen = Math.max(distFromLeft, distFromRight, distFromTop, distFromBottom);

    const maxScalingDistance = Math.max(gameCanvas.width, gameCanvas.height) / 3; // Use gameCanvas.width/height

    const normalizedDistance = Math.min(distanceOffScreen / maxScalingDistance, 1);

    const currentIndicatorSize = maxIndicatorSize - (normalizedDistance * (maxScalingDistance - minIndicatorSize));

    let indicatorX, indicatorY;

    if (entityPixelX < 0) {
        indicatorX = 0;
    } else if (entityPixelX + dynamicTileSize > gameCanvas.width) { // Use gameCanvas.width
        indicatorX = gameCanvas.width - currentIndicatorSize; // Use gameCanvas.width
    } else {
        indicatorX = entityPixelX + (dynamicTileSize / 2) - (currentIndicatorSize / 2);
    }

    if (entityPixelY < 0) {
        indicatorY = 0;
    } else if (entityPixelY + dynamicTileSize > gameCanvas.height) { // Use gameCanvas.height
        indicatorY = gameCanvas.height - currentIndicatorSize; // Use gameCanvas.height
    } else {
        indicatorY = entityPixelY + (dynamicTileSize / 2) - (currentIndicatorSize / 2);
    }

    if (entityPixelX < 0 && entityPixelY < 0) {
        indicatorX = 0;
        indicatorY = 0;
    } else if (entityPixelX + dynamicTileSize > gameCanvas.width && entityPixelY < 0) { // Use gameCanvas.width
        indicatorX = gameCanvas.width - currentIndicatorSize; // Use gameCanvas.width
        indicatorY = 0;
    } else if (entityPixelX < 0 && entityPixelY + dynamicTileSize > gameCanvas.height) { // Use gameCanvas.height
        indicatorX = 0;
        indicatorY = gameCanvas.height - currentIndicatorSize; // Use gameCanvas.height
    } else if (entityPixelX + dynamicTileSize > gameCanvas.width && entityPixelY + dynamicTileSize > gameCanvas.height) { // Use gameCanvas.width/height
        indicatorX = gameCanvas.width - currentIndicatorSize; // Use gameCanvas.width
        indicatorY = gameCanvas.height - currentIndicatorSize; // Use gameCanvas.height
    } else if (entityPixelX < 0 || entityPixelX + dynamicTileSize > gameCanvas.width) { // Use gameCanvas.width
        indicatorY = Math.max(0, Math.min(gameCanvas.height - currentIndicatorSize, indicatorY)); // Use gameCanvas.height
    } else if (entityPixelY < 0 || entityPixelY + dynamicTileSize > gameCanvas.height) { // Use gameCanvas.height
        indicatorX = Math.max(0, Math.min(gameCanvas.width - currentIndicatorSize, indicatorX)); // Use gameCanvas.width
    }

    ctx.save();
    ctx.globalAlpha = opacity; // Apply opacity to the indicator
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(indicatorX), Math.floor(indicatorY), Math.floor(currentIndicatorSize), Math.floor(currentIndicatorSize));
    ctx.restore();
}

/**
 * Calculates target tile size based on level for zoom effects
 * @param {number} level - The current level
 * @returns {number} Target tile size for this level
 */
function calculateTargetTileSize(level) {
    const initialMaxTileSize = Math.floor(Math.min(gameCanvas.width / MAX_VISIBLE_TILES_LEVEL1, gameCanvas.height / MAX_VISIBLE_TILES_LEVEL1));
    const finalMinTileSize = Math.floor(Math.min(gameCanvas.width / MIN_VISIBLE_TILES_MAX_LEVEL, gameCanvas.height / MIN_VISIBLE_TILES_MAX_LEVEL));
    let calculated = initialMaxTileSize - ((Math.min(level, ZOOM_LEVELS_EFFECTIVE) - 1) * (initialMaxTileSize - finalMinTileSize) / (ZOOM_LEVELS_EFFECTIVE - 1));
    return Math.max(finalMinTileSize, Math.floor(calculated));
}

/**
 * Updates the activity log display in the right panel
 */
function updateActivityLogDisplay() {
    const rightPanel = document.getElementById('rightPanel');
    rightPanel.innerHTML = ''; // Clear existing entries
    
    activityLog.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'activity-log-entry';
        
        // Dim older entries
        if (index > 0) {
            entryDiv.classList.add('dimmed');
        }
        
        if (entry.isMajorEvent) {
            // Major event entry with warning symbol
            entryDiv.style.backgroundColor = '#2a2a00'; // Dark yellow background
            entryDiv.style.border = '1px solid #ffaa00'; // Orange border
            entryDiv.style.padding = '4px';
            entryDiv.style.borderRadius = '3px';
            entryDiv.style.marginBottom = '2px';
            
            const warningSymbol = document.createElement('span');
            warningSymbol.innerHTML = '⚠️ ';
            warningSymbol.style.color = '#ffaa00';
            warningSymbol.style.fontWeight = 'bold';
            
            const messageText = document.createElement('span');
            messageText.innerHTML = entry.message;
            messageText.style.color = '#ffffff';
            
            entryDiv.appendChild(warningSymbol);
            entryDiv.appendChild(messageText);
        } else {
            // Regular entry
            entryDiv.innerHTML = entry.message;
            entryDiv.style.color = entry.color || '#ffffff';
        }
        
        rightPanel.appendChild(entryDiv);
    });
    
    // Scroll to bottom to show latest entry
    rightPanel.scrollTop = rightPanel.scrollHeight;
}

/**
 * Resizes the game canvas to fit the current window
 */
function resizeCanvas() {
    // Get container dimensions
    const gameContainer = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    
    if (!gameContainer || !canvas) {
        console.error('Required elements not found:', { 
            gameContainer: !!gameContainer, 
            canvas: !!canvas 
        });
        return;
    }

    // Make canvas truly fullscreen
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Set the container dimensions to fullscreen
    gameContainer.style.width = `${canvasWidth}px`;
    gameContainer.style.height = `${canvasHeight}px`;
    
    // Set the canvas dimensions to fullscreen
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Calculate new tile size
    const targetDynamicTileSizeForLevel = calculateTargetTileSize(currentLevel);

    // Update the tile size
    if (gameStartZoomActive) {
        // Let the zoom animation handle the tile size
        dynamicTileSize = Math.floor(targetDynamicTileSizeForLevel * GAME_START_INITIAL_ZOOM_FACTOR);
    } else {
        // Set tile size directly
        dynamicTileSize = Math.floor(targetDynamicTileSizeForLevel);
    }

    // Force a redraw
    drawGame();
}

// Add a roundRect method to CanvasRenderingContext2D for drawing rounded rectangles
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

// ======================== EXPORTS ========================

// Export all functions to global scope for backward compatibility
if (typeof window !== 'undefined') {
    // Utility functions
    window.drawOffScreenIndicator = drawOffScreenIndicator;
    window.calculateTargetTileSize = calculateTargetTileSize;
    window.updateActivityLogDisplay = updateActivityLogDisplay;
    window.resizeCanvas = resizeCanvas;
}