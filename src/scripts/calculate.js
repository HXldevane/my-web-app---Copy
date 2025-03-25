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
    const spotToExit = outlines.find((outline) => outline.type === "spot-to-exit");
    const exitToExit = outlines.find((outline) => outline.type === "exit-to-exit");

    if (!cuspToSpot || !spotToExit || !exitToExit) {
        console.error("Required outlines are missing for intersection calculation.");
        return [];
    }

    const intersections = [];

    // Helper function to check intersections between two outline sides
    function checkOutlineIntersections(side1, side2) {
        for (let i = 0; i < side1.length - 1; i++) {
            for (let j = 0; j < side2.length - 1; j++) {
                const line1 = { start: side1[i], end: side1[i + 1] };
                const line2 = { start: side2[j], end: side2[j + 1] };

                const intersection = getLineIntersection(line1, line2);
                if (intersection) {
                    // Draw intersection point
                    ctx.beginPath();
                    ctx.arc(intersection.x, intersection.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = "green";
                    ctx.fill();
                    ctx.closePath();

                    intersections.push(intersection);
                }
            }
        }
    }

    // Check intersections between cusp-to-spot and spot-to-exit
    checkOutlineIntersections(cuspToSpot.left, spotToExit.left);
    checkOutlineIntersections(cuspToSpot.right, spotToExit.right);

    // Check intersections between cusp-to-spot and exit-to-exit
    checkOutlineIntersections(cuspToSpot.left, exitToExit.left);
    checkOutlineIntersections(cuspToSpot.right, exitToExit.right);

    if (intersections.length === 0) {
        console.log("No intersections detected between the specified outlines.");
    }

    return intersections;
}

// Helper function to calculate the intersection of two line segments
function getLineIntersection(line1, line2) {
    const { start: p1, end: p2 } = line1;
    const { start: q1, end: q2 } = line2;

    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = q2.y - q1.y;
    const b2 = q1.x - q2.x;
    const c2 = a2 * q1.x + b2 * q1.y;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant === 0) {
        return null; // Lines are parallel
    }

    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;

    // Check if the intersection point is within both line segments
    if (
        Math.min(p1.x, p2.x) <= x &&
        x <= Math.max(p1.x, p2.x) &&
        Math.min(p1.y, p2.y) <= y &&
        y <= Math.max(p1.y, p2.y) &&
        Math.min(q1.x, q2.x) <= x &&
        x <= Math.max(q1.x, q2.x) &&
        Math.min(q1.y, q2.y) <= y &&
        y <= Math.max(q1.y, q2.y)
    ) {
        return { x, y };
    }

    return null;
}

export { calculateLineDistances, calculateLineAngles, findIntersections };