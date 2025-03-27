import { checkPathIntersections } from "./rules.js"; // Import the intersection checker

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

// Function to calculate Tonnes per Hour
function calculateTonnesPerHour(spotTime) {
    const effectiveTime = Math.max(135 + spotTime, 180); // Max of 135 + spotTime or 180
    const tonnesPerHour = (3600 / effectiveTime) * 250; // Calculate Tonnes per Hour
    return tonnesPerHour;
}

// Function to evaluate user performance
function userPerformance(curves, cuspOutlines, scale, ctx, speedLimit) {
    const exitLength = exitPathLength(curves, scale);
    const queueLength = queuePathLength(curves, scale);
    const cuspLength = cuspPathLength(curves, scale);

    const cuspIntercept = cuspInterceptLength(curves, cuspOutlines, ctx);
    const queueIntercept = queueInterceptLength(curves, cuspOutlines, ctx);

    // Example acceleration, deceleration, and max speed values
    const emptyAcceleration = 2 / 3.6; // m/s² -> kphh
    const emptyDeceleration = 2 / 3.6; // m/s² -> kphh
    const loadedAcceleration = 2 / 3.6; // m/s² -> kphh
    const loadedDeceleration = 2 / 3.6; // m/s² -> kphh
    const maxForwardSpeed = speedLimit / 3.6; // Convert kph to m/s
    console.log(speedLimit);

    const reverseAcceleration = 1 / 3.6; // m/s² -> kphh
    const reverseDeceleration = 1 / 3.6; // m/s² -> kphh
    const maxReverseSpeed = 12 / 3.6; // m/s -> kph

    // Calculate and log time for each path
    const exitTime = calculateTimeForDistance(exitLength, loadedAcceleration, 0, maxForwardSpeed);
    const queueTime = calculateTimeForDistance(queueLength, reverseAcceleration, reverseDeceleration, maxForwardSpeed);
    const cuspTime = calculateTimeForDistance(cuspLength, emptyAcceleration, emptyDeceleration, maxReverseSpeed);

    const cuspWaitTime = calculateTimeForDistance(cuspIntercept.furthestDistance, emptyAcceleration, 0, maxForwardSpeed);
    const queueWaitTime = calculateTimeForDistance(queueIntercept.furthestDistance, emptyAcceleration, 0, maxForwardSpeed);

    const totalTime = exitTime + queueTime + cuspTime + cuspWaitTime + queueWaitTime;
    const spotTime = cuspTime + cuspWaitTime;

    const tonnesPerHour = calculateTonnesPerHour(spotTime); // Calculate Tonnes per Hour

    return { totalTime, spotTime, exitTime, queueTime, cuspWaitTime, queueWaitTime, tonnesPerHour };
}

// Function to calculate the length of the exit path (spot to road exit)
function exitPathLength(curves, scale) {
    const spotToExitCurve = curves.find((curve) => curve.type === "spot-to-exit")?.path;
    const exitToRoadExitCurve = curves.find((curve) => curve.type === "exit-to-exit")?.path;

    if (!spotToExitCurve || !exitToRoadExitCurve) {
        return 0; // Return 0 instead of null to avoid further errors
    }

    const spotToExitLength = calculatePathLength(spotToExitCurve, scale);
    const exitToRoadExitLength = calculatePathLength(exitToRoadExitCurve, scale);

    return spotToExitLength + exitToRoadExitLength;
}

// Function to calculate the length of the cusp path (cusp to spot)
function cuspPathLength(curves, scale) {
    const cuspToSpotCurve = curves.find((curve) => curve.type === "cusp-to-spot-opposite")?.path;

    if (!cuspToSpotCurve) {
        return 0; // Return 0 instead of null to avoid further errors
    }

    return calculatePathLength(cuspToSpotCurve, scale);
}

// Function to calculate the length of the queue path (queue to cusp)
function queuePathLength(curves, scale) {
    const queueToCuspCurve = curves.find((curve) => curve.type === "queue-to-cusp")?.path;

    if (!queueToCuspCurve) {
        return 0; // Return 0 instead of null to avoid further errors
    }

    return calculatePathLength(queueToCuspCurve, scale);
}

// Function to calculate the longest cusp intercept length
function cuspInterceptLength(curves, cuspOutlines, ctx) {
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const cuspToSpotOutline = cuspOutlines.find((outline) => outline.type === "cusp-to-spot-opposite");

    if (!exitToRoadExitOutline || !spotToExitOutline || !cuspToSpotOutline) {
        console.error("Required outlines for cusp intercept calculation are missing.");
        return { intersections: [], furthestDistance: 0 };
    }

    const spotPoint = curves.find((curve) => curve.type === "spot-to-exit")?.path[0];

    if (!spotPoint) {
        console.error("Spot point not found.");
        return { intersections: [], furthestDistance: 0 };
    }

    const { left: exitLeft, right: exitRight } = exitToRoadExitOutline;
    const { left: spotLeft, right: spotRight } = spotToExitOutline;
    const { left: cuspLeft, right: cuspRight } = cuspToSpotOutline;

    let intersectionFound = null;

    // Function to check if a segment intersects with cusp outlines
    function checkSegment(segment) {
        for (const cuspSide of [cuspLeft, cuspRight]) {
            for (let i = 0; i < cuspSide.length - 1; i++) {
                const cuspSegment = { p1: cuspSide[i], p2: cuspSide[i + 1] };
                const intersection = getLineIntersection(segment.p1, segment.p2, cuspSegment.p1, cuspSegment.p2);
                if (intersection) {
                    return intersection;
                }
            }
        }
        return null;
    }

    // Helper to traverse an outline backward and find the first intersection
    function findIntersection(outline) {
        for (let i = outline.length - 1; i > 0; i--) {
            const segment = { p1: outline[i], p2: outline[i - 1] };
            const intersection = checkSegment(segment);
            if (intersection) return intersection;
        }
        return null;
    }

    // Check `exit-to-road-exit` outline
    for (const exitSide of [exitLeft, exitRight]) {
        intersectionFound = findIntersection(exitSide);
        if (intersectionFound) break;
    }

    // If no intersection found, check `spot-to-exit` outline
    if (!intersectionFound) {
        for (const spotSide of [spotLeft, spotRight]) {
            intersectionFound = findIntersection(spotSide);
            if (intersectionFound) break;
        }
    }

    // Plot the line from the spot point to the intersection if found
    if (intersectionFound && ctx) {
        ctx.beginPath();
        ctx.moveTo(spotPoint.x, spotPoint.y);
        ctx.lineTo(intersectionFound.x, intersectionFound.y);
        ctx.strokeStyle = "red"; // Red line for cusp intercept
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    } else {
        console.log("No intersections found between exit-to-road-exit/spot-to-exit and cusp outlines.");
    }

    return { intersections: intersectionFound ? [intersectionFound] : [], furthestDistance: intersectionFound ? calculateSegmentLength(spotPoint, intersectionFound) : 0 };
}

function queueInterceptLength(curves, cuspOutlines, ctx) {
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");
    const queueToCuspOutline = cuspOutlines.find((outline) => outline.type === "queue-to-cusp");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");

    if (!exitToRoadExitOutline || !queueToCuspOutline || !spotToExitOutline) {
        console.error("Required outlines for queue intercept calculation are missing.");
        return { intersections: [], furthestDistance: 0 };
    }

    const spotPoint = curves.find((curve) => curve.type === "spot-to-exit")?.path[0];

    if (!spotPoint) {
        console.error("Spot point not found.");
        return { intersections: [], furthestDistance: 0 };
    }

    const { left: exitLeft, right: exitRight } = exitToRoadExitOutline;
    const { left: queueLeft, right: queueRight } = queueToCuspOutline;
    const { left: spotLeft, right: spotRight } = spotToExitOutline;

    let intersectionFound = null;

    // Function to check if a segment intersects with queue outlines
    function checkSegment(segment) {
        for (const queueSide of [queueLeft, queueRight]) {
            for (let i = 0; i < queueSide.length - 1; i++) {
                const queueSegment = { p1: queueSide[i], p2: queueSide[i + 1] };
                const intersection = getLineIntersection(segment.p1, segment.p2, queueSegment.p1, queueSegment.p2);
                if (intersection) {
                    return intersection;
                }
            }
        }
        return null;
    }

    // Helper to traverse an outline backward and find the first intersection
    function findIntersection(outline) {
        for (let i = outline.length - 1; i > 0; i--) {
            const segment = { p1: outline[i], p2: outline[i - 1] };
            const intersection = checkSegment(segment);
            if (intersection) return intersection;
        }
        return null;
    }

    // Check `exit-to-road-exit` outline
    for (const exitSide of [exitLeft, exitRight]) {
        intersectionFound = findIntersection(exitSide);
        if (intersectionFound) break;
    }

    // If no intersection found, check `spot-to-exit` outline
    if (!intersectionFound) {
        for (const spotSide of [spotLeft, spotRight]) {
            intersectionFound = findIntersection(spotSide);
            if (intersectionFound) break;
        }
    }

    // Plot the line from the spot point to the intersection if found
    if (intersectionFound && ctx) {
        ctx.beginPath();
        ctx.moveTo(spotPoint.x, spotPoint.y);
        ctx.lineTo(intersectionFound.x, intersectionFound.y);
        ctx.strokeStyle = "blue"; // Blue line for queue intercept
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    } else {
        console.log("No intersections found between exit-to-road-exit/spot-to-exit and queue outlines.");
    }

    return { intersections: intersectionFound ? [intersectionFound] : [], furthestDistance: intersectionFound ? calculateSegmentLength(spotPoint, intersectionFound) : 0 };
}

// Helper function to calculate the length of a segment
function calculateSegmentLength(p1, p2) {
    if (!p1 || !p2) return 0; // Handle cases where points are undefined
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// Helper function to calculate the intersection point of two line segments
function getLineIntersection(p1, p2, p3, p4) {
    const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (denominator === 0) return null; // Parallel lines

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y),
        };
    }

    return null;
}

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
