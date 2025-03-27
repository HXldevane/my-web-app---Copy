function generateSpot(canvasWidth, canvasHeight, scale, difficulty) {
    let x;
    if (difficulty === "easy") {
        x = Math.random() * (870 - 700) + 750; // Random x between 800 and 1000
    } else if (difficulty === "medium") {
        x = Math.random() * (800 - 700) + 700; // Random x between 750 and 900
    } else if (difficulty === "hard") {
        x = Math.random() * (750 - 600) + 600; // Random x between 600 and 800
    }

    const centerY = canvasHeight / scale / 2;
    const y = centerY + (Math.random() * 100 - 50); // ±50px from the center
    const heading = ((Math.random() * 80 - 40) + 180) * (Math.PI / 180); // ±40 degrees flipped by 180

    return { x, y, heading };
}

function drawSpot(ctx, spot) {
    // Draw the gold dot
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "gold";
    ctx.fill();
    ctx.closePath();

    // Draw the black circle outline around the dot
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "black"; // Black outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the black circle outline around the dot
    const circleRadius = 15; // Radius of the circle
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = "gold"; // Black outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the triangle aligned with the heading
    const triangleSize = 10;
    ctx.save();
    ctx.translate(spot.x, spot.y); // Move to the spot's position
    ctx.rotate(spot.heading + Math.PI / 2); // Adjust rotation to align correctly
    ctx.beginPath();
    ctx.moveTo(0, -circleRadius - triangleSize - 2); // Tip of the triangle
    ctx.lineTo(-triangleSize / 2, -circleRadius - 2); // Left corner
    ctx.lineTo(triangleSize / 2, -circleRadius - 2); // Right corner
    ctx.closePath();
    ctx.strokeStyle = "black"; // Black outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function generateSpeedLimit(difficulty) {
    let speedLimit;
    if (difficulty === "easy") {
        speedLimit = Math.floor(Math.random() * (40 - 30 + 1) + 30); // Random between 30 and 40 kph
    } else if (difficulty === "medium") {
        speedLimit = Math.floor(Math.random() * (40 - 20 + 1) + 20); // Random between 20 and 40 kph
    } else if (difficulty === "hard") {
        speedLimit = Math.floor(Math.random() * (40 - 15 + 1) + 15); // Random between 15 and 40 kph
    }

    // Round to the nearest 5
    return Math.round(speedLimit / 5) * 5;
}

function drawSpeedLimit(ctx, loadShapePoints, speedLimit) {
    if (!loadShapePoints || loadShapePoints.length === 0) return;

    // Position the speed limit in the top-right of the load shape
    const topRight = loadShapePoints[1]; // Last point of the load shape
    const x = topRight.x + 80; // Offset 50px to the left
    const y = topRight.y + 80; // Offset 50px down

    // Draw the speed limit circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2); // Circle with radius 20
    ctx.fillStyle = "white"; // White background
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "red"; // Red outline
    ctx.stroke();
    ctx.closePath();

    // Draw the speed limit text
    ctx.font = "bold 20px Segoe UI";
    
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // Keep this
    ctx.fillText(`${speedLimit}`, x, y + 1); // Add a slight vertical nudge
    
    ctx.restore();
}



export { generateSpot, drawSpot, generateSpeedLimit, drawSpeedLimit };