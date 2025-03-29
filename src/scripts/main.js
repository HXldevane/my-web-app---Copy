import { initialiseRandomMap, initialiseSetMap, drawLoadArea } from "./Initialisation.js";
import { drawSplines } from "./lines.js";
import { generateAllRoadPoints, drawRoad, generateLoadShape } from "./road.js";
import { generateSpot, drawSpot } from "./spot.js"; // Removed duplicate drawSpeedLimit import
import { initializePoints, resetPoints, drawQueue, drawCusp, drawExit } from "./points.js";
import { stopAnimations, kickAHT, callAHT, scheduler } from "./autonomy.js";
import { checkPathIntersections } from "./rules.js";
import { userPerformance, cuspInterceptLength, queueInterceptLength } from "./estimator.js";
import { generateSpeedLimit, drawSpeedLimit } from "./spot.js"; // Retained this import for drawSpeedLimit

let kickedBeenOnYellow = false; // Define as a global variable
let loadShapePoints = null; // Define globally to ensure it is accessible in drawCanvas
let showOffsets = false; // Global flag to track whether offsets are displayed

const cuspCloseRadius = 130;

let road, roadEntry, roadExit, spot, speedLimit; // Declare variables globally

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const regenerateBtn = document.getElementById("regenerate-btn");
    const clearLinesBtn = document.getElementById("clear-lines-btn");
    const toggleBtn = document.getElementById("toggle-btn");
    const drawLinesBtn = document.getElementById("draw-lines-btn");
    const simulateBtn = document.getElementById("simulate-btn"); // New button
    const difficultyBtn = document.getElementById("difficulty-btn"); // New button
    const fileUpload = document.getElementById("file-upload");
    const clearFileBtn = document.getElementById("clear-file-btn");
    let visualToggle = false; // State to track whether visuals are displayed
    let allPointsPlaced = false; // Track if all points have been placed

    // High-quality canvas rendering
    const scale = window.devicePixelRatio;
    canvas.width = 940 * scale;
    canvas.height = 520 * scale;
    canvas.style.width = "940px";
    canvas.style.height = "520px";
    ctx.scale(scale, scale);

    // Set the canvas background to a very, very light grey
    ctx.fillStyle = "#f9f9f9"; // Very light grey
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const points = initializePoints(); // Ensure points array is initialized here
    let selectedPointIndex = null;
    let mode = "adjust-position";
    const minRadius = 70;
    let difficulty = "easy"; // Default difficulty

    function setupCanvas() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const file = fileUpload.files[0]; // Check if a file is uploaded
        const isJsonFile = file && file.name.endsWith(".json"); // Check if the file is a .json file

        const result = isJsonFile
            ? initialiseSetMap(ctx, canvas.width, canvas.height, scale, difficulty, points)
            : initialiseRandomMap(ctx, canvas.width, canvas.height, scale, difficulty, points);

        road = result.road;
        roadEntry = result.roadEntry;
        roadExit = result.roadExit;
        spot = result.spot;
        loadShapePoints = result.loadShapePoints;
        speedLimit = result.speedLimit;
    }

    setupCanvas(); // Initialize on load

    function updateToggleButton() {
        toggleBtn.textContent =
            mode === "adjust-position" ? "Adjust Heading" : "Adjust Position";
        toggleBtn.disabled = !allPointsPlaced; // Disable toggle until all points are placed
    }

    updateToggleButton();

    function checkAllPointsPlaced() {
        allPointsPlaced = points.every((point) => point.x !== null && point.y !== null);
        updateToggleButton();
    }

    function getClickedPointIndex(x, y) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (point.x !== null && point.y !== null) {
                const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (distance <= 40) { // Change this value to adjust the clickable radius
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

        if (!allPointsPlaced) {
            // Place points sequentially
            const nextPointIndex = points.findIndex((point) => point.x === null && point.y === null);
            if (nextPointIndex !== -1) {
                points[nextPointIndex].x = x;
                points[nextPointIndex].y = y;
                console.log(`Point ${points[nextPointIndex].name} placed at (${x}, ${y}).`);
                checkAllPointsPlaced();
            }
        } else if (mode === "adjust-position") {
            // Adjust position only after all points are placed
            const clickedPointIndex = getClickedPointIndex(x, y);
            if (clickedPointIndex !== null) {
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for repositioning.`);
            } else if (selectedPointIndex !== null) {
                const distanceToSpot = Math.sqrt(
                    (x - points[2].x) ** 2 + (y - points[2].y) ** 2
                );

                if (selectedPointIndex === 1 && distanceToSpot < cuspCloseRadius) {
                    console.error("Cusp too close to the spot point. Please place it again.");
                    points[selectedPointIndex].x = null;
                    points[selectedPointIndex].y = null;
                    showCuspError();
                } else {
                    points[selectedPointIndex].x = x;
                    points[selectedPointIndex].y = y;
                    console.log(`Point ${points[selectedPointIndex].name} repositioned to (${x}, ${y}).`);
                    hideCuspError(); // Remove the error message if the cusp is placed correctly
                }
            } else {
                const nextPointIndex = points.findIndex(
                    (point, index) => point.x === null && point.y === null && index !== 2
                );
                if (nextPointIndex !== -1) {
                    points[nextPointIndex].x = x;
                    points[nextPointIndex].y = y;
                    console.log(`Point ${points[nextPointIndex].name} placed at (${x}, ${y}).`);
                    hideCuspError(); // Remove the error message if the cusp is placed correctly
                } else {
                    console.log("All points have been placed.");
                }
            }
        } else if (mode === "adjust-heading") {
            // Adjust heading
            const clickedPointIndex = getClickedPointIndex(x, y);
            if (clickedPointIndex !== null) {
                selectedPointIndex = clickedPointIndex;
                console.log(`Point ${points[clickedPointIndex].name} selected for heading adjustment.`);
            } else if (selectedPointIndex !== null) {
                const point = points[selectedPointIndex];
                point.heading = Math.atan2(y - point.y, x - point.x);
                console.log(`Adjusted heading for point ${point.name} to ${point.heading} radians.`);
            }
        }
        drawCanvas(); // Redraw the canvas to reflect changes
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
             <div><strong>Truck Exch. Time:</strong> - (s)</div>
            <div><strong>Time to Spot:</strong> - (s)</div>
            <div><strong>Spot Wait:</strong> - (s)</div>
            <div><strong>Time to Cusp:</strong> - (s)</div>
            <div><strong>Cusp Wait:</strong> - (s)</div>
            <div><strong>Tonnes per Hour:</strong> - (T/h)</div>
        `;
    }

    regenerateBtn.addEventListener("click", () => {
        stopAnimations(); // Stop any ongoing animations
        resetPoints(points); // Reset points array
        selectedPointIndex = null;
        allPointsPlaced = false; // Reset placement state
        updateToggleButton();

        // Clear statistics and hide error message
        clearTopRightDisplay();
        hideBoundsError();

        // Reset the headings for cusp and exit points
        points[1].heading = -Math.PI / 2; // Cusp: 90 degrees to the left
        points[3].heading = Math.PI; // Exit: 180 degrees

        console.log("Canvas regenerated. All points reset.");
        setupCanvas(); // Reinitialize the canvas
    });

    clearLinesBtn.addEventListener("click", () => {
        console.log("Clearing splines and shading...");
        showOffsets = false; // Set flag to false
        drawCanvas(); // Redraw the canvas without outlines, overlap, or shading
    });

    function updateTopRightDisplay(totalTime, spotTime, exitTime = "-",CusptoSpotTime = "-",CusptoSpotWaitTime = "-", QueuetoCuspTime = "-",  QueuetoCuspWaitTime = "-", tonnesPerHour = "-") {
        const displayContainer = document.getElementById("top-right-display");
    
        if (!displayContainer) {
            console.error("Top-right display container not found.");
            return;
        }
    
        displayContainer.innerHTML = `
            <div><strong>Truck Exch. Time:</strong> ${totalTime} (s)</div>
            <div><strong>Time to Spot:</strong> ${CusptoSpotTime} (s)</div>
            <div><strong>Spot Wait:</strong> ${CusptoSpotWaitTime} (s)</div>
            <div><strong>Time to Cusp:</strong> ${QueuetoCuspTime} (s)</div>
            <div><strong>Cusp Wait:</strong> ${QueuetoCuspWaitTime} (s)</div>
            <div><strong>Tonnes per Hour:</strong> ${tonnesPerHour} (T/h)</div>
        `;
    
       
    }

    function showBoundsError() {
        const boundsError = document.getElementById("bounds-error");
        if (boundsError) {
            boundsError.style.display = "block";
        }

        // Clear the data table
        clearTopRightDisplay();
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

                // Reset the data table to default values
                updateTopRightDisplay("-", "-", "-", "-", "-", "-", "-", "-");
                return; // Exit early if bounds error occurs
            }
    
          
            // Call cuspInterceptLength to calculate intersections
            const cuspIntercepts = cuspInterceptLength(curves, outlines, ctx); // Pass ctx
            console.log("Cusp Intercepts:", cuspIntercepts);
    
    
            // Call queueInterceptLength to calculate intersections
            const queueIntercepts = queueInterceptLength(curves, outlines, ctx); // Pass ctx
            console.log("Queue Intercepts:", queueIntercepts);
    
    
            // Call userPerformance to evaluate performance
            const {
                totalTime,
                spotTime,
                exitTime,
                CusptoSpotTime,
                CusptoSpotWaitTime,
                QueuetoCuspTime,
                QueuetoCuspWaitTime,
                tonnesPerHour,
            } = userPerformance(curves, outlines, scale, ctx, speedLimit); // Pass speed limit
    
            console.log("Tonnes per Hour:", tonnesPerHour); // Debug log
    
            // Update the top-right display with consistent layout
            updateTopRightDisplay(
                totalTime.toFixed(2),
                spotTime.toFixed(2),
                exitTime.toFixed(2),
                CusptoSpotTime.toFixed(2),
                CusptoSpotWaitTime.toFixed(2),
                QueuetoCuspTime.toFixed(2),
                QueuetoCuspWaitTime.toFixed(2),
                tonnesPerHour.toFixed(0)
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
        const file = fileUpload.files[0]; // Check if a file is uploaded
        const isJsonFile = file && file.name.endsWith(".json"); // Check if the file is a .json file
    
        if (isJsonFile) {
            console.log("Difficulty change ignored because a file is uploaded.");
            return; // Do nothing if a file is uploaded
        }
    
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
        setupCanvas(); // Reinitialize the canvas with the new difficulty
    });

    fileUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log(`File selected: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log("File content:", e.target.result);
                // Handle the uploaded file content here
            };
            reader.readAsText(file);
        }
    });

    clearFileBtn.addEventListener("click", () => {
        fileUpload.value = ""; // Clear the file input
        console.log("File upload cleared.");
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

        // Draw the road only if its points are not null
        if (road && roadEntry && roadExit) {
            ctx.save();
            drawRoad(ctx, road, roadEntry, roadExit);
            ctx.restore();
        }

        // Redraw the load area
        if (loadShapePoints && loadShapePoints.length > 0) {
            drawLoadArea(ctx, loadShapePoints);
        }

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

        // Draw the red dotted circle around the spot point if the "cusp too close" error is active
        if (document.getElementById("cusp-error").style.display === "block") {
            ctx.save();
            ctx.setLineDash([5, 5]); // Dotted line
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(points[2].x, points[2].y, cuspCloseRadius, 0, Math.PI * 2); // 120px radius circle
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
        }

        // Plot the topRightCornerRoad point
        const topRightCornerRoad = {
            x: road.x + 30, // Assuming road width is 60, half of it is 30
            y: road.y - 50, // Assuming road height is 100, half of it is 50
        };

        // Draw the speed limit in the load shape
        if (loadShapePoints && loadShapePoints.length > 0) {
            drawSpeedLimit(ctx, loadShapePoints, speedLimit);
        }
    }

    drawCanvas();
});