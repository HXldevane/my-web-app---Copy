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

    // Draw the gold circle around the dot
    const circleRadius = 20; // Radius of the circle
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, circleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

export { generateSpot, drawSpot };