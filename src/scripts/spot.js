function generateSpot(canvasWidth, canvasHeight) {
    const x = 1000; // Fixed x position
    const centerY = canvasHeight / 2;
    const y = centerY + (Math.random() * 200 - 100); // ±100px from the center
    const heading = ((Math.random() * 80 - 40) + 180) * (Math.PI / 180); // ±40 degrees flipped by 180

    return { x, y, heading };
}

function drawSpot(ctx, spot) {
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
}

export { generateSpot, drawSpot };