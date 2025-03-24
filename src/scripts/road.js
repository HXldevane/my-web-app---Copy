function generateRandomRoad() {
    const angle = Math.random() * 60 - 30; // Random angle between -30 and 30 degrees
    const x = Math.random() * 300 + 50; // Random x position
    const y = Math.random() * 300 + 50; // Random y position

    return { x, y, angle };
}

function drawRoad(ctx, road) {
    const size = 50; // Size of the road (square)
    const halfSize = size / 2;

    ctx.save();
    ctx.translate(road.x, road.y);
    ctx.rotate((road.angle * Math.PI) / 180); // Convert angle to radians
    ctx.fillStyle = "gray";
    ctx.fillRect(-halfSize, -halfSize, size, size);
    ctx.restore();
}