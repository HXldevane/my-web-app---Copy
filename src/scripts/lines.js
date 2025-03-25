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
    const steps = 3000; // Number of steps to sample the curve
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
    ctx.strokeStyle = "blue"; // Light blue color
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    ctx.closePath();
}

function drawCurveOutline(ctx, curve, width) {
    const outlinePointsLeft = [];
    const outlinePointsRight = [];

    for (let t = 0; t <= 1; t += 0.01) {
        const point = curve.get(t);
        const normal = curve.normal(t); // Get the normal vector at t
        const offsetX = normal.x * width;
        const offsetY = normal.y * width;

        // Calculate left and right outline points
        outlinePointsLeft.push({ x: point.x - offsetX, y: point.y - offsetY });
        outlinePointsRight.push({ x: point.x + offsetX, y: point.y + offsetY });
    }

    // Draw the left outline
    ctx.beginPath();
    ctx.moveTo(outlinePointsLeft[0].x, outlinePointsLeft[0].y);
    outlinePointsLeft.forEach((point) => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Semi-transparent blue
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    // Draw the right outline
    ctx.beginPath();
    ctx.moveTo(outlinePointsRight[0].x, outlinePointsRight[0].y);
    outlinePointsRight.forEach((point) => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Semi-transparent blue
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

function drawSplines(ctx, points, minRadius, drawOutlines = false) {
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

            // Generate and save outline lines
            const offset = 20; // Offset distance for the outline lines
            const leftOutline = [];
            const rightOutline = [];

            for (let t = 0; t <= 1; t += 0.01) {
                const point = curve.get(t);
                const normal = curve.normal(t); // Get the normal vector at t
                const offsetX = normal.x * offset;
                const offsetY = normal.y * offset;

                // Calculate left and right outline points
                leftOutline.push({ x: point.x - offsetX, y: point.y - offsetY });
                rightOutline.push({ x: point.x + offsetX, y: point.y + offsetY });
            }

            outlines.push({ type: segment.type, left: leftOutline, right: rightOutline });

            // Conditionally draw outline lines
            if (drawOutlines) {
                // Draw the left outline
                ctx.beginPath();
                ctx.moveTo(leftOutline[0].x, leftOutline[0].y);
                leftOutline.forEach((point) => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Semi-transparent blue
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();

                // Draw the right outline
                ctx.beginPath();
                ctx.moveTo(rightOutline[0].x, rightOutline[0].y);
                rightOutline.forEach((point) => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Semi-transparent blue
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
            }
        }
    });

    return { curves, outlines }; // Return both curves and outlines
}

export { drawSplines };