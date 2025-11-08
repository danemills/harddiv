/**
 * Core Game Logic Module
 * Contains fundamental game functions for game flow, player actions, and game state management
 */

// === CORE GAME FLOW FUNCTIONS ===

/**
 * Handles the main game loop animation frame
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame
 */
function animate(currentTime) {
    try {
        animationFrameId = requestAnimationFrame(animate);
        if (!ctx) {
            console.error("No context available for drawing");
            return;
        }
        if (!gameCanvas) {
            console.error("No canvas available for drawing");
            return;
        }
        drawGame();
    }
    catch (error) {
        console.error("Error in animation loop:", error);
        stopAnimationLoop(); // Stop the loop to prevent further errors
        handleGameOver(); // Attempt to gracefully end the game
    }
}

/**
 * Starts the animation loop
 */
function startAnimationLoop() {
    console.log('Starting animation loop...');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(animate);
    console.log('Animation loop started with ID:', animationFrameId);
}

/**
 * Stops the animation loop
 */
function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Handles game over state and cleanup
 */
function handleGameOver() {
    console.log("Game Over!");
    gameOver = true;
    
    // Cancel any active auto-movement
    if (autoMoveTimeoutId) {
        clearTimeout(autoMoveTimeoutId);
        autoMoveTimeoutId = null;
        autoMode = null;
    }
    
    // Stop automated movement
    if (typeof stopAutomatedMovement === 'function') {
        stopAutomatedMovement();
    }
    
    // Save total score for world progression
    localStorage.setItem('hardDivisionTotalScore', totalPlayerScore.toString());
    
    // Activate death animation effects
    deathAnimationActive = true;
    deathAnimationStartTime = performance.now();
    timeScale = DEATH_SLOW_MOTION_FACTOR; // Activate slow motion
    
    // Remove player movement listener temporarily
    window.removeEventListener('keydown', handleKeyDown);
    
    console.log("Game over state activated with death animation");
}

/**
 * Calculates and returns the current score based on various game metrics
 * @returns {number} The calculated score
 */
function calculateScore() {
    let score = 0;
    if (stepsTaken > 0) {
        const averageDamagePerTurn = totalDamageDealt / stepsTaken;
        score = Math.floor(totalDamageDealt * averageDamagePerTurn);
    }
    return score;
}

/**
 * Proceeds to the next level
 */
function nextLevel() {
    currentLevel++;
    console.log(`Advancing to level ${currentLevel}`);
    
    // We'll add a check in `nextLevel()` or `initGame()` when `resetGameStats` is false.
    // Score persists across levels within the same run.
    
    // Increment enemies spawned counter for the new level
    enemiesSpawnedThisLevel = 0;
    
    // Set level start metrics for the new level
    levelStartSteps = stepsTaken;
    levelStartDamage = totalDamageDealt;
    levelStartHitsTaken = hitsTaken;
    
    // Add current level score to total and prepare for next level
    const currentLevelScore = calculateScore();
    totalPlayerScore += currentLevelScore;
    
    // Check for world progression after score update
    checkAndUnlockWorlds();
    
    // Initialize next level
    initGame(false); // No overlay when progressing levels
}

// Export functions to global scope for compatibility
window.animate = animate;
window.startAnimationLoop = startAnimationLoop;
window.stopAnimationLoop = stopAnimationLoop;
window.handleGameOver = handleGameOver;
window.calculateScore = calculateScore;
window.nextLevel = nextLevel;