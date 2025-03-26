function checkPathIntersections(outlines, loadShapeBoundary, ctx) {
    let hasIntersections = false; // Track if any intersections are found

    // Convert load shape boundary points into line segments
    const loadShapeLines = [];
    for (let i = 0; i < loadShapeBoundary.length - 1; i++) {
        const start = loadShapeBoundary[i];
        const end = loadShapeBoundary[i + 1];
        loadShapeLines.push({ p1: start, p2: end });
    }

    // Check each outline's left and right offset curves against the load shape boundary
    outlines.forEach((outline) => {
        const { left = [], right = [] } = outline;

        // Check left offset curves
        left.forEach((point, index) => {
            if (index < left.length - 1) {
                const segment = { p1: point, p2: left[index + 1] };
                if (checkSegmentIntersections(segment, loadShapeLines, ctx)) {
                    hasIntersections = true;
                }
            }
        });

        // Check right offset curves
        right.forEach((point, index) => {
            if (index < right.length - 1) {
                const segment = { p1: point, p2: right[index + 1] };
                if (checkSegmentIntersections(segment, loadShapeLines, ctx)) {
                    hasIntersections = true;
                }
            }
        });
    });

    return hasIntersections; // Return true if any intersections are found
}

// Helper function to check intersections for a single segment
function checkSegmentIntersections(segment, loadShapeLines, ctx) {
    let hasIntersection = false;

    loadShapeLines.forEach((line) => {
        const intersection = getLineIntersection(segment.p1, segment.p2, line.p1, line.p2);
        if (intersection) {
            hasIntersection = true;
            plotIntersection(ctx, intersection);
        }
    });

    return hasIntersection;
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

// Helper function to plot a dot at the intersection point
function plotIntersection(ctx, point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "blue"; // Red dot for intersections
    ctx.fill();
    ctx.closePath();
}

export { checkPathIntersections };
