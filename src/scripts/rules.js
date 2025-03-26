function checkPathIntersections(outlines, loadShapeBoundary, ctx) {
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

    // Convert load shape boundary points into line segments
    const loadShapeLines = [];
    for (let i = 0; i < loadShapeBoundary.length - 1; i++) {
        const start = loadShapeBoundary[i];
        const end = loadShapeBoundary[i + 1];
        loadShapeLines.push({ start, end });
    }

    // Check each outline's left and right offset curves against the load shape boundary
    outlines.forEach((outline) => {
        const { left = [], right = [] } = outline; // Ensure left and right are arrays

        // Check left offset curves
        left.forEach((leftCurve) => {
            for (let t = 0; t < 1; t += 0.01) {
                const start = leftCurve.get(t);
                const end = leftCurve.get(t + 0.01);
                const leftLine = { start, end };

                loadShapeLines.forEach((loadShapeLine) => {
                    const intersection = getIntersectionPoint(leftLine, loadShapeLine);
                    if (intersection) {
                        console.log("Intersection found on left offset:", intersection);
                        plotIntersection(ctx, intersection);
                    }
                });
            }
        });

        // Check right offset curves
        right.forEach((rightCurve) => {
            for (let t = 0; t < 1; t += 0.01) {
                const start = rightCurve.get(t);
                const end = rightCurve.get(t + 0.01);
                const rightLine = { start, end };

                loadShapeLines.forEach((loadShapeLine) => {
                    const intersection = getIntersectionPoint(rightLine, loadShapeLine);
                    if (intersection) {
                        console.log("Intersection found on right offset:", intersection);
                        plotIntersection(ctx, intersection);
                    }
                });
            }
        });
    });
}

// Helper function to plot a dot at the intersection point
function plotIntersection(ctx, point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red"; // Red dot for intersections
    ctx.fill();
    ctx.closePath();
}

export { checkPathIntersections };
