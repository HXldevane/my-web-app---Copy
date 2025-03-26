import { Bezier } from "bezier-js"; // Ensure Bezier is imported

// Function to calculate the pixel length of the path
function calculatePathLength(pathPoints, scale) {
    let totalLength = 0;

    for (let i = 0; i < pathPoints.length - 1; i++) {
        const start = pathPoints[i];
        const end = pathPoints[i + 1];

        // Calculate the distance between two points
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        totalLength += distance;
    }

    // Divide the total length by the scale
    return totalLength / scale;
}

// Function to evaluate user performance
function userPerformance(curves, cuspOutlines, scale, ctx) {
    const { queueToCuspOutline, cuspToSpotOutline } = cuspOutlines;

    console.log("Queue-to-Cusp Outline:", queueToCuspOutline);
    console.log("Cusp-to-Spot Outline:", cuspToSpotOutline);

    const exitLength = exitPathLength(curves, scale);
    console.log(`Exit path length: ${exitLength} scaled units`);

    const queueLength = queuePathLength(curves, scale);
    console.log(`Queue path length: ${queueLength} scaled units`);

    const cuspLength = cuspPathLength(curves, scale);
    console.log(`Cusp path length: ${cuspLength} scaled units`);

    const cuspIntercept = cuspInterceptLength(curves, cuspOutlines);
    console.log("Cusp Intercept Lengths:", cuspIntercept);

    // Visualize intersections
    ctx.save();
    ctx.fillStyle = "red";
    cuspIntercept.leftIntersections.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    cuspIntercept.rightIntersections.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    ctx.restore();
}

// Function to calculate the length of the exit path (spot to road exit)
function exitPathLength(curves, scale) {
    const spotToExitCurve = curves[3]?.curve; // Assuming index 3 is "spot-to-exit"
    const exitToRoadExitCurve = curves[4]?.curve; // Assuming index 4 is "exit-to-road-exit"

    if (!spotToExitCurve || !exitToRoadExitCurve) {
        console.error("Required curves for exit path not found.");
        return null;
    }

    const spotToExitLength = spotToExitCurve.length() / scale;
    const exitToRoadExitLength = exitToRoadExitCurve.length() / scale;

    return spotToExitLength + exitToRoadExitLength;
}

// Function to calculate the length of the cusp path (cusp to spot)
function cuspPathLength(curves, scale) {
    const cuspToSpotCurve = curves[2]?.curve; // Assuming index 2 is "cusp-to-spot"

    if (!cuspToSpotCurve) {
        console.error("Cusp-to-spot curve not found.");
        return null;
    }

    return cuspToSpotCurve.length() / scale;
}

// Function to calculate the length of the queue path (queue to cusp)
function queuePathLength(curves, scale) {
    const queueToCuspCurve = curves[1]?.curve; // Assuming index 1 is "queue-to-cusp"

    if (!queueToCuspCurve) {
        console.error("Queue-to-cusp curve not found.");
        return null;
    }

    return queueToCuspCurve.length() / scale;
}

// Function to calculate the longest cusp intercept length
function cuspInterceptLength(curves, cuspOutlines) {
    const spotToExitCurve = curves.find((curve) => curve.type === "spot-to-exit")?.curve;
    const cuspToSpotOutline = cuspOutlines.find((outline) => outline.type === "cusp-to-spot-opposite");

    if (!cuspToSpotOutline || !spotToExitCurve) {
        console.error("Required outline or curve for cusp intercept calculation is missing.");
        return { leftIntersections: [], rightIntersections: [] };
    }

    // Helper function to find intersections between two Bezier curves
    function findIntersections(curve1, curve2) {
        const intersectionTs = curve1.intersects(curve2); // Returns t-values of intersections
        if (!Array.isArray(intersectionTs)) return []; // Ensure it's an array
        return intersectionTs.map((t) => {
            if (typeof t === "string" && t.includes("/")) {
                // Handle cases where the intersection is reported as "t1/t2"
                const [t1] = t.split("/").map(parseFloat);
                return curve1.get(t1);
            }
            return curve1.get(parseFloat(t)); // Convert t to a number and get the point
        });
    }

    // Find intersections for left and right offset curves
    const leftIntersections = [];
    cuspToSpotOutline.left.forEach((leftCurve) => {
        const intersections = findIntersections(spotToExitCurve, leftCurve);
        leftIntersections.push(...intersections);
    });

    const rightIntersections = [];
    cuspToSpotOutline.right.forEach((rightCurve) => {
        const intersections = findIntersections(spotToExitCurve, rightCurve);
        rightIntersections.push(...intersections);
    });

    console.log("Left Intersections:", leftIntersections);
    console.log("Right Intersections:", rightIntersections);

    return { leftIntersections, rightIntersections };
}

// Placeholder for queue intercept length
function queueInterceptLength() {
    // Logic to be implemented later
    return null;
}

// Export the functions
export { 
    calculatePathLength, 
    userPerformance, 
    exitPathLength, 
    cuspPathLength, 
    queuePathLength, 
    cuspInterceptLength, 
    queueInterceptLength 
};
