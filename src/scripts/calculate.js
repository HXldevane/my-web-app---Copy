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

function findIntersections(curvesObj, ctx, threshold = 0.1) {
    const { curves } = curvesObj; // Extract curves array
    const entryCurves = curves.filter((curve) =>
        ["entry-to-queue", "queue-to-cusp", "cusp-to-spot-opposite"].includes(curve.type)
    );
    const exitCurves = curves.filter((curve) =>
        ["spot-to-exit", "exit-to-exit"].includes(curve.type)
    );

    const intersections = [];

    entryCurves.forEach((entryCurve) => {
        exitCurves.forEach((exitCurve) => {
            const curveIntersections = entryCurve.curve.intersects(exitCurve.curve, threshold);
            curveIntersections.forEach((intersection) => {
                const [t1, t2] = intersection.split("/").map(parseFloat);
                const point1 = entryCurve.curve.get(t1);
                const point2 = exitCurve.curve.get(t2);

                // Draw intersection point
                ctx.beginPath();
                ctx.arc(point1.x, point1.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = "green";
                ctx.fill();
                ctx.closePath();

                intersections.push({
                    entryType: entryCurve.type,
                    exitType: exitCurve.type,
                    t1,
                    t2,
                    point: { x: point1.x, y: point1.y },
                });

                console.log(
                    `Intersection at ${entryCurve.type} t=${t1}, ${exitCurve.type} t=${t2}: (${point1.x.toFixed(2)}, ${point1.y.toFixed(2)})`
                );
            });
        });
    });

    if (intersections.length === 0) {
        console.log("No intersections detected between entry and exit curves.");
    }

    return intersections;
}

export { calculateLineDistances, calculateLineAngles, findIntersections };