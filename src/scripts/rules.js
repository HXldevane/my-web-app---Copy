function checkPathIntersections(outlines, loadShapeBoundary) {
    // Helper function to check if two line segments intersect
    function doLinesIntersect(line1, line2) {
        const { start: a, end: b } = line1;
        const { start: c, end: d } = line2;

        const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (det === 0) return false; // Lines are parallel

        const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
        const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    // Convert load shape boundary points into line segments, excluding the first-to-last segment
    const loadShapeLines = [];
    for (let i = 0; i < loadShapeBoundary.length - 1; i++) {
        const start = loadShapeBoundary[i];
        const end = loadShapeBoundary[i + 1];
        loadShapeLines.push({ start, end });
    }

    // Check each outline line against the load shape boundary
    for (const outline of outlines) {
        const { left, right } = outline;

        // Combine left and right outline points into line segments
        const outlineLines = [];
        for (let i = 0; i < left.length - 1; i++) {
            outlineLines.push({ start: left[i], end: left[i + 1] });
        }
        for (let i = 0; i < right.length - 1; i++) {
            outlineLines.push({ start: right[i], end: right[i + 1] });
        }

        // Check for intersections
        for (const outlineLine of outlineLines) {
            for (const loadShapeLine of loadShapeLines) {
                if (doLinesIntersect(outlineLine, loadShapeLine)) {
                    return "Yes";
                }
            }
        }
    }

    return "No";
}

// Example usage: Define outlines and loadShapeBoundary before calling the function
const outlines = [
    // Define your outlines array here
];
const loadShapeBoundary = [
    // Define your loadShapeBoundary array here
];

// Log the response of checkPathIntersections
const result = checkPathIntersections(outlines, loadShapeBoundary);
console.log(result);

function plotIntersections(ctx, outlines, loadShapeBoundary) {
    // Helper function to check if two line segments intersect and return the intersection point
    function getIntersectionPoint(line1, line2) {
        const { start: a, end: b } = line1;
        const { start: c, end: d } = line2;

        const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (det === 0) return null; // Lines are parallel

        const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
        const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: a.x + t * (b.x - a.x),
                y: a.y + t * (b.y - a.y),
            };
        }
        return null;
    }

    // Convert load shape boundary points into line segments, excluding the first-to-last segment
    const loadShapeLines = [];
    for (let i = 0; i < loadShapeBoundary.length - 1; i++) {
        const start = loadShapeBoundary[i];
        const end = loadShapeBoundary[i + 1];
        loadShapeLines.push({ start, end });
    }

    // Check each outline line against the load shape boundary
    for (const outline of outlines) {
        const { left, right } = outline;

        // Combine left and right outline points into line segments
        const outlineLines = [];
        for (let i = 0; i < left.length - 1; i++) {
            outlineLines.push({ start: left[i], end: left[i + 1] });
        }
        for (let i = 0; i < right.length - 1; i++) {
            outlineLines.push({ start: right[i], end: right[i + 1] });
        }

        // Check for intersections and plot dots
        for (const outlineLine of outlineLines) {
            for (const loadShapeLine of loadShapeLines) {
                const intersection = getIntersectionPoint(outlineLine, loadShapeLine);
                if (intersection) {
                    // Plot a dot at the intersection point
                    ctx.beginPath();
                    ctx.arc(intersection.x, intersection.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = "red"; // Red dot for intersections
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

export { checkPathIntersections, plotIntersections };
