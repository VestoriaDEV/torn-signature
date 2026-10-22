const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const path = require('path');

// Register the bundled font (place Oswald-Bold.ttf in /fonts — see setup guide)
GlobalFonts.registerFromPath(
  path.join(process.cwd(), 'fonts', 'Oswald-Bold.ttf'),
  'Oswald Bold'
);

const WIDTH = 600;
const HEIGHT = 100;
const FRAME_COUNT = 12;
const FRAME_DELAY = 100; // ms per frame

// ---- Drawing: mobster silhouette (fedora + tommy gun) ----
function drawMobster(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Coat / body
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-18, 10);
  ctx.lineTo(-24, 70);
  ctx.lineTo(24, 70);
  ctx.lineTo(18, 10);
  ctx.closePath();
  ctx.fill();

  // Shoulders / collar
  ctx.fillStyle = '#242424';
  ctx.beginPath();
  ctx.moveTo(-18, 10);
  ctx.lineTo(0, 22);
  ctx.lineTo(18, 10);
  ctx.lineTo(10, 2);
  ctx.lineTo(-10, 2);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.ellipse(0, -10, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fedora brim
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.ellipse(0, -20, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fedora crown
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.moveTo(-10, -22);
  ctx.quadraticCurveTo(-12, -38, 0, -40);
  ctx.quadraticCurveTo(12, -38, 10, -22);
  ctx.closePath();
  ctx.fill();

  // Hat band
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -23);
  ctx.lineTo(10, -23);
  ctx.stroke();

  // Arm holding gun
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(40, 24);
  ctx.lineTo(36, 34);
  ctx.lineTo(12, 24);
  ctx.closePath();
  ctx.fill();

  // Tommy gun stock
  ctx.fillStyle = '#2a1d14';
  ctx.fillRect(34, 20, 10, 8);
  // Barrel
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(44, 21, 22, 5);
  // Drum magazine
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.ellipse(42, 30, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Grip
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(38, 26, 4, 10);

  ctx.restore();
}

// ---- Drawing: drifting smoke, animated across frames ----
function drawSmoke(ctx, frame) {
  const puffCount = 6;
  for (let i = 0; i < puffCount; i++) {
    const t = (frame / FRAME_COUNT + i / puffCount) % 1;
    const x = 60 + i * 95 + Math.sin(t * Math.PI * 2 + i) * 10;
    const y = HEIGHT - t * HEIGHT * 1.3;
    const r = 14 + t * 18;
    const alpha = 0.08 * (1 - t);
    ctx.beginPath();
    ctx.fillStyle = `rgba(160,160,160,${alpha})`;
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFrame(ctx, frame, stats) {
  // Background gradient: dark grey -> black
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, '#2b2b2b');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawSmoke(ctx, frame);

  // Subtle flickering light behind the figure
  const flicker = 0.85 + 0.15 * Math.sin((frame / FRAME_COUNT) * Math.PI * 4);
  const lightGrad = ctx.createRadialGradient(90, 55, 5, 90, 55, 70);
  lightGrad.addColorStop(0, `rgba(120,120,120,${0.25 * flicker})`);
  lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawMobster(ctx, 90, 60);

  // Divider line
  ctx.strokeStyle = 'rgba(180,180,180,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 10);
  ctx.lineTo(180, HEIGHT - 10);
  ctx.stroke();

  // Stats text
  const lines = [
    `LEVEL ${stats.level}`,
    stats.name,
    stats.faction,
    stats.job,
  ];
  ctx.textBaseline = 'middle';
  const startX = 195;
  const lineHeight = 22;
  const startY = HEIGHT / 2 - (lineHeight * (lines.length - 1)) / 2;

  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#d4d4d4' : '#9a9a9a';
    ctx.font = i === 0 ? 'bold 18px "Oswald Bold"' : '14px "Oswald Bold"';
    ctx.fillText(line, startX, startY + i * lineHeight);
  });

  // Outer border
  ctx.strokeStyle = 'rgba(150,150,150,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2);
}

// ---- Torn API ----
async function fetchTornStats(apiKey) {
  const url = `https://api.torn.com/user/?selections=profile&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Torn API error: ${data.error.error}`);
  }

  return {
    level: data.level ?? '?',
    name: data.name ?? 'Unknown',
    faction: data.faction?.faction_name ?? 'None',
    // NOTE: verify this field against the live API response once deployed —
    // Torn's job object shape can be `job.job` or `job.position` depending
    // on version. Adjust here if it comes through blank.
    job: data.job?.job ?? data.job?.position ?? 'None',
  };
}

// ---- Handler ----
module.exports = async (req, res) => {
  try {
    const apiKey = process.env.TORN_API_KEY;
    if (!apiKey) {
      res.status(500).send('Missing TORN_API_KEY environment variable');
      return;
    }

    const stats = await fetchTornStats(apiKey);

    const gif = GIFEncoder();
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    for (let frame = 0; frame < FRAME_COUNT; frame++) {
      drawFrame(ctx, frame, stats);
      const { data } = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, WIDTH, HEIGHT, { palette, delay: FRAME_DELAY });
    }

    gif.finish();
    const buffer = Buffer.from(gif.bytes());

    res.setHeader('Content-Type', 'image/gif');
    // Cache the generated GIF for 5 minutes so we don't hit the Torn API
    // (or re-render frames) on every single signature view.
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
    );
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).send(`Error generating signature: ${err.message}`);
  }
};
