function generateRandomRoad(canvasHeight) {
    const angle = Math.random() * 60 - 30; // Random angle between -30 and 30 degrees
    const x = 100; // Fixed x position
    const y = Math.random() * (canvasHeight - 600) + 300; // Between 150px from top and bottom

    return { x, y, angle };
}

function drawRoad(ctx, road) {
    const width = 80; // Width of the road
    const height = 200; // Height of the road
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.save();
    ctx.translate(road.x, road.y);
    ctx.rotate((road.angle * Math.PI) / 180); // Convert angle to radians
    ctx.fillStyle = "gray";
    ctx.fillRect(-halfWidth, -halfHeight, width, height);
    ctx.restore();
}

export { generateRandomRoad, drawRoad };