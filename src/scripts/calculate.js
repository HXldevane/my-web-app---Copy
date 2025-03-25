import { Bezier } from "bezier-js"; // Ensure Bezier is imported

function calculateLineDistances(lines) {
    return lines.map((line) => {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        return Math.sqrt(dx * dx + dy * dy);
    });
}

function calculateLineAngles(lines) {
    return lines.map((line) => {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        return (Math.atan2(dy, dx) * 180) / Math.PI; // Convert to degrees
    });
}

function findIntersections(outlines, ctx) {
    const cuspToSpot = outlines.find((outline) => outline.type === "cusp-to-spot-opposite");

    if (!cuspToSpot) {
        console.error("Required outline for 'cusp-to-spot-opposite' is missing.");
        return;
    }

    // Helper function to draw a shape from an outline
    function drawShape(ctx, outline, fillStyle) {
        ctx.beginPath();
        ctx.moveTo(outline[0].x, outline[0].y);
        outline.forEach((point) => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    // Highlight the "cusp-to-spot-opposite" shape
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; // Semi-transparent yellow
    drawShape(ctx, cuspToSpot.left.concat(cuspToSpot.right.reverse()), ctx.fillStyle);
    ctx.restore();
}

export { calculateLineDistances, calculateLineAngles, findIntersections };