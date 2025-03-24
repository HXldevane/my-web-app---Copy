function initializePoints() {
    return [
        { name: "Queue", x: null, y: null, heading: 0 },
        { name: "Cusp", x: null, y: null, heading: 0 },
        { name: "Spot", x: null, y: null, heading: 0 },
        { name: "Exit", x: null, y: null, heading: 0 },
    ];
}

function resetPoints(points) {
    points.forEach((point) => {
        point.x = null;
        point.y = null;
        point.heading = 0;
    });
}

function placePoint(points, x, y) {
    points.push({ x, y });
}

function drawPoints(ctx, points) {
    points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();

        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        ctx.fillText(`Point ${index + 1}`, point.x + 10, point.y - 10);
    });
}

export { initializePoints, resetPoints, placePoint, drawPoints };