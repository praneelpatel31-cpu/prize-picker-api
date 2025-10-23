/**
 * Prize Picker Serverless Function
 *
 * This function processes a URL path containing item and weight pairs (e.g., /itemA_50/itemB_30/itemC_20)
 * and uses weighted random selection to determine a single winner.
 *
 * It is designed to be deployed as a serverless function (e.g., on Vercel or Netlify).
 * The weights provided in the URL are treated as proportional chances.
 *
 * NOTE: The JSON response is now simplified to only include the "winner" field.
 */

// This handler structure is compatible with most Node.js serverless platforms (like Vercel/Netlify)
module.exports = (req, res) => {
    // 1. Extract the path from the request URL
    // We assume the path structure is: /item1_P1/item2_P2/...
    const path = req.url.split('?')[0];
    
    // Split the path into segments and filter out empty strings (like the leading '/')
    const segments = path.split('/').filter(s => s.length > 0 && s !== 'api' && s !== 'picker');

    if (segments.length === 0) {
        // Return 400 error for missing input
        return res.status(400).json({
            error: "No prizes provided.",
            usage: "Append prizes and their percentages to the URL path, e.g., /prizeA_50/prizeB_30/prizeC_20"
        });
    }

    let totalWeight = 0;
    const prizes = [];
    let isValid = true;

    // 2. Parse the segments into an array of { name, weight } objects
    for (const segment of segments) {
        const parts = segment.split('_');
        if (parts.length !== 2) {
            isValid = false;
            break;
        }

        const name = parts[0];
        // Parse the weight (percentage)
        const weight = parseInt(parts[1], 10);

        if (isNaN(weight) || weight <= 0) {
            isValid = false;
            break;
        }

        prizes.push({ name, weight });
        totalWeight += weight;
    }

    if (!isValid) {
        // Return 400 error for invalid format
        return res.status(400).json({
            error: "Invalid format detected.",
            details: "Segments must follow the format: item_percentage (e.g., /apple_40/banana_60). Percentages must be positive numbers."
        });
    }
    
    // --- Weighted Random Selection Logic ---
    
    // 3. Select a random point within the total weight range
    const winningNumber = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    let winner = null;

    // 4. Iterate and find the prize where the cumulative weight exceeds the winning number
    for (const prize of prizes) {
        cumulativeWeight += prize.weight;

        if (winningNumber < cumulativeWeight) {
            winner = prize.name;
            break; // Winner found, exit the loop
        }
    }
    
    // 5. Return the highly simplified JSON result: {"winner": item}
    return res.status(200).json({
        winner: winner
    });
};
