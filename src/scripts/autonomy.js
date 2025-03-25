import { Bezier } from "bezier-js";

let kickAnimationId = null;
let callAnimationId = null;
let callAHTTriggered = false;

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, onComplete) {
    const speed = 30; // Speed in pixels per second
    const totalLength = spotToExitCurve.length(); // Only the spot-to-exit curve is used
    const totalDuration = (totalLength / speed) * 1000; // Total time in milliseconds
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / totalDuration, 1); // Normalize time to [0, 1]
        const easedT = easeInOutQuad(t); // Apply easing for acceleration and deceleration

        // Calculate position on spot-to-exit curve
        const currentPosition = spotToExitCurve.get(easedT);

        // Draw the kicking truck's semi-transparent dot
        drawDot(ctx, currentPosition.x, currentPosition.y, "rgba(255, 0, 0, 0.5)");

        // Check if the truck intercepts the cusp-to-spot outline or gets within 10px
        if (!callAHTTriggered && intersectsOutline(currentPosition, cuspToSpotOutline, 10)) {
            console.log("Truck intercepted the cusp-to-spot outline or got within 10px.");
            callAHT(ctx, cuspToSpotCurve, () => {
                console.log("Call AHT completed.");
            });
        }

        if (t < 1) {
            kickAnimationId = requestAnimationFrame(animate);
        } else if (onComplete) {
            onComplete();
        }
    }

    kickAnimationId = requestAnimationFrame(animate);
}

function intersectsOutline(position, outline, threshold) {
    const { left, right } = outline;

    // Check distance to each line segment in the left and right outlines
    const isCloseToLeft = isCloseToLine(position, left, threshold);
    const isCloseToRight = isCloseToLine(position, right, threshold);

    return isCloseToLeft || isCloseToRight;
}

function isCloseToLine(position, linePoints, threshold) {
    for (let i = 0; i < linePoints.length - 1; i++) {
        const start = linePoints[i];
        const end = linePoints[i + 1];

        // Calculate the distance from the position to the line segment
        const distance = pointToSegmentDistance(position, start, end);
        if (distance <= threshold) {
            return true;
        }
    }
    return false;
}

function pointToSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Start and end are the same point
        const dist = Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
        return dist;
    }

    // Project the point onto the line segment
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    const projection = { x: start.x + t * dx, y: start.y + t * dy };

    // Calculate the distance from the point to the projection
    const dist = Math.sqrt((point.x - projection.x) ** 2 + (point.y - projection.y) ** 2);
    return dist;
}

function callAHT(ctx, cuspToSpotCurve, onComplete) {
    if (callAHTTriggered) return; // Ensure `callAHT` is callable only once
    callAHTTriggered = true;

    console.log("Call AHT triggered."); // Log when `callAHT` is triggered

    const speed = 30; // Speed in pixels per second
    const totalLength = cuspToSpotCurve.length(); // Total length of the curve
    const totalDuration = (totalLength / speed) * 1000; // Total time in milliseconds
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / totalDuration, 1); // Normalize time to [0, 1]
        const easedT = easeInOutQuad(t); // Apply easing for acceleration and deceleration

        // Calculate position on cusp-to-spot curve
        const position = cuspToSpotCurve.get(easedT);

        // Draw the called truck's semi-transparent dot
        drawDot(ctx, position.x, position.y, "rgba(0, 0, 255, 0.5)");

        if (t < 1) {
            callAnimationId = requestAnimationFrame(animate);
        } else if (onComplete) {
            onComplete();
        }
    }

    callAnimationId = requestAnimationFrame(animate);
}

function scheduler(ctx, cuspToSpotCurve, spotToExitCurve, exitToExitCurve, cuspToSpotOutline) {
    kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, () => {
        console.log("Kick AHT completed.");
    });
}

function isOnYellowHighlight(position, polygonPoints) {
    let isInside = false;
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
        const xi = polygonPoints[i].x, yi = polygonPoints[i].y;
        const xj = polygonPoints[j].x, yj = polygonPoints[j].y;

        // Check if the position is inside the polygon using the ray-casting algorithm
        const intersect = ((yi > position.y) !== (yj > position.y)) &&
            (position.x < ((xj - xi) * (position.y - yi)) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }

    if (isInside) {
        console.log(`Truck is on the yellow highlight. Number of polygon points: ${polygonPoints.length}`);
    }

    return isInside;
}

function calcTruckExchange() {
    // Placeholder for truck exchange calculation logic
    console.log("Calculating truck exchange...");
    // Add your logic here
}

function stopAnimations() {
    if (kickAnimationId) {
        cancelAnimationFrame(kickAnimationId);
        kickAnimationId = null;
    }
    if (callAnimationId) {
        cancelAnimationFrame(callAnimationId);
        callAnimationId = null;
    }
    callAHTTriggered = false; // Reset the `callAHT` trigger
}

function drawDot(ctx, x, y, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

export { kickAHT, callAHT, scheduler, calcTruckExchange, stopAnimations };
