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

// Function to calculate the time taken for a given distance
function calculateTimeForDistance(distance, acceleration, deceleration, maxSpeed) {
    const distanceInMeters = distance * 0.2; // Convert pixels to meters (1 pixel = 20 cm)

    let accelTime = 0;
    let accelDistance = 0;
    if (acceleration > 0) {
        accelTime = maxSpeed / acceleration; // Time to reach max speed
        accelDistance = 0.5 * acceleration * accelTime ** 2; // Distance covered during acceleration
    }

    let decelTime = 0;
    let decelDistance = 0;
    if (deceleration > 0) {
        decelTime = maxSpeed / deceleration; // Time to decelerate from max speed
        decelDistance = 0.5 * deceleration * decelTime ** 2; // Distance covered during deceleration
    }

    if (distanceInMeters <= accelDistance + decelDistance) {
        // If the distance is too short to reach max speed
        const effectiveDistance = distanceInMeters / 2;
        const accelTimeShort = acceleration > 0 ? Math.sqrt(2 * effectiveDistance / acceleration) : 0;
        const decelTimeShort = deceleration > 0 ? Math.sqrt(2 * effectiveDistance / deceleration) : 0;
        return accelTimeShort + decelTimeShort; // Time for acceleration and deceleration
    }

    const cruiseDistance = distanceInMeters - accelDistance - decelDistance; // Distance covered at max speed
    const cruiseTime = cruiseDistance > 0 ? cruiseDistance / maxSpeed : 0; // Time spent cruising

    return accelTime + cruiseTime + decelTime; // Total time
}

// Function to evaluate user performance
function userPerformance(curves, cuspOutlines, scale, ctx) {
    const exitLength = exitPathLength(curves, scale);
    const queueLength = queuePathLength(curves, scale);
    const cuspLength = cuspPathLength(curves, scale);

    const cuspIntercept = cuspInterceptLength(curves, cuspOutlines);
    const queueIntercept = queueInterceptLength(curves, cuspOutlines);

    // Example acceleration, deceleration, and max speed values
    const emptyAcceleration = 2 / 3.6; // m/s² -> kphh
    const emptyDeceleration = 2 / 3.6; // m/s² -> kphh
    const loadedAcceleration = 2 / 3.6; // m/s² -> kphh
    const loadedDeceleration = 2 / 3.6; // m/s² -> kphh
    const maxForwardSpeed = 30 / 3.6; // m/s -> kph

    const reverseAcceleration = 2 / 3.6; // m/s² -> kphh
    const reverseDeceleration = 2 / 3.6; // m/s² -> kphh
    const maxReverseSpeed = 10 / 3.6; // m/s -> kph

    // Calculate and log time for each path
    const exitTime = calculateTimeForDistance(exitLength, loadedAcceleration, 0, maxForwardSpeed);
    const queueTime = calculateTimeForDistance(queueLength, reverseAcceleration, reverseDeceleration, maxReverseSpeed);
    const cuspTime = calculateTimeForDistance(cuspLength, emptyAcceleration, emptyDeceleration, maxReverseSpeed);

    const cuspWaitTime = calculateTimeForDistance(cuspIntercept.furthestDistance, reverseAcceleration, reverseDeceleration, maxReverseSpeed);
    const queueWaitTime = calculateTimeForDistance(queueIntercept.furthestDistance, emptyAcceleration, emptyDeceleration, maxForwardSpeed);

    const totalTime = exitTime + queueTime + cuspTime + cuspWaitTime + queueWaitTime;
    const spotTime = cuspTime + cuspWaitTime;

    console.log(`Total Time: ${totalTime.toFixed(2)} seconds`);
    console.log(`Spot Time: ${spotTime.toFixed(2)} seconds`);
    console.log(`Exit Time: ${exitTime.toFixed(2)} seconds`);
    console.log(`Queue Time: ${queueTime.toFixed(2)} seconds`);
    console.log(`Cusp Wait Time: ${cuspWaitTime.toFixed(2)} seconds`);
    console.log(`Queue Wait Time: ${queueWaitTime.toFixed(2)} seconds`);

    return { totalTime, spotTime, exitTime, queueTime, cuspWaitTime, queueWaitTime };
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
    const cuspToSpotOutline = cuspOutlines.find((outline) => outline.type === "cusp-to-spot-opposite");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");

    if (!cuspToSpotOutline || !spotToExitOutline || !exitToRoadExitOutline) {
        console.error("Required outlines for cusp intercept calculation are missing.");
        return { leftIntersections: [], rightIntersections: [], furthestDistance: 0 };
    }

    const cuspToSpotCurve = curves.find((curve) => curve.type === "cusp-to-spot-opposite")?.curve;

    if (!cuspToSpotCurve) {
        console.error("Cusp-to-spot curve not found.");
        return { leftIntersections: [], rightIntersections: [], furthestDistance: 0 };
    }

    // Helper function to find intersections and calculate distances
    function findIntersectionsAndDistances(curve, otherCurves) {
        const intersections = [];
        let maxDistance = 0;

        otherCurves.forEach((otherCurve) => {
            const intersectionTs = curve.intersects(otherCurve);
            intersectionTs.forEach((t) => {
                const point = curve.get(t);
                const distance = curve.length(0, t); // Distance from the start of the curve to the intersection
                intersections.push({ point, distance });
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            });
        });

        return { intersections, maxDistance };
    }

    const leftResults = findIntersectionsAndDistances(cuspToSpotCurve, [...spotToExitOutline.left, ...exitToRoadExitOutline.left]);
    const rightResults = findIntersectionsAndDistances(cuspToSpotCurve, [...spotToExitOutline.right, ...exitToRoadExitOutline.right]);

    const furthestDistance = Math.max(leftResults.maxDistance, rightResults.maxDistance);

    console.log(`Furthest Cusp Intersection Distance: ${furthestDistance.toFixed(2)} meters`);

    return { leftIntersections: leftResults.intersections, rightIntersections: rightResults.intersections, furthestDistance };
}

function queueInterceptLength(curves, cuspOutlines) {
    const queueToCuspOutline = cuspOutlines.find((outline) => outline.type === "queue-to-cusp");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");

    if (!queueToCuspOutline || !spotToExitOutline || !exitToRoadExitOutline) {
        console.error("Required outlines for queue intercept calculation are missing.");
        return { leftIntersections: [], rightIntersections: [], furthestDistance: 0 };
    }

    const queueToCuspCurve = curves.find((curve) => curve.type === "queue-to-cusp")?.curve;

    if (!queueToCuspCurve) {
        console.error("Queue-to-cusp curve not found.");
        return { leftIntersections: [], rightIntersections: [], furthestDistance: 0 };
    }

    // Helper function to find intersections and calculate distances
    function findIntersectionsAndDistances(curve, otherCurves) {
        const intersections = [];
        let maxDistance = 0;

        otherCurves.forEach((otherCurve) => {
            const intersectionTs = curve.intersects(otherCurve);
            intersectionTs.forEach((t) => {
                const point = curve.get(t);
                const distance = curve.length(0, t); // Distance from the start of the curve to the intersection
                intersections.push({ point, distance });
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            });
        });

        return { intersections, maxDistance };
    }

    const leftResults = findIntersectionsAndDistances(queueToCuspCurve, [...spotToExitOutline.left, ...exitToRoadExitOutline.left]);
    const rightResults = findIntersectionsAndDistances(queueToCuspCurve, [...spotToExitOutline.right, ...exitToRoadExitOutline.right]);

    const furthestDistance = Math.max(leftResults.maxDistance, rightResults.maxDistance);

    console.log(`Furthest Queue Intersection Distance: ${furthestDistance.toFixed(2)} meters`);

    return { leftIntersections: leftResults.intersections, rightIntersections: rightResults.intersections, furthestDistance };
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
    queueInterceptLength, 
    calculateTimeForDistance 
};
