/**
 * Global Game State Management
 * Contains all global variables and their initialization logic
 */

// === TURN CONTROL VARIABLES ===
var playerHasMovedThisLevel = false;
var inputLocked = false;

// === WORLD PROGRESSION VARIABLES ===
var currentWorld = 1;
var unlockedWorlds = [1]; // World 1 is always unlocked
var totalPlayerScore = 0; // Accumulated score across all runs

// === ACTIVITY LOG STATE ===
var activityLog = [];
var killedEnemiesThisTurn = [];

// === ANIMATION AND TIMING VARIABLES ===
var deathAnimationActive = false;
var deathAnimationStartTime = 0;
var timeScale = 1; // Global time scale for animations
var gameStartZoomStartTime = 0;
var gameStartedOverlayStartTime = 0;
var restartTextAnimationActive = false;
var restartTextAnimationStartTime = 0;
var restartTextParticles = [];

// === GAME RUNNING STATE ===
var isGameRunning = true; // Game is always running after initial load now

// === GAME STATISTICS ===
var hitsDealt = 0;
var hitsTaken = 0;
var stepsTaken = 0;
var totalDamageDealt = 0;
var playerFlow = 0;

// === PER-LEVEL SCORE TRACKING ===
var totalScore = 0;
var enemiesSpawnedThisLevel = 0;
var levelStartSteps = 0;
var levelStartDamage = 0;
var levelStartHitsTaken = 0;
var lastLevelScoreBreakdown = null;

// === AUTO-MOVEMENT STATE ===
var autoMode = null;
var autoMovePath = [];
var currentPathIndex = 0;
var autoMoveTimeoutId = null;
var AUTO_MOVE_SPEED = DEFAULT_AUTO_MOVE_SPEED;

// === GAMEPAD INPUT STATE ===
var gamepadIndex = -1;
var lastGamepadState = {
    dx: 0,
    dy: 0,
    lastMoveTime: 0,
    buttonA: false
};

// === PERFORMANCE OPTIMIZATION ===
var pathfindingCache = new Map();
var cacheValidationFrame = 0;
var spatialIndex = new Map(); // Grid-based spatial index for fast entity queries
var spatialGridSize = SPATIAL_GRID_SIZE; // Use constant from constants.js
var spatialIndexValid = false;
var performanceStats = {
    pathfindingCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastResetTime: performance.now()
};

// === CORE GAME OBJECTS ===
var gameCanvas;
var ctx;
var gameMap;
var dynamicMapWidth;
var dynamicMapHeight;
var player;
var stairs;
var key;
var enemies;
var items;
var currentLevel;
var gameOver;
var dynamicTileSize;
var visitedTiles;

// === ANIMATION STATES ===
var doorAnimActive = false;
var doorAnimStartTime = 0;
var doorAnimDuration = 1000; // 1000ms (1 second) door opening animation
var doorAnimTimeoutId = null; // Track door animation timeout for cleanup
var doorShakeActive = false;
var doorShakeStartTime = 0;
var doorShakeDuration = 800; // 800ms slower shake animation
var triangleFlyActive = false;
var triangleFlyStartTime = 0;
var triangleFlyDuration = 600; // 600ms triangle flight animation
var triangleFlyStartPos = { x: 0, y: 0 };
var triangleFlyEndPos = { x: 0, y: 0 };
var teleportAnimActive = false;
var teleportAnimStartTime = 0;
var teleportAnimDuration = 1200; // 1200ms teleport beam animation (slower)
var teleportStartPos = { x: 0, y: 0 };
var teleportEndPos = { x: 0, y: 0 };
var gameStartZoomActive;
var gameStartedOverlayActive;

// === ANIMATION FRAME CONTROL ===
var animationFrameId = null;

// === EVENT SYSTEM VARIABLES ===
var gameHistory = []; // Stores snapshots for event detection
var activeEventMessages = []; // Messages currently displayed on screen

// === EVENT SYSTEM CONSTANTS ===
// Combat Events - Offensive
var ONE_SHOT_MIN_HEALTH = 5; // Minimum enemy health for one-shot
var ONE_SHOT_MAJOR_HEALTH = 12; // Major one-shot kill threshold
var KILLING_SPREE_COUNT = 3; // Enemies for killing spree
var KILLING_SPREE_MAJOR_COUNT = 5; // Major killing spree
var MASSACRE_COUNT = 7; // Enemies for massacre event
var FLAWLESS_VICTORY_TURNS = 5; // Turns without taking damage while dealing damage
var BERSERKER_DAMAGE_THRESHOLD = 30; // Total damage in short period
var BERSERKER_TURNS = 3; // Time window for berserker mode
var EXECUTION_LOW_HEALTH_RATIO = 0.15; // Enemy health ratio for execution
var COMBO_KILLS_COUNT = 2; // Consecutive kills for combo
var OVERKILL_DAMAGE_RATIO = 2.0; // Damage dealt vs enemy health for overkill
var HEADHUNTER_HIGH_VALUE_ENEMY = 15; // High-value enemy health threshold
var GLASS_CANNON_DAMAGE_RATIO = 3.0; // Damage dealt vs health remaining

// Combat Events - Defensive
var SURROUNDED_THRESHOLD = 2; // Adjacent enemies for surrounded
var SURROUNDED_MAJOR_THRESHOLD = 4; // Major surrounded event
var ENEMY_OVERWHELM_THRESHOLD = 18; // Combined enemy health
var ENEMY_OVERWHELM_MAJOR_THRESHOLD = 35; // Major overwhelm
var LAST_STAND_HEALTH_RATIO = 0.1; // Health ratio for last stand
var CORNERED_THRESHOLD = 6; // Blocked directions out of 8
var NARROW_ESCAPE_HEALTH_RATIO = 0.05; // Health ratio for narrow escape
var PERFECT_DODGE_TURNS = 3; // Turns dodging all attacks
var SURVIVAL_INSTINCT_TURNS = 8; // Turns surviving at low health
var CLUTCH_HEAL_TIMING = 2; // Turns before death when healing
var DAMAGE_SPONGE_THRESHOLD = 25; // Total damage absorbed
var IRON_WILL_LOW_HEALTH_COMBAT = 0.2; // Health ratio for iron will

// === TACTICAL EVENTS ===
// Movement & Positioning
var STRATEGIC_RETREAT_TURNS = 4; // Turns for retreat analysis
var RETREAT_DISTANCE_INCREASE = 3; // Distance increase needed
var TACTICAL_ADVANCE_DISTANCE = 4; // Distance moved toward enemies
var FLANKING_MANEUVER_ANGLE = 90; // Angle change for flanking
var AMBUSH_WAIT_TURNS = 3; // Turns waiting for enemy approach
var KITING_DISTANCE_MIN = 2; // Minimum distance for kiting
var KITING_TURNS = 4; // Turns maintaining distance while attacking
var MAP_CONTROL_PERCENTAGE = 0.4; // Map area controlled
var CHOKE_POINT_WIDTH = 1; // Narrow passage width
var GUERRILLA_HIT_AND_RUN = 3; // Hit and run sequence length
var POSITIONING_MASTER_TURNS = 6; // Optimal positioning duration

// Resource Management
var HIGH_VALUE_PICKUP_THRESHOLD = 15; // Health collected
var HIGH_VALUE_PICKUP_MAJOR_THRESHOLD = 30; // Major pickup event
var PICKUP_SPREE_TURNS = 3; // Time window for pickups
var RESOURCE_DENIAL_COUNT = 3; // Pickups denied to enemies
var EFFICIENT_PATHING_TURNS = 5; // Turns for efficiency analysis
var WASTEFUL_MOVEMENT_THRESHOLD = 10; // Excess moves without progress
var GREEDY_COLLECTOR_RATIO = 0.8; // Pickup collection efficiency
var RESOURCE_HOARDER_COUNT = 10; // Total resources hoarded

// === EXPLORATION EVENTS ===
var EXPLORER_TURNS = 6; // Turns for exploration analysis
var EXPLORER_TILE_PERCENTAGE = 0.2; // Map percentage explored
var SPEED_RUNNER_PERCENTAGE = 0.8; // Map completion speed
var SECRET_FINDER_CORNERS = 4; // Hidden corners discovered
var THOROUGH_SEARCH_PERCENTAGE = 0.9; // Near-complete exploration
var BACKTRACKER_REVISIT_COUNT = 5; // Tiles revisited
var PATHFINDER_OPTIMAL_ROUTES = 3; // Efficient path discoveries
var CARTOGRAPHER_MAP_COVERAGE = 0.95; // Near-complete mapping

// === SITUATIONAL EVENTS ===
// Health & Recovery
var NEAR_DEATH_HEALTH_RATIO = 0.15; // Near-death threshold
var RECOVERY_HEALTH_GAIN_RATIO = 0.4; // Recovery amount needed
var FULL_HEALTH_TURNS = 8; // Turns at maximum health
var STEADY_DECLINE_TURNS = 5; // Consistent health loss
var HEALTH_ROLLER_COASTER_SWINGS = 3; // Major health changes
var REGENERATION_HEALTH_GAIN = 20; // Health gained rapidly
var VITALITY_HIGH_HEALTH_COMBAT = 0.8; // Health ratio for vitality

// Persistence & Endurance
var LONG_FIGHT_TURNS_THRESHOLD = 12; // Extended combat duration
var LONG_FIGHT_MAJOR_THRESHOLD = 20; // Major long fight
var MARATHON_TURNS = 50; // Very long level duration
var UNSTOPPABLE_TURNS = 6; // No damage taken while dealing damage
var UNSTOPPABLE_MAJOR_TURNS = 12; // Major unstoppable streak
var PERSISTENCE_ENEMY_HEALTH = 20; // High-health enemy threshold
var GRINDING_TURNS = 15; // Slow progress against tough enemies
var ENDURANCE_TEST_DURATION = 30; // Extended play duration
var RELENTLESS_PURSUIT_TURNS = 8; // Chasing enemies consistently

// === SPECIAL CIRCUMSTANCES ===
// Environmental Events
var STAIRS_BLOCKED_DISTANCE = 999; // No path to stairs
var CORNER_CAMPING_TURNS = 6; // Staying in corner
var CENTRAL_POSITION_DISTANCE = 3; // Distance from map center
var EDGE_WALKER_DISTANCE = 2; // Distance from map edge
var TUNNEL_VISION_WIDTH = 3; // Narrow area focus
var MAZE_RUNNER_COMPLEX_PATH = 15; // Complex pathfinding
var WALL_HUGGER_EDGE_PREFERENCE = 0.7; // Edge movement preference

// Psychological Events
var CONFIDENCE_HIGH_FLOW = 2.0; // High flow state
var DESPERATION_LOW_HEALTH = 0.08; // Desperate health level
var CALCULATED_RISK_THRESHOLD = 0.3; // Health ratio for risky moves
var PANIC_MODE_SURROUNDED = 5; // Enemies surrounding for panic
var ZEN_MODE_TURNS = 10; // Calm, methodical play
var BERSERKER_RAGE_DAMAGE = 40; // Total damage for rage mode
var ICE_COLD_PRECISION_ACCURACY = 0.9; // High accuracy threshold

// === ACHIEVEMENT EVENTS ===
// Milestone Events
var FIRST_BLOOD_LEVEL = 1; // First kill of the game
var PACIFIST_TURNS = 20; // Turns without dealing damage
var PERFECTIONIST_NO_DAMAGE = 0; // No damage taken entire level
var SPEEDSTER_TURN_LIMIT = 15; // Fast level completion
var COLLECTOR_PICKUP_RATIO = 0.9; // Pickups collected vs available
var COMPLETIONIST_FULL_CLEAR = 0.95; // Near-complete level clear
var MINIMALIST_EFFICIENT_CLEAR = 0.5; // Efficient minimal completion

// Meta Events
var COMEBACK_HEALTH_DEFICIT = 0.2; // Health deficit overcome
var DOMINANCE_ENEMY_RATIO = 3.0; // Player health vs enemy health
var UNDERDOG_ENEMY_ADVANTAGE = 2.0; // Enemy advantage overcome
var BALANCED_APPROACH_VARIANCE = 0.3; // Consistent play style
var ADAPTATION_STRATEGY_CHANGES = 3; // Different approaches tried
var LEGENDARY_PERFORMANCE_SCORE = 1000; // High score threshold
var EPIC_COMEBACK_NEAR_DEATH = 0.05; // Extreme comeback threshold

// === ADDITIONAL CONSTANTS ===
var HISTORY_LENGTH = 15; // Number of turns to keep in history for analysis
var EVENT_TEXT_DURATION = 2000; // Duration for event messages

// HIGH_SCORE auto-mode constants
var HIGH_SCORE_LOW_HEALTH_THRESHOLD_RATIO = 0.3; // Player health below this will prioritize pickups
var HIGH_SCORE_WEAK_ENEMY_THRESHOLD_RATIO = 1.0; // Enemy is "weak" if its health is <= player.health * this ratio

// Damage animation duration constants
var MIN_DAMAGE_ANIM_DURATION = 300;
var MAX_DAMAGE_ANIM_DURATION = 1000;
var MAX_DAMAGE_VALUE_FOR_ANIM_SCALE = 10;

// === GAME STATE INITIALIZATION ===
/**
 * Initialize global game state variables
 * This function should be called during game startup
 */
function initializeGameState() {
    console.log("=== INITIALIZING GAME STATE ===");
    
    // Reset all state variables to default values
    playerHasMovedThisLevel = false;
    inputLocked = false;
    
    // Initialize collections
    activityLog = [];
    killedEnemiesThisTurn = [];
    restartTextParticles = [];
    autoMovePath = [];
    gameHistory = [];
    activeEventMessages = [];
    
    // Initialize performance tracking
    pathfindingCache = new Map();
    spatialIndex = new Map();
    spatialIndexValid = false;
    cacheValidationFrame = 0;
    
    // Reset animation states
    deathAnimationActive = false;
    doorAnimActive = false;
    doorShakeActive = false;
    triangleFlyActive = false;
    teleportAnimActive = false;
    gameStartZoomActive = false;
    gameStartedOverlayActive = false;
    restartTextAnimationActive = false;
    
    // Reset timing
    deathAnimationStartTime = 0;
    gameStartZoomStartTime = 0;
    gameStartedOverlayStartTime = 0;
    restartTextAnimationStartTime = 0;
    doorAnimStartTime = 0;
    doorShakeStartTime = 0;
    triangleFlyStartTime = 0;
    teleportAnimStartTime = 0;
    
    // Reset statistics
    hitsDealt = 0;
    hitsTaken = 0;
    stepsTaken = 0;
    totalDamageDealt = 0;
    playerFlow = 0;
    totalScore = 0;
    enemiesSpawnedThisLevel = 0;
    levelStartSteps = 0;
    levelStartDamage = 0;
    levelStartHitsTaken = 0;
    
    // Reset auto-movement
    autoMode = null;
    currentPathIndex = 0;
    if (autoMoveTimeoutId) {
        clearTimeout(autoMoveTimeoutId);
        autoMoveTimeoutId = null;
    }
    
    // Reset performance stats
    performanceStats = {
        pathfindingCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        lastResetTime: performance.now()
    };
    
    console.log("✅ Game state initialized");
}

/**
 * Reset game state for a new game
 */
function resetGameState() {
    console.log("=== RESETTING GAME STATE ===");
    
    // Reset game progress
    currentLevel = 1;
    gameOver = false;
    isGameRunning = true;
    
    // Reset player state (will be properly initialized when player object is created)
    playerHasMovedThisLevel = false;
    
    // Clear collections
    activityLog = [];
    killedEnemiesThisTurn = [];
    gameHistory = [];
    activeEventMessages = [];
    
    // Reset statistics for new game
    hitsDealt = 0;
    hitsTaken = 0;
    stepsTaken = 0;
    totalDamageDealt = 0;
    playerFlow = 0;
    totalScore = 0;
    
    // Reset gamepad state
    gamepadIndex = -1;
    lastGamepadState = { dx: 0, dy: 0, lastMoveTime: 0 };
    
    console.log("✅ Game state reset for new game");
}

// Export functions to global scope for compatibility
window.initializeGameState = initializeGameState;
window.resetGameState = resetGameState;