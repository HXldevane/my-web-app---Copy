function calculateSpotRegion(road) {
    const distance = 100; // Distance from the road
    const angle = Math.random() * 100 - 50; // Random angle between -50 and 50 degrees

    const radian = (angle * Math.PI) / 180;
    const x = road.x + distance * Math.cos(radian);
    const y = road.y + distance * Math.sin(radian);

    return { x, y, angle };
}

function drawSpot(ctx, spot) {
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
}