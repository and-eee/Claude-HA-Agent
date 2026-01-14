// Voyeur - After Dark Screensaver Recreation
// A polished web-based screensaver with 24 animated window vignettes

// ===== CONSTANTS & CONFIGURATION =====

const COLORS = {
    sky: {
        top: '#0a0520',
        mid: '#1a1a3e',
        horizon: '#2d1b4e'
    },
    building: {
        main: '#2a2a2a',
        shadow: '#1a1a1a',
        frame: '#404040'
    },
    windowLight: {
        primary: '#ffe5b4',
        warm: '#ffd699',
        cool: '#fff5e6',
        tvGlow: '#4d94ff'
    },
    cityscape: '#0f0f0f',
    effects: {
        ufoBeam: '#9fffe6',
        policeRed: '#ff3333',
        policeBlue: '#3366ff',
        lightning: '#ffffff',
        spotlight: '#ffffcc'
    }
};

const TIMING = {
    ufo: { min: 45000, max: 90000, duration: 10000 },
    police: { min: 60000, max: 120000, duration: 5000 },
    shootingStar: { min: 90000, max: 180000, duration: 1500 },
    helicopter: { min: 120000, max: 240000, duration: 12000 },
    lightning: { min: 90000, max: 180000, duration: 2500 },
    airplane: { min: 60000, max: 120000, duration: 18000 },
    windowToggle: 15000
};

// ===== UTILITY FUNCTIONS =====

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ===== STATE MANAGEMENT =====

const state = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    dpr: 1,
    lastTime: 0,
    stars: [],
    cityBuildings: [],
    windows: [],
    activeEffects: [],
    eventQueue: [],
    audioManager: null,
    building: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }
};

// ===== AUDIO MANAGER =====

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = {};
        this.audioSources = {};
        this.isMuted = false;
        this.masterGain = null;
        this.isLoaded = false;
    }

    async init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                return;
            }

            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // Try to resume context (for autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Load audio files
            await this.loadAudioFiles();
            this.isLoaded = true;

            // Start ambient sound
            this.playAmbient();
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    async loadAudioFiles() {
        const files = [
            'ambient-city.mp3',
            'police-siren.mp3',
            'helicopter.mp3',
            'thunder.mp3',
            'ufo-whoosh.mp3'
        ];

        const loadPromises = files.map(async (filename) => {
            try {
                const response = await fetch(`audio/${filename}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers[filename] = audioBuffer;
            } catch (error) {
                console.warn(`Failed to load ${filename}:`, error);
            }
        });

        await Promise.all(loadPromises);
    }

    playAmbient() {
        if (!this.isLoaded || !this.audioBuffers['ambient-city.mp3']) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers['ambient-city.mp3'];
        source.loop = true;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.18;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(0);

        this.audioSources['ambient'] = { source, gainNode };
    }

    playSound(filename, volume = 0.3, loop = false) {
        if (!this.isLoaded || !this.audioBuffers[filename]) return null;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[filename];
        source.loop = loop;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(0);

        return { source, gainNode };
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
        }
    }
}

// ===== WINDOW VIGNETTE CLASSES =====

class AerobicsVignette {
    constructor() {
        this.frame = 0;
        this.speed = 30; // frames per second for animation
    }

    update(deltaTime) {
        this.frame += deltaTime * this.speed;
        if (this.frame >= 60) this.frame = 0;
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const headRadius = height * 0.1;
        const bodyHeight = height * 0.25;

        // Determine animation state
        const cycle = this.frame / 60;
        let armAngle = 0;
        let legSpread = 0;
        let yOffset = 0;

        if (this.frame < 15) {
            armAngle = 0;
            legSpread = 0;
        } else if (this.frame < 30) {
            const t = (this.frame - 15) / 15;
            armAngle = t * Math.PI;
            legSpread = t * 15;
            yOffset = -Math.sin(t * Math.PI) * 5;
        } else if (this.frame < 45) {
            armAngle = 0;
            legSpread = 0;
        } else {
            const t = (this.frame - 45) / 15;
            armAngle = Math.PI / 2;
            legSpread = 0;
        }

        // Draw head
        ctx.fillStyle = '#f4c2a8';
        ctx.beginPath();
        ctx.arc(centerX, centerY - bodyHeight + yOffset, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw body
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(centerX - width * 0.08, centerY - bodyHeight / 2 + yOffset,
                     width * 0.16, bodyHeight);

        // Draw arms
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - bodyHeight / 2 + yOffset);
        ctx.lineTo(centerX - Math.cos(armAngle) * width * 0.15,
                   centerY - bodyHeight / 2 - Math.sin(armAngle) * width * 0.15 + yOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - bodyHeight / 2 + yOffset);
        ctx.lineTo(centerX + Math.cos(armAngle) * width * 0.15,
                   centerY - bodyHeight / 2 - Math.sin(armAngle) * width * 0.15 + yOffset);
        ctx.stroke();

        // Draw legs
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + bodyHeight / 2 + yOffset);
        ctx.lineTo(centerX - legSpread, centerY + bodyHeight + yOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + bodyHeight / 2 + yOffset);
        ctx.lineTo(centerX + legSpread, centerY + bodyHeight + yOffset);
        ctx.stroke();
    }
}

class TVWatcherVignette {
    constructor() {
        this.tvFlicker = 0;
        this.headTilt = 0;
        this.tiltDirection = 1;
        this.tiltTimer = 0;
    }

    update(deltaTime) {
        this.tvFlicker += deltaTime * 10;
        this.tiltTimer += deltaTime;

        if (this.tiltTimer > 3) {
            this.tiltTimer = 0;
            this.tiltDirection *= -1;
        }

        this.headTilt = Math.sin(this.tiltTimer / 3 * Math.PI) * this.tiltDirection * 0.2;
    }

    render(ctx, x, y, width, height) {
        // TV on left
        const tvWidth = width * 0.3;
        const tvHeight = height * 0.4;
        const tvX = x + width * 0.15;
        const tvY = y + height * 0.3;

        // TV glow
        const gradient = ctx.createRadialGradient(tvX + tvWidth / 2, tvY + tvHeight / 2, 0,
                                                   tvX + tvWidth / 2, tvY + tvHeight / 2, tvWidth);
        gradient.addColorStop(0, 'rgba(77, 148, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(77, 148, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // TV screen
        ctx.fillStyle = COLORS.windowLight.tvGlow;
        ctx.fillRect(tvX, tvY, tvWidth, tvHeight);

        // Person silhouette on right
        const personX = x + width * 0.65;
        const personY = y + height * 0.4;

        ctx.save();
        ctx.translate(personX, personY);
        ctx.rotate(this.headTilt);

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, height * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Body
        ctx.fillRect(personX - width * 0.06, personY + height * 0.08,
                     width * 0.12, height * 0.25);
    }
}

class ChefVignette {
    constructor() {
        this.frame = 0;
        this.foodX = 0;
        this.foodY = 0;
        this.dropped = false;
        this.armUp = false;
    }

    update(deltaTime) {
        this.frame += deltaTime * 30;
        if (this.frame >= 90) {
            this.frame = 0;
            this.dropped = false;
            this.armUp = false;
        }

        if (this.frame >= 75 && this.frame < 89) {
            // Check if food drops (10% chance)
            if (!this.dropped && Math.random() < 0.1) {
                this.dropped = true;
                this.armUp = true;
            }
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Person silhouette
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.15, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(centerX - width * 0.1, centerY - height * 0.05, width * 0.2, height * 0.3);

        // Pan
        let panY = centerY + height * 0.1;
        let panTilt = 0;

        if (this.frame >= 30 && this.frame < 45) {
            panTilt = -((this.frame - 30) / 15) * 0.3;
        } else if (this.frame >= 45 && this.frame < 75) {
            panTilt = -0.3;
        }

        ctx.save();
        ctx.translate(centerX, panY);
        ctx.rotate(panTilt);
        ctx.fillStyle = '#888888';
        ctx.fillRect(-width * 0.15, -5, width * 0.3, 10);
        ctx.restore();

        // Food
        if (this.frame < 30) {
            // In pan
            this.foodX = centerX;
            this.foodY = panY;
        } else if (this.frame < 75) {
            // Flying
            const t = (this.frame - 30) / 45;
            const arc = Math.sin(t * Math.PI);
            this.foodX = centerX;
            this.foodY = panY - arc * height * 0.3;
        } else if (!this.dropped) {
            // Back in pan
            this.foodX = centerX;
            this.foodY = panY;
        } else {
            // Dropped to floor
            this.foodY = y + height;
        }

        if (this.frame < 90 && (!this.dropped || this.frame < 75)) {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.foodX, this.foodY, width * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }

        // Arms up if dropped
        if (this.armUp) {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.08, centerY);
            ctx.lineTo(centerX - width * 0.15, centerY - height * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + width * 0.08, centerY);
            ctx.lineTo(centerX + width * 0.15, centerY - height * 0.2);
            ctx.stroke();
        }
    }
}

class PlantEnthusiastVignette {
    constructor() {
        this.position = 0;
        this.plantPositions = [0.2, 0.45, 0.7];
        this.currentPlant = 0;
        this.waterDrops = [];
    }

    update(deltaTime) {
        this.position += deltaTime * 0.15;
        if (this.position >= 1) {
            this.position = 0;
            this.currentPlant = 0;
            this.waterDrops = [];
        }

        this.currentPlant = Math.floor(this.position * 3);

        // Add water drops
        if (Math.random() < 0.3) {
            this.waterDrops.push({
                x: this.plantPositions[this.currentPlant],
                y: 0.3,
                life: 1
            });
        }

        // Update water drops
        this.waterDrops = this.waterDrops.filter(drop => {
            drop.y += deltaTime * 0.5;
            drop.life -= deltaTime * 2;
            return drop.life > 0;
        });
    }

    render(ctx, x, y, width, height) {
        // Plants
        this.plantPositions.forEach(pos => {
            const plantX = x + width * pos;
            const plantY = y + height * 0.7;

            // Pot
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(plantX - width * 0.08, plantY, width * 0.16, height * 0.2);

            // Stem and leaves
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(plantX, plantY);
            ctx.lineTo(plantX, plantY - height * 0.25);
            ctx.stroke();

            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.ellipse(plantX - width * 0.05, plantY - height * 0.15, width * 0.06, height * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(plantX + width * 0.05, plantY - height * 0.2, width * 0.06, height * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Person
        const personX = x + width * this.plantPositions[this.currentPlant];
        const personY = y + height * 0.5;

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(personX, personY - height * 0.15, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(personX - width * 0.06, personY - height * 0.08, width * 0.12, height * 0.2);

        // Watering can
        ctx.fillStyle = '#666666';
        ctx.fillRect(personX + width * 0.08, personY, width * 0.1, height * 0.08);

        // Water drops
        ctx.fillStyle = '#4da6ff';
        this.waterDrops.forEach(drop => {
            ctx.globalAlpha = drop.life;
            ctx.beginPath();
            ctx.arc(x + width * drop.x, y + height * drop.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

class ArtistVignette {
    constructor() {
        this.colorPhase = 0;
        this.brushX = 0.5;
        this.brushY = 0.4;
        this.brushTimer = 0;
    }

    update(deltaTime) {
        this.colorPhase += deltaTime / 30;
        if (this.colorPhase >= 1) this.colorPhase = 0;

        this.brushTimer += deltaTime * 2;
        this.brushX = 0.5 + Math.sin(this.brushTimer) * 0.15;
        this.brushY = 0.4 + Math.cos(this.brushTimer * 1.3) * 0.1;
    }

    render(ctx, x, y, width, height) {
        // Easel
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.9);
        ctx.lineTo(x + width * 0.5, y + height * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width * 0.7, y + height * 0.9);
        ctx.lineTo(x + width * 0.5, y + height * 0.2);
        ctx.stroke();

        // Canvas
        const phase = this.colorPhase * Math.PI * 2;
        const r = Math.floor(127 + 127 * Math.sin(phase));
        const g = Math.floor(127 + 127 * Math.sin(phase + Math.PI * 2 / 3));
        const b = Math.floor(127 + 127 * Math.sin(phase + Math.PI * 4 / 3));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + width * 0.35, y + height * 0.25, width * 0.3, height * 0.4);

        ctx.strokeStyle = '#8b4513';
        ctx.strokeRect(x + width * 0.35, y + height * 0.25, width * 0.3, height * 0.4);

        // Person
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x + width * 0.75, y + height * 0.4, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + width * 0.7, y + height * 0.47, width * 0.1, height * 0.25);

        // Brush arm
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.7, y + height * 0.5);
        ctx.lineTo(x + width * this.brushX, y + height * this.brushY);
        ctx.stroke();
    }
}

class ReadingVignette {
    constructor() {
        this.pageTimer = 0;
        this.pageFlip = false;
    }

    update(deltaTime) {
        this.pageTimer += deltaTime;
        if (this.pageTimer > random(8, 12)) {
            this.pageTimer = 0;
            this.pageFlip = true;
            setTimeout(() => this.pageFlip = false, 200);
        }
    }

    render(ctx, x, y, width, height) {
        // Chair
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + width * 0.25, y + height * 0.45, width * 0.5, height * 0.35);
        ctx.fillRect(x + width * 0.25, y + height * 0.3, width * 0.5, height * 0.05);

        // Person
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x + width * 0.5, y + height * 0.35, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + width * 0.44, y + height * 0.42, width * 0.12, height * 0.2);

        // Book
        ctx.fillStyle = this.pageFlip ? '#fff' : '#f5f5f5';
        ctx.fillRect(x + width * 0.42, y + height * 0.6, width * 0.16, height * 0.12);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + width * 0.42, y + height * 0.6, width * 0.16, height * 0.12);
    }
}

class CatLaserVignette {
    constructor() {
        this.laserX = 0.5;
        this.laserY = 0.5;
        this.catX = 0.3;
        this.catY = 0.3;
        this.targetTimer = 0;
        this.tailWag = 0;
    }

    update(deltaTime) {
        this.targetTimer += deltaTime;

        if (this.targetTimer > 2) {
            this.targetTimer = 0;
            this.laserX = random(0.2, 0.8);
            this.laserY = random(0.2, 0.8);
        }

        // Cat follows laser
        this.catX = lerp(this.catX, this.laserX, deltaTime * 2);
        this.catY = lerp(this.catY, this.laserY, deltaTime * 2);

        this.tailWag += deltaTime * 4;
    }

    render(ctx, x, y, width, height) {
        // Laser dot
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + width * this.laserX, y + height * this.laserY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cat
        const catPosX = x + width * this.catX;
        const catPosY = y + height * this.catY;

        ctx.fillStyle = '#ffa500';
        // Body
        ctx.beginPath();
        ctx.ellipse(catPosX, catPosY, width * 0.08, height * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(catPosX + width * 0.06, catPosY, height * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.moveTo(catPosX + width * 0.05, catPosY - height * 0.04);
        ctx.lineTo(catPosX + width * 0.03, catPosY - height * 0.08);
        ctx.lineTo(catPosX + width * 0.07, catPosY - height * 0.04);
        ctx.fill();

        // Tail
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(catPosX - width * 0.08, catPosY);
        ctx.quadraticCurveTo(
            catPosX - width * 0.12,
            catPosY + Math.sin(this.tailWag) * height * 0.1,
            catPosX - width * 0.15,
            catPosY
        );
        ctx.stroke();
    }
}

class DogWaitingVignette {
    constructor() {
        this.tailWag = 0;
        this.earPerk = 0;
        this.perkTimer = 0;
    }

    update(deltaTime) {
        this.tailWag += deltaTime * 6;
        this.perkTimer += deltaTime;

        if (this.perkTimer > random(20, 30)) {
            this.perkTimer = 0;
            this.earPerk = 1;
        }

        if (this.earPerk > 0) {
            this.earPerk -= deltaTime;
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height * 0.6;

        // Dog body
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width * 0.15, height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.15, height * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        const earOffset = this.earPerk * 10;
        ctx.beginPath();
        ctx.ellipse(centerX - width * 0.08, centerY - height * 0.2 - earOffset,
                    width * 0.05, height * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + width * 0.08, centerY - height * 0.2 - earOffset,
                    width * 0.05, height * 0.1, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX - width * 0.1, centerY + height * 0.1,
                width * 0.1, Math.PI, Math.PI + Math.sin(this.tailWag) * 0.8);
        ctx.stroke();
    }
}

class FishTankVignette {
    constructor() {
        this.fish = [];
        for (let i = 0; i < 4; i++) {
            this.fish.push({
                x: random(0.1, 0.9),
                y: random(0.2, 0.7),
                speed: random(0.05, 0.15),
                direction: Math.random() < 0.5 ? 1 : -1,
                color: ['#ff6b35', '#ffaa00', '#00ffaa', '#ff1493'][i],
                phase: random(0, Math.PI * 2)
            });
        }
        this.bubbles = [];
    }

    update(deltaTime) {
        this.fish.forEach(fish => {
            fish.x += fish.direction * fish.speed * deltaTime;
            fish.phase += deltaTime * 2;
            fish.y += Math.sin(fish.phase) * 0.01;

            if (fish.x > 0.95 || fish.x < 0.05) {
                fish.direction *= -1;
            }
        });

        // Add bubbles
        if (Math.random() < 0.1) {
            this.bubbles.push({
                x: random(0.1, 0.9),
                y: 0.8,
                speed: random(0.1, 0.2)
            });
        }

        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= bubble.speed * deltaTime;
            return bubble.y > 0.1;
        });
    }

    render(ctx, x, y, width, height) {
        // Tank background
        ctx.fillStyle = '#a8dadc';
        ctx.fillRect(x + width * 0.1, y + height * 0.15, width * 0.8, height * 0.7);

        // Gravel
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.8, height * 0.05);

        // Fish
        this.fish.forEach(fish => {
            const fishX = x + width * fish.x;
            const fishY = y + height * fish.y;

            ctx.fillStyle = fish.color;
            ctx.save();
            ctx.translate(fishX, fishY);
            if (fish.direction < 0) ctx.scale(-1, 1);
            ctx.beginPath();
            ctx.ellipse(0, 0, width * 0.06, height * 0.03, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-width * 0.06, 0);
            ctx.lineTo(-width * 0.1, -height * 0.02);
            ctx.lineTo(-width * 0.1, height * 0.02);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(x + width * bubble.x, y + height * bubble.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Tank outline
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + width * 0.1, y + height * 0.15, width * 0.8, height * 0.7);
    }
}

class BirdCageVignette {
    constructor() {
        this.birdY = 0.4;
        this.hopTimer = 0;
        this.hopping = false;
        this.targetY = 0.4;
        this.bobPhase = 0;
    }

    update(deltaTime) {
        this.hopTimer += deltaTime;
        this.bobPhase += deltaTime * 3;

        if (this.hopTimer > random(4, 6) && !this.hopping) {
            this.hopping = true;
            this.targetY = this.birdY === 0.4 ? 0.6 : 0.4;
            this.hopTimer = 0;
        }

        if (this.hopping) {
            this.birdY = lerp(this.birdY, this.targetY, deltaTime * 4);
            if (Math.abs(this.birdY - this.targetY) < 0.01) {
                this.hopping = false;
                this.birdY = this.targetY;
            }
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;

        // Cage bars
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
            const barX = x + width * (0.2 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(barX, y + height * 0.25);
            ctx.lineTo(barX, y + height * 0.8);
            ctx.stroke();
        }

        // Cage top
        ctx.beginPath();
        ctx.arc(centerX, y + height * 0.25, width * 0.3, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Perches
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.4);
        ctx.lineTo(x + width * 0.8, y + height * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.6);
        ctx.lineTo(x + width * 0.8, y + height * 0.6);
        ctx.stroke();

        // Bird
        const birdX = centerX;
        const birdYPos = y + height * this.birdY;
        const bob = Math.sin(this.bobPhase) * 3;

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(birdX, birdYPos + bob, width * 0.06, height * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.moveTo(birdX + width * 0.06, birdYPos + bob);
        ctx.lineTo(birdX + width * 0.09, birdYPos + bob);
        ctx.lineTo(birdX + width * 0.06, birdYPos + bob + 3);
        ctx.fill();
    }
}

class DancingCoupleVignette {
    constructor() {
        this.rotation = 0;
        this.spinPerson = -1;
        this.spinRotation = 0;
    }

    update(deltaTime) {
        this.rotation += deltaTime * Math.PI / 4;

        if (Math.random() < 0.005 && this.spinPerson < 0) {
            this.spinPerson = Math.random() < 0.5 ? 0 : 1;
            this.spinRotation = 0;
        }

        if (this.spinPerson >= 0) {
            this.spinRotation += deltaTime * Math.PI * 2;
            if (this.spinRotation >= Math.PI * 2) {
                this.spinPerson = -1;
            }
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Person 1
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.translate(-width * 0.08, 0);
        if (this.spinPerson === 0) ctx.rotate(this.spinRotation);

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -height * 0.12, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-width * 0.05, -height * 0.05, width * 0.1, height * 0.2);
        ctx.restore();

        // Person 2
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.translate(width * 0.08, 0);
        if (this.spinPerson === 1) ctx.rotate(this.spinRotation);

        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(0, -height * 0.12, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-width * 0.05, -height * 0.05, width * 0.1, height * 0.2);
        ctx.restore();

        ctx.restore();
    }
}

class ArguingCoupleVignette {
    constructor() {
        this.frame = 0;
        this.person1State = 0;
        this.person2State = 0;
    }

    update(deltaTime) {
        this.frame += deltaTime * 30;
        if (this.frame >= 60) this.frame = 0;

        this.person1State = Math.floor(this.frame / 15) % 4;
        this.person2State = Math.floor((this.frame + 7.5) / 15) % 4;
    }

    render(ctx, x, y, width, height) {
        const person1X = x + width * 0.35;
        const person2X = x + width * 0.65;
        const personY = y + height * 0.5;

        // Person 1
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(person1X, personY - height * 0.15, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(person1X - width * 0.05, personY - height * 0.08, width * 0.1, height * 0.25);

        // Person 1 arms
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        if (this.person1State === 1) {
            // Arms up
            ctx.beginPath();
            ctx.moveTo(person1X, personY);
            ctx.lineTo(person1X - width * 0.1, personY - height * 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(person1X, personY);
            ctx.lineTo(person1X + width * 0.1, personY - height * 0.15);
            ctx.stroke();
        } else if (this.person1State === 2) {
            // Pointing
            ctx.beginPath();
            ctx.moveTo(person1X, personY);
            ctx.lineTo(person2X - width * 0.1, personY);
            ctx.stroke();
        }

        // Person 2
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(person2X, personY - height * 0.15, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(person2X - width * 0.05, personY - height * 0.08, width * 0.1, height * 0.25);

        // Person 2 arms
        ctx.strokeStyle = '#2a2a2a';
        if (this.person2State === 1) {
            // Arms crossed
            ctx.beginPath();
            ctx.moveTo(person2X - width * 0.05, personY);
            ctx.lineTo(person2X + width * 0.08, personY + height * 0.05);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(person2X + width * 0.05, personY);
            ctx.lineTo(person2X - width * 0.08, personY + height * 0.05);
            ctx.stroke();
        } else if (this.person2State === 2) {
            // Pointing back
            ctx.beginPath();
            ctx.moveTo(person2X, personY);
            ctx.lineTo(person1X + width * 0.1, personY);
            ctx.stroke();
        }
    }
}

class PartyVignette {
    constructor() {
        this.people = [];
        for (let i = 0; i < 5; i++) {
            this.people.push({
                x: random(0.2, 0.8),
                y: random(0.4, 0.7),
                phase: random(0, Math.PI * 2),
                speed: random(1, 2),
                armUp: false,
                armTimer: random(0, 5)
            });
        }
        this.balloons = [];
    }

    update(deltaTime) {
        this.people.forEach(person => {
            person.phase += deltaTime * person.speed;
            person.armTimer += deltaTime;

            if (person.armTimer > 5) {
                person.armUp = Math.random() < 0.3;
                person.armTimer = 0;
            }
        });

        // Add balloons
        if (Math.random() < 0.05) {
            this.balloons.push({
                x: random(0.2, 0.8),
                y: 0.9,
                speed: random(0.02, 0.05),
                color: ['#ff69b4', '#00ffff', '#ffaa00'][randomInt(0, 2)]
            });
        }

        this.balloons = this.balloons.filter(balloon => {
            balloon.y -= balloon.speed * deltaTime;
            return balloon.y > 0.1;
        });
    }

    render(ctx, x, y, width, height) {
        // Balloons
        this.balloons.forEach(balloon => {
            ctx.fillStyle = balloon.color;
            ctx.beginPath();
            ctx.arc(x + width * balloon.x, y + height * balloon.y, width * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(x + width * balloon.x, y + height * balloon.y);
            ctx.lineTo(x + width * balloon.x, y + height * (balloon.y + 0.08));
            ctx.stroke();
        });

        // People
        this.people.forEach(person => {
            const px = x + width * person.x;
            const py = y + height * person.y;
            const sway = Math.sin(person.phase) * width * 0.02;

            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(px + sway, py - height * 0.08, height * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + sway - width * 0.03, py - height * 0.03, width * 0.06, height * 0.15);

            if (person.armUp) {
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px + sway, py);
                ctx.lineTo(px + sway, py - height * 0.15);
                ctx.stroke();
            }
        });
    }
}

class PhonePacerVignette {
    constructor() {
        this.x = 0.2;
        this.direction = 1;
        this.gesturePhase = 0;
    }

    update(deltaTime) {
        this.x += this.direction * deltaTime * 0.2;
        this.gesturePhase += deltaTime * 2;

        if (this.x > 0.8) {
            this.x = 0.8;
            this.direction = -1;
        } else if (this.x < 0.2) {
            this.x = 0.2;
            this.direction = 1;
        }
    }

    render(ctx, x, y, width, height) {
        const px = x + width * this.x;
        const py = y + height * 0.5;

        ctx.save();
        ctx.translate(px, py);
        if (this.direction < 0) ctx.scale(-1, 1);

        // Person
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -height * 0.15, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-width * 0.05, -height * 0.08, width * 0.1, height * 0.25);

        // Phone at ear
        ctx.fillStyle = '#333333';
        ctx.fillRect(width * 0.05, -height * 0.18, width * 0.04, height * 0.08);

        // Free arm gesture
        const armWave = Math.sin(this.gesturePhase) * 0.3;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-width * 0.05, -height * 0.05);
        ctx.lineTo(-width * 0.12, -height * 0.05 + armWave * height * 0.1);
        ctx.stroke();

        ctx.restore();
    }
}

class SleepingVignette {
    constructor() {
        this.breathPhase = 0;
        this.zs = [];
        this.zTimer = 0;
    }

    update(deltaTime) {
        this.breathPhase += deltaTime * 0.5;
        this.zTimer += deltaTime;

        if (this.zTimer > 2) {
            this.zTimer = 0;
            this.zs.push({
                x: 0.55,
                y: 0.35,
                size: randomInt(0, 2),
                life: 1
            });
        }

        this.zs = this.zs.filter(z => {
            z.y -= deltaTime * 0.1;
            z.life -= deltaTime * 0.4;
            return z.life > 0;
        });
    }

    render(ctx, x, y, width, height) {
        // Bed
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + width * 0.2, y + height * 0.5, width * 0.6, height * 0.15);

        // Blanket
        ctx.fillStyle = '#4169e1';
        ctx.fillRect(x + width * 0.25, y + height * 0.5, width * 0.5, height * 0.1);

        // Person (breathing)
        const breathe = Math.sin(this.breathPhase) * 0.02;
        ctx.fillStyle = '#f4c2a8';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.55, y + height * 0.45,
                    width * 0.08, height * (0.06 + breathe), 0, 0, Math.PI * 2);
        ctx.fill();

        // Pillow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + width * 0.45, y + height * 0.48, width * 0.15, height * 0.05);

        // Z's
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        this.zs.forEach(z => {
            ctx.globalAlpha = z.life;
            const size = [16, 20, 24][z.size];
            ctx.font = `bold ${size}px Arial`;
            ctx.fillText('Z', x + width * z.x, y + height * z.y);
        });
        ctx.globalAlpha = 1;
    }
}

class YogaVignette {
    constructor() {
        this.breathPhase = 0;
        this.stretchTimer = 0;
        this.isStretching = false;
        this.stretchProgress = 0;
    }

    update(deltaTime) {
        this.breathPhase += deltaTime * 0.3;
        this.stretchTimer += deltaTime;

        if (this.stretchTimer > 15 && !this.isStretching) {
            this.isStretching = true;
            this.stretchProgress = 0;
            this.stretchTimer = 0;
        }

        if (this.isStretching) {
            this.stretchProgress += deltaTime * 0.2;
            if (this.stretchProgress >= 2) {
                this.isStretching = false;
                this.stretchProgress = 0;
            }
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height * 0.6;

        // Mat
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(x + width * 0.2, y + height * 0.7, width * 0.6, height * 0.05);

        // Person in lotus position
        const breathe = Math.sin(this.breathPhase) * 0.01;
        const stretch = this.isStretching ?
            Math.sin(Math.min(this.stretchProgress, 1) * Math.PI) : 0;

        ctx.fillStyle = '#1a1a1a';

        // Head
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.2 - stretch * height * 0.1,
                height * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillRect(centerX - width * 0.06, centerY - height * 0.15 + breathe * height,
                     width * 0.12, height * (0.2 + breathe));

        // Arms
        if (stretch > 0.5) {
            // Arms overhead
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - height * 0.1);
            ctx.lineTo(centerX, centerY - height * 0.3);
            ctx.stroke();
        } else {
            // Arms at sides
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.06, centerY);
            ctx.lineTo(centerX - width * 0.15, centerY + height * 0.05);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + width * 0.06, centerY);
            ctx.lineTo(centerX + width * 0.15, centerY + height * 0.05);
            ctx.stroke();
        }

        // Legs (crossed)
        ctx.fillRect(centerX - width * 0.12, centerY + height * 0.05,
                     width * 0.24, height * 0.08);
    }
}

class BathtubVignette {
    constructor() {
        this.ripplePhase = 0;
        this.bubbles = [];
        this.armTimer = 0;
        this.armVisible = false;
    }

    update(deltaTime) {
        this.ripplePhase += deltaTime * 2;
        this.armTimer += deltaTime;

        if (this.armTimer > random(5, 10)) {
            this.armTimer = 0;
            this.armVisible = !this.armVisible;
        }

        // Add bubbles
        if (Math.random() < 0.2) {
            this.bubbles.push({
                x: random(0.2, 0.8),
                y: 0.55,
                speed: random(0.05, 0.1),
                size: random(3, 8)
            });
        }

        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= bubble.speed * deltaTime;
            return bubble.y > 0.25;
        });
    }

    render(ctx, x, y, width, height) {
        // Tub
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + width * 0.15, y + height * 0.5, width * 0.7, height * 0.35);

        // Water with ripple
        const ripple = Math.sin(this.ripplePhase) * 3;
        ctx.fillStyle = '#add8e6';
        ctx.fillRect(x + width * 0.15, y + height * 0.55 + ripple,
                     width * 0.7, height * 0.25);

        // Bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(x + width * bubble.x, y + height * bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Arm (occasionally visible)
        if (this.armVisible) {
            ctx.fillStyle = '#f4c2a8';
            ctx.fillRect(x + width * 0.7, y + height * 0.5, width * 0.08, height * 0.15);
        }
    }
}

class GamerVignette {
    constructor() {
        this.leanPhase = 0;
        this.buttonPhase = 0;
        this.victoryTimer = 0;
        this.isVictory = false;
    }

    update(deltaTime) {
        this.leanPhase += deltaTime * 1.5;
        this.buttonPhase += deltaTime * 10;
        this.victoryTimer += deltaTime;

        if (this.victoryTimer > 20 && !this.isVictory) {
            this.isVictory = true;
            this.victoryTimer = 0;
        }

        if (this.isVictory && this.victoryTimer > 2) {
            this.isVictory = false;
            this.victoryTimer = 0;
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height * 0.55;
        const lean = this.isVictory ? 0 : Math.sin(this.leanPhase) * 0.05;

        // Screen glow
        const gradient = ctx.createRadialGradient(centerX, y + height * 0.3, 0,
                                                   centerX, y + height * 0.3, width * 0.5);
        gradient.addColorStop(0, 'rgba(77, 148, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(77, 148, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(lean);

        if (this.isVictory) {
            // Victory pose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, -height * 0.2, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-width * 0.06, -height * 0.13, width * 0.12, height * 0.25);

            // Arms up
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-width * 0.06, -height * 0.1);
            ctx.lineTo(-width * 0.12, -height * 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(width * 0.06, -height * 0.1);
            ctx.lineTo(width * 0.12, -height * 0.25);
            ctx.stroke();
        } else {
            // Gaming pose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, -height * 0.15, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-width * 0.06, -height * 0.08, width * 0.12, height * 0.25);

            // Controller
            ctx.fillStyle = '#333333';
            ctx.fillRect(-width * 0.1, height * 0.05, width * 0.2, height * 0.08);

            // Button presses (color change)
            const buttonBlink = Math.sin(this.buttonPhase) > 0;
            ctx.fillStyle = buttonBlink ? '#ff0000' : '#660000';
            ctx.beginPath();
            ctx.arc(width * 0.06, height * 0.09, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class LateNightWorkerVignette {
    constructor() {
        this.typingPhase = 0;
        this.pauseTimer = 0;
        this.isPaused = false;
        this.screenLines = [];
        this.stretchTimer = 0;
        this.isStretching = false;

        for (let i = 0; i < 5; i++) {
            this.screenLines.push(random(0, 1));
        }
    }

    update(deltaTime) {
        if (!this.isPaused) {
            this.typingPhase += deltaTime * 8;
        }

        this.pauseTimer += deltaTime;
        if (this.pauseTimer > (this.isPaused ? 2 : random(5, 10))) {
            this.pauseTimer = 0;
            this.isPaused = !this.isPaused;
        }

        this.stretchTimer += deltaTime;
        if (this.stretchTimer > 25) {
            this.isStretching = true;
            if (this.stretchTimer > 28) {
                this.isStretching = false;
                this.stretchTimer = 0;
            }
        }

        // Update screen
        if (Math.random() < 0.05) {
            this.screenLines[randomInt(0, 4)] = random(0, 1);
        }
    }

    render(ctx, x, y, width, height) {
        // Desk
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + width * 0.1, y + height * 0.6, width * 0.8, height * 0.05);

        // Monitor
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + width * 0.25, y + height * 0.3, width * 0.5, height * 0.35);

        // Screen glow
        const gradient = ctx.createRadialGradient(
            x + width * 0.5, y + height * 0.47, 0,
            x + width * 0.5, y + height * 0.47, width * 0.4
        );
        gradient.addColorStop(0, 'rgba(77, 148, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(77, 148, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Screen content
        ctx.fillStyle = COLORS.windowLight.tvGlow;
        ctx.fillRect(x + width * 0.27, y + height * 0.32, width * 0.46, height * 0.3);

        ctx.strokeStyle = '#003366';
        ctx.lineWidth = 2;
        this.screenLines.forEach((linePos, i) => {
            ctx.beginPath();
            ctx.moveTo(x + width * 0.28, y + height * (0.34 + i * 0.05));
            ctx.lineTo(x + width * (0.28 + linePos * 0.4), y + height * (0.34 + i * 0.05));
            ctx.stroke();
        });

        // Person
        const personX = x + width * 0.5;
        const personY = y + height * 0.7;

        if (this.isStretching) {
            // Stretching pose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(personX, personY - height * 0.15, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(personX - width * 0.06, personY - height * 0.08,
                        width * 0.12, height * 0.2);

            // Arms stretching
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(personX - width * 0.06, personY - height * 0.05);
            ctx.lineTo(personX - width * 0.15, personY - height * 0.1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(personX + width * 0.06, personY - height * 0.05);
            ctx.lineTo(personX + width * 0.15, personY - height * 0.1);
            ctx.stroke();
        } else {
            // Typing pose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(personX, personY - height * 0.12, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(personX - width * 0.06, personY - height * 0.05,
                        width * 0.12, height * 0.2);

            // Typing hands
            const handBob = this.isPaused ? 0 : Math.sin(this.typingPhase) * 3;
            ctx.fillRect(personX - width * 0.08, personY + height * 0.12 + handBob,
                        width * 0.16, height * 0.03);
        }
    }
}

class MagicianVignette {
    constructor() {
        this.frame = 0;
        this.objectVisible = false;
        this.poofParticles = [];
    }

    update(deltaTime) {
        this.frame += deltaTime * 30;
        if (this.frame >= 120) this.frame = 0;

        // Determine object visibility
        if (this.frame >= 30 && this.frame < 90) {
            if (!this.objectVisible && this.frame >= 45 && this.frame < 50) {
                // Create poof
                for (let i = 0; i < 10; i++) {
                    this.poofParticles.push({
                        x: 0.5,
                        y: 0.45,
                        vx: random(-0.3, 0.3),
                        vy: random(-0.3, 0.3),
                        life: 1
                    });
                }
            }
            this.objectVisible = this.frame >= 45;
        } else {
            if (this.objectVisible && this.frame >= 90 && this.frame < 95) {
                // Create poof
                for (let i = 0; i < 10; i++) {
                    this.poofParticles.push({
                        x: 0.5,
                        y: 0.45,
                        vx: random(-0.3, 0.3),
                        vy: random(-0.3, 0.3),
                        life: 1
                    });
                }
            }
            this.objectVisible = false;
        }

        // Update poof particles
        this.poofParticles = this.poofParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 2;
            return p.life > 0;
        });
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height * 0.6;

        // Magician
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.2, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(centerX - width * 0.06, centerY - height * 0.13,
                     width * 0.12, height * 0.25);

        // Hat
        const hatX = centerX;
        const hatY = centerY - height * 0.05;
        const hatTilt = this.frame < 30 ? Math.PI / 6 : 0;

        ctx.save();
        ctx.translate(hatX, hatY);
        ctx.rotate(hatTilt);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.12, height * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-width * 0.08, -height * 0.15, width * 0.16, height * 0.15);
        ctx.restore();

        // Rabbit/object in hat
        if (this.objectVisible) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, hatY - height * 0.08, width * 0.05, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.ellipse(centerX - width * 0.03, hatY - height * 0.12,
                       width * 0.02, height * 0.06, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(centerX + width * 0.03, hatY - height * 0.12,
                       width * 0.02, height * 0.06, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Poof particles
        ctx.fillStyle = '#ffff99';
        this.poofParticles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(x + width * p.x, y + height * p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Waving arm
        if (this.frame >= 15 && this.frame < 45) {
            const waveAngle = Math.sin((this.frame - 15) / 30 * Math.PI * 4) * 0.5;
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX + width * 0.06, centerY - height * 0.05);
            ctx.lineTo(centerX + width * 0.15, centerY - height * 0.05 + Math.sin(waveAngle) * height * 0.1);
            ctx.stroke();
        }
    }
}

class JugglerVignette {
    constructor() {
        this.balls = [
            { phase: 0, color: '#ff0000' },
            { phase: Math.PI * 2 / 3, color: '#00ff00' },
            { phase: Math.PI * 4 / 3, color: '#0000ff' }
        ];
        this.dropped = false;
        this.dropTimer = 0;
        this.armsUp = false;
    }

    update(deltaTime) {
        this.balls.forEach(ball => {
            ball.phase += deltaTime * Math.PI;
            if (ball.phase >= Math.PI * 2) ball.phase -= Math.PI * 2;
        });

        this.dropTimer += deltaTime;
        if (this.dropTimer > 30 && !this.dropped && Math.random() < 0.01) {
            this.dropped = true;
            this.armsUp = true;
            this.dropTimer = 0;
        }

        if (this.dropped && this.dropTimer > 2) {
            this.dropped = false;
            this.armsUp = false;
            this.dropTimer = 0;
        }
    }

    render(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height * 0.6;

        // Person
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.15, height * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(centerX - width * 0.06, centerY - height * 0.08,
                     width * 0.12, height * 0.25);

        if (this.armsUp) {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.06, centerY);
            ctx.lineTo(centerX - width * 0.12, centerY - height * 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + width * 0.06, centerY);
            ctx.lineTo(centerX + width * 0.12, centerY - height * 0.15);
            ctx.stroke();
        }

        // Balls
        if (!this.dropped) {
            this.balls.forEach(ball => {
                const t = ball.phase / (Math.PI * 2);
                let ballX, ballY;

                if (t < 0.33) {
                    // Left to top
                    const localT = t / 0.33;
                    ballX = centerX - width * 0.15 + localT * width * 0.15;
                    ballY = centerY + height * 0.1 - Math.sin(localT * Math.PI) * height * 0.3;
                } else if (t < 0.66) {
                    // Top to right
                    const localT = (t - 0.33) / 0.33;
                    ballX = centerX + localT * width * 0.15;
                    ballY = centerY - height * 0.2 + Math.sin(localT * Math.PI) * height * 0.3;
                } else {
                    // Right to left
                    const localT = (t - 0.66) / 0.34;
                    ballX = centerX + width * 0.15 - localT * width * 0.3;
                    ballY = centerY + height * 0.1 - Math.sin(localT * Math.PI) * height * 0.05;
                }

                ctx.fillStyle = ball.color;
                ctx.beginPath();
                ctx.arc(ballX, ballY, width * 0.04, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
}

class TelescopeVignette {
    constructor() {
        this.excited = false;
        this.exciteTimer = 0;
    }

    update(deltaTime) {
        if (this.excited) {
            this.exciteTimer += deltaTime;
            if (this.exciteTimer > 3) {
                this.excited = false;
                this.exciteTimer = 0;
            }
        }
    }

    reactToUFO() {
        this.excited = true;
        this.exciteTimer = 0;
    }

    render(ctx, x, y, width, height) {
        const baseX = x + width * 0.4;
        const baseY = y + height * 0.8;

        // Telescope tripod
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(baseX - width * 0.1, baseY);
        ctx.lineTo(baseX, baseY - height * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(baseX + width * 0.1, baseY);
        ctx.lineTo(baseX, baseY - height * 0.3);
        ctx.stroke();

        // Telescope tube
        ctx.fillStyle = '#808080';
        ctx.save();
        ctx.translate(baseX, baseY - height * 0.3);
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(0, -height * 0.03, width * 0.25, height * 0.06);
        ctx.restore();

        // Person
        const personX = x + width * 0.65;
        const personY = y + height * 0.65;

        if (this.excited) {
            // Excited pose
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(personX, personY - height * 0.15, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(personX - width * 0.06, personY - height * 0.08,
                        width * 0.12, height * 0.25);

            // Arms up
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(personX - width * 0.06, personY);
            ctx.lineTo(personX - width * 0.12, personY - height * 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(personX + width * 0.06, personY);
            ctx.lineTo(personX + width * 0.12, personY - height * 0.15);
            ctx.stroke();
        } else {
            // Looking through telescope
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(personX - width * 0.1, personY - height * 0.1,
                   height * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(personX - width * 0.16, personY - height * 0.03,
                        width * 0.12, height * 0.25);
        }
    }
}

class ShadowPuppetVignette {
    constructor() {
        this.shapeIndex = 0;
        this.shapeTimer = 0;
        this.transitionProgress = 0;
        this.shapes = ['bird', 'dog', 'rabbit'];
    }

    update(deltaTime) {
        this.shapeTimer += deltaTime;

        if (this.shapeTimer > 2) {
            this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime * 2);

            if (this.transitionProgress >= 1) {
                this.shapeIndex = (this.shapeIndex + 1) % this.shapes.length;
                this.shapeTimer = 0;
                this.transitionProgress = 0;
            }
        }
    }

    render(ctx, x, y, width, height) {
        // Light source
        ctx.fillStyle = '#ffff99';
        ctx.beginPath();
        ctx.arc(x + width * 0.2, y + height * 0.7, width * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Hands (simplified)
        const handX = x + width * 0.35;
        const handY = y + height * 0.5;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(handX, handY, width * 0.1, height * 0.15);

        // Shadow on wall
        const shadowX = x + width * 0.65;
        const shadowY = y + height * 0.4;
        const shape = this.shapes[this.shapeIndex];

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.save();
        ctx.translate(shadowX, shadowY);

        if (shape === 'bird') {
            // Bird shape
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-width * 0.1, -height * 0.08);
            ctx.lineTo(-width * 0.15, 0);
            ctx.lineTo(-width * 0.1, height * 0.08);
            ctx.lineTo(0, 0);
            ctx.lineTo(width * 0.1, -height * 0.08);
            ctx.lineTo(width * 0.15, 0);
            ctx.lineTo(width * 0.1, height * 0.08);
            ctx.closePath();
            ctx.fill();
        } else if (shape === 'dog') {
            // Dog shape
            ctx.fillRect(-width * 0.1, -height * 0.05, width * 0.2, height * 0.1);
            ctx.fillRect(-width * 0.12, -height * 0.08, width * 0.08, height * 0.08);
            ctx.fillRect(-width * 0.15, -height * 0.12, width * 0.05, height * 0.06);
        } else {
            // Rabbit shape
            ctx.beginPath();
            ctx.arc(0, 0, width * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-width * 0.02, -height * 0.15, width * 0.02, height * 0.12);
            ctx.fillRect(width * 0.01, -height * 0.15, width * 0.02, height * 0.12);
        }

        ctx.restore();
    }
}

class DiscoVignette {
    constructor() {
        this.rotation = 0;
        this.spots = [];
        for (let i = 0; i < 15; i++) {
            this.spots.push({
                x: random(0.1, 0.9),
                y: random(0.1, 0.9),
                color: this.randomColor(),
                colorTimer: 0
            });
        }
    }

    randomColor() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        return colors[randomInt(0, colors.length - 1)];
    }

    update(deltaTime) {
        this.rotation += deltaTime * Math.PI / 2;

        this.spots.forEach(spot => {
            spot.colorTimer += deltaTime;
            if (spot.colorTimer > 1) {
                spot.color = this.randomColor();
                spot.colorTimer = 0;
            }

            // Recalculate position based on ball rotation
            const angle = this.rotation + spot.x * Math.PI * 2;
            const newX = 0.5 + Math.cos(angle) * 0.3;
            const newY = 0.3 + Math.sin(spot.y * Math.PI) * 0.4;
            spot.x = lerp(spot.x, newX, deltaTime * 2);
            spot.y = lerp(spot.y, newY, deltaTime * 2);
        });
    }

    render(ctx, x, y, width, height) {
        const ballX = x + width / 2;
        const ballY = y + height * 0.3;
        const ballRadius = width * 0.12;

        // Mirror ball
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Facets
        const facetCount = 20;
        for (let i = 0; i < facetCount; i++) {
            const angle = (i / facetCount) * Math.PI * 2 + this.rotation;
            const fx = ballX + Math.cos(angle) * ballRadius * 0.7;
            const fy = ballY + Math.sin(angle) * ballRadius * 0.7;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx - 3, fy - 3, 6, 6);
        }

        // Light spots
        this.spots.forEach(spot => {
            ctx.fillStyle = spot.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x + width * spot.x, y + height * spot.y, width * 0.04, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

// ===== SPECIAL EFFECTS CLASSES =====

class UFOEffect {
    constructor() {
        this.x = -0.1;
        this.y = random(0.1, 0.2);
        this.wobblePhase = 0;
        this.beamPulse = 0;
        this.active = true;
        this.duration = TIMING.ufo.duration;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime * 1000;
        this.x += deltaTime / (this.duration / 1000);
        this.wobblePhase += deltaTime * 4;
        this.beamPulse += deltaTime * 3;

        if (this.x > 1.1) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        const xPos = canvasWidth * this.x;
        const yPos = canvasHeight * this.y + Math.sin(this.wobblePhase) * 20;

        // UFO body
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(xPos, yPos, 40, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // UFO dome
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.ellipse(xPos, yPos - 10, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lights
        const colors = ['#ff00ff', '#00ffff'];
        for (let i = 0; i < 4; i++) {
            const lightX = xPos - 30 + i * 20;
            ctx.fillStyle = colors[i % 2];
            ctx.beginPath();
            ctx.arc(lightX, yPos + 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beam
        const beamAlpha = 0.25 + Math.sin(this.beamPulse) * 0.15;
        ctx.fillStyle = `rgba(159, 255, 230, ${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(xPos - 15, yPos + 15);
        ctx.lineTo(xPos - 40, canvasHeight * 0.4);
        ctx.lineTo(xPos + 40, canvasHeight * 0.4);
        ctx.lineTo(xPos + 15, yPos + 15);
        ctx.closePath();
        ctx.fill();
    }
}

class PoliceEffect {
    constructor() {
        this.x = 0;
        this.direction = Math.random() < 0.5 ? 1 : -1;
        if (this.direction < 0) this.x = 1;
        this.flashPhase = 0;
        this.active = true;
        this.duration = TIMING.police.duration;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime * 1000;
        this.x += this.direction * deltaTime / (this.duration / 1000);
        this.flashPhase += deltaTime * 10;

        if ((this.direction > 0 && this.x > 1.1) || (this.direction < 0 && this.x < -0.1)) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        const xPos = canvasWidth * this.x;
        const yPos = canvasHeight;

        // Flashing lights
        const flashState = Math.floor(this.flashPhase * 3) % 3;

        if (flashState === 0) {
            // Red on
            ctx.fillStyle = COLORS.effects.policeRed;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(xPos - 50, yPos - 20, 30, 0, Math.PI * 2);
            ctx.fill();
        } else if (flashState === 2) {
            // Blue on
            ctx.fillStyle = COLORS.effects.policeBlue;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(xPos + 50, yPos - 20, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

class ShootingStarEffect {
    constructor() {
        this.startX = random(0, 0.5);
        this.startY = random(0, 0.3);
        this.endX = this.startX + random(0.3, 0.6);
        this.endY = this.startY + random(0.1, 0.3);
        this.progress = 0;
        this.active = true;
        this.duration = TIMING.shootingStar.duration;
    }

    update(deltaTime) {
        this.progress += deltaTime / (this.duration / 1000);
        if (this.progress >= 1) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        const x = lerp(this.startX * canvasWidth, this.endX * canvasWidth, this.progress);
        const y = lerp(this.startY * canvasHeight, this.endY * canvasHeight, this.progress);

        // Star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        for (let i = 1; i <= 5; i++) {
            const trailProgress = Math.max(0, this.progress - i * 0.02);
            const tx = lerp(this.startX * canvasWidth, this.endX * canvasWidth, trailProgress);
            const ty = lerp(this.startY * canvasHeight, this.endY * canvasHeight, trailProgress);

            ctx.globalAlpha = 1 - i * 0.2;
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class HelicopterEffect {
    constructor() {
        this.x = Math.random() < 0.5 ? -0.1 : 1.1;
        this.direction = this.x < 0.5 ? 1 : -1;
        this.y = random(0.3, 0.5);
        this.spotlightX = this.x;
        this.active = true;
        this.duration = TIMING.helicopter.duration;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime * 1000;
        this.x += this.direction * deltaTime / (this.duration / 1000) * 1.2;
        this.spotlightX = this.x;

        if ((this.direction > 0 && this.x > 1.1) || (this.direction < 0 && this.x < -0.1)) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight, buildingBounds) {
        if (!buildingBounds) return;

        const spotX = canvasWidth * this.spotlightX;
        const spotY = buildingBounds.y + this.y * buildingBounds.height;

        // Spotlight
        const gradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 150);
        gradient.addColorStop(0, 'rgba(255, 255, 204, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 204, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 150, 0, Math.PI * 2);
        ctx.fill();
    }

    getSpotlightPosition() {
        return { x: this.spotlightX, y: this.y };
    }
}

class LightningEffect {
    constructor() {
        this.phase = 0;
        this.active = true;
        this.duration = TIMING.lightning.duration;
        this.flashDuration = 100; // ms
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime * 1000;
        this.phase = this.elapsed / this.duration;

        if (this.elapsed >= this.duration) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (this.elapsed < this.flashDuration) {
            // Flash
            const alpha = 1 - (this.elapsed / this.flashDuration);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.6);

            // Lightning bolt
            if (alpha > 0.5) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                const startX = canvasWidth * random(0.3, 0.7);
                ctx.moveTo(startX, 0);
                let currentX = startX;
                let currentY = 0;

                for (let i = 0; i < 5; i++) {
                    currentX += random(-50, 50);
                    currentY += canvasHeight * 0.12;
                    ctx.lineTo(currentX, currentY);
                }
                ctx.stroke();
            }
        }
    }
}

class AirplaneEffect {
    constructor() {
        this.x = -0.1;
        this.y = random(0.15, 0.25);
        this.blinkPhase = 0;
        this.active = true;
        this.duration = TIMING.airplane.duration;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime * 1000;
        this.x += deltaTime / (this.duration / 1000);
        this.blinkPhase += deltaTime;

        if (this.x > 1.1) {
            this.active = false;
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        const xPos = canvasWidth * this.x;
        const yPos = canvasHeight * this.y;

        // Plane silhouette
        ctx.fillStyle = '#808080';
        // Body
        ctx.fillRect(xPos - 20, yPos - 3, 40, 6);
        // Wings
        ctx.fillRect(xPos - 5, yPos - 12, 10, 24);
        // Tail
        ctx.beginPath();
        ctx.moveTo(xPos - 20, yPos);
        ctx.lineTo(xPos - 28, yPos - 8);
        ctx.lineTo(xPos - 20, yPos - 3);
        ctx.fill();

        // Blinking lights
        const blink = Math.floor(this.blinkPhase * 2) % 2;

        if (blink === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(xPos - 5, yPos - 12, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(xPos + 5, yPos + 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ===== EVENT SCHEDULER =====

class EventScheduler {
    constructor() {
        this.eventQueue = [];
        this.activeEffect = null;
        this.windowToggleTimer = 0;
        this.initialize();
    }

    initialize() {
        // Schedule initial events
        Object.keys(TIMING).forEach(eventType => {
            if (eventType !== 'windowToggle') {
                const delay = random(TIMING[eventType].min, TIMING[eventType].max);
                this.scheduleEvent(eventType, delay);
            }
        });
    }

    scheduleEvent(type, delay) {
        this.eventQueue.push({
            type,
            time: Date.now() + delay
        });
        this.eventQueue.sort((a, b) => a.time - b.time);
    }

    update(deltaTime) {
        const now = Date.now();

        // Check window toggle
        this.windowToggleTimer += deltaTime * 1000;
        if (this.windowToggleTimer >= TIMING.windowToggle) {
            this.windowToggleTimer = 0;
            this.toggleRandomWindow();
        }

        // Update active effect
        if (this.activeEffect) {
            this.activeEffect.update(deltaTime);
            if (!this.activeEffect.active) {
                this.activeEffect = null;
            }
        }

        // Check event queue
        while (this.eventQueue.length > 0 && this.eventQueue[0].time <= now) {
            const event = this.eventQueue.shift();

            // Only trigger if no active effect
            if (!this.activeEffect) {
                this.triggerEvent(event.type);
            }

            // Reschedule
            const timing = TIMING[event.type];
            const nextDelay = random(timing.min, timing.max);
            this.scheduleEvent(event.type, nextDelay);
        }
    }

    triggerEvent(type) {
        switch (type) {
            case 'ufo':
                this.activeEffect = new UFOEffect();
                if (state.audioManager) {
                    state.audioManager.playSound('ufo-whoosh.mp3', 0.3);
                }
                // Trigger telescope reaction
                state.windows.forEach(win => {
                    if (win.vignette instanceof TelescopeVignette) {
                        win.vignette.reactToUFO();
                    }
                });
                break;
            case 'police':
                this.activeEffect = new PoliceEffect();
                if (state.audioManager) {
                    state.audioManager.playSound('police-siren.mp3', 0.3);
                }
                break;
            case 'shootingStar':
                this.activeEffect = new ShootingStarEffect();
                break;
            case 'helicopter':
                this.activeEffect = new HelicopterEffect();
                if (state.audioManager) {
                    const sound = state.audioManager.playSound('helicopter.mp3', 0.25, true);
                    if (sound) {
                        setTimeout(() => {
                            if (sound.source) sound.source.stop();
                        }, TIMING.helicopter.duration);
                    }
                }
                break;
            case 'lightning':
                this.activeEffect = new LightningEffect();
                if (state.audioManager) {
                    setTimeout(() => {
                        state.audioManager.playSound('thunder.mp3', 0.3);
                    }, 500);
                }
                break;
            case 'airplane':
                this.activeEffect = new AirplaneEffect();
                break;
        }
    }

    toggleRandomWindow() {
        if (state.windows.length === 0) return;

        // Count lit windows
        const litCount = state.windows.filter(w => w.isLit).length;

        // Always keep at least 15 lit
        if (litCount <= 15) {
            // Turn on a dark window
            const darkWindows = state.windows.filter(w => !w.isLit);
            if (darkWindows.length > 0) {
                const win = darkWindows[randomInt(0, darkWindows.length - 1)];
                win.isLit = true;
                win.fadeProgress = 0;
            }
        } else if (Math.random() < 0.2) {
            // Random chance to toggle a window
            const win = state.windows[randomInt(0, state.windows.length - 1)];
            win.isLit = !win.isLit;
            win.fadeProgress = 0;
        }
    }

    renderActiveEffect(ctx) {
        if (this.activeEffect) {
            this.activeEffect.render(ctx, state.width, state.height, state.building);
        }
    }
}

// ===== RENDERING FUNCTIONS =====

function renderSky(ctx) {
    const { width, height } = state;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLORS.sky.top);
    gradient.addColorStop(0.5, COLORS.sky.mid);
    gradient.addColorStop(1, COLORS.sky.horizon);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Stars
    state.stars.forEach(star => {
        const twinkle = star.twinkle ?
            (0.3 + 0.7 * (Math.sin(Date.now() / 1000 * star.twinkleSpeed) + 1) / 2) :
            star.opacity;

        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderCityscape(ctx) {
    const { width, height } = state;
    const cityscapeHeight = height * 0.15;
    const cityscapeY = height - cityscapeHeight;

    state.cityBuildings.forEach(building => {
        ctx.fillStyle = COLORS.cityscape;
        ctx.fillRect(building.x, cityscapeY + cityscapeHeight - building.height,
                     building.width, building.height);

        // Tiny windows
        building.windows.forEach(win => {
            ctx.fillStyle = win.color;
            ctx.fillRect(building.x + win.x, cityscapeY + cityscapeHeight - building.height + win.y,
                        2, 2);
        });
    });
}

function renderBuilding(ctx) {
    const { building } = state;

    // Building shadow/border
    ctx.fillStyle = COLORS.building.shadow;
    ctx.fillRect(building.x - 2, building.y - 2, building.width + 4, building.height + 4);

    // Building body
    ctx.fillStyle = COLORS.building.main;
    ctx.fillRect(building.x, building.y, building.width, building.height);

    // Roof
    ctx.fillStyle = COLORS.building.shadow;
    ctx.fillRect(building.x, building.y - 20, building.width, 20);
}

function renderWindows(ctx, deltaTime) {
    state.windows.forEach(win => {
        // Update fade
        if (win.fadeProgress < 1) {
            win.fadeProgress = Math.min(1, win.fadeProgress + deltaTime * 2);
        }

        const fadeT = easeInOutQuad(win.fadeProgress);
        const targetAlpha = win.isLit ? 1 : 0.1;
        const currentAlpha = lerp(win.isLit ? 0.1 : 1, targetAlpha, fadeT);

        // Window frame
        ctx.strokeStyle = COLORS.building.frame;
        ctx.lineWidth = 3;
        ctx.strokeRect(win.x, win.y, win.width, win.height);

        // Window glow (if lit)
        if (win.isLit && currentAlpha > 0.5) {
            const glowGradient = ctx.createRadialGradient(
                win.x + win.width / 2, win.y + win.height / 2, 0,
                win.x + win.width / 2, win.y + win.height / 2, win.width * 0.8
            );
            glowGradient.addColorStop(0, `rgba(255, 229, 180, ${currentAlpha * 0.3})`);
            glowGradient.addColorStop(1, 'rgba(255, 229, 180, 0)');

            ctx.fillStyle = glowGradient;
            ctx.fillRect(win.x - win.width * 0.3, win.y - win.height * 0.3,
                        win.width * 1.6, win.height * 1.6);
        }

        // Window background
        if (win.isLit) {
            const lightGradient = ctx.createRadialGradient(
                win.x + win.width / 2, win.y + win.height / 2, 0,
                win.x + win.width / 2, win.y + win.height / 2, win.width * 0.7
            );
            lightGradient.addColorStop(0, win.lightColor);
            lightGradient.addColorStop(1, COLORS.windowLight.warm);

            ctx.globalAlpha = currentAlpha;
            ctx.fillStyle = lightGradient;
            ctx.fillRect(win.x, win.y, win.width, win.height);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = COLORS.building.shadow;
            ctx.globalAlpha = currentAlpha * 0.5 + 0.5;
            ctx.fillRect(win.x, win.y, win.width, win.height);
            ctx.globalAlpha = 1;
        }

        // Render vignette
        if (win.isLit || currentAlpha > 0.3) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(win.x + 5, win.y + 5, win.width - 10, win.height - 10);
            ctx.clip();

            ctx.globalAlpha = currentAlpha;
            win.vignette.update(deltaTime);
            win.vignette.render(ctx, win.x + 5, win.y + 5, win.width - 10, win.height - 10);
            ctx.globalAlpha = 1;

            ctx.restore();
        }
    });
}

// ===== INITIALIZATION =====

function initializeCanvas() {
    state.canvas = document.getElementById('screensaverCanvas');
    state.ctx = state.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 200));
}

function resizeCanvas() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = window.devicePixelRatio || 1;

    state.canvas.width = state.width * state.dpr;
    state.canvas.height = state.height * state.dpr;
    state.canvas.style.width = `${state.width}px`;
    state.canvas.style.height = `${state.height}px`;

    state.ctx.scale(state.dpr, state.dpr);

    calculateLayout();
}

function calculateLayout() {
    const { width, height } = state;

    // Generate stars
    state.stars = [];
    const starCount = Math.floor(width / 20);
    for (let i = 0; i < starCount; i++) {
        state.stars.push({
            x: random(0, width),
            y: random(0, height * 0.6),
            size: random(1, 3),
            opacity: random(0.3, 1),
            twinkle: Math.random() < 0.2,
            twinkleSpeed: random(0.5, 2)
        });
    }

    // Generate cityscape buildings
    state.cityBuildings = [];
    let currentX = 0;
    while (currentX < width) {
        const buildingWidth = random(50, 200);
        const buildingHeight = random(100, 300);
        const windowCount = Math.floor(buildingWidth / 20) * Math.floor(buildingHeight / 30);

        const windows = [];
        for (let i = 0; i < windowCount; i++) {
            windows.push({
                x: random(5, buildingWidth - 7),
                y: random(10, buildingHeight - 12),
                color: Math.random() < 0.7 ?
                    COLORS.windowLight.warm :
                    COLORS.windowLight.tvGlow
            });
        }

        state.cityBuildings.push({
            x: currentX,
            width: buildingWidth,
            height: buildingHeight,
            windows
        });

        currentX += buildingWidth - random(0, 30); // Slight overlap
    }

    // Calculate building dimensions
    const buildingWidth = Math.max(600, Math.min(1200, width * 0.45));
    const buildingHeight = height * 0.65;
    const buildingX = (width - buildingWidth) / 2;
    const buildingY = height - buildingHeight - height * 0.15;

    state.building = {
        x: buildingX,
        y: buildingY,
        width: buildingWidth,
        height: buildingHeight
    };

    // Create windows
    const cols = 4;
    const rows = 6;
    const padding = 15;
    const margin = 30;

    const windowWidth = (buildingWidth - margin * 2 - padding * (cols - 1)) / cols;
    const windowHeight = (buildingHeight - margin * 2 - padding * (rows - 1)) / rows;

    state.windows = [];
    const vignetteClasses = [
        AerobicsVignette, TVWatcherVignette, ChefVignette, PlantEnthusiastVignette,
        ArtistVignette, ReadingVignette, CatLaserVignette, DogWaitingVignette,
        FishTankVignette, BirdCageVignette, DancingCoupleVignette, ArguingCoupleVignette,
        PartyVignette, PhonePacerVignette, SleepingVignette, YogaVignette,
        BathtubVignette, GamerVignette, LateNightWorkerVignette, MagicianVignette,
        JugglerVignette, TelescopeVignette, ShadowPuppetVignette, DiscoVignette
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const index = row * cols + col;
            const VignetteClass = vignetteClasses[index];

            const lightColors = [
                COLORS.windowLight.primary,
                COLORS.windowLight.warm,
                COLORS.windowLight.cool,
                COLORS.windowLight.tvGlow
            ];

            state.windows.push({
                x: buildingX + margin + col * (windowWidth + padding),
                y: buildingY + margin + row * (windowHeight + padding),
                width: windowWidth,
                height: windowHeight,
                vignette: new VignetteClass(),
                isLit: index < 20, // Start with 20 lit
                lightColor: index === 1 || index === 18 ?
                    COLORS.windowLight.tvGlow :
                    lightColors[Math.floor(Math.random() * 3)],
                fadeProgress: 1
            });
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== ANIMATION LOOP =====

function animate(currentTime) {
    const deltaTime = state.lastTime ? (currentTime - state.lastTime) / 1000 : 0;
    state.lastTime = currentTime;

    const ctx = state.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, state.width, state.height);

    // Render layers
    renderSky(ctx);

    // Render special effects that go behind building
    if (state.eventScheduler) {
        state.eventScheduler.update(deltaTime);
        state.eventScheduler.renderActiveEffect(ctx);
    }

    renderCityscape(ctx);
    renderBuilding(ctx);
    renderWindows(ctx, deltaTime);

    requestAnimationFrame(animate);
}

// ===== KEYBOARD CONTROLS =====

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            if (state.audioManager) {
                state.audioManager.toggleMute();
            }
        }
    });
}

// ===== STARTUP =====

async function init() {
    initializeCanvas();
    setupKeyboardControls();

    // Initialize audio
    state.audioManager = new AudioManager();
    await state.audioManager.init();

    // Initialize event scheduler
    state.eventScheduler = new EventScheduler();

    // Start animation
    requestAnimationFrame(animate);

    // Try to resume audio on first click (for autoplay policy)
    document.addEventListener('click', async () => {
        if (state.audioManager && state.audioManager.audioContext) {
            if (state.audioManager.audioContext.state === 'suspended') {
                await state.audioManager.audioContext.resume();
            }
        }
    }, { once: true });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
