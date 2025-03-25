import { Bezier } from "bezier-js";

function generateRandomRoad(canvasHeight) {
    const angle = Math.random() * 60 - 30; // Random angle between -30 and 30 degrees
    const x = 100; // Fixed x position
    const y = Math.random() * (canvasHeight - 600) + 300; // Between 150px from top and bottom

    return { x, y, angle };
}

function generateRoadPoints(road) {
    const roadWidth = 60;
    const roadHeight = 100;
    const roadQuarterHeight = roadHeight / 4;
    const roadCenterX = road.x;

    const roadEntry = {
        name: "Road Entry",
        x: roadCenterX,
        y: road.y - roadHeight / 2 + roadQuarterHeight,
        heading: road.angle * (Math.PI / 180),
    };

    const roadExit = {
        name: "Road Exit",
        x: roadCenterX,
        y: road.y + roadHeight / 2 - roadQuarterHeight,
        heading: (road.angle + 180) * (Math.PI / 180),
    };

    return { roadEntry, roadExit };
}

function generateAllRoadPoints(canvasHeight) {
    const road = generateRandomRoad(canvasHeight);
    const { roadEntry, roadExit } = generateRoadPoints(road);
    return { road, roadEntry, roadExit };
}

function drawRoad(ctx, road) {
    const width = 60; // Width of the road
    const height = 100; // Height of the road
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx.save();
    ctx.translate(road.x, road.y);
    ctx.rotate((road.angle * Math.PI) / 180); // Convert angle to radians
    ctx.fillStyle = "gray";
    ctx.fillRect(-halfWidth, -halfHeight, width, height);
    ctx.restore();
}

function generateLoadShape(road, bottomRightCornerRoad, spot, canvasWidth, canvasHeight, difficulty) {
    // Calculate topRightCornerRoad considering the road's rotation angle
    const angle = road.angle * (Math.PI / 180); // Convert angle to radians
    const halfWidth = 30; // xwHalf of the road width (60 / 2)
    const halfHeight = 50; // Half of the road height (100 / 2)

    const topRightCornerRoad = {
        x: road.x + halfWidth * Math.cos(angle) - halfHeight * Math.sin(angle),
        y: road.y + halfWidth * Math.sin(angle) + halfHeight * Math.cos(angle),
    };

  

    let aboveSpot; // P2
    if (difficulty === "easy") {
        aboveSpot = {
            y: Math.random() * (spot.y - 200),
            x: spot.x + Math.random() * 10, // Random offset for x
        };
    } else if (difficulty === "medium") {
        aboveSpot = {
            y: spot.y / 1.3,
            x: spot.x + Math.random() * 30, // Random offset for x
        };
    } else if (difficulty === "hard") {
        aboveSpot = {
            y: spot.y / 1.3,
            x: spot.x + Math.random() * 30, // Random offset for x
        };
    }
    
    let belowSpot; // P3
    if (difficulty === "easy") {
        belowSpot = {
            y: canvasHeight - (Math.random() * (canvasHeight -spot.y - 100)),
            x: spot.x + Math.random() * 30,
        };
    } else if (difficulty === "medium") {
        belowSpot = {
            y: (spot.y) / 1.7,
            x: (canvasWidth - spot.x) + spot.x + Math.random() * 40,
        };
    } else if (difficulty === "hard") {
        belowSpot = {
            y: ((canvasHeight - spot.y) + spot.y) / 2,
            x: (canvasWidth - spot.x) + spot.x + Math.random() * 50,
        };
    }

    let aboveRoad; // P2
    if (difficulty === "easy") {
        aboveRoad = {
            y: Math.random() * (canvasHeight / 4),
            x: topRightCornerRoad.x + Math.random() * 10, // Random offset for x
        };
    } else if (difficulty === "medium") {
        aboveRoad = {
            y: spot.y / 1.3,
            x: spot.x + Math.random() * 30, // Random offset for x
        };
    } else if (difficulty === "hard") {
        aboveRoad = {
            y: spot.y / 1.3,
            x: spot.x + Math.random() * 30, // Random offset for x
        };
    }
    
    let belowRoad; // P3
    if (difficulty === "easy") {
        belowRoad = {
            y: canvasHeight - (Math.random() * (canvasHeight / 4)),
            x: bottomRightCornerRoad.x + Math.random() * 30,
        };
    } else if (difficulty === "medium") {
        belowRoad = {
            y: (spot.y) / 1.7,
            x: (canvasWidth - spot.x) + spot.x + Math.random() * 40,
        };
    } else if (difficulty === "hard") {
        belowRoad = {
            y: ((canvasHeight - spot.y) + spot.y) / 2,
            x: (canvasWidth - spot.x) + spot.x + Math.random() * 50,
        };
    }

    // generate a random numbe rbetwene 1 and 3
    // generate x number of points, random * 200 from the top in y, kind of evenly, but also randomly placed in y depending on number of points
    // save them as an array to enter into points later.
    // Let me have easy, med and hard for x and y positions. 

    // DO THIS AGAIN FOR bottom interp with different random numbers. 


    // Create an array of points for the Bezier curve

    const beforeTopInterp = [
        { x: topRightCornerRoad.x, y: topRightCornerRoad.y },
        { x: aboveRoad.x, y: aboveRoad.y },
        
    ];


    const MidInterp = [
        { x: aboveSpot.x, y: aboveSpot.y },
        { x: belowSpot.x, y: belowSpot.y },
        
    ];

    const afterBottomInterp = [
        { x: belowRoad.x, y: belowRoad.y },
        { x: topRightCornerRoad.x, y: topRightCornerRoad.y },
        
    ];


    const points = [
        { x: bottomRightCornerRoad.x, y: bottomRightCornerRoad.y },
        { x: aboveRoad.x, y: aboveRoad.y },
        { x: aboveSpot.x, y: aboveSpot.y },
        { x: belowSpot.x, y: belowSpot.y },
        { x: belowRoad.x, y: belowRoad.y },
        { x: topRightCornerRoad.x, y: topRightCornerRoad.y },
        
    ];
   
    // return before top + top interp + mid interp + bottom interp + after bottom
    return points;
}

export { generateRandomRoad, generateRoadPoints, generateAllRoadPoints, drawRoad, generateLoadShape };