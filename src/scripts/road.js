
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

function drawRoad(ctx, road, roadEntry, roadExit) {
    const width = 60; // Width of the road
    const height = 100; // Height of the road
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.save();
    ctx.translate(road.x, road.y);
    ctx.rotate((road.angle * Math.PI) / 180); // Convert angle to radians

    // Draw the road background (light grey towards white)
    ctx.fillStyle = "#f1f1f1"; // Light grey color
    ctx.fillRect(-halfWidth - 200, -halfHeight, width + 200, height);

    // Draw the grey border
    ctx.strokeStyle = "grey"; // Grey border
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfWidth - 200, -halfHeight, width + 200, height);

    // Draw the gold line across the middle
    ctx.beginPath();
    ctx.moveTo(-halfWidth - 200, 0); // Start at the left edge of the road
    ctx.lineTo(halfWidth, 0); // End at the right edge of the road
    ctx.strokeStyle = "gold"; // Gold line
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();

    // Draw the thin grey line from road entry to the left
    drawAngledLine(ctx, roadEntry.x, roadEntry.y, roadEntry.heading, 200);

    // Draw the thin grey line from road exit in the opposite direction of its heading
    drawAngledLine(ctx, roadExit.x, roadExit.y, roadExit.heading + Math.PI, 200);
}

function drawAngledLine(ctx, startX, startY, angle, length) {
    const endX = startX - length * Math.cos(angle); // Calculate the end x-coordinate
    const endY = startY - length * Math.sin(angle); // Calculate the end y-coordinate

    ctx.beginPath();
    ctx.moveTo(startX, startY); // Start at the given point
    ctx.lineTo(endX, endY); // Extend the line at the given angle
    ctx.strokeStyle = "grey"; // Thin grey line
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

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

function generateLoadShape(road, topRightCornerRoad, spot, canvasWidth, canvasHeight, difficulty) {
    const angle = road.angle * (Math.PI / 180);
    const halfWidth = 30;
    const halfHeight = 50;

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

    const numTopInterp = difficulty === "hard" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3) + 1;
    const numBottomInterp = difficulty === "hard" ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3) + 1;

    const topInterp = generateInterpolatedPoints(aboveRoad, aboveSpot, numTopInterp, difficulty);
    const bottomInterp = generateInterpolatedPoints(belowSpot, belowRoad, numBottomInterp, difficulty);

    const points = [
        topRightCornerRoad,
        aboveRoad,
        ...topInterp,
        aboveSpot,
        belowSpot,
        ...bottomInterp,
        belowRoad,
        bottomRightCornerRoadPoint,
    ];

    return points;
}

export { generateRandomRoad, generateRoadPoints, generateAllRoadPoints, drawRoad, generateLoadShape };