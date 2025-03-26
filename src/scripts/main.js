import { drawSplines } from "./lines.js";
import { generateAllRoadPoints, drawRoad, generateLoadShape } from "./road.js"; // Updated imports
import { generateSpot, drawSpot } from "./spot.js";
import { initializePoints, resetPoints, drawQueue, drawCusp, drawExit } from "./points.js";
import { stopAnimations, kickAHT, callAHT, scheduler } from "./autonomy.js"; // Import scheduler function
import { checkPathIntersections } from "./rules.js"; // Removed plotIntersections
import { userPerformance, cuspInterceptLength, queueInterceptLength } from "./estimator.js"; // Import queueInterceptLength

let kickedBeenOnYellow = false; // Define as a global variable
let loadShapePoints = null; // Define globally to ensure it is accessible in drawCanvas
let showOffsets = false; // Global flag to track whether offsets are displayed

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const regenerateBtn = document.getElementById("regenerate-btn");
    const clearLinesBtn = document.getElementById("clear-lines-btn");
    const toggleBtn = document.getElementById("toggle-btn");
    const drawLinesBtn = document.getElementById("draw-lines-btn");
    const simulateBtn = document.getElementById("simulate-btn"); // New button
    const difficultyBtn = document.getElementById("difficulty-btn"); // New button
    let visualToggle = false; // State to track whether visuals are displayed

    // High-quality canvas rendering
    const scale = window.devicePixelRatio;
    canvas.width = 1200 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = "1200px";
    canvas.style.height = "600px";
    ctx.scale(scale, scale);

    // Set the canvas background to a very, very light grey
    ctx.fillStyle = "#f9f9f9"; // Very light grey
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const points = initializePoints();
    let selectedPointIndex = null;
    let mode = "adjust-position";
    const minRadius = 70;
    let difficulty = "easy"; // Default difficulty

    // Generate all road points
    let { road, roadEntry, roadExit } = generateAllRoadPoints(canvas.height, scale);

    // Ensure the spot is set on start
    let spot = generateSpot(canvas.width, canvas.height, scale, difficulty); // Pass difficulty
    points[2] = { ...spot, name: "Spot" };

    let spline = null; // Initialize spline variable

    // Generate the load shape on page load
    const angle = road.angle * (Math.PI / 180);
    const halfWidth = 30;
    const halfHeight = 50;

    const bottomRightCornerRoad = {
        x: road.x + halfWidth * Math.cos(angle) + halfHeight * Math.sin(angle),
        y: road.y + halfWidth * Math.sin(angle) - halfHeight * Math.cos(angle),
    };

    loadShapePoints = generateLoadShape(road, bottomRightCornerRoad, spot, canvas.width / scale, canvas.height / scale, difficulty);

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
                const distanceToSpot = Math.sqrt(
                    (x - points[2].x) ** 2 + (y - points[2].y) ** 2
                );

                if (selectedPointIndex === 1 && distanceToSpot < 200) {
                    // Prevent cusp placement, remove the point, and show error
                    console.error("Cusp too close to the spot point. Please place it again.");
                    points[selectedPointIndex].x = null;
                    points[selectedPointIndex].y = null;
                    showCuspError();
                } else {
                    points[selectedPointIndex].x = x;
                    points[selectedPointIndex].y = y;
                    console.log(`Point ${points[selectedPointIndex].name} repositioned to (${x}, ${y}).`);
                    selectedPointIndex = null;
                    hideCuspError(); // Remove the error message if the cusp is placed correctly
                }
            } else {
                const nextPointIndex = points.findIndex(
                    (point, index) => point.x === null && point.y === null && index !== 2
                );
                if (nextPointIndex !== -1) {
                    if (nextPointIndex === 1) {
                        const distanceToSpot = Math.sqrt(
                            (x - points[2].x) ** 2 + (y - points[2].y) ** 2
                        );

                        if (distanceToSpot < 200) {
                            // Prevent cusp placement, remove the point, and show error
                            console.error("Cusp too close to the spot point. Please place it again.");
                            showCuspError();
                            return;
                        }
                    }

                    points[nextPointIndex].x = x;
                    points[nextPointIndex].y = y;
                    console.log(`Point ${points[nextPointIndex].name} placed at (${x}, ${y}).`);
                    hideCuspError(); // Remove the error message if the cusp is placed correctly
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

    function clearTopRightDisplay() {
        const displayContainer = document.getElementById("top-right-display");
    
        if (!displayContainer) {
            console.error("Top-right display container not found.");
            return;
        }
    
        displayContainer.innerHTML = `
            <div><strong>Truck Exchange Time:</strong> - (s)</div>
            <div><strong>Time to Spot:</strong> - (s)</div>
            <div><strong>Time to Queue:</strong> - (s)</div>
            <div><strong>Cusp Wait:</strong> - (s)</div>
            <div><strong>Queue Wait:</strong> - (s)</div>
            <div><strong>Tonnes per Hour:</strong> -</div>
        `;
    }

    regenerateBtn.addEventListener("click", () => {
        stopAnimations(); // Stop any ongoing animations
        resetPoints(points);
        selectedPointIndex = null;

        // Clear statistics and hide error message
        clearTopRightDisplay();
        hideBoundsError();

        // Reset the headings for cusp and exit points
        points[1].heading = -Math.PI / 2; // Cusp: 90 degrees to the left
        points[3].heading = Math.PI; // Exit: 180 degrees

        console.log("Canvas regenerated. All points reset.");
        ({ road, roadEntry, roadExit } = generateAllRoadPoints(canvas.height, scale)); // Regenerate all road points
        spot = generateSpot(canvas.width, canvas.height, scale, difficulty); // Pass difficulty
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
        showOffsets = false; // Set flag to false
        drawCanvas(); // Redraw the canvas without outlines, overlap, or shading
    });

    function updateTopRightDisplay(totalTime, spotTime, exitTime = "-", queueTime = "-", cuspWaitTime = "-", queueWaitTime = "-", tonnesPerHour = "-") {
        const displayContainer = document.getElementById("top-right-display");
    
        if (!displayContainer) {
            console.error("Top-right display container not found.");
            return;
        }
    
        displayContainer.innerHTML = `
            <div><strong>Truck Exchange Time:</strong> ${totalTime.toFixed(2)} (s)</div>
            <div><strong>Time to Spot:</strong> ${spotTime.toFixed(2)} (s)</div>
            <div><strong>Time to Queue:</strong> ${queueTime} (s)</div>
            <div><strong>Cusp Wait:</strong> ${cuspWaitTime} (s)</div>
            <div><strong>Queue Wait:</strong> ${queueWaitTime} (s)</div>
            <div><strong>Tonnes per Hour:</strong> ${tonnesPerHour.toFixed(2)}</div>
        `;
    }

    function showBoundsError() {
        const boundsError = document.getElementById("bounds-error");
        if (boundsError) {
            boundsError.style.display = "block";
        }
    }

    function hideBoundsError() {
        const boundsError = document.getElementById("bounds-error");
        if (boundsError) {
            boundsError.style.display = "none";
        }
    }

    function showCuspError() {
        const cuspError = document.getElementById("cusp-error");
        if (cuspError) {
            cuspError.style.display = "block";
        }
        drawCanvas(); // Ensure the red dotted line is drawn immediately
    }

    function hideCuspError() {
        const cuspError = document.getElementById("cusp-error");
        if (cuspError) {
            cuspError.style.display = "none";
        }
        drawCanvas(); // Ensure the red dotted line is removed immediately
    }

    drawLinesBtn.addEventListener("click", () => {
        hideBoundsError(); // Hide any previous error message
    
        if (points.every((point, index) => (index === 2 || (point.x !== null && point.y !== null)))) {
            console.log("Drawing splines and highlighting 'cusp-to-spot-opposite' shape...");
            const allPoints = [roadEntry, points[0], points[1], points[2], points[3], roadExit];
    
            // Log points to verify their validity
            console.log("All Points:", allPoints);
    
            const { outlines, curves } = drawSplines(ctx, allPoints, minRadius, true); // Enable offsets
    
            showOffsets = true; // Set flag to true
    
            // Log outlines to verify their structure
            console.log("Outlines generated by drawSplines:", outlines);
    
    
            // Check for intersections between path outlines and the load shape boundary
            const hasIntersections = checkPathIntersections(outlines, loadShapePoints, ctx); // Pass outlines and ctx
    
            if (hasIntersections) {
                console.error("Bounds Error: Intersection detected.");
                showBoundsError(); // Display the error message
            }
    
          
            // Call cuspInterceptLength to calculate intersections
            const cuspIntercepts = cuspInterceptLength(curves, outlines);
            console.log("Cusp Intercepts:", cuspIntercepts);
    
            // Visualize cusp intersections
            ctx.save();
            ctx.fillStyle = "red";
            cuspIntercepts.leftIntersections.forEach(({ point }) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });
            cuspIntercepts.rightIntersections.forEach(({ point }) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });
            ctx.restore();
    
            // Call queueInterceptLength to calculate intersections
            const queueIntercepts = queueInterceptLength(curves, outlines);
            console.log("Queue Intercepts:", queueIntercepts);
    
            // Visualize queue intersections
            ctx.save();
            ctx.fillStyle = "red";
            queueIntercepts.leftIntersections.forEach(({ point }) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });
            queueIntercepts.rightIntersections.forEach(({ point }) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });
            ctx.restore();
    
            // Call userPerformance to evaluate performance
            const { totalTime, spotTime, exitTime, queueTime, cuspWaitTime, queueWaitTime, tonnesPerHour } = userPerformance(curves, outlines, scale, ctx);
    
            // Update the top-right display with consistent layout
            updateTopRightDisplay(
                totalTime,
                spotTime,
                exitTime.toFixed(2),
                queueTime.toFixed(2),
                cuspWaitTime.toFixed(2),
                queueWaitTime.toFixed(2),
                tonnesPerHour
            );
    
            window.curves = curves; // Store curves globally for simulation
            window.outlines = outlines; // Store outlines globally for debugging
        } else {
            console.error("Please place all points before drawing lines.");
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
    
        console.log("Starting simulation...");
        console.log("spotToExitCurve:", spotToExitCurve);
        console.log("exitToExitCurve:", exitToExitCurve);
    
        const cuspWaitTime = 5; // Example wait time in seconds (replace with actual value if dynamic)
    
        // Call the kickAHT function to simulate the truck movement
        kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, drawCanvas, () => {
            console.log("Simulation completed.");
        }, cuspWaitTime);
    });

    difficultyBtn.addEventListener("click", () => {
        // Toggle difficulty levels
        if (difficulty === "easy") {
            difficulty = "medium";
        } else if (difficulty === "medium") {
            difficulty = "hard";
        } else {
            difficulty = "easy";
        }

        // Clear statistics and hide error message
        clearTopRightDisplay();
        hideBoundsError();

        // Reset the headings for cusp and exit points
        points[1].heading = -Math.PI / 2; // Cusp: 90 degrees to the left
        points[3].heading = Math.PI; // Exit: 180 degrees

        // Update button text to reflect the current difficulty
        difficultyBtn.textContent = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;

        console.log(`Difficulty set to: ${difficulty}`);
        regenerateBtn.click(); // Regenerate the load shape with the new difficulty
    });

    function scheduler(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline) {
        kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, () => {
            console.log("Kick AHT completed.");
        });
    }

    function drawCanvas() {
        // Clear the canvas and set the background to very light grey
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f9f9f9"; // Very light grey
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawRoad(ctx, road, roadEntry, roadExit); // Plot the road

        // Define colors for points
        const greenColor = "limegreen";
        const goldColor = "gold";

        // Draw queue point if placed
        if (points[0].x !== null && points[0].y !== null) {
            drawQueue(ctx, points[0], greenColor, selectedPointIndex === 0);
        }

        // Draw cusp point if placed
        if (points[1].x !== null && points[1].y !== null) {
            drawCusp(ctx, points[1], goldColor, selectedPointIndex === 1);
        }

        // Draw spot point if placed
        if (points[2].x !== null && points[2].y !== null) {
            drawSpot(ctx, points[2], goldColor);
        }

        // Draw exit point if placed
        if (points[3].x !== null && points[3].y !== null) {
            drawExit(ctx, points[3], greenColor, selectedPointIndex === 3);
        }

        // Always draw the purple splines
        const allPoints = [roadEntry, points[0], points[1], points[2], points[3], roadExit];
        drawSplines(ctx, allPoints, minRadius); // Do not pass true to avoid drawing outlines

        // Fill the load shape area with a more transparent yellow background and closer grey dot pattern
        if (loadShapePoints && loadShapePoints.length > 0) {
            // Create a pattern for the grey dots
            const patternCanvas = document.createElement("canvas");
            patternCanvas.width = 3; // Smaller grid for closer dots
            patternCanvas.height = 3;
            const patternCtx = patternCanvas.getContext("2d");

            // Draw the grey dots on a transparent background
            patternCtx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent grey dots
            patternCtx.beginPath();
            patternCtx.arc(3, 3, 1, 0, Math.PI * 2); // Smaller dots
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

            // Draw the solid black line first
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
        } else {
            console.error("Load shape points are not defined or empty. Ensure they are generated before drawing.");
        }

        // Draw the red dotted circle around the spot point if the "cusp too close" error is active
        if (document.getElementById("cusp-error").style.display === "block") {
            ctx.save();
            ctx.setLineDash([5, 5]); // Dotted line
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(points[2].x, points[2].y, 200, 0, Math.PI * 2); // 200px radius circle
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
        }

        // Plot the topRightCornerRoad point
        const topRightCornerRoad = {
            x: road.x + 30, // Assuming road width is 60, half of it is 30
            y: road.y - 50, // Assuming road height is 100, half of it is 50
        };

    }

    drawCanvas();
});