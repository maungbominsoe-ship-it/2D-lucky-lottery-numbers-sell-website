// Snow/Stars falling effect
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('snowCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Snowflake/Star class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.3;
            this.isStar = Math.random() > 0.7; // 30% chance to be a star
            this.color = this.isStar ? 
                `rgba(255, 255, ${Math.random() > 0.5 ? 200 : 100}, ${this.opacity})` :
                `rgba(255, 255, 255, ${this.opacity})`;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        }
        
        update() {
            this.x += this.speedX + Math.sin(this.wobble) * 0.5;
            this.y += this.speedY;
            this.wobble += this.wobbleSpeed;
            
            // Reset position if particle goes off screen
            if (this.y > canvas.height) {
                this.y = 0;
                this.x = Math.random() * canvas.width;
            }
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
        }
        
        draw() {
            ctx.beginPath();
            
            if (this.isStar) {
                // Draw a small star
                const spikes = 5;
                const outerRadius = this.size;
                const innerRadius = this.size / 2;
                
                let rotation = Math.PI / 2 * 3;
                let x = this.x;
                let y = this.y;
                let step = Math.PI / spikes;
                
                ctx.moveTo(x, y - outerRadius);
                
                for (let i = 0; i < spikes; i++) {
                    x = this.x + Math.cos(rotation) * outerRadius;
                    y = this.y + Math.sin(rotation) * outerRadius;
                    ctx.lineTo(x, y);
                    rotation += step;
                    
                    x = this.x + Math.cos(rotation) * innerRadius;
                    y = this.y + Math.sin(rotation) * innerRadius;
                    ctx.lineTo(x, y);
                    rotation += step;
                }
                
                ctx.lineTo(this.x, this.y - outerRadius);
                ctx.closePath();
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // Add glow effect for stars
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
            } else {
                // Draw snowflake
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
    
    // Create particles
    const particles = [];
    const particleCount = Math.min(150, Math.floor(window.innerWidth / 10));
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add some twinkling stars in background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 97) % canvas.width;
            const y = (i * 53) % canvas.height;
            const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
});