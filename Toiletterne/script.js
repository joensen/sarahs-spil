$(document).ready(function() {
    // Game configuration
    const MOVE_SPEED = 2; // pixels per frame
    const COLLISION_DISTANCE = 40; // pixels
    const ARRIVAL_DISTANCE = 30; // pixels to consider "arrived"

    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    let canvasRect;

    // Game state
    let girlPath = [];
    let boyPath = [];
    let isDrawing = false;
    let currentDrawing = null; // 'girl' or 'boy'
    let gameRunning = false;
    let bestScore = localStorage.getItem('toiletterne-best-score') || null;

    // Character positions (will be updated based on canvas size)
    let girlPos = { x: 0, y: 0 };
    let boyPos = { x: 0, y: 0 };
    let girlToiletPos = { x: 0, y: 0 };
    let boyToiletPos = { x: 0, y: 0 };

    // Path progress
    let girlPathIndex = 0;
    let boyPathIndex = 0;
    let girlFinished = false;
    let boyFinished = false;

    // Walls (obstacles)
    let walls = [];
    let gamesPlayed = 0;
    let shouldRegenerateWalls = false;
    const WALL_THICKNESS = 8;

    // Timer
    let startTime = 0;
    let timerInterval = null;

    // Initialize
    function init() {
        resizeCanvas();
        updatePositions();
        drawPaths();
        updateBestScoreDisplay();

        $(window).on('resize', function() {
            resizeCanvas();
            updatePositions();
            drawPaths();
        });
    }

    function resizeCanvas() {
        const gameArea = $('#game-area');
        canvas.width = gameArea.width();
        canvas.height = gameArea.height();
        canvasRect = canvas.getBoundingClientRect();
    }

    function updatePositions() {
        // Get positions from DOM elements
        const $girl = $('#girl');
        const $boy = $('#boy');
        const $girlToilet = $('#girl-toilet');
        const $boyToilet = $('#boy-toilet');

        // Character starting positions (center of character icons)
        girlPos = {
            x: $girl.position().left + $girl.width() / 2,
            y: $girl.position().top + 25
        };
        boyPos = {
            x: $boy.position().left + $boy.width() / 2,
            y: $boy.position().top + 25
        };

        // Toilet positions (center of toilet images)
        girlToiletPos = {
            x: $girlToilet.position().left + $girlToilet.width() / 2,
            y: $girlToilet.position().top + 35
        };
        boyToiletPos = {
            x: $boyToilet.position().left + $boyToilet.width() / 2,
            y: $boyToilet.position().top + 35
        };
    }

    function updateBestScoreDisplay() {
        if (bestScore !== null) {
            $('#best-score').text(bestScore + 's');
        } else {
            $('#best-score').text('-');
        }
    }

    // Generate random walls after first game
    function generateWalls() {
        walls = [];

        if (gamesPlayed === 0) return; // No walls on first game

        // Number of walls increases with games played (max 5)
        const numWalls = Math.min(gamesPlayed, 5);

        // Define safe zones around characters and toilets
        const margin = 80; // Keep walls away from edges and characters
        const safeZones = [
            { x: girlPos.x, y: girlPos.y, radius: 70 },
            { x: boyPos.x, y: boyPos.y, radius: 70 },
            { x: girlToiletPos.x, y: girlToiletPos.y, radius: 70 },
            { x: boyToiletPos.x, y: boyToiletPos.y, radius: 70 }
        ];

        for (let i = 0; i < numWalls; i++) {
            let wall;
            let attempts = 0;

            do {
                // Random wall in the middle area of the canvas
                const isHorizontal = Math.random() > 0.5;
                const length = 60 + Math.random() * 120; // 60-180px length

                if (isHorizontal) {
                    wall = {
                        x: margin + Math.random() * (canvas.width - 2 * margin - length),
                        y: margin + Math.random() * (canvas.height - 2 * margin),
                        width: length,
                        height: WALL_THICKNESS,
                        horizontal: true
                    };
                } else {
                    wall = {
                        x: margin + Math.random() * (canvas.width - 2 * margin),
                        y: margin + Math.random() * (canvas.height - 2 * margin - length),
                        width: WALL_THICKNESS,
                        height: length,
                        horizontal: false
                    };
                }

                attempts++;
            } while (isWallInSafeZone(wall, safeZones) && attempts < 20);

            if (attempts < 20) {
                walls.push(wall);
            }
        }
    }

    function isWallInSafeZone(wall, safeZones) {
        // Check if wall overlaps with any safe zone
        const wallCenterX = wall.x + wall.width / 2;
        const wallCenterY = wall.y + wall.height / 2;

        for (const zone of safeZones) {
            const dist = distanceBetween(
                { x: wallCenterX, y: wallCenterY },
                { x: zone.x, y: zone.y }
            );
            if (dist < zone.radius + Math.max(wall.width, wall.height) / 2) {
                return true;
            }
        }
        return false;
    }

    function isPointInWall(point) {
        for (const wall of walls) {
            if (point.x >= wall.x && point.x <= wall.x + wall.width &&
                point.y >= wall.y && point.y <= wall.y + wall.height) {
                return true;
            }
        }
        return false;
    }

    function drawWalls() {
        ctx.fillStyle = '#795548'; // Brown color for walls
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;

        for (const wall of walls) {
            // Draw wall with rounded corners
            const radius = 4;
            ctx.beginPath();
            ctx.roundRect(wall.x, wall.y, wall.width, wall.height, radius);
            ctx.fill();
            ctx.stroke();

            // Add some texture/detail
            ctx.fillStyle = '#6d4c41';
            if (wall.horizontal) {
                for (let x = wall.x + 10; x < wall.x + wall.width - 10; x += 20) {
                    ctx.fillRect(x, wall.y + 2, 2, wall.height - 4);
                }
            } else {
                for (let y = wall.y + 10; y < wall.y + wall.height - 10; y += 20) {
                    ctx.fillRect(wall.x + 2, y, wall.width - 4, 2);
                }
            }
            ctx.fillStyle = '#795548';
        }
    }

    // Drawing functions
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function distanceBetween(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function isNearGirl(pos) {
        return distanceBetween(pos, girlPos) < 40;
    }

    function isNearBoy(pos) {
        return distanceBetween(pos, boyPos) < 40;
    }

    function isNearGirlToilet(pos) {
        return distanceBetween(pos, girlToiletPos) < 50;
    }

    function isNearBoyToilet(pos) {
        return distanceBetween(pos, boyToiletPos) < 50;
    }

    // Canvas event handlers - click on character to start drawing
    $('#girl').on('mousedown touchstart', function(e) {
        if (gameRunning) return;
        e.preventDefault();
        e.stopPropagation();

        isDrawing = true;
        currentDrawing = 'girl';
        girlPath = [{ ...girlPos }];
        $('#game-container').addClass('drawing-girl');

        drawPaths();
        updateStartButton();
    });

    $('#boy').on('mousedown touchstart', function(e) {
        if (gameRunning) return;
        e.preventDefault();
        e.stopPropagation();

        isDrawing = true;
        currentDrawing = 'boy';
        boyPath = [{ ...boyPos }];
        $('#game-container').addClass('drawing-boy');

        drawPaths();
        updateStartButton();
    });

    $(canvas).on('mousemove', function(e) {
        if (!isDrawing || gameRunning) return;

        const pos = getMousePos(e);

        if (currentDrawing === 'girl') {
            // Only add point if it's far enough from last point (smoother lines)
            if (girlPath.length === 0 || distanceBetween(pos, girlPath[girlPath.length - 1]) > 5) {
                girlPath.push(pos);
            }
        } else if (currentDrawing === 'boy') {
            if (boyPath.length === 0 || distanceBetween(pos, boyPath[boyPath.length - 1]) > 5) {
                boyPath.push(pos);
            }
        }

        drawPaths();
    });

    $(canvas).on('mouseup mouseleave', function(e) {
        if (!isDrawing) return;

        const pos = getMousePos(e);

        // Check if ending near correct toilet
        if (currentDrawing === 'girl' && isNearGirlToilet(pos)) {
            girlPath.push({ ...girlToiletPos });
        } else if (currentDrawing === 'girl') {
            // Invalid path - clear it
            girlPath = [];
        }

        if (currentDrawing === 'boy' && isNearBoyToilet(pos)) {
            boyPath.push({ ...boyToiletPos });
        } else if (currentDrawing === 'boy') {
            // Invalid path - clear it
            boyPath = [];
        }

        isDrawing = false;
        currentDrawing = null;
        $('#game-container').removeClass('drawing-girl drawing-boy');

        drawPaths();
        updateStartButton();
    });

    // Touch support
    $(canvas).on('touchstart', function(e) {
        e.preventDefault();
        const touch = e.originalEvent.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    $(canvas).on('touchmove', function(e) {
        e.preventDefault();
        const touch = e.originalEvent.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    $(canvas).on('touchend', function(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });

    function drawPaths() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw walls first (behind paths)
        drawWalls();

        // Draw girl path (pink)
        if (girlPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#ec407a';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([]);

            ctx.moveTo(girlPath[0].x, girlPath[0].y);
            for (let i = 1; i < girlPath.length; i++) {
                ctx.lineTo(girlPath[i].x, girlPath[i].y);
            }
            ctx.stroke();

            // Draw dotted line for remaining path during game
            if (gameRunning && girlPathIndex < girlPath.length) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(236, 64, 122, 0.3)';
                ctx.setLineDash([5, 5]);
                ctx.moveTo(girlPath[girlPathIndex].x, girlPath[girlPathIndex].y);
                for (let i = girlPathIndex + 1; i < girlPath.length; i++) {
                    ctx.lineTo(girlPath[i].x, girlPath[i].y);
                }
                ctx.stroke();
            }
        }

        // Draw boy path (blue)
        if (boyPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#1e88e5';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([]);

            ctx.moveTo(boyPath[0].x, boyPath[0].y);
            for (let i = 1; i < boyPath.length; i++) {
                ctx.lineTo(boyPath[i].x, boyPath[i].y);
            }
            ctx.stroke();

            // Draw dotted line for remaining path during game
            if (gameRunning && boyPathIndex < boyPath.length) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(30, 136, 229, 0.3)';
                ctx.setLineDash([5, 5]);
                ctx.moveTo(boyPath[boyPathIndex].x, boyPath[boyPathIndex].y);
                for (let i = boyPathIndex + 1; i < boyPath.length; i++) {
                    ctx.lineTo(boyPath[i].x, boyPath[i].y);
                }
                ctx.stroke();
            }
        }

        ctx.setLineDash([]);
    }

    function updateStartButton() {
        const girlPathComplete = girlPath.length > 1 &&
            distanceBetween(girlPath[girlPath.length - 1], girlToiletPos) < 10;
        const boyPathComplete = boyPath.length > 1 &&
            distanceBetween(boyPath[boyPath.length - 1], boyToiletPos) < 10;

        if (girlPathComplete && boyPathComplete) {
            $('#start-btn').prop('disabled', false);
            $('#instruction-text').text('Klar! Tryk Start for at begynde!');
        } else {
            $('#start-btn').prop('disabled', true);
            if (!girlPathComplete && !boyPathComplete) {
                $('#instruction-text').text('Klik på pigen eller drengen og tegn en sti til deres toilet!');
            } else if (!girlPathComplete) {
                $('#instruction-text').text('Klik på pigen og tegn en sti til hendes toilet!');
            } else {
                $('#instruction-text').text('Klik på drengen og tegn en sti til hans toilet!');
            }
        }
    }

    // Button handlers
    $('#start-btn').on('click', function() {
        if (gameRunning) return;
        startGame();
    });

    function startGame() {
        gameRunning = true;
        girlPathIndex = 0;
        boyPathIndex = 0;
        girlFinished = false;
        boyFinished = false;

        // Reset character positions to start
        updateCharacterPosition('girl', girlPath[0]);
        updateCharacterPosition('boy', boyPath[0]);

        $('#start-btn').prop('disabled', true);
        $('#instruction-text').text('De er på vej...');

        // Start timer
        startTime = Date.now();
        $('#timer-display').show();
        $('#timer-value').text('0.0');
        timerInterval = setInterval(updateTimer, 100);

        gameLoop();
    }

    function updateTimer() {
        const elapsed = (Date.now() - startTime) / 1000;
        $('#timer-value').text(elapsed.toFixed(1));
    }

    function updateCharacterPosition(character, pos) {
        const $char = character === 'girl' ? $('#girl') : $('#boy');
        const offset = 25; // Half of character width
        // Clear right positioning and use left for both characters during movement
        $char.css({
            right: 'auto',
            left: pos.x - offset,
            top: pos.y - offset
        });
    }

    function getCurrentPosition(character) {
        const $char = character === 'girl' ? $('#girl') : $('#boy');
        return {
            x: $char.position().left + 25,
            y: $char.position().top + 25
        };
    }

    function gameLoop() {
        if (!gameRunning) return;

        // Move girl along path
        if (!girlFinished && girlPathIndex < girlPath.length - 1) {
            const currentPos = getCurrentPosition('girl');
            const targetPos = girlPath[girlPathIndex + 1];
            const dist = distanceBetween(currentPos, targetPos);

            if (dist < MOVE_SPEED) {
                girlPathIndex++;
                updateCharacterPosition('girl', targetPos);
            } else {
                const ratio = MOVE_SPEED / dist;
                const newPos = {
                    x: currentPos.x + (targetPos.x - currentPos.x) * ratio,
                    y: currentPos.y + (targetPos.y - currentPos.y) * ratio
                };
                updateCharacterPosition('girl', newPos);
            }
        } else if (!girlFinished) {
            girlFinished = true;
            $('#girl').addClass('victory');
        }

        // Move boy along path
        if (!boyFinished && boyPathIndex < boyPath.length - 1) {
            const currentPos = getCurrentPosition('boy');
            const targetPos = boyPath[boyPathIndex + 1];
            const dist = distanceBetween(currentPos, targetPos);

            if (dist < MOVE_SPEED) {
                boyPathIndex++;
                updateCharacterPosition('boy', targetPos);
            } else {
                const ratio = MOVE_SPEED / dist;
                const newPos = {
                    x: currentPos.x + (targetPos.x - currentPos.x) * ratio,
                    y: currentPos.y + (targetPos.y - currentPos.y) * ratio
                };
                updateCharacterPosition('boy', newPos);
            }
        } else if (!boyFinished) {
            boyFinished = true;
            $('#boy').addClass('victory');
        }

        // Check collision between characters
        const girlCurrentPos = getCurrentPosition('girl');
        const boyCurrentPos = getCurrentPosition('boy');
        if (distanceBetween(girlCurrentPos, boyCurrentPos) < COLLISION_DISTANCE) {
            gameOver(false, 'collision');
            return;
        }

        // Check collision with walls
        if (isPointInWall(girlCurrentPos) || isPointInWall(boyCurrentPos)) {
            gameOver(false, 'wall');
            return;
        }

        // Check if both finished
        if (girlFinished && boyFinished) {
            gameOver(true);
            return;
        }

        drawPaths();
        requestAnimationFrame(gameLoop);
    }

    function calculateScore() {
        // Score is the elapsed time in seconds (lower is better)
        const elapsed = (Date.now() - startTime) / 1000;
        return elapsed.toFixed(1);
    }

    function gameOver(won, failReason) {
        gameRunning = false;

        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        if (won) {
            gamesPlayed++; // Only increase difficulty when player wins
            shouldRegenerateWalls = true; // Only regenerate walls on win
        }

        if (won) {
            const score = calculateScore();
            $('#game-container').addClass('game-won');
            $('#instruction-text').text('Tillykke! ' + score + ' sekunder!');

            // Update best score (lower is better)
            if (bestScore === null || parseFloat(score) < parseFloat(bestScore)) {
                bestScore = score;
                localStorage.setItem('toiletterne-best-score', bestScore);
                updateBestScoreDisplay();
                $('#instruction-text').text('NY REKORD! ' + score + ' sekunder!');
            }
        } else {
            $('#game-container').addClass('game-over');
            if (failReason === 'wall') {
                $('#instruction-text').text('Av! De ramte en væg! Prøv igen.');
            } else {
                $('#instruction-text').text('Av! De stødte sammen! Prøv igen.');
            }
            $('#girl, #boy').addClass('collision');
        }

        // Auto reset after delay
        setTimeout(resetGame, 3000);
    }

    function resetGame() {
        gameRunning = false;
        girlPath = [];
        boyPath = [];
        girlPathIndex = 0;
        boyPathIndex = 0;
        girlFinished = false;
        boyFinished = false;

        $('#game-container').removeClass('game-won game-over');
        $('#girl, #boy').removeClass('collision victory');
        $('#timer-display').hide();

        // Reset character CSS positions first
        $('#girl').css({
            top: '30px',
            right: '50px',
            left: 'auto'
        });
        $('#boy').css({
            top: '30px',
            left: '50px',
            right: 'auto'
        });

        // Now update the position variables AFTER CSS is reset
        // Use setTimeout to ensure CSS has been applied
        setTimeout(function() {
            updatePositions();
            // Only regenerate walls after a win
            if (shouldRegenerateWalls) {
                generateWalls();
                shouldRegenerateWalls = false;
            }
            drawPaths();
            updateStartButton();
        }, 10);
    }

    // Initialize the game
    init();
});
