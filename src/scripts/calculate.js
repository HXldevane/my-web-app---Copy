import { Bezier } from "bezier-js";

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

function checkIntersections(splineSegments, ctx) {
    function samplePoints(spline, numSamples = 100) {
        const points = [];
        for (let t = 0; t <= 1; t += 1 / numSamples) {
            points.push({ t, ...spline.get(t) }); // Include t value for interpolation
        }
        return points;
    }

    function doLineSegmentsIntersect(p1, p2, p3, p4) {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (det === 0) return null; // Parallel lines

        const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
        const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

        if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
            return {
                x: p1.x + lambda * (p2.x - p1.x),
                y: p1.y + lambda * (p2.y - p1.y),
            };
        }
        return null;
    }

    function refineIntersection(spline1, spline2, t1Start, t1End, t2Start, t2End, iterations = 10) {
        let t1Mid, t2Mid;
        for (let i = 0; i < iterations; i++) {
            t1Mid = (t1Start + t1End) / 2;
            t2Mid = (t2Start + t2End) / 2;

            const point1 = spline1.get(t1Mid);
            const point2 = spline2.get(t2Mid);

            const distance = Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);

            if (distance < 0.1) break; // Stop refining if the points are close enough

            if (point1.x < point2.x || point1.y < point2.y) {
                t1Start = t1Mid;
                t2Start = t2Mid;
            } else {
                t1End = t1Mid;
                t2End = t2Mid;
            }
        }

        const refinedPoint1 = spline1.get(t1Mid);
        const refinedPoint2 = spline2.get(t2Mid);

        return {
            x: (refinedPoint1.x + refinedPoint2.x) / 2,
            y: (refinedPoint1.y + refinedPoint2.y) / 2,
        };
    }

    function findIntersections(points1, points2, spline1, spline2) {
        const intersections = [];
        for (let i = 0; i < points1.length - 1; i++) {
            for (let j = 0; j < points2.length - 1; j++) {
                const intersection = doLineSegmentsIntersect(
                    points1[i],
                    points1[i + 1],
                    points2[j],
                    points2[j + 1]
                );
                if (intersection) {
                    // Refine intersection point using binary search
                    const refinedPoint = refineIntersection(
                        spline1,
                        spline2,
                        points1[i].t,
                        points1[i + 1].t,
                        points2[j].t,
                        points2[j + 1].t
                    );
                    intersections.push(refinedPoint);
                }
            }
        }
        return intersections;
    }

    let totalIntersections = 0;
    const intersectionPoints = [];

    for (let i = 0; i < splineSegments.length; i++) {
        const points1 = samplePoints(splineSegments[i]);
        for (let j = i + 1; j < splineSegments.length; j++) {
            const points2 = samplePoints(splineSegments[j]);
            const intersections = findIntersections(points1, points2, splineSegments[i], splineSegments[j]);
            totalIntersections += intersections.length;
            intersectionPoints.push(...intersections);
        }
    }

    console.log(`Number of intersections between splines: ${totalIntersections}`);

    // Draw red dots at intersection points
    intersectionPoints.forEach((point) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); // Small red dot
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    });
}

export { calculateLineDistances, calculateLineAngles, checkIntersections };