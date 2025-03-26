function generateSpot(canvasWidth, canvasHeight, scale, difficulty) {
    let x;
    if (difficulty === "easy") {
        x = Math.random() * (1000 - 800) + 800; // Random x between 800 and 1000
    } else if (difficulty === "medium") {
        x = Math.random() * (900 - 750) + 750; // Random x between 750 and 900
    } else if (difficulty === "hard") {
        x = Math.random() * (850 - 600) + 600; // Random x between 600 and 800
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

export { generateSpot, drawSpot };