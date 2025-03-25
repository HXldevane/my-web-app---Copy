function generateRandomRoad(canvasHeight) {
    const angle = Math.random() * 60 - 30; // Random angle between -30 and 30 degrees
    const x = 100; // Fixed x position
    const y = Math.random() * (canvasHeight - 600) + 300; // Between 150px from top and bottom

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

function generateAllRoadPoints(canvasHeight) {
    const road = generateRandomRoad(canvasHeight);
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
    ctx.fillStyle = "gray";
    ctx.fillRect(-halfWidth, -halfHeight, width, height);
    ctx.restore();
}

export { generateRandomRoad, generateRoadPoints, generateAllRoadPoints, drawRoad };