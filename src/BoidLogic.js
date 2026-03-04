// BoidLogic.js
export class BoidLogic {
    constructor(numBoids, width, height) {
        this.numBoids = numBoids;
        this.baseParams = {
            visualRange: 60,
            protectedRange: 18,
            centeringFactor: 0.001,
            avoidFactor: 0.04,
            matchingFactor: 0.07,
            maxSpeed: 3.6,
            minSpeed: 1.2,
            turnFactor: 0.2,
            margin: 300,
            maxbias: 0.01,
            bias_increment: 0.00004
        };
        this.params = { ...this.baseParams };

        this.positions = new Float32Array(numBoids * 2);
        this.velocities = new Float32Array(numBoids * 2);
        this.scoutGroup = new Uint8Array(numBoids); // 0: normal, 1: scout group 1 (right), 2: scout group 2 (left)
        this.biasVal = new Float32Array(numBoids); // bias strength for each boid
        this.setResponsiveScale(width, height);
        this.init(width, height);
    }

    setResponsiveScale(width, height) {
        const minScreen = Math.min(width, height);
        const widthScale = Math.max(0.58, Math.min(1, width / 1280));

        this.params.visualRange = this.baseParams.visualRange * widthScale;
        this.params.protectedRange = this.baseParams.protectedRange * widthScale;
        this.params.maxSpeed = this.baseParams.maxSpeed * Math.max(0.85, widthScale);
        this.params.minSpeed = this.baseParams.minSpeed * Math.max(0.85, widthScale);
        this.params.margin = Math.max(40, Math.min(this.baseParams.margin, minScreen * 0.2));
    }

    init(width, height) {
        // Create 5 spawn centers at the screen edges
        const spawnCenters = [
            { x: 0, y: 0 },                  // Top-left
            { x: width, y: 0 },              // Top-right
            { x: width / 2, y: height / 2 }, // Center
            { x: 0, y: height },             // Bottom-left
            { x: width, y: height }          // Bottom-right
        ];

        // Calculate screen center for convergence direction
        const screenCenterX = width / 2;
        const screenCenterY = height / 2;

        // Distribute boids evenly among 5 spawn centers
        const boidsPerCenter = Math.floor(this.numBoids / 5);

        for (let i = 0; i < this.numBoids; i++) {
            // Assign boid to one of the 5 spawn centers
            const centerIndex = Math.floor(i / boidsPerCenter) % 5;
            const spawnCenter = spawnCenters[centerIndex];

            // Position: spawn center + random offset (±100px)
            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 200;
            this.positions[i * 2] = spawnCenter.x + offsetX;
            this.positions[i * 2 + 1] = spawnCenter.y + offsetY;

            // Velocity: direction toward screen center with variance
            const dirX = screenCenterX - spawnCenter.x;
            const dirY = screenCenterY - spawnCenter.y;
            const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
            const normalizedDirX = dirX / dirLength;
            const normalizedDirY = dirY / dirLength;

            // Base velocity toward center with some randomness
            const baseSpeed = 7;
            const variance = (Math.random() - 0.5) * 2; // ±1 variance
            this.velocities[i * 2] = normalizedDirX * (baseSpeed + variance);
            this.velocities[i * 2 + 1] = normalizedDirY * (baseSpeed + variance);

            // Assign scout groups: first 10% to group 1 (right), next 10% to group 2 (left), rest normal
            if (i < this.numBoids * 0.1) {
                this.scoutGroup[i] = 1; // Scout group 1 - biased right
                this.biasVal[i] = 0.001; // Initial bias strength
            } else if (i < this.numBoids * 0.2) {
                this.scoutGroup[i] = 2; // Scout group 2 - biased left
                this.biasVal[i] = 0.001; // Initial bias strength
            } else {
                this.scoutGroup[i] = 0; // Normal boid
                this.biasVal[i] = 0;
            }
        }
    }

    update(width, height) {
        this.setResponsiveScale(width, height);

        // Define margins based on current screen size
        const leftmargin = this.params.margin;
        const rightmargin = width - this.params.margin;
        const topmargin = this.params.margin;
        const bottommargin = height - this.params.margin;
        const turnfactor = this.params.turnFactor;

        for (let i = 0; i < this.numBoids; i++) {
            let boidX = this.positions[i * 2];
            let boidY = this.positions[i * 2 + 1];
            let boidVX = this.velocities[i * 2];
            let boidVY = this.velocities[i * 2 + 1];

            let close_dx = 0, close_dy = 0;
            let xpos_avg = 0, ypos_avg = 0;
            let xvel_avg = 0, yvel_avg = 0;
            let neighbors = 0;

            for (let j = 0; j < this.numBoids; j++) {
                if (i === j) continue;
                let dx = boidX - this.positions[j * 2];
                let dy = boidY - this.positions[j * 2 + 1];
                let distSq = dx * dx + dy * dy;

                if (distSq < this.params.protectedRange * this.params.protectedRange) {
                    close_dx += dx;
                    close_dy += dy;
                } else if (distSq < this.params.visualRange * this.params.visualRange) {
                    xpos_avg += this.positions[j * 2];
                    ypos_avg += this.positions[j * 2 + 1];
                    xvel_avg += this.velocities[j * 2];
                    yvel_avg += this.velocities[j * 2 + 1];
                    neighbors++;
                }
            }

            if (neighbors > 0) {
                boidVX += (xpos_avg / neighbors - boidX) * this.params.centeringFactor;
                boidVY += (ypos_avg / neighbors - boidY) * this.params.centeringFactor;
                boidVX += (xvel_avg / neighbors - boidVX) * this.params.matchingFactor;
                boidVY += (yvel_avg / neighbors - boidVY) * this.params.matchingFactor;
            }

            boidVX += close_dx * this.params.avoidFactor;
            boidVY += close_dy * this.params.avoidFactor;

            // --- Apply scout group bias ---
            if (this.scoutGroup[i] === 1) {
                // Scout group 1: biased to the right
                const biasVal = this.biasVal[i];
                boidVX = (1 - biasVal) * boidVX + biasVal * 1;
                // Increment bias value toward maxbias
                this.biasVal[i] = Math.min(biasVal + this.params.bias_increment, this.params.maxbias);
            } else if (this.scoutGroup[i] === 2) {
                // Scout group 2: biased to the left
                const biasVal = this.biasVal[i];
                boidVX = (1 - biasVal) * boidVX + biasVal * (-1);
                // Increment bias value toward maxbias
                this.biasVal[i] = Math.min(biasVal + this.params.bias_increment, this.params.maxbias);
            }

            let speed = Math.sqrt(boidVX * boidVX + boidVY * boidVY);
            if (speed > this.params.maxSpeed) {
                boidVX = (boidVX / speed) * this.params.maxSpeed;
                boidVY = (boidVY / speed) * this.params.maxSpeed;
            } else if (speed < this.params.minSpeed) {
                boidVX = (boidVX / speed) * this.params.minSpeed;
                boidVY = (boidVY / speed) * this.params.minSpeed;
            }

            this.velocities[i * 2] = boidVX;
            this.velocities[i * 2 + 1] = boidVY;
            
            // Update position
            this.positions[i * 2] += boidVX;
            this.positions[i * 2 + 1] += boidVY;

            // --- Proportional Steering for boundaries ---
            const newBoidX = this.positions[i * 2];
            const newBoidY = this.positions[i * 2 + 1];

            // Calculate depth of penetration into margin and apply proportional steering
            if (newBoidX < leftmargin) {
                const depth = leftmargin - newBoidX;
                const force = turnfactor * (depth / this.params.margin) * 5;
                this.velocities[i * 2] += force;
            }
            if (newBoidX > rightmargin) {
                const depth = newBoidX - rightmargin;
                const force = turnfactor * (depth / this.params.margin) * 5;
                this.velocities[i * 2] -= force;
            }
            if (newBoidY < topmargin) {
                const depth = topmargin - newBoidY;
                const force = turnfactor * (depth / this.params.margin) * 5;
                this.velocities[i * 2 + 1] += force;
            }
            if (newBoidY > bottommargin) {
                const depth = newBoidY - bottommargin;
                const force = turnfactor * (depth / this.params.margin) * 5;
                this.velocities[i * 2 + 1] -= force;
            }

            // Hard boundaries at screen edges
            if (newBoidX < 0) this.positions[i * 2] = 0;
            if (newBoidX > width) this.positions[i * 2] = width;
            if (newBoidY < 0) this.positions[i * 2 + 1] = 0;
            if (newBoidY > height) this.positions[i * 2 + 1] = height;

            // Add jitter to break symmetry and prevent infinite loops
            this.velocities[i * 2] += (Math.random() - 0.5) * 0.1;
            this.velocities[i * 2 + 1] += (Math.random() - 0.5) * 0.1;
        }
    }
}