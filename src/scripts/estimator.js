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

    const queueIntercept = queueInterceptLength(curves, cuspOutlines);
    console.log("Queue Intercept Lengths:", queueIntercept);

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
    queueIntercept.leftIntersections.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    queueIntercept.rightIntersections.forEach((point) => {
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
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");
    const cuspToSpotOutline = cuspOutlines.find((outline) => outline.type === "cusp-to-spot-opposite");

    if (!cuspToSpotOutline || !spotToExitOutline || !exitToRoadExitOutline) {
        console.error("Required outlines for cusp intercept calculation are missing.");
        return { leftIntersections: [], rightIntersections: [] };
    }

    // Helper function to find intersections between two Bezier curves
    function findIntersections(curve1, curve2) {
        const intersectionTs = curve1.intersects(curve2); // Returns t-values of intersections
        if (!Array.isArray(intersectionTs)) return []; // Ensure it's an array
        return intersectionTs.map((t) => {
            if (typeof t === "string" && t.includes("/")) {
                const [t1] = t.split("/").map(parseFloat);
                return curve1.get(t1);
            }
            return curve1.get(parseFloat(t)); // Convert t to a number and get the point
        });
    }

    // Find intersections for left and right offset curves
    const leftIntersections = [];
    cuspToSpotOutline.left.forEach((cuspLeftCurve) => {
        [...spotToExitOutline.left, ...exitToRoadExitOutline.left].forEach((spotLeftCurve) => {
            const intersections = findIntersections(cuspLeftCurve, spotLeftCurve);
            leftIntersections.push(...intersections);
        });
    });

    const rightIntersections = [];
    cuspToSpotOutline.right.forEach((cuspRightCurve) => {
        [...spotToExitOutline.right, ...exitToRoadExitOutline.right].forEach((spotRightCurve) => {
            const intersections = findIntersections(cuspRightCurve, spotRightCurve);
            rightIntersections.push(...intersections);
        });
    });

    // Find the furthest intersection along the path
    function findFurthestIntersection(intersections, spot) {
        let furthestIntersection = null;
        let maxDistance = 0;

        intersections.forEach((intersection) => {
            const distance = Math.sqrt(
                Math.pow(intersection.x - spot.x, 2) + Math.pow(intersection.y - spot.y, 2)
            );
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestIntersection = intersection;
            }
        });

        return { furthestIntersection, maxDistance };
    }

    const spot = curves.find((curve) => curve.type === "spot-to-exit")?.curve.points[0]; // Spot position
    const furthestLeft = findFurthestIntersection(leftIntersections, spot);
    const furthestRight = findFurthestIntersection(rightIntersections, spot);

    const furthestOverall =
        furthestLeft.maxDistance > furthestRight.maxDistance
            ? { side: "Left", ...furthestLeft }
            : { side: "Right", ...furthestRight };

    console.log(
        `Furthest Intersection Overall: Side: ${furthestOverall.side}, Point:`,
        furthestOverall.furthestIntersection,
        "Distance:",
        furthestOverall.maxDistance
    );

    return { leftIntersections, rightIntersections };
}

function queueInterceptLength(curves, cuspOutlines) {
    const queueToCuspOutline = cuspOutlines.find((outline) => outline.type === "queue-to-cusp");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");

    if (!queueToCuspOutline || !spotToExitOutline || !exitToRoadExitOutline) {
        console.error("Required outlines for queue intercept calculation are missing.");
        return { leftIntersections: [], rightIntersections: [] };
    }

    // Helper function to find intersections between two Bezier curves
    function findIntersections(curve1, curve2) {
        const intersectionTs = curve1.intersects(curve2); // Returns t-values of intersections
        if (!Array.isArray(intersectionTs)) return []; // Ensure it's an array
        return intersectionTs.map((t) => {
            if (typeof t === "string" && t.includes("/")) {
                const [t1] = t.split("/").map(parseFloat);
                return curve1.get(t1);
            }
            return curve1.get(parseFloat(t)); // Convert t to a number and get the point
        });
    }

    // Find intersections for left and right offset curves
    const leftIntersections = [];
    queueToCuspOutline.left.forEach((queueLeftCurve) => {
        [...spotToExitOutline.left, ...exitToRoadExitOutline.left].forEach((spotLeftCurve) => {
            const intersections = findIntersections(queueLeftCurve, spotLeftCurve);
            leftIntersections.push(...intersections);
        });
    });

    const rightIntersections = [];
    queueToCuspOutline.right.forEach((queueRightCurve) => {
        [...spotToExitOutline.right, ...exitToRoadExitOutline.right].forEach((spotRightCurve) => {
            const intersections = findIntersections(queueRightCurve, spotRightCurve);
            rightIntersections.push(...intersections);
        });
    });

    // Find the furthest intersection along the path
    function findFurthestIntersection(intersections, queue) {
        let furthestIntersection = null;
        let maxDistance = 0;

        intersections.forEach((intersection) => {
            const distance = Math.sqrt(
                Math.pow(intersection.x - queue.x, 2) + Math.pow(intersection.y - queue.y, 2)
            );
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestIntersection = intersection;
            }
        });

        return { furthestIntersection, maxDistance };
    }

    const queue = curves.find((curve) => curve.type === "queue-to-cusp")?.curve.points[0]; // Queue position
    const furthestLeft = findFurthestIntersection(leftIntersections, queue);
    const furthestRight = findFurthestIntersection(rightIntersections, queue);

    const furthestOverall =
        furthestLeft.maxDistance > furthestRight.maxDistance
            ? { side: "Left", ...furthestLeft }
            : { side: "Right", ...furthestRight };

    console.log(
        `Furthest Queue Intersection Overall: Side: ${furthestOverall.side}, Point:`,
        furthestOverall.furthestIntersection,
        "Distance:",
        furthestOverall.maxDistance
    );

    return { leftIntersections, rightIntersections };
}

// Helper function to highlight an intersection
function highlightIntersection(intersection, color) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(intersection.x, intersection.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color; // Highlight color
    ctx.fill();
    ctx.closePath();
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
