import { drawSplines } from "./lines.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const clearBtn = document.getElementById("clear-btn");
    const toggleBtn = document.getElementById("toggle-btn");
    const drawLinesBtn = document.getElementById("draw-lines-btn");

    // High-quality canvas rendering
    const scale = window.devicePixelRatio; // Get device pixel ratio
    canvas.width = 1200 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = "1200px";
    canvas.style.height = "600px";
    ctx.scale(scale, scale);

    const points = [
        { name: "Queue", x: null, y: null, heading: 0 },
        { name: "Cusp", x: null, y: null, heading: 0 },
        { name: "Spot", x: null, y: null, heading: 0 },
        { name: "Exit", x: null, y: null, heading: 0 },
    ];
    let selectedPointIndex = null; // Index of the currently selected point
    let mode = "adjust-position"; // Modes: "adjust-position" or "adjust-heading"
    const minRadius = 50; // Minimum radius for the curves

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
            if (clickedPointIndex !== null) {
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
                const nextPointIndex = points.findIndex((point) => point.x === null && point.y === null);
                if (nextPointIndex !== -1) {
                    points[nextPointIndex].x = x;
                    points[nextPointIndex].y = y;
                    console.log(`Point ${points[nextPointIndex].name} placed at (${x}, ${y}).`);
                } else {
                    console.log("All points have been placed.");
                }
            }
        } else if (mode === "adjust-heading") {
            if (clickedPointIndex !== null) {
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

    // Clear the canvas
    clearBtn.addEventListener("click", () => {
        points.forEach((point) => {
            point.x = null;
            point.y = null;
            point.heading = 0;
        });
        selectedPointIndex = null;
        console.log("Canvas cleared. All points reset.");
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

    // Draw lines button
    drawLinesBtn.addEventListener("click", () => {
        if (points.every((point) => point.x !== null && point.y !== null)) {
            console.log("Drawing splines between points...");
            drawSplines(ctx, points, minRadius); // Call the imported function
        } else {
            console.log("Please place all points before drawing lines.");
        }
    });

    // Draw the canvas
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
});