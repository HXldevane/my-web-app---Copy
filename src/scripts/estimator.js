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
function userPerformance(curves, cuspOutlines, scale, ctx) {
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
    const maxForwardSpeed = 30 / 3.6; // m/s -> kph

    const reverseAcceleration = 1 / 3.6; // m/s² -> kphh
    const reverseDeceleration = 1 / 3.6; // m/s² -> kphh
    const maxReverseSpeed = 12 / 3.6; // m/s -> kph

    // Calculate and log time for each path
    const exitTime = calculateTimeForDistance(exitLength, loadedAcceleration, 0, maxForwardSpeed);
    const queueTime = calculateTimeForDistance(queueLength, reverseAcceleration, reverseDeceleration, maxReverseSpeed);
    const cuspTime = calculateTimeForDistance(cuspLength, emptyAcceleration, emptyDeceleration, maxReverseSpeed);

    const cuspWaitTime = calculateTimeForDistance(cuspIntercept.furthestDistance, reverseAcceleration, reverseDeceleration, maxReverseSpeed);
    const queueWaitTime = calculateTimeForDistance(queueIntercept.furthestDistance, emptyAcceleration, emptyDeceleration, maxForwardSpeed);

    const totalTime = exitTime + queueTime + cuspTime + cuspWaitTime + queueWaitTime;
    const spotTime = cuspTime + cuspWaitTime;

    const tonnesPerHour = calculateTonnesPerHour(spotTime); // Calculate Tonnes per Hour

    console.log(`Total Time: ${totalTime.toFixed(2)} seconds`);
    console.log(`Spot Time: ${spotTime.toFixed(2)} seconds`);
    console.log(`Exit Time: ${exitTime.toFixed(2)} seconds`);
    console.log(`Queue Time: ${queueTime.toFixed(2)} seconds`);
    console.log(`Cusp Wait Time: ${cuspWaitTime.toFixed(2)} seconds`);
    console.log(`Queue Wait Time: ${queueWaitTime.toFixed(2)} seconds`);
    console.log(`Tonnes per Hour: ${tonnesPerHour.toFixed(2)}`);


    


    return { totalTime, spotTime, exitTime, queueTime, cuspWaitTime, queueWaitTime, tonnesPerHour };
}

// Function to calculate the length of the exit path (spot to road exit)
function exitPathLength(curves, scale) {
    const spotToExitCurve = curves.find((curve) => curve.type === "spot-to-exit")?.path;
    const exitToRoadExitCurve = curves.find((curve) => curve.type === "exit-to-exit")?.path;

    if (!spotToExitCurve || !exitToRoadExitCurve) {
        console.error("Required curves for exit path not found.");
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
        console.error("Cusp-to-spot curve not found.");
        return 0; // Return 0 instead of null to avoid further errors
    }

    return calculatePathLength(cuspToSpotCurve, scale);
}

// Function to calculate the length of the queue path (queue to cusp)
function queuePathLength(curves, scale) {
    const queueToCuspCurve = curves.find((curve) => curve.type === "queue-to-cusp")?.path;

    if (!queueToCuspCurve) {
        console.error("Queue-to-cusp curve not found.");
        return 0; // Return 0 instead of null to avoid further errors
    }

    return calculatePathLength(queueToCuspCurve, scale);
}

// Function to calculate the longest cusp intercept length
function cuspInterceptLength(curves, cuspOutlines, ctx) {
    if (!ctx) {
        console.error("Canvas context (ctx) is undefined.");
        return { intersections: [], furthestDistance: 0 };
    }

    const cuspToSpotOutline = cuspOutlines.find((outline) => outline.type === "cusp-to-spot-opposite");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");

    if (!cuspToSpotOutline || !spotToExitOutline) {
        console.error("Required outlines for cusp intercept calculation are missing.");
        return { intersections: [], furthestDistance: 0 };
    }

    const cuspToSpotCurve = curves.find((curve) => curve.type === "cusp-to-spot-opposite")?.path;

    if (!cuspToSpotCurve) {
        console.error("Cusp-to-spot curve not found.");
        return { intersections: [], furthestDistance: 0 };
    }

    const intersections = [];
    let furthestDistance = 0;

    // Check intersections for both sides of cusp-to-spot with both sides of spot-to-exit
    [cuspToSpotOutline.left, cuspToSpotOutline.right].forEach((cuspSide) => {
        cuspSide?.forEach((point, index) => {
            if (index < cuspSide.length - 1) {
                const segment = { p1: point, p2: cuspSide[index + 1] };

                [spotToExitOutline.left, spotToExitOutline.right].forEach((spotSide) => {
                    spotSide?.forEach((outlinePoint, outlineIndex) => {
                        if (outlineIndex < spotSide.length - 1) {
                            const outlineSegment = { p1: outlinePoint, p2: spotSide[outlineIndex + 1] };
                            const intersection = getLineIntersection(segment.p1, segment.p2, outlineSegment.p1, outlineSegment.p2);

                            if (intersection) {
                                intersections.push(intersection);
                                plotIntersection(ctx, intersection, "red"); // Plot intersection
                                const distance = calculateSegmentLength(cuspToSpotCurve[0], intersection);
                                furthestDistance = Math.max(furthestDistance, distance);
                            }
                        }
                    });
                });
            }
        });
    });

    // Draw dots along the path from the spot to the furthest intersection
    intersections.forEach((intersection) => {
        const distance = calculateSegmentLength(cuspToSpotCurve[0], intersection);
        if (distance === furthestDistance) {
            ctx.beginPath();
            ctx.arc(intersection.x, intersection.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.closePath();
        }
    });

    console.log(`Furthest Intersection Distance (Cusp): ${furthestDistance.toFixed(2)} units`);

    return { intersections, furthestDistance };
}

function queueInterceptLength(curves, cuspOutlines, ctx) {
    if (!ctx) {
        console.error("Canvas context (ctx) is undefined.");
        return { intersections: [], furthestDistance: 0 };
    }

    const queueToCuspOutline = cuspOutlines.find((outline) => outline.type === "queue-to-cusp");
    const spotToExitOutline = cuspOutlines.find((outline) => outline.type === "spot-to-exit");
    const exitToRoadExitOutline = cuspOutlines.find((outline) => outline.type === "exit-to-exit");

    if (!queueToCuspOutline || !spotToExitOutline || !exitToRoadExitOutline) {
        console.error("Required outlines for queue intercept calculation are missing.");
        return { intersections: [], furthestDistance: 0 };
    }

    const queueToCuspCurve = curves.find((curve) => curve.type === "queue-to-cusp")?.path;
    const spotToExitCurve = curves.find((curve) => curve.type === "spot-to-exit")?.path;

    if (!queueToCuspCurve || !spotToExitCurve) {
        console.error("Required curves for queue-to-cusp or spot-to-exit are missing.");
        return { intersections: [], furthestDistance: 0 };
    }

    const intersections = [];
    let furthestDistance = 0;

    // Check intersections for both sides of queue-to-cusp with both sides of spot-to-exit and exit-to-road-exit
    [queueToCuspOutline.left, queueToCuspOutline.right].forEach((queueSide) => {
        queueSide?.forEach((point, index) => {
            if (index < queueSide.length - 1) {
                const segment = { p1: point, p2: queueSide[index + 1] };

                // Check against spot-to-exit outline
                [spotToExitOutline.left, spotToExitOutline.right].forEach((spotSide) => {
                    spotSide?.forEach((outlinePoint, outlineIndex) => {
                        if (outlineIndex < spotSide.length - 1) {
                            const outlineSegment = { p1: outlinePoint, p2: spotSide[outlineIndex + 1] };
                            const intersection = getLineIntersection(segment.p1, segment.p2, outlineSegment.p1, outlineSegment.p2);

                            if (intersection) {
                                intersections.push(intersection);
                                plotIntersection(ctx, intersection, "blue"); // Plot intersection
                                const distance = calculateSegmentLength(queueToCuspCurve[0], intersection);
                                furthestDistance = Math.max(furthestDistance, distance);
                            }
                        }
                    });
                });

                // Check against exit-to-road-exit outline
                [exitToRoadExitOutline.left, exitToRoadExitOutline.right].forEach((exitSide) => {
                    exitSide?.forEach((outlinePoint, outlineIndex) => {
                        if (outlineIndex < exitSide.length - 1) {
                            const outlineSegment = { p1: outlinePoint, p2: exitSide[outlineIndex + 1] };
                            const intersection = getLineIntersection(segment.p1, segment.p2, outlineSegment.p1, outlineSegment.p2);

                            if (intersection) {
                                intersections.push(intersection);
                                plotIntersection(ctx, intersection, "blue"); // Plot intersection

                                // Add the distance from the spot to the exit
                                const distanceToExit = calculatePathLength(spotToExitCurve, 1); // Scale = 1 for raw pixel distance
                                const distance = calculateSegmentLength(queueToCuspCurve[0], intersection) + distanceToExit;
                                furthestDistance = Math.max(furthestDistance, distance);
                            }
                        }
                    });
                });
            }
        });
    });

    console.log(`Corrected Furthest Intersection Distance (Queue): ${furthestDistance.toFixed(2)} units`);

    return { intersections, furthestDistance };
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

// Helper function to plot a dot at the intersection point
function plotIntersection(ctx, point, color) {
    if (!ctx) {
        console.error("Canvas context (ctx) is undefined in plotIntersection.");
        return;
    }

    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color; // Use the provided color
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
