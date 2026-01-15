/**
 * Pastel Flower Canvas - Stem Growth Animation
 * Flowers grow from bottom of screen up to click position
 * Soft pastel colors, organic petal shapes, subtle glow
 */

(function () {
    'use strict';

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const hint = document.getElementById('hint');
    const cleanBtn = document.getElementById('cleanBtn');

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const flowers = [];
    let animating = false;
    let flowerCounter = 0; // Track total flowers spawned
    let lastColorIndices = []; // Track recent colors to avoid clustering

    // Ambient effects
    const fireflies = []; // Floating glow particles
    const FIREFLY_COUNT = 25; // Number of ambient particles
    const FIREFLY_COLORS = ['#ffeb9c', '#b5ffd9', '#9ecbff', '#fff8dc'];
    let backgroundGradient = null; // Canvas gradient (deep purple or midnight blue)
    const gradientType = Math.random() > 0.5 ? 'purple' : 'blue'; // Random on load

    // Expanded pastel color palettes
    const PETAL_COLORS = [
        { center: '#ffeb9c', outer: '#ff7eb3' }, // yellow → pink
        { center: '#ffd4a3', outer: '#ffad66' }, // peach → orange
        { center: '#ffe5f1', outer: '#cc8bff' }, // white → purple
        { center: '#fff5b8', outer: '#ff5f8d' }, // pale yellow → rose
        { center: '#ffe0c4', outer: '#ffb86c' }, // cream → apricot
        { center: '#e0f4ff', outer: '#9ecbff' }, // pale blue → pastel blue
        { center: '#fffef5', outer: '#fff5e6' }, // warm white → soft white
        { center: '#e8ffe8', outer: '#b5ffd9' }, // pale mint → light mint green
        { center: '#ffe5e5', outer: '#ff9f9f' }, // pale pink → coral pastel
        { center: '#d4b3ff', outer: '#5a2bff' }, // lavender → deep violet (contrast)
    ];

    // Special red rose palette (every 7th flower)
    const RED_ROSE_PALETTE = {
        center: '#ff4d4d', // bright red
        outer: '#d40000',  // dark red
    };

    const STEM_COLORS = ['#66cc66', '#55aa55', '#99cc66'];

    // Utility functions
    const rand = (min, max) => Math.random() * (max - min) + min;
    const randInt = (min, max) => Math.floor(rand(min, max));
    const pick = (arr) => arr[randInt(0, arr.length)];

    // Easing functions
    const easeOutQuad = (t) => t * (2 - t);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Smart color selection: avoid repeating same color 3 times in a row
    function selectPalette() {
        flowerCounter++;

        // Every 7th flower is a red rose
        if (flowerCounter % 7 === 0) {
            lastColorIndices = []; // Reset tracking after special flower
            return { ...RED_ROSE_PALETTE, isRedRose: true };
        }

        // Select random color, avoiding recent repeats
        let colorIndex;
        let attempts = 0;
        do {
            colorIndex = randInt(0, PETAL_COLORS.length);
            attempts++;
        } while (
            attempts < 10 &&
            lastColorIndices.length >= 2 &&
            lastColorIndices[0] === colorIndex &&
            lastColorIndices[1] === colorIndex
        );

        // Track last 3 colors
        lastColorIndices.unshift(colorIndex);
        if (lastColorIndices.length > 3) lastColorIndices.pop();

        return { ...PETAL_COLORS[colorIndex], isRedRose: false };
    }

    // Canvas setup
    function resizeCanvas() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Recreate background gradient on resize
        createBackgroundGradient();
        redrawAll();
    }

    // Create subtle background gradient
    function createBackgroundGradient() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        backgroundGradient = ctx.createLinearGradient(0, 0, 0, h);

        if (gradientType === 'purple') {
            backgroundGradient.addColorStop(0, '#1a0a2e'); // deep purple
            backgroundGradient.addColorStop(1, '#000000'); // black
        } else {
            backgroundGradient.addColorStop(0, '#0a1628'); // midnight blue
            backgroundGradient.addColorStop(1, '#000000'); // black
        }
    }

    function clearCanvas() {
        // Fill with subtle gradient background
        ctx.fillStyle = backgroundGradient || '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function redrawAll() {
        clearCanvas();
        drawFireflies(); // Draw ambient particles behind flowers
        flowers.forEach(f => {
            drawStem(f, 1, performance.now()); // Pass time for wind sway
            drawFlowerHead(f, 1);
        });
    }

    // Initialize fireflies system
    function initFireflies() {
        for (let i = 0; i < FIREFLY_COUNT; i++) {
            fireflies.push(createFirefly());
        }
    }

    // Create a single firefly particle
    function createFirefly() {
        return {
            x: rand(0, window.innerWidth),
            y: rand(0, window.innerHeight),
            radius: rand(2, 4),
            color: pick(FIREFLY_COLORS),
            opacity: rand(0.2, 0.4),
            speedY: rand(-0.3, -0.8), // float upward
            speedX: rand(-0.2, 0.2), // slight horizontal drift
            phase: rand(0, Math.PI * 2), // for pulsing
        };
    }

    // Update and draw fireflies
    function updateFireflies() {
        fireflies.forEach(f => {
            f.y += f.speedY;
            f.x += f.speedX;

            // Respawn at bottom when exiting top
            if (f.y < -10) {
                f.y = window.innerHeight + 10;
                f.x = rand(0, window.innerWidth);
            }

            // Wrap horizontally
            if (f.x < -10) f.x = window.innerWidth + 10;
            if (f.x > window.innerWidth + 10) f.x = -10;

            // Gentle pulsing
            f.phase += 0.02;
        });
    }

    function drawFireflies() {
        fireflies.forEach(f => {
            const pulse = Math.sin(f.phase) * 0.1 + 0.9; // subtle pulse
            const currentOpacity = f.opacity * pulse;

            ctx.save();
            ctx.globalAlpha = currentOpacity;
            ctx.fillStyle = f.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Create flower data when user clicks
    function createFlower(targetX, targetY) {
        const startY = window.innerHeight; // Bottom of screen
        const palette = selectPalette(); // Smart color selection with red rose logic
        const petalCount = randInt(4, 7);

        const flower = {
            // Position
            startX: targetX + rand(-20, 20), // slight x variation at bottom
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            currentY: startY,

            // Timing
            startTime: performance.now(),
            stemDuration: rand(800, 1400), // stem growth time
            bloomDuration: rand(600, 900), // bloom time
            bloomStartTime: null,

            // Stem properties
            stemColor: pick(STEM_COLORS),
            stemThickness: rand(1.4, 2.2),
            stemCurve: rand(-30, 30), // curve control point offset

            // Wind sway properties
            swaySpeed: rand(0.0008, 0.0015), // unique sway speed per stem
            swayPhase: rand(0, Math.PI * 2), // unique starting phase
            swayAmount: rand(1, 3), // sway amplitude in pixels

            // Flower properties
            palette: palette,
            petalCount: petalCount,
            petals: Array.from({ length: petalCount }, (_, i) => ({
                angle: (i / petalCount) * Math.PI * 2 + rand(-0.15, 0.15),
                length: rand(25, 40),
                width: rand(12, 22),
                curve: rand(0.3, 0.7),
            })),

            // State
            stemComplete: false,
            bloomComplete: false,
        };

        flowers.push(flower);
        hint.style.opacity = '0';
        startAnimation();
    }

    // Draw stem growing from bottom to target
    function drawStem(flower, progress, currentTime) {
        const { startX, startY, targetX, targetY, stemColor, stemThickness, stemCurve } = flower;

        // Interpolate current position
        const t = easeOutCubic(progress);
        let currentX = startX + (targetX - startX) * t;
        const currentY = startY - (startY - targetY) * t;

        // Apply gentle wind sway ONLY after bloom is complete
        if (flower.bloomComplete && currentTime) {
            const swayOffset = Math.sin(currentTime * flower.swaySpeed + flower.swayPhase) * flower.swayAmount;
            currentX += swayOffset * progress; // Sway increases along stem length
        }

        // Control point for curved stem
        const midY = startY - (startY - targetY) * 0.5;
        const ctrlX = currentX + stemCurve * t;
        const ctrlY = midY;

        ctx.save();
        ctx.strokeStyle = stemColor;
        ctx.lineWidth = stemThickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 4;
        ctx.shadowColor = stemColor;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, currentX, currentY);
        ctx.stroke();
        ctx.restore();

        flower.currentX = currentX;
        flower.currentY = currentY;
    }

    // Draw flower head with organic petals
    function drawFlowerHead(flower, bloomProgress) {
        const { currentX, currentY, petals, palette } = flower;
        if (!currentX || !currentY) return;

        const t = easeOutQuad(bloomProgress);
        const opacity = Math.min(1, t * 1.5);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(currentX, currentY);

        // Draw each petal using bezier curves
        petals.forEach(petal => {
            const { angle, length, width, curve } = petal;
            const petalLength = length * t;
            const petalWidth = width * t;

            ctx.save();
            ctx.rotate(angle);

            // Petal gradient (center → outer)
            const grad = ctx.createRadialGradient(0, 0, 0, 0, petalLength * 0.7, petalLength);
            grad.addColorStop(0, palette.center);
            grad.addColorStop(0.6, palette.outer);
            grad.addColorStop(1, palette.outer + '80'); // semi-transparent edge

            ctx.fillStyle = grad;
            // Adjust glow strength: red roses get slightly stronger glow
            ctx.shadowBlur = palette.isRedRose ? 14 : 10;
            ctx.shadowColor = palette.outer;

            // Draw organic petal shape with bezier curve
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Control points for curved petal
            const cp1x = petalWidth * curve;
            const cp1y = petalLength * 0.4;
            const cp2x = petalWidth;
            const cp2y = petalLength * 0.7;
            const endX = 0;
            const endY = petalLength;

            // Right side of petal
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

            // Left side of petal (mirrored)
            ctx.bezierCurveTo(-cp2x, cp2y, -cp1x, cp1y, 0, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });

        // Flower center
        const centerRadius = 4 * t;
        const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius * 3);
        centerGrad.addColorStop(0, '#fff8dc');
        centerGrad.addColorStop(0.5, palette.center);
        centerGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');

        ctx.fillStyle = centerGrad;
        // Red roses get slightly stronger center glow
        ctx.shadowBlur = palette.isRedRose ? 12 : 8;
        ctx.shadowColor = palette.center;
        ctx.beginPath();
        ctx.arc(0, 0, centerRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Animation loop
    function animate() {
        clearCanvas();
        updateFireflies(); // Update ambient particles
        drawFireflies(); // Draw fireflies behind flowers

        const now = performance.now();
        let hasActive = false;

        flowers.forEach(flower => {
            // Stem growth phase
            if (!flower.stemComplete) {
                const elapsed = now - flower.startTime;
                const stemProgress = Math.min(1, elapsed / flower.stemDuration);
                drawStem(flower, stemProgress, now);

                if (stemProgress >= 1) {
                    flower.stemComplete = true;
                    flower.bloomStartTime = now;
                } else {
                    hasActive = true;
                }
            }
            // Bloom phase
            else if (!flower.bloomComplete) {
                drawStem(flower, 1, now); // Draw full stem with wind sway

                const bloomElapsed = now - flower.bloomStartTime;
                const bloomProgress = Math.min(1, bloomElapsed / flower.bloomDuration);
                drawFlowerHead(flower, bloomProgress);

                if (bloomProgress >= 1) {
                    flower.bloomComplete = true;
                } else {
                    hasActive = true;
                }
            }
            // Complete - draw static with wind sway
            else {
                drawStem(flower, 1, now);
                drawFlowerHead(flower, 1);
            }
        });

        // Always keep animating if flowers exist (for wind sway) or if actively blooming
        if (hasActive || flowers.length > 0) {
            requestAnimationFrame(animate);
        } else {
            animating = false;
        }
    }

    function startAnimation() {
        if (!animating) {
            animating = true;
            requestAnimationFrame(animate);
        }
    }

    // Event handlers
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createFlower(x, y);
    });

    cleanBtn.addEventListener('click', () => {
        flowers.length = 0;
        flowerCounter = 0; // Reset counter when clearing
        lastColorIndices = []; // Reset color tracking
        hint.style.opacity = '1';
        clearCanvas();
        drawFireflies(); // Keep fireflies visible
    });

    window.addEventListener('resize', resizeCanvas);

    // Initialize
    initFireflies(); // Create ambient particles
    createBackgroundGradient(); // Set up subtle gradient
    resizeCanvas();

    // Start ambient animation loop immediately
    animating = true;
    requestAnimationFrame(animate);
})();
