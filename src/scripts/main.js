import { drawSplines } from "./lines.js";
import { generateRandomRoad, drawRoad } from "./road.js";
import { generateSpot, drawSpot } from "./spot.js";
import { initializePoints, resetPoints } from "./points.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const regenerateBtn = document.getElementById("regenerate-btn"); // Ensure ID matches
    const clearLinesBtn = document.getElementById("clear-lines-btn"); // Ensure ID matches
    const toggleBtn = document.getElementById("toggle-btn");
    const drawLinesBtn = document.getElementById("draw-lines-btn");

    // High-quality canvas rendering
    const scale = window.devicePixelRatio; // Get device pixel ratio
    canvas.width = 1200 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = "1200px";
    canvas.style.height = "600px";
    ctx.scale(scale, scale);

    const points = initializePoints(); // Initialize points
    let roadEntry = null; // Road entry point
    let roadExit = null; // Road exit point
    let selectedPointIndex = null; // Index of the currently selected point
    let mode = "adjust-position"; // Modes: "adjust-position" or "adjust-heading"
    const minRadius = 50; // Minimum radius for the curves

    let road = generateRandomRoad(canvas.height); // Generate a road on page load
    let spot = generateSpot(canvas.width, canvas.height); // Generate a spot on page load
    points[2] = { ...spot, name: "Spot" }; // Automatically set the Spot point

    // Place road entry and exit points
    function placeRoadPoints() {
        const roadWidth = 80; // Width of the road
        const roadHeight = 200; // Height of the road
        const roadQuarterHeight = roadHeight / 4; // 1/4 of the road height
        const roadCenterX = road.x; // Center of the road horizontally

        roadEntry = {
            name: "Road Entry",
            x: roadCenterX, // Centered on the x-axis
            y: road.y - roadHeight / 2 + roadQuarterHeight, // 1/4 inside from the top edge
            heading: road.angle * (Math.PI / 180), // Align with road angle
        };
        roadExit = {
            name: "Road Exit",
            x: roadCenterX, // Centered on the x-axis
            y: road.y + roadHeight / 2 - roadQuarterHeight, // 1/4 inside from the bottom edge
            heading: (road.angle + 180) * (Math.PI / 180), // Rotate 180 degrees
        };
    }

    placeRoadPoints(); // Place road points on page load

    // Update toggle button text
    function updateToggleButton() {
        toggleBtn.textContent =
            mode === "adjust-position" ? "Switch to Adjust Heading" : "Switch to Adjust Position";
    }

    updateToggleButton();

    // Handle canvas click
    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log(`Canvas clicked at: (${x}, ${y})`);

        const clickedPointIndex = getClickedPointIndex(x, y);

        if (mode === "adjust-position") {
            if (clickedPointIndex !== null && clickedPointIndex !== 2) { // Exclude Spot from user placement
                // Select the clicked point for repositioning
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for repositioning.`);
            } else if (selectedPointIndex !== null) {
                // Reposition the selected point
                points[selectedPointIndex].x = x;
                points[selectedPointIndex].y = y;
                console.log(`Point ${points[selectedPointIndex].name} repositioned to (${x}, ${y}).`);
                selectedPointIndex = null; // Deselect the point after repositioning
            } else {
                // Place a new point if not all points are placed
                const nextPointIndex = points.findIndex(
                    (point, index) => point.x === null && point.y === null && index !== 2 // Exclude Spot
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
            if (clickedPointIndex !== null && clickedPointIndex !== 2) { // Exclude Spot from heading adjustment
                // Select the clicked point for heading adjustment
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for heading adjustment.`);
            } else if (selectedPointIndex !== null) {
                // Adjust heading for the selected point
                const point = points[selectedPointIndex];
                point.heading = Math.atan2(y - point.y, x - point.x); // Calculate heading angle
                console.log(`Adjusted heading for point ${point.name} to ${point.heading} radians.`);
                selectedPointIndex = null; // Deselect the point after adjusting heading
            }
        }
        drawCanvas();
    });

    // Toggle between adjust modes
    toggleBtn.addEventListener("click", () => {
        mode = mode === "adjust-position" ? "adjust-heading" : "adjust-position";
        selectedPointIndex = null; // Deselect any selected point when switching modes
        updateToggleButton();
        console.log(`Mode switched to: ${mode}`);
        drawCanvas();
    });

    // Regenerate the canvas
    regenerateBtn.addEventListener("click", () => {
        resetPoints(points); // Reset points
        selectedPointIndex = null;
        console.log("Canvas regenerated. All points reset.");
        road = generateRandomRoad(canvas.height); // Generate a new road on regenerate
        spot = generateSpot(canvas.width, canvas.height); // Generate a new spot on regenerate
        points[2] = { ...spot, name: "Spot" }; // Automatically set the Spot point
        placeRoadPoints(); // Place road entry and exit points
        drawCanvas();
    });

    // Clear lines
    clearLinesBtn.addEventListener("click", () => {
        console.log("Clearing splines...");
        drawCanvas(); // Redraw canvas without splines
    });

    // Draw lines button
    drawLinesBtn.addEventListener("click", () => {
        if (points.every((point, index) => (index === 2 || (point.x !== null && point.y !== null)))) {
            console.log("Drawing splines between points...");
            const allPoints = [roadEntry, points[0], points[1], points[2], points[3], roadExit]; // Updated sequence
            drawSplines(ctx, allPoints, minRadius); // Call the imported function to draw splines
        } else {
            console.log("Please place all points before drawing lines.");
        }
    });

    // Draw the canvas
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the road
        drawRoad(ctx, road);

        // Draw the spot
        drawSpot(ctx, spot);

        // Draw road entry and exit points
        [roadEntry, roadExit].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "orange";
            ctx.fill();
            ctx.closePath();

            // Draw heading arrow
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

            // Label the point
            ctx.font = "12px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(point.name, point.x + 10, point.y - 10);
        });

        points.forEach((point, index) => {
            if (point.x !== null && point.y !== null) {
                // Draw the point
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = index === selectedPointIndex ? "green" : "red"; // Highlight selected point
                ctx.fill();
                ctx.closePath();

                // Draw the heading arrow
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

                // Label the point
                ctx.font = "12px Arial";
                ctx.fillStyle = "black";
                ctx.fillText(point.name, point.x + 10, point.y - 10);
            }
        });
    }

    // Get the index of the clicked point, if any
    function getClickedPointIndex(x, y) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (point.x !== null && point.y !== null) {
                const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (distance <= 10) {
                    return i; // Return the index of the clicked point
                }
            }
        }
        return null; // No point was clicked
    }

    drawCanvas(); // Initial draw on page load
});