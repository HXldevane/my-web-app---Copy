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
    const controlDistance = Math.max(minRadius, 100); // Ensure minimum radius

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

    return new Bezier(start.x, start.y, startControlX, startControlY, endControlX, endControlY, end.x, end.y);
}

function drawCurve(ctx, curve) {
    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    for (let t = 0; t <= 1; t += 0.01) {
        const point = curve.get(t);
        ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawSplines(ctx, points, minRadius) {
    const segments = [
        { start: points[0], end: points[1], type: "entry-to-queue" },
        { start: points[1], end: points[2], type: "queue-to-cusp" },
        { start: points[2], end: points[3], type: "cusp-to-spot-opposite" },
        { start: points[3], end: points[4], type: "spot-to-exit" },
        { start: points[4], end: points[5], type: "exit-to-exit" },
    ];

    // Do not clear the canvas here to preserve existing drawings
    segments.forEach((segment) => {
        if (segment.start.x !== null && segment.end.x !== null) {
            console.log(`Processing segment: ${segment.type}`);
            const curve = createSpline(segment.start, segment.end, minRadius, segment.type);
            drawCurve(ctx, curve);
        }
    });
}

export { drawSplines };