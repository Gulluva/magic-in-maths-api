// scripts/populateSums.js
const { Sum } = require('../models');


function isPrime(num) {
    for(let i = 2, s = Math.sqrt(num); i <= s; i++)
        if(num % i === 0) return false; 
    return num > 1;
}

function getStageLimit(stage) {
    if (stage < 6) return 100;
    return (stage - 5) * 100 + 100; // 200 for stage 6, 300 for stage 7, etc.
}

function getAllProducts(numbers, limit) {
    let products = new Set(); // Start empty
    
    // Add individual numbers first
    for (let num of numbers) {
        if (num <= limit) {
            products.add(num);
        }
    }

    // Generate products
    let previousSize;
    do {
        previousSize = products.size;
        const currentProducts = [...products];
        
        for (let i = 0; i < currentProducts.length; i++) {
            for (let num of numbers) {
                const newProduct = currentProducts[i] * num;
                if (newProduct <= limit) {
                    products.add(newProduct);
                }
            }
        }
    } while (products.size > previousSize);

    return [...products].sort((a, b) => a - b);
}

function getValidAddendsForStage(stage) {
    // Base colors for stage 1
    let colors = [2, 5];  // red, blue
    
    if (stage >= 2) colors.push(11); // yellow
    if (stage >= 3) colors.push(3);  // green
    if (stage >= 4) colors.push(7);  // purple
    if (stage >= 5) colors.push(13); // orange
    if (stage >= 7) colors.push(17); // pink
    if (stage >= 8) colors.push(19); // brown
    if (stage >= 9) colors.push(23); // gold

    const limit = getStageLimit(stage);
    const addends = getAllProducts(colors, limit);
    
    // Add 1 as a valid addend for all stages
    addends.unshift(1);
    
    return addends;
}

async function populateSums() {
  // Inside populateSums function:
let debugCounts = {};  // Track counts by result

    try {
        const allSums = new Map(); // Use Map to track unique sums by their key

        // Add special case: 1 + 1 = 2
        allSums.set('1-1-2', {
            addend1: 1,
            addend2: 1,
            result: 2,
            isPrime: true,
            stage: 1
        });

        // Generate sums for each stage
        for (let stage = 1; stage <= 9; stage++) {
            const validAddends = getValidAddendsForStage(stage);
            const stageLimit = getStageLimit(stage);
            
            console.log(`Stage ${stage}: Processing ${validAddends.length} possible addends...`);

            for (let i = 0; i < validAddends.length; i++) {
                for (let j = i; j < validAddends.length; j++) {
                    const addend1 = validAddends[i];
                    const addend2 = validAddends[j];
                    const sum = addend1 + addend2;

                    if (sum <= stageLimit && isPrime(sum)) {
                        // Create a unique key for this sum
                        const sumKey = `${Math.min(addend1, addend2)}-${Math.max(addend1, addend2)}-${sum}`;
                        
                        // Only add if we don't already have this sum in an earlier stage
                        if (!allSums.has(sumKey)) {
                            allSums.set(sumKey, {
                                addend1: Math.min(addend1, addend2),
                                addend2: Math.max(addend1, addend2),
                                result: sum,
                                isPrime: true,
                                stage: stage
                            });
                        }
                    }
                }
            }
            
            console.log(`Stage ${stage}: Generated ${allSums.size} unique sums so far`);
        }

        // Convert Map values to Array for bulkCreate
        const sumsArray = Array.from(allSums.values());
        
        // Sort by stage, then by result for easier verification
        sumsArray.sort((a, b) => {
            if (a.stage !== b.stage) return a.stage - b.stage;
            return a.result - b.result;
        });

        await Sum.bulkCreate(sumsArray);
        console.log(`Sums populated successfully. Created ${sumsArray.length} unique sums.`);
        
// After generating all sums:
console.log("\nAnalysis of sums by result:");
sumsArray.forEach(sum => {
    if (!debugCounts[sum.result]) {
        debugCounts[sum.result] = [];
    }
    debugCounts[sum.result].push({
        stage: sum.stage,
        addends: `${sum.addend1} + ${sum.addend2}`
    });
});

Object.keys(debugCounts).sort((a,b) => a-b).forEach(result => {
    console.log(`\nResult ${result} (${debugCounts[result].length} ways):`);
    debugCounts[result].forEach(way => {
        console.log(`  Stage ${way.stage}: ${way.addends}`);
    });
});

        // Log some statistics
        const statsByStage = sumsArray.reduce((acc, sum) => {
            acc[sum.stage] = (acc[sum.stage] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Sums by stage:', statsByStage);

    } catch (error) {
        console.error('Error populating sums:', error);
        throw error;
    }
}

module.exports = populateSums;