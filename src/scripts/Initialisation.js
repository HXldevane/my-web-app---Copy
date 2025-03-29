import { generateSpot, drawSpot } from './spot.js';
import { generateAllRoadPoints, drawRoad, generateLoadShape, generateRoadPoints } from './road.js';
import { generateSpeedLimit, drawSpeedLimit } from './spot.js';

function drawLoadArea(ctx, loadShapePoints) {
    if (!loadShapePoints || loadShapePoints.length === 0) {
        console.error("Load shape points are not defined or empty. Ensure they are generated before drawing.");
        return;
    }

    // Create a pattern for the grey dots
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = 3;// Smaller grid for closer dots
    patternCanvas.height = 3;
    const patternCtx = patternCanvas.getContext("2d");

    // Draw the grey dots on a transparent background
    patternCtx.fillStyle = "rgba(0, 0, 0, 0.8)"; // Semi-transparent grey dots
    patternCtx.beginPath();
    patternCtx.arc(1, 1, 1, 0, 2); // Smaller dots
    patternCtx.fill();
    patternCtx.closePath();

    const pattern = ctx.createPattern(patternCanvas, "repeat");

    // Fill the load shape with the more transparent yellow background
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(loadShapePoints[0].x, loadShapePoints[0].y);
    for (let i = 1; i < loadShapePoints.length; i++) {
        ctx.lineTo(loadShapePoints[i].x, loadShapePoints[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 0, 0.1)"; // More transparent yellow
    ctx.fill();

    // Overlay the closer grey dot pattern
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.restore();

    // Draw the solid black line
    ctx.beginPath();
    ctx.moveTo(loadShapePoints[0].x, loadShapePoints[0].y);
    for (let i = 1; i < loadShapePoints.length; i++) {
        ctx.lineTo(loadShapePoints[i].x, loadShapePoints[i].y);
    }
    ctx.strokeStyle = "black"; // Solid black line
    ctx.lineWidth = 2; // Slightly thicker for visibility
    ctx.stroke();
    ctx.closePath();

    // Draw the yellow dashed line on top
    ctx.beginPath();
    ctx.setLineDash([10, 5]); // Set line to be dashed
    ctx.moveTo(loadShapePoints[0].x, loadShapePoints[0].y);
    for (let i = 1; i < loadShapePoints.length; i++) {
        ctx.lineTo(loadShapePoints[i].x, loadShapePoints[i].y);
    }
    ctx.strokeStyle = "gold"; // Yellowy-gold dashed line
    ctx.lineWidth = 2; // Slightly thinner than the black line
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    ctx.closePath();
}

function initialiseRandomMap(ctx, canvasWidth, canvasHeight, scale, difficulty, points) {
    // Generate and draw road points
    const { road, roadEntry, roadExit } = generateAllRoadPoints(canvasHeight, scale);
    drawRoad(ctx, road, roadEntry, roadExit);

    // Generate and draw a spot
    const spot = generateSpot(canvasWidth, canvasHeight, scale, difficulty);
    points[2] = { ...spot, name: "Spot" };
    drawSpot(ctx, spot);

    // Generate load shape points
    const angle = road.angle * (Math.PI / 180);
    const halfWidth = 30;
    const halfHeight = 50;
    const bottomRightCornerRoad = {
        x: road.x + halfWidth * Math.cos(angle) + halfHeight * Math.sin(angle),
        y: road.y + halfWidth * Math.sin(angle) - halfHeight * Math.cos(angle),
    };
    const loadShapePoints = generateLoadShape(road, bottomRightCornerRoad, spot, canvasWidth / scale, canvasHeight / scale, difficulty);

    // Draw the load area
    drawLoadArea(ctx, loadShapePoints);

    // Draw speed limit
    const speedLimit = generateSpeedLimit(difficulty);
    drawSpeedLimit(ctx, loadShapePoints, speedLimit);

    return { road, roadEntry, roadExit, spot, loadShapePoints, speedLimit };
}

function initialiseSetMap(ctx, canvasWidth, canvasHeight, scale, difficulty, points, existingLoadShapePoints) {
    // Generate road at clicked point with heading of 0 degrees
    const road = {
        x: points[0].x,
        y: points[0].y,
        angle: 0, // 0 degrees
    };
    const { roadEntry, roadExit } = generateRoadPoints(road);
    drawRoad(ctx, road, roadEntry, roadExit);

    // Generate spot at clicked point with heading of -180 degrees
    const spot = {
        x: points[1].x,
        y: points[1].y,
        heading: Math.PI, // -180 degrees in radians
    };

    // Assign names to user-defined points
    points[0].name = "Road Entry";
    points[1].name = "Queue";
    points[2].name = "Cusp";
    points[3].name = "Exit";

    // Return generated data without drawing
    return { road, roadEntry, roadExit, spot, loadShapePoints: existingLoadShapePoints, speedLimit: null };
}

export { initialiseRandomMap, initialiseSetMap, drawLoadArea };
