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

export { calculateLineDistances, calculateLineAngles };