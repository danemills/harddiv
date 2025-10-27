// Game constants - make globally accessible
window.CANVAS_WIDTH_INITIAL = 730; // Initial canvas width for logical scaling
window.CANVAS_HEIGHT_INITIAL = 730; // Initial canvas height for logical scaling

window.MAX_VISIBLE_TILES_LEVEL1 = 7; // Adjusted for closer zoom at level 1
// MODIFIED: Decreased maximum zoom out by half (from 25 to 12.5)
window.MIN_VISIBLE_TILES_MAX_LEVEL = 12.5;
window.ZOOM_LEVELS_EFFECTIVE = 30;

// Score box constants
window.SCORE_BOX_WIDTH = 120;
window.SCORE_BOX_HEIGHT = 25;  // Made narrower
window.SCORE_BOX_PADDING = 3;  // Reduced padding
window.SCORE_BOX_MARGIN = 0;

// Health-based visual scaling constants (now act as thresholds, not caps)
window.PLAYER_VISUAL_HEALTH_THRESHOLD = 73;
window.ENEMY_VISUAL_HEALTH_THRESHOLD = 73;
window.MIN_HEALTH_FOR_VISUAL_EFFECTS = 1;
window.MIN_OPACITY_AT_LOW_HEALTH = 0.9; // Increased starting opacity again

// New constants for player death animation
window.PLAYER_DEATH_PARTICLE_COUNT = 50;
window.PLAYER_DEATH_PICKUP_VALUE_PER_CHUNK = 1;
window.PLAYER_DEATH_EXPLOSION_DURATION = 3000;
window.PLAYER_DEATH_PARTICLE_SPREAD_FACTOR = 2.5;

// New constants for explosion and pickup scattering based on damage
window.ENEMY_DEATH_EXPLOSION_BASE_SPREAD = 1.0;
window.ENEMY_DEATH_EXPLOSION_DAMAGE_SPREAD_MULTIPLIER = 0.1; // Adjust this value to control how much damage affects spread
window.PICKUP_SCATTER_BASE_SPREAD = 1.5; // Original value for pickup scatter
window.PICKUP_SCATTER_DAMAGE_MULTIPLIER = 0.15; // Adjust this value to control how much damage affects pickup scatter

// Mathematical symbols for player death
window.MATH_SYMBOLS = ['+', '-', '*', '/', '=', '>', '<', '%', '&', '!', '?', '^', '~', '|', '(', ')', '[', ']', '{', '}'];

// World progression system
window.WORLDS = {
    1: {
        name: "Foundational Chambers",
        theme: "basic",
        description: "Simple rectangular rooms where mathematics begins",
        colors: {
            floor: '#333333', // Medium gray floor
            wall: '#111111',  // Dark gray walls
            stairs: '#00FF00', // Green exit
            player: '#0066FF', // Blue player
            enemy: '#FF4444'   // Red enemy
        },
        mapGenerator: 'generateBasicMap',
        unlockRequirement: 0 // Always available
    }
};

// Tile types
window.TILE_WALL = 0;
window.TILE_FLOOR = 1;
window.TILE_STAIRS = 2;

// Colors (consistent across gameplay and UI) - make globally accessible
window.COLOR_WALL = '#000000'; // Black for walls (same as void)
window.COLOR_FLOOR = '#333333'; // Dark grey for playable floor tiles
window.FIXED_COLOR_PLAYER = '#0066FF'; // Blue player color
window.FIXED_COLOR_STAIRS = '#00FF00'; // Green stairs/exits
window.FIXED_COLOR_ENEMY = '#FF4444'; // Red enemies
window.VINTAGE_GREEN = '#00FF00';

// Activity log state
window.MAX_ACTIVITY_LOG_ENTRIES = 10;

// Death animation constants
window.DEATH_ZOOM_DURATION = 1000; // Reduced for quicker zoom
window.DEATH_SLOW_MOTION_FACTOR = 0.2;
window.DEATH_ZOOM_TARGET_TILE_SCALE = 1.0; // Reduced for less zoom-in after death

// Title overlay constants
window.OVERLAY_ZOOM_DURATION = 1000;
window.OVERLAY_FADE_DURATION = 2000;
window.GAME_START_OVERLAY_DURATION = OVERLAY_ZOOM_DURATION + OVERLAY_FADE_DURATION;
window.INITIAL_OVERLAY_FONT_FACTOR = 0.12;
window.MAX_OVERLAY_FONT_FACTOR = 0.15;

// New constants for game start/restart zoom out
// MODIFIED: Decreased zoom out rate by half (from 3000 to 6000)
window.GAME_START_ZOOM_OUT_DURATION = 6000;
window.GAME_START_INITIAL_ZOOM_FACTOR = 2.5; // Decreased for less initial zoom
window.RESTART_TEXT_EXPLOSION_DURATION = 2000; // Increased duration for slower explosion

// Game statistics
window.HEALTH_LOSS_INTERVAL = 37;

// Auto-movement constants
window.DEFAULT_AUTO_MOVE_SPEED = 100; // Back to original fast speed
window.COMBAT_MOVE_DELAY = 500;
window.PICKUP_COLLECTION_RADIUS = 7;
window.DIRECT_PICKUP_RADIUS = 1.5;

// Pathfinding cache for performance optimization
window.MAX_PATHFINDING_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

// Spatial indexing for entity management optimization
window.SPATIAL_GRID_SIZE = 8; // Grid cell size for spatial indexing

// Performance monitoring constants
window.PERFORMANCE_LOG_INTERVAL = 10000; // Log every 10 seconds
