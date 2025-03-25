import { Bezier } from "bezier-js";

function generateRandomRoad(canvasHeight, scale) {
    const angle = Math.random() * 60 - 30; // Random angle between -30 and 30 degrees
    const x = 100; // Fixed x position
    const y = Math.random() * 100 - Math.random() * 100 +  + (canvasHeight/scale / 2); // Between 150px from top and bottom

    return { x, y, angle };
}

function generateRoadPoints(road) {
    const roadWidth = 60;
    const roadHeight = 100;
    const roadQuarterHeight = roadHeight / 4;
    const roadCenterX = road.x;

    const roadEntry = {
        name: "Road Entry",
        x: roadCenterX,
        y: road.y - roadHeight / 2 + roadQuarterHeight,
        heading: road.angle * (Math.PI / 180),
    };

    const roadExit = {
        name: "Road Exit",
        x: roadCenterX,
        y: road.y + roadHeight / 2 - roadQuarterHeight,
        heading: (road.angle + 180) * (Math.PI / 180),
    };

    return { roadEntry, roadExit };
}

function generateAllRoadPoints(canvasHeight, scale) {
    const road = generateRandomRoad(canvasHeight, scale);
    const { roadEntry, roadExit } = generateRoadPoints(road);
    return { road, roadEntry, roadExit };
}

function drawRoad(ctx, road) {
    const width = 60; // Width of the road
    const height = 100; // Height of the road
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.save();
    ctx.translate(road.x, road.y);
    ctx.rotate((road.angle * Math.PI) / 180); // Convert angle to radians

    // Draw the road background (light grey towards white)
    ctx.fillStyle = "#f2f2f2"; // Light grey color
    ctx.fillRect(-halfWidth-200, -halfHeight, width+200, height);

    // Draw the grey border
    ctx.strokeStyle = "grey"; // Grey border
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfWidth-200, -halfHeight, width+200, height);

    // Draw the gold line across the middle
    ctx.beginPath();
    ctx.moveTo(-halfWidth-200, 0); // Start at the left edge of the road
    ctx.lineTo(halfWidth, 0); // End at the right edge of the road
    ctx.strokeStyle = "gold"; // gold line
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}

// Generate random points for interpolation
function generateInterpolatedPoints(start, end, numPoints, difficulty) {
    const points = [];
    for (let i = 1; i <= numPoints; i++) {
        const t = i / (numPoints + 1); // Interpolation factor
        const x = start.x + t * (end.x - start.x);
        let y = start.y + t * (end.y - start.y);

        // Add randomness to the y-coordinate based on difficulty
        const randomness = difficulty === "easy" ? 20 : difficulty === "medium" ? 50 : 100;
        y += Math.random() * randomness - randomness / 2;

        points.push({ x, y });
    }
    return points;
}

// Generate the load shape points
function generateLoadShape(road, topRightCornerRoad, spot, canvasWidth, canvasHeight, difficulty) {
    const angle = road.angle * (Math.PI / 180);
    const halfWidth = 30;
    const halfHeight = 50;

    // Define fixed points
    const bottomRightCornerRoad = {
        x: road.x + halfWidth * Math.cos(angle) - halfHeight * Math.sin(angle),
        y: road.y + halfWidth * Math.sin(angle) + halfHeight * Math.cos(angle),
    };

    const bottomRightCornerRoadPoint = {
        x: bottomRightCornerRoad.x,
        y: bottomRightCornerRoad.y,
    };

    const aboveRoad = {
        x: topRightCornerRoad.x + (difficulty === "easy" ? 10 : difficulty === "medium" ? 30 : 100) * (Math.random() - 0.5),
        y: topRightCornerRoad.y - (difficulty === "easy" ? 170 : difficulty === "medium" ? 150 : 80),
    };

    const aboveSpot = {
        x: spot.x + (difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 60), // Always slightly to the right of the spot
        y: spot.y - (difficulty === "easy" ? 170 : difficulty === "medium" ? 150 : 80),
    };

    const belowSpot = {
        x: spot.x + (difficulty === "easy" ? 20 : difficulty === "medium" ? 40 : 60), // Always slightly to the right of the spot
        y: spot.y + (difficulty === "easy" ? 170 : difficulty === "medium" ? 150 : 80),
    };

    const belowRoad = {
        x: bottomRightCornerRoad.x + (difficulty === "easy" ? 10 : difficulty === "medium" ? 30 : 100) * (Math.random() - 0.5),
        y: bottomRightCornerRoad.y + (difficulty === "easy" ? 170 : difficulty === "medium" ? 150 : 80),
    };

    // Generate a random number of interpolation points between 1 and 5 for hard difficulty
    const numTopInterp = difficulty === "hard" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3) + 1;
    const numBottomInterp = difficulty === "hard" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3) + 1;

    // Generate interpolated points
    const topInterp = generateInterpolatedPoints(aboveRoad, aboveSpot, numTopInterp, difficulty);
    const bottomInterp = generateInterpolatedPoints(belowSpot, belowRoad, numBottomInterp, difficulty);

    // Combine all points to form the load shape
    const points = [
        topRightCornerRoad, // Top right of the road
        aboveRoad,          // Above the road
        ...topInterp,       // Interpolated points between aboveRoad and aboveSpot
        aboveSpot,          // Above the spot
        belowSpot,          // Below the spot
        ...bottomInterp,    // Interpolated points between belowSpot and belowRoad
        belowRoad,          // Below the road
        bottomRightCornerRoadPoint, // Bottom right of the road
    ];

    return points;
}

export { generateRandomRoad, generateRoadPoints, generateAllRoadPoints, drawRoad, generateLoadShape };