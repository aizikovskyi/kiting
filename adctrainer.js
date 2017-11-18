/* eslint-env browser */

class ADCTrainer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d', { alpha: false });
        this.fps = 60;
        this.activeTarget = 0;   // 0 or 1
        this.targetsDisabled = false;
        this.targetsEnabledTime = 0;
        this.targetLastHitTime = 0;
        this.minDistance = 50;
        this.maxDistance = 150;
        this.maxAngularVelocity = 0.004;
        this.angularAccelAmount = 0.0001;
        this.maxRadialVelocity = 0.3;
        this.radialAccelAmount = 0.001;

        
        this.targetRadius = 20;
        
        this.activeTargetColor = { r:0xff, g:0x45, b:0x00 };
        this.passiveTargetColor = { r:0x40, g:0x40, b:0x40 };
        this.colorTransitionTime = 100;
        
        this.score = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.gameStarted = false;
        this.scoreGoal = 50;
        
        this.targetPair = {
            angle: Math.random() * Math.PI * 2,
            distance: 100,
            angularVelocity: 0,  // in rad
            radialVelocity: 0,
            angularAccel: 0,     // -1, 0, 1
            radialAccel: 0       // -1, 0, 1
        };
        
        window.oncontextmenu = function() {
            return false;
        };
        
        this.canvas.oncontextmenu = function() {
            return false;
        }
        
        this.canvas.addEventListener('mousedown', (evt) => {
            evt.preventDefault();
            if (this.targetsDisabled) {
                return;
            }
            const targetCoords = this.targetCoords(this.activeTarget);
            const distance = Math.sqrt(Math.pow(evt.clientX - targetCoords.x, 2) + Math.pow(evt.clientY - targetCoords.y, 2));
            if (distance <= this.targetRadius) {
                if (!this.gameStarted) {
                    this.gameStarted = true;
                    this.startTime = Date.now();
                    this.score = 0;
                }
                this.activeTarget = -(this.activeTarget - 1);
                this.targetLastHitTime = Date.now();
                this.score += 1;
                
                if (this.score == this.scoreGoal) {
                    this.gameStarted = false;
                    this.endTime = Date.now();
                    this.targetsDisabled = true;
                    this.targetsEnabledTime = Date.now() + 3000;
                }
            }
            else {
                // missed an active target
                this.targetsDisabled = true;
                this.targetsEnabledTime = Date.now() + 1000;
            }
        });
        
        this.start();
    }
    
    start() {
        this.mainLoopInterval = window.setInterval(() => this.mainLoop(), 1000 / this.fps);
    }
    
    showText() {
        this.context.font = '24px Arial';
        this.context.fillStyle = 'Yellow';
        this.context.textAlign = 'center';
        this.context.fillText(`${this.score} / ${this.scoreGoal}`, (this.canvas.width / 2.0), (this.canvas.height / 2.0) - 6);
        
        let secondsElapsed = 0;
        if (this.gameStarted) {
            secondsElapsed = (Date.now() - this.startTime) / 1000.0;
        }
        else {
            secondsElapsed = (this.endTime - this.startTime) / 1000.0;
        }
        if (secondsElapsed !== 0) {
            const secondsLabel = `${secondsElapsed.toFixed(2)}s`;
            this.context.fillText(secondsLabel, (this.canvas.width / 2.0), (this.canvas.height / 2.0) + 24);
        }
        else {
            this.context.fillText('click the red target', (this.canvas.width / 2.0), (this.canvas.height / 2.0) + 24);
        }
    }
    
    targetCoords(targetId) {
        // if (targetId == 1) {
        //     return {
        //         x: (this.canvas.width / 2.0),
        //         y: (this.canvas.height / 2.0)
        //     };
        // }
        let angle = this.targetPair.angle + (Math.PI * targetId);
        let distance = this.targetPair.distance;
        let x = Math.cos(angle) * distance;
        let y = Math.sin(angle) * distance;
        x += (this.canvas.width / 2.0);
        y += (this.canvas.height / 2.0);
        return {
            x: x,
            y: y
        };
    }
    
    intermediateColor(color1, color2, fraction1) {
        const r = color1.r * fraction1 + color2.r * (1 - fraction1);
        const g = color1.g * fraction1 + color2.g * (1 - fraction1);
        const b = color1.b * fraction1 + color2.b * (1 - fraction1);
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

    }
    
    mainLoop() {
        if (this.targetsDisabled && Date.now() > this.targetsEnabledTime) {
            this.targetsDisabled = false;
            this.activeTarget = Math.floor(Math.random() * 2);
        }
        if (Math.random() < 0.05) {
            this.targetPair.angularAccel = Math.floor(Math.random() * 3) - 1;
        }
        if (Math.random() < 0.05) {
            const distanceFraction = (this.targetPair.distance - this.minDistance) / (this.maxDistance - this.minDistance);
            const r = Math.random();
            if (r < distanceFraction / 2.0) {
                this.targetPair.radialAccel = -1;
            }
            else if (r > 1 - ((1 - distanceFraction) / 2.0)) {
                this.targetPair.radialAccel = 1;
            }
            else {
                this.targetPair.radialAccel = 0;
            }
            //this.targetPair.radialAccel = Math.floor(Math.random() * 3) - 1;
        }
        
        this.targetPair.radialVelocity += (this.targetPair.radialAccel * this.radialAccelAmount);
        if (this.targetPair.radialVelocity > this.maxRadialVelocity) {
            this.targetPair.radialVelocity = this.maxRadialVelocity;
        }
        if (this.targetPair.radialVelocity < -this.maxRadialVelocity) {
            this.targetPair.radialVelocity = -this.maxRadialVelocity;
        }
        
        this.targetPair.distance += this.targetPair.radialVelocity;
        if (this.targetPair.distance > this.maxDistance) {
            this.targetPair.distance = this.maxDistance;
        }
        if (this.targetPair.distance < this.minDistance) {
            this.targetPair.distance = this.minDistance;
        }
        
        this.targetPair.angularVelocity += (this.targetPair.angularAccel * this.angularAccelAmount);
        if (this.targetPair.angularVelocity > this.maxAngularVelocity) {
            this.targetPair.angularVelocity = this.maxAngularVelocity;
        }
        if (this.targetPair.angularVelocity < -this.maxAngularVelocity) {
            this.targetPair.angularVelocity = -this.maxAngularVelocity;
        }
        
        this.targetPair.angle += this.targetPair.angularVelocity; // * 100.0 / this.targetPair.distance;
        
        this.draw();
    }
    
    clearCanvas() {
        this.context.fillStyle = 'DarkGreen';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawTarget(targetId, color) {
        const coords = this.targetCoords(targetId);
        let x = coords.x;
        let y = coords.y;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, this.targetRadius, 0, Math.PI * 2, false);
        this.context.fill();
    }
    
    draw() {
        this.clearCanvas();
        this.showText();
        for (let targetId = 0; targetId <= 1; targetId++) {
            let color = 'Yellow';
            if (!this.targetsDisabled) {
                let fractionSinceTransition = Math.min(Date.now() - this.targetLastHitTime, this.colorTransitionTime) / this.colorTransitionTime;
                if (this.activeTarget != targetId) {
                    fractionSinceTransition = 1 - fractionSinceTransition;
                }
                color = this.intermediateColor(this.activeTargetColor, this.passiveTargetColor, fractionSinceTransition);
            }
            else {
                if (!this.gameStarted) {
                    color = 'Aquamarine';
                }
            }
            this.drawTarget(targetId, color);            
        }
    }
    
    updateSize() {
        this.draw();
    }
    
    
}
