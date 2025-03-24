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