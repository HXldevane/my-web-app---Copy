import { Dubins } from 'dubins-js';

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

function offsetPoint(point, offsetDistance) {
    const { x, y, psi } = point;
    const normalAngle = psi + Math.PI / 2;

    return {
        x: x + offsetDistance * Math.cos(normalAngle),
        y: y + offsetDistance * Math.sin(normalAngle),
        psi: psi,
    };
}

function drawSplines(ctx, points, minRadius, showOffsets = false) {
    const segments = [
        { start: points[0], end: points[1], type: "entry-to-queue" },
        { start: points[1], end: points[2], type: "queue-to-cusp" },
        { start: points[2], end: points[3], type: "cusp-to-spot-opposite" },
        { start: points[3], end: points[4], type: "spot-to-exit" },
        { start: points[4], end: points[5], type: "exit-to-exit" },
    ];

    const curves = [];
    const outlines = [];

    segments.forEach((segment) => {
        if (segment.start?.x !== null && segment.start?.y !== null && segment.end?.x !== null && segment.end?.y !== null) {
            // Generate the curve
            const shortpath = Dubins.path(
                { x: segment.start.x, y: segment.start.y, psi: segment.start.heading },
                { x: segment.end.x, y: segment.end.y, psi: segment.end.heading },
                minRadius
            );

            const pathPoints = [];
            for (let dist = 0; dist <= shortpath.length; dist += 3) {
                pathPoints.push(shortpath.pointAtLength(dist));
                
            }
            console.log(shortpath.length);
            curves.push({ type: segment.type, path: pathPoints });
        } else {
            console.warn(`Invalid segment: ${segment.type}`, segment);
        }
    });

    segments.forEach((segment) => {
        if (segment.start.x !== null && segment.end.x !== null) {
            const isOpposite = segment.type === "cusp-to-spot-opposite";
            const start = isOpposite ? segment.end : segment.start;
            const end = isOpposite ? segment.start : segment.end;

            // Adjust start and end to avoid tight turns
            const adjustedStart = {
                x: start.x + 10 * Math.cos(start.heading),
                y: start.y + 10 * Math.sin(start.heading),
                psi: start.heading,
            };
            const adjustedEnd = {
                x: end.x - 10 * Math.cos(end.heading),
                y: end.y - 10 * Math.sin(end.heading),
                psi: end.heading,
            };

            const shortpath = Dubins.path(adjustedStart, adjustedEnd, minRadius);
            const totalLength = shortpath.length;

            const pathPoints = [];
            for (let dist = 0; dist <= totalLength; dist += 0.1) {
                const pt = shortpath.pointAtLength(dist);
                pathPoints.push({ x: pt.x, y: pt.y, psi: pt.psi });
                console
            }

            // Ensure exact end point alignment
            pathPoints[pathPoints.length - 1] = {
                x: adjustedEnd.x,
                y: adjustedEnd.y,
                psi: adjustedEnd.psi,
            };

            // Convert to canvas space
            const worldToCanvas = (x, y) => ({ x: x * 1, y: y });

            // Draw the center (gray) path
            ctx.beginPath();
            const startCanvas = worldToCanvas(pathPoints[0].x, pathPoints[0].y);
            ctx.moveTo(startCanvas.x, startCanvas.y);
            pathPoints.forEach(({ x, y }) => {
                const p = worldToCanvas(x, y);
                ctx.lineTo(p.x, p.y);
            });
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            // ✅ Offset using actual heading (psi) at each point
            const leftOffsetPoints = pathPoints.map((point) =>
                offsetPoint(point, 20)
            );
            const rightOffsetPoints = pathPoints.map((point) =>
                offsetPoint(point, -20)
            );

            outlines.push({
                type: segment.type,
                left: leftOffsetPoints,
                right: rightOffsetPoints,
            });

            if (showOffsets) {
                // Left (green)
                ctx.save();
                ctx.strokeStyle = "grey";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(leftOffsetPoints[0].x, leftOffsetPoints[0].y);
                leftOffsetPoints.forEach(({ x, y }) => ctx.lineTo(x, y));
                ctx.stroke();
                ctx.closePath();
                ctx.restore();

                // Right (orange)
                ctx.save();
                ctx.strokeStyle = "grey";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(rightOffsetPoints[0].x, rightOffsetPoints[0].y);
                rightOffsetPoints.forEach(({ x, y }) => ctx.lineTo(x, y));
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            }

            curves.push({ type: segment.type, path: pathPoints });
        }
    });

    return { curves, outlines };
}

export { drawSplines };
