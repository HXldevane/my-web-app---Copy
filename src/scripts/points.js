import { drawSpot } from "./spot.js";

function initializePoints() {
    return [
        { name: "Queue", x: null, y: null, heading: 0 },
        { name: "Cusp", x: null, y: null, heading: -Math.PI / 2 }, // 90 degrees to the left
        { name: "Spot", x: null, y: null, heading: 0 },
        { name: "Exit", x: null, y: null, heading: -Math.PI }, // 180 degrees
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
        if (point.x !== null && point.y !== null) {
            // Draw the point as a red circle
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.closePath();

            // Draw the point label
            ctx.font = "12px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(point.name, point.x + 10, point.y - 10);
        }
    });
}

function drawQueue(ctx, queue, color, isSelected) {
    ctx.save();
    ctx.translate(queue.x, queue.y); // Move to the queue point's position
    ctx.rotate(queue.heading); // Rotate the entire shape with the heading

    // Draw the dot (black if selected)
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "black" : color;
    ctx.fill();
    ctx.closePath();

    // Draw the square around the dot
    const squareSize = 30;
    ctx.beginPath();
    ctx.rect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the triangle on the right edge of the square, pushed by 2px
    const triangleSize = 10;
    ctx.beginPath();
    ctx.moveTo(squareSize / 2 + triangleSize + 2, 0); // Tip of the triangle
    ctx.lineTo(squareSize / 2 + 2, -triangleSize / 2); // Top corner
    ctx.lineTo(squareSize / 2 + 2, triangleSize / 2); // Bottom corner
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function drawCusp(ctx, cusp, color, isSelected) {
    ctx.save();
    ctx.translate(cusp.x, cusp.y); // Move to the cusp point's position
    ctx.rotate(cusp.heading + Math.PI / 2); // Rotate the entire shape with the heading + 90 degrees

    // Draw the dot (black if selected)
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "black" : color;
    ctx.fill();
    ctx.closePath();

    // Draw the circle around the dot
    const circleRadius = 15;
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the triangle on the top edge of the circle, pushed by 2px
    const triangleSize = 10;
    ctx.beginPath();
    ctx.moveTo(0, -circleRadius - triangleSize - 2); // Tip of the triangle
    ctx.lineTo(-triangleSize / 2, -circleRadius - 2); // Left corner
    ctx.lineTo(triangleSize / 2, -circleRadius - 2); // Right corner
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function drawExit(ctx, exit, color, isSelected) {
    ctx.save();
    ctx.translate(exit.x, exit.y); // Move to the exit point's position
    ctx.rotate(exit.heading); // Rotate the entire shape with the heading

    // Draw the dot (black if selected)
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "black" : color;
    ctx.fill();
    ctx.closePath();

    // Draw the circle around the dot
    const circleRadius = 15;
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the triangle on the right edge of the circle, pushed by 2px
    const triangleSize = 10;
    ctx.beginPath();
    ctx.moveTo(circleRadius + triangleSize + 2, 0); // Tip of the triangle
    ctx.lineTo(circleRadius + 2, -triangleSize / 2); // Top corner
    ctx.lineTo(circleRadius + 2, triangleSize / 2); // Bottom corner
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

export { initializePoints, resetPoints, placePoint, drawPoints, drawQueue, drawCusp, drawExit, drawSpot };