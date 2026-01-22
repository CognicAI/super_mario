
interface PlayerState {
    pos: { x: number; y: number };
    width: number;
    height: number;
    facing: 1 | -1;
}

const INVULNERABILITY_TIME = 1000; // ms - should match App.tsx constant

// Load player image
let playerImage: HTMLImageElement | null = null;
let imageLoaded = false;

// Initialize image loading
if (typeof window !== 'undefined') {
    playerImage = new Image();
    playerImage.src = '/assets/player.png';
    playerImage.onload = () => {
        imageLoaded = true;
    };
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, timeSinceHit: number = Infinity): void {
    ctx.save();

    // Apply flashing effect during invulnerability period
    if (timeSinceHit < INVULNERABILITY_TIME) {
        const flashInterval = 100;
        const flashPhase = Math.floor(timeSinceHit / flashInterval) % 2;

        if (flashPhase === 1) {
            ctx.globalAlpha = 0.3;
        }
    }

    if (imageLoaded && playerImage) {
        // Calculate scaling to fit player dimensions
        const scale = player.height / playerImage.height;
        const scaledWidth = playerImage.width * scale;
        const scaledHeight = playerImage.height * scale;

        // Center the image horizontally
        const drawX = player.pos.x + (player.width - scaledWidth) / 2;
        const drawY = player.pos.y;

        // Flip image if facing left
        if (player.facing === -1) {
            ctx.save();
            ctx.translate(drawX + scaledWidth / 2, drawY + scaledHeight / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
            ctx.restore();
        } else {
            ctx.drawImage(playerImage, drawX, drawY, scaledWidth, scaledHeight);
        }
    } else {
        // Fallback: draw a simple rectangle if image hasn't loaded
        ctx.fillStyle = '#1C1C1C';
        ctx.fillRect(player.pos.x, player.pos.y, player.width, player.height);
    }

    ctx.restore();
}
