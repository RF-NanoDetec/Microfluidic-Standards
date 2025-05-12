import { testSimulationWithSimpleSetup, testSimulationWithMeanderChip, testSimulationWithThreeChips } from './simulationEngine';

// Run the tests
console.log("Starting simulation tests...");

// --- Test 1: Simple Straight Chip (5mm L, 100um W/D) ---
// console.log("\n--- Running Test: Simple Straight Chip ---");
// testSimulationWithSimpleSetup();

// --- Test 2: Meander Chip (1m L, 100um W/D) ---
// console.log("\n--- Running Test: Meander Chip ---");
// testSimulationWithMeanderChip();

// --- Test 3: Three Straight Chips in Series (Original Dimensions) ---
console.log("\n--- Running Test: Three Straight Chips in Series ---");
testSimulationWithThreeChips(); // Keep this if you still want to run it, or comment out

console.log("\nAll specified tests complete."); 