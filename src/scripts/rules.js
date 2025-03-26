import { Bezier } from "bezier-js";

function checkPathIntersections(outlines, loadShapeBoundary, ctx) {
    // Log the loadShapeBoundary points for debugging
    console.log("loadShapeBoundary points:", loadShapeBoundary);

    // Convert load shape boundary points into line segments
    const loadShapeLines = [];
    for (let i = 0; i < loadShapeBoundary.length - 1; i++) {
        const start = loadShapeBoundary[i];
        const end = loadShapeBoundary[i + 1];
        loadShapeLines.push({ p1: start, p2: end }); // Use p1 and p2 format
    }

    // Log the generated loadShapeLines for debugging
    console.log("Generated loadShapeLines:", loadShapeLines);

    // Check each outline's left and right offset curves against the load shape boundary
    outlines.forEach((outline) => {
        const { left = [], right = [] } = outline; // Ensure left and right are arrays

        // Check left offset curves
        left.forEach((leftCurve) => {
            if (Array.isArray(leftCurve)) {
                leftCurve.forEach((subCurve) => checkCurveIntersections(subCurve, loadShapeLines, ctx, "left"));
            } else {
                checkCurveIntersections(leftCurve, loadShapeLines, ctx, "left");
            }
        });

        // Check right offset curves
        right.forEach((rightCurve) => {
            if (Array.isArray(rightCurve)) {
                rightCurve.forEach((subCurve) => checkCurveIntersections(subCurve, loadShapeLines, ctx, "right"));
            } else {
                checkCurveIntersections(rightCurve, loadShapeLines, ctx, "right");
            }
        });
    });
}

// Helper function to check intersections for a single curve
function checkCurveIntersections(curve, loadShapeLines, ctx, side) {
    if (!(curve instanceof Bezier)) {
        console.error(`Invalid Bezier curve in ${side} offset:`, curve);
        return;
    }

    loadShapeLines.forEach((line) => {
        console.log(`Checking intersection with line on ${side} offset:`, line); // Debugging log
        const intersections = curve.intersects(line); // Use line in p1, p2 format
        if (intersections.length > 0) {
            console.log(`Intersection found on ${side} offset:`, intersections);
            intersections.forEach((t) => {
                const point = curve.get(t);
                plotIntersection(ctx, point);
            });
        }
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
