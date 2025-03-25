import { drawSplines } from "./lines.js";
import { generateAllRoadPoints, drawRoad, generateLoadShape } from "./road.js"; // Updated imports
import { generateSpot, drawSpot } from "./spot.js";
import { initializePoints, resetPoints } from "./points.js";
import { Bezier } from "bezier-js"; // Correct import
import { findIntersections } from "./calculate.js"; // Import the new function
import { stopAnimations, kickAHT, callAHT, scheduler } from "./autonomy.js"; // Import scheduler function

let kickedBeenOnYellow = false; // Define as a global variable
let loadShapePoints = null; // Define globally to ensure it is accessible in drawCanvas

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const regenerateBtn = document.getElementById("regenerate-btn");
    const clearLinesBtn = document.getElementById("clear-lines-btn");
    const toggleBtn = document.getElementById("toggle-btn");
    const drawLinesBtn = document.getElementById("draw-lines-btn");
    const simulateBtn = document.getElementById("simulate-btn"); // New button
    let visualToggle = false; // State to track whether visuals are displayed

    // High-quality canvas rendering
    const scale = window.devicePixelRatio;
    canvas.width = 1200 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = "1200px";
    canvas.style.height = "600px";
    ctx.scale(scale, scale);

    const points = initializePoints();
    let selectedPointIndex = null;
    let mode = "adjust-position";
    const minRadius = 50;

    // Generate all road points
    let { road, roadEntry, roadExit } = generateAllRoadPoints(canvas.height);

    let spot = generateSpot(canvas.width, canvas.height);
    points[2] = { ...spot, name: "Spot" };

    let spline = null; // Initialize spline variable
    let difficulty = "easy"; // Default difficulty

    function updateToggleButton() {
        toggleBtn.textContent =
            mode === "adjust-position" ? "Switch to Adjust Heading" : "Switch to Adjust Position";
    }

    updateToggleButton();

    function getClickedPointIndex(x, y) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (point.x !== null && point.y !== null) {
                const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (distance <= 10) {
                    return i;
                }
            }
        }
        return null;
    }

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log(`Canvas clicked at: (${x}, ${y})`);

        const clickedPointIndex = getClickedPointIndex(x, y);

        if (mode === "adjust-position") {
            if (clickedPointIndex !== null && clickedPointIndex !== 2) {
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for repositioning.`);
            } else if (selectedPointIndex !== null) {
                points[selectedPointIndex].x = x;
                points[selectedPointIndex].y = y;
                console.log(`Point ${points[selectedPointIndex].name} repositioned to (${x}, ${y}).`);
                selectedPointIndex = null;
            } else {
                const nextPointIndex = points.findIndex(
                    (point, index) => point.x === null && point.y === null && index !== 2
                );
                if (nextPointIndex !== -1) {
                    points[nextPointIndex].x = x;
                    points[nextPointIndex].y = y;
                    console.log(`Point ${points[nextPointIndex].name} placed at (${x}, ${y}).`);
                } else {
                    console.log("All points have been placed.");
                }
            }
        } else if (mode === "adjust-heading") {
            if (clickedPointIndex !== null && clickedPointIndex !== 2) {
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for heading adjustment.`);
            } else if (selectedPointIndex !== null) {
                const point = points[selectedPointIndex];
                point.heading = Math.atan2(y - point.y, x - point.x);
                console.log(`Adjusted heading for point ${point.name} to ${point.heading} radians.`);
                selectedPointIndex = null;
            }
        }
        drawCanvas();
    });

    toggleBtn.addEventListener("click", () => {
        mode = mode === "adjust-position" ? "adjust-heading" : "adjust-position";
        selectedPointIndex = null;
        updateToggleButton();
        console.log(`Mode switched to: ${mode}`);
        drawCanvas();
    });

    regenerateBtn.addEventListener("click", () => {
        stopAnimations(); // Stop any ongoing animations
        resetPoints(points);
        selectedPointIndex = null;
        console.log("Canvas regenerated. All points reset.");
        ({ road, roadEntry, roadExit } = generateAllRoadPoints(canvas.height)); // Regenerate all road points
        spot = generateSpot(canvas.width, canvas.height);
        points[2] = { ...spot, name: "Spot" };

        // Calculate bottomRightCornerRoad dynamically considering the road's rotation angle
        const angle = road.angle * (Math.PI / 180); // Convert angle to radians
        const halfWidth = 30; // Half of the road width (60 / 2)
        const halfHeight = 50; // Half of the road height (100 / 2)

        const bottomRightCornerRoad = {
            x: road.x + halfWidth * Math.cos(angle) + halfHeight * Math.sin(angle),
            y: road.y + halfWidth * Math.sin(angle) - halfHeight * Math.cos(angle),
        };

        // Generate the points from generateLoadShape and store them globally
        loadShapePoints = generateLoadShape(road, bottomRightCornerRoad, spot, canvas.width / scale, canvas.height / scale, difficulty);

        drawCanvas(); // Ensure the canvas is updated after regenerating
    });

    clearLinesBtn.addEventListener("click", () => {
        console.log("Clearing splines and shading...");
        drawCanvas(); // Redraw the canvas without outlines, overlap, or shading
    });

    drawLinesBtn.addEventListener("click", () => {
        if (points.every((point, index) => (index === 2 || (point.x !== null && point.y !== null)))) {
            console.log("Drawing splines and highlighting 'cusp-to-spot-opposite' shape...");
            const allPoints = [roadEntry, points[0], points[1], points[2], points[3], roadExit];
            const { outlines, curves } = drawSplines(ctx, allPoints, minRadius, true); // Extract outlines and curves

            // Log outlines to verify their structure
            console.log("Outlines generated by drawSplines:", outlines);

            findIntersections(outlines, ctx); // Highlight the "cusp-to-spot-opposite" shape
            window.curves = curves; // Store curves globally for simulation
            window.outlines = outlines; // Store outlines globally for debugging
        } else {
            console.log("Please place all points before drawing lines.");
        }
    });

    simulateBtn.addEventListener("click", () => {
        if (!window.curves || !window.outlines) {
            console.error("Please draw lines first to initialize curves and outlines.");
            return;
        }
    
        const spotToExitCurve = window.curves.find((curve) => curve.type === "spot-to-exit")?.curve;
        const exitToExitCurve = window.curves.find((curve) => curve.type === "exit-to-exit")?.curve;
        const cuspToSpotCurve = window.curves.find((curve) => curve.type === "cusp-to-spot-opposite")?.curve;
        const cuspToSpotOutline = window.outlines.find((outline) => outline.type === "cusp-to-spot-opposite");
    
        if (!spotToExitCurve || !exitToExitCurve || !cuspToSpotCurve || !cuspToSpotOutline) {
            console.error("Required curves or outlines are missing for simulation.");
            return;
        }
    
        // Call the scheduler to handle the kick and call logic
        scheduler(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline);
    });

    function scheduler(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline) {
        kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, () => {
            console.log("Kick AHT completed.");
        });
    }

    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawRoad(ctx, road); // Plot the road
        drawSpot(ctx, spot); // Plot the spot

        [roadEntry, roadExit].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "orange";
            ctx.fill();
            ctx.closePath();

            const arrowLength = 30;
            const arrowX = point.x + arrowLength * Math.cos(point.heading);
            const arrowY = point.y + arrowLength * Math.sin(point.heading);

            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(arrowX, arrowY);
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            ctx.font = "12px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(point.name, point.x + 10, point.y - 10);
        });

        points.forEach((point, index) => {
            if (point.x !== null && point.y !== null) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = index === selectedPointIndex ? "green" : "red";
                ctx.fill();
                ctx.closePath();

                const arrowLength = 30;
                const arrowX = point.x + arrowLength * Math.cos(point.heading);
                const arrowY = point.y + arrowLength * Math.sin(point.heading);

                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(arrowX, arrowY);
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

                ctx.font = "12px Arial";
                ctx.fillStyle = "black";
                ctx.fillText(point.name, point.x + 10, point.y - 10);
            }
        });

        // Always draw the purple splines
        const allPoints = [roadEntry, points[0], points[1], points[2], points[3], roadExit];
        drawSplines(ctx, allPoints, minRadius); // Do not pass true to avoid drawing outlines

        // Draw the load shape points
        if (loadShapePoints && loadShapePoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(loadShapePoints[0].x, loadShapePoints[0].y);
            for (let i = 1; i < loadShapePoints.length; i++) {
                ctx.lineTo(loadShapePoints[i].x, loadShapePoints[i].y);
            }
            //ctx.lineTo(loadShapePoints[0].x, loadShapePoints[0].y); // Close the shape
            ctx.strokeStyle = "black"; // Line color
            ctx.lineWidth = 2; // Line thickness
            ctx.stroke();
            ctx.closePath();

            // Draw the points as circles
            loadShapePoints.forEach((point, index) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = "red"; // Color for points
                ctx.fill();
                ctx.closePath();

                ctx.font = "12px Arial";
                ctx.fillStyle = "black";
                ctx.fillText(`P${index + 1}`, point.x + 10, point.y - 10); // Label the points
            });
        } else {
            console.error("Load shape points are not defined or empty. Ensure they are generated before drawing.");
        }

        // Plot the topRightCornerRoad point
        const topRightCornerRoad = {
            x: road.x + 30, // Assuming road width is 60, half of it is 30
            y: road.y - 50, // Assuming road height is 100, half of it is 50
        };

       

        
    }

    drawCanvas();
});