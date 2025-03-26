import { Bezier } from "bezier-js";

function generateLines(points) {
    const lines = [];
    for (let i = 0; i < points.length - 1; i++) {
        lines.push({ start: points[i], end: points[i + 1] });
    }
    return lines;
}

function drawLines(ctx, lines) {
    lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    });
}

function createSpline(start, end, minRadius, segmentType) {
    const controlDistance = Math.max(minRadius, 100); // Ensure a minimum radius of 50px

    let startControlX, startControlY, endControlX, endControlY;

    if (segmentType === "entry-to-queue" || segmentType === "queue-to-cusp" || segmentType === "spot-to-exit" || segmentType === "exit-to-exit") {
        startControlX = start.x + controlDistance * Math.cos(start.heading);
        startControlY = start.y + controlDistance * Math.sin(start.heading);
        endControlX = end.x - controlDistance * Math.cos(end.heading);
        endControlY = end.y - controlDistance * Math.sin(end.heading);
    } else if (segmentType === "cusp-to-spot-opposite") {
        startControlX = start.x - controlDistance * Math.cos(start.heading);
        startControlY = start.y - controlDistance * Math.sin(start.heading);
        endControlX = end.x + controlDistance * Math.cos(end.heading);
        endControlY = end.y + controlDistance * Math.sin(end.heading);
    }

    let curve = new Bezier(start.x, start.y, startControlX, startControlY, endControlX, endControlY, end.x, end.y);

    // Enforce minimum turning radius
    curve = enforceMinimumRadius(curve, minRadius);

    return curve;
}

function enforceMinimumRadius(curve, minRadius) {
    const steps = 4; // Number of steps to sample the curve
    const controlPoints = curve.points;

    for (let t = 0; t <= 1; t += 1 / steps) {
        const radius = calculateRadiusOfCurvature(curve, t);
        if (radius < minRadius) {
            console.warn(`Radius of curvature (${radius}px) is below the minimum (${minRadius}px). Adjusting control points.`);

            // Adjust control points to increase the radius of curvature
            adjustControlPointsForRadius(curve, t, minRadius);
        }
    }

    return curve;
}

function adjustControlPointsForRadius(curve, t, minRadius) {
    const controlPoints = curve.points;

    // Calculate the direction vectors for control point adjustments
    const startToControl1 = {
        x: controlPoints[1].x - controlPoints[0].x,
        y: controlPoints[1].y - controlPoints[0].y,
    };
    const endToControl2 = {
        x: controlPoints[2].x - controlPoints[3].x,
        y: controlPoints[2].y - controlPoints[3].y,
    };

    // Normalize the direction vectors
    const startToControl1Length = Math.sqrt(startToControl1.x ** 2 + startToControl1.y ** 2);
    const endToControl2Length = Math.sqrt(endToControl2.x ** 2 + endToControl2.y ** 2);

    const normalizedStartToControl1 = {
        x: startToControl1.x / startToControl1Length,
        y: startToControl1.y / startToControl1Length,
    };
    const normalizedEndToControl2 = {
        x: endToControl2.x / endToControl2Length,
        y: endToControl2.y / endToControl2Length,
    };

    // Scale the control points outward to increase the radius of curvature
    const adjustmentFactor = minRadius / calculateRadiusOfCurvature(curve, t);

    controlPoints[1].x += normalizedStartToControl1.x * adjustmentFactor;
    controlPoints[1].y += normalizedStartToControl1.y * adjustmentFactor;

    controlPoints[2].x += normalizedEndToControl2.x * adjustmentFactor;
    controlPoints[2].y += normalizedEndToControl2.y * adjustmentFactor;

    // Update the curve with the adjusted control points
    curve = new Bezier(...controlPoints);
}

function calculateRadiusOfCurvature(curve, t) {
    const d1 = curve.derivative(t); // First derivative
    const d2 = curve.derivative(t, 2); // Second derivative

    const numerator = Math.pow(d1.x ** 2 + d1.y ** 2, 1.5);
    const denominator = Math.abs(d1.x * d2.y - d1.y * d2.x);

    if (denominator === 0) return Infinity; // Straight line
    return numerator / denominator;
}

function adjustControlPoints(curve, t, minRadius) {
    // Adjust control points to increase the radius of curvature
    const controlPoints = curve.points;

    // Example adjustment logic: scale control points outward
    const scaleFactor = minRadius / calculateRadiusOfCurvature(curve, t);
    controlPoints[1].x *= scaleFactor;
    controlPoints[1].y *= scaleFactor;
    controlPoints[2].x *= scaleFactor;
    controlPoints[2].y *= scaleFactor;

    curve.update(); // Update the curve with new control points
}

function drawCurve(ctx, curve) {
    ctx.beginPath();
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    for (let t = 0; t <= 1; t += 0.01) {
        const point = curve.get(t);
        ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = "gray"; // Light blue color
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    ctx.closePath();
}


function drawOffsetCurve(ctx, curve) {
    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    for (let t = 0; t <= 1; t += 0.01) {
        const point = curve.get(t);
        ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = "gray"; // Light blue color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

function createCuspToSpotCurve(ctx, cusp, spot, minRadius) {
    // Offset the start and end points by 100px in the local y-direction
    const cuspOffset = {
        x: cusp.x + 100 * Math.cos(cusp.heading + Math.PI / 2),
        y: cusp.y + 100 * Math.sin(cusp.heading + Math.PI / 2),
    };

    const spotOffset = {
        x: spot.x + 100 * Math.cos(spot.heading + Math.PI / 2),
        y: spot.y + 100 * Math.sin(spot.heading + Math.PI / 2),
    };

    // Create the spline between the offset points
    const curve = createSpline(cuspOffset, spotOffset, minRadius, "cusp-to-spot");

    // Plot the curve with a distinct style
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([]); // Solid line
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    for (let t = 0; t <= 1; t += 0.01) {
        const point = curve.get(t);
        ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = "red"; // Red color for high visibility
    ctx.lineWidth = 4; // Thicker line for emphasis
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

    return curve;
}

function drawSplines(ctx, points, minRadius, showOffsets = false) {
    const segments = [
        { start: points[0], end: points[1], type: "entry-to-queue" },
        { start: points[1], end: points[2], type: "queue-to-cusp" },
        { start: points[2], end: points[3], type: "cusp-to-spot-opposite" },
        { start: points[3], end: points[4], type: "spot-to-exit" },
        { start: points[4], end: points[5], type: "exit-to-exit" },
    ];

    const curves = []; // Array to store the created curves
    const outlines = []; // Array to store the left and right outlines

    segments.forEach((segment) => {
        if (segment.start.x !== null && segment.end.x !== null) {
            const curve = createSpline(segment.start, segment.end, minRadius, segment.type);
            curves.push({ type: segment.type, curve }); // Save the curve with its type

            // Always draw the dashed, light blue curve
            drawCurve(ctx, curve);

            // Generate offset curves using bezier-js's .offset(d)
            const leftOffsetCurves = curve.offset(15); // Offset 15px to the left
            const rightOffsetCurves = curve.offset(-15); // Offset 15px to the right

            // Store the offset curves in outlines
            outlines.push({ type: segment.type, left: leftOffsetCurves, right: rightOffsetCurves });

            if (showOffsets) {
                // Draw the left offset curves
                ctx.save();
                ctx.strokeStyle = "green"; // Green for left offset
                ctx.lineWidth = 2;
                leftOffsetCurves.forEach((offsetCurve) => {
                    drawOffsetCurve(ctx, offsetCurve);
                });
                ctx.restore();

                // Draw the right offset curves
                ctx.save();
                ctx.strokeStyle = "orange"; // Orange for right offset
                ctx.lineWidth = 2;
                rightOffsetCurves.forEach((offsetCurve) => {
                    drawOffsetCurve(ctx, offsetCurve);
                });
                ctx.restore();
            }
        }
    });

    return { curves, outlines }; // Return curves and outlines
}

export { drawSplines, createCuspToSpotCurve };