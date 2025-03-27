
let kickAnimationId = null;
let callAnimationId = null;
let callAHTTriggered = false;

// Speed and acceleration factors
const speedFactor = 2; // Factor to scale speeds and accelerations
const loadedAcceleration = (2 / 3.6) * speedFactor; // m/s² -> kph scaled
const loadedDeceleration = (2 / 3.6) * speedFactor; // m/s² -> kph scaled
const maxForwardSpeed = (30 / 3.6) * speedFactor; // m/s -> kph scaled
const reverseAcceleration = (2 / 3.6) * speedFactor; // m/s² -> kph scaled
const reverseDeceleration = (2 / 3.6) * speedFactor; // m/s² -> kph scaled
const maxReverseSpeed = (10 / 3.6) * speedFactor; // m/s -> kph scaled

function calculateTimeForDistance(distance, acceleration, maxSpeed) {
    const distanceInMeters = distance * 0.2; // Convert pixels to meters (1 pixel = 20 cm)

    let accelTime = 0;
    let accelDistance = 0;
    if (acceleration > 0) {
        accelTime = maxSpeed / acceleration; // Time to reach max speed
        accelDistance = 0.5 * acceleration * accelTime ** 2; // Distance covered during acceleration
    }

    if (distanceInMeters <= accelDistance) {
        // If the distance is too short to reach max speed
        return Math.sqrt(2 * distanceInMeters / acceleration); // Time for acceleration only
    }

    const cruiseDistance = distanceInMeters - accelDistance; // Distance covered at max speed
    const cruiseTime = cruiseDistance > 0 ? cruiseDistance / maxSpeed : 0; // Time spent cruising

    return accelTime + cruiseTime; // Total time
}

function kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, drawCanvas, onComplete, cuspWaitTime) {
    const truckImage = new Image();
    truckImage.src = myImageUrl;

    const totalLength = spotToExitCurve.length() + exitToExitCurve.length(); // Total length of the path
    const totalDuration = calculateTimeForDistance(totalLength, loadedAcceleration, maxForwardSpeed) * 1000; // Total time in milliseconds
    const startTime = performance.now();

    // Start the `callAHT` function independently
    setTimeout(() => {
        callAHT(ctx, cuspToSpotCurve, drawCanvas, () => {
            console.log("Call AHT completed.");
        });
    }, cuspWaitTime * 1000 / speedFactor); // Convert seconds to milliseconds and scale by speedFactor

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

function callAHT(ctx, cuspToSpotCurve, drawCanvas, onComplete) {
    const truckImage = new Image();
    truckImage.src = myImageUrl;

    const totalLength = cuspToSpotCurve.length(); // Total length of the path
    const totalDuration = calculateTimeForDistance(totalLength, reverseAcceleration, maxReverseSpeed) * 1000; // Total time in milliseconds
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / totalDuration, 1); // Normalize time to [0, 1]

        const position = cuspToSpotCurve.get(t);
        const tangent = cuspToSpotCurve.derivative(t);
        const angle = Math.atan2(tangent.y, tangent.x) + Math.PI / 2; // Rotate by 90 degrees

        // Clear the previous truck position
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Redraw the canvas elements (e.g., road, points, splines)
        drawCanvas();

        // Draw the truck at the new position with rotation
        ctx.save();
        ctx.translate(position.x, position.y); // Move to the truck's position
        ctx.rotate(angle); // Rotate the truck to align with the path
        ctx.drawImage(truckImage, -12.5, -10, 25, 40); // Draw the truck image centered
        ctx.restore();

        if (t < 1) {
            callAnimationId = requestAnimationFrame(animate);
        } else if (onComplete) {
            onComplete();
        }
    }

    truckImage.onload = () => {
        console.log("Truck image loaded successfully for callAHT.");
        callAnimationId = requestAnimationFrame(animate);
    };

    truckImage.onerror = () => {
        console.error("Failed to load truck image for callAHT. Ensure 'truck.png' is in the correct path.");
    };
}

function scheduler(ctx, cuspToSpotCurve, spotToExitCurve, exitToExitCurve, cuspToSpotOutline) {
    kickAHT(ctx, spotToExitCurve, exitToExitCurve, cuspToSpotCurve, cuspToSpotOutline, () => {
        console.log("Kick AHT completed.");
    });
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
