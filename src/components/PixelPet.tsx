import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface PixelPetProps {
  isWriting?: boolean;
  /** increment to make the cat do a happy hop (e.g. after a successful save) */
  celebrate?: number;
  /** increment when the focus timer finishes — jump + reminder bubble */
  timerDone?: number;
  /** app theme: "light" shows a black cat, "dark" a white cat */
  theme?: string;
  /** focus mode: the cat peeks over the bottom edge and stays out of the way */
  focusMode?: boolean;
  /** music is playing: the cat wears headphones and vibes */
  musicPlaying?: boolean;
}

type Mood = "idle" | "writing" | "happy" | "hunt" | "purr" | "overheat" | "sleep" | "grabbed";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  type: "heart" | "steam" | "sparkle" | "zzz" | "note";
}

type EyeStyle = "open" | "blink" | "happy" | "sleep" | "wide";

interface Pose {
  bob: number;
  tailPhase: number;
  pupil: { x: number; y: number };
  eyes: EyeStyle;
  mouth: "idle" | "smile" | "open" | "purr";
  brows?: boolean;
  blush: number;
  earL?: number;
  earR?: number;
  overheat?: boolean;
  lookX?: number;
  typing?: boolean;
  /** 0..1 — keyboard slides up from the floor as this approaches 1 */
  typeSlide?: number;
  typeHitL?: number;
  typeHitR?: number;
  /** headphones on while music plays */
  phones?: boolean;
}

interface PeekPose {
  pupil: { x: number; y: number };
  eyes: EyeStyle;
  blush: number;
  earL?: number;
  earR?: number;
  /** 0..1 — how far the head has risen over the edge */
  rise: number;
  /** extra upward pop (celebrations) in logical px */
  pop?: number;
}

// ---------- fine-grained pixel cat renderer ----------
// Logical grid is 72x68 at 2x css scale, so pixels read as real pixel art.
// The top rows are headroom for hops and mochi-stretch so ears never clip.

const LW = 72;
const LH = 68;
const SCALE = 2;
const FLOOR = 62; // paws/tail/keyboard baseline
const CX = 33; // cat center column

// focus-mode peek sprite (head + paws over the bottom screen edge)
const PW = 56;
const PH = 38;

interface Palette {
  darkFur: boolean;
  out: string;
  fur: string;
  shade: string;
  mark: string;
  ear: string;
  eyeFill: string;
  pupil: string;
  eyeLine: string;
  shine: string;
  nose: string;
  noseHi: string;
  mouth: string;
  mouthIn: string;
  muzzle: string;
  keycap: string;
  keycapHi: string;
  keycapLo: string;
  keyside: string;
  keysideHi: string;
  whisker: string;
  blush: (a: number) => string;
  washA: number;
  shadow1: string;
  shadow2: string;
  phoneA: string;
  phoneB: string;
  phoneBand: string;
  note: string;
}

function makePal(darkTheme: boolean): Palette {
  if (darkTheme) {
    // white/cream cat for the dark theme
    return {
      darkFur: false,
      out: "#4a3b31",
      fur: "#f8eedd",
      shade: "#ead9be",
      mark: "#dcc09a",
      ear: "#f2b3b8",
      eyeFill: "#2d241c",
      pupil: "#2d241c",
      eyeLine: "#2d241c",
      shine: "#ffffff",
      nose: "#e08e88",
      noseHi: "#eaa19b",
      mouth: "#8a6f5c",
      mouthIn: "#e5a49e",
      muzzle: "#fdf6ea",
      keycap: "#efe6d6",
      keycapHi: "#fbf5ea",
      keycapLo: "#d8ccb6",
      keyside: "#c9bda8",
      keysideHi: "#f4ecdd",
      whisker: "rgba(74,59,49,0.30)",
      blush: (a) => `rgba(240,130,120,${0.34 * a})`,
      washA: 0.14,
      shadow1: "rgba(0,0,0,0.30)",
      shadow2: "rgba(0,0,0,0.18)",
      phoneA: "#5f5347",
      phoneB: "#8d7c69",
      phoneBand: "#5f5347",
      note: "#c4b7a2",
    };
  }
  // black/charcoal cat for the light theme
  return {
    darkFur: true,
    out: "#15120f",
    fur: "#35312c",
    shade: "#2b2823",
    mark: "#47423b",
    ear: "#d9959c",
    eyeFill: "#f7f1e6",
    pupil: "#1c1916",
    eyeLine: "#ece5d7",
    shine: "#ffffff",
    nose: "#d98d87",
    noseHi: "#e29d97",
    mouth: "#cfc5b6",
    mouthIn: "#c98f89",
    muzzle: "#403b34",
    keycap: "#eae4d9",
    keycapHi: "#f6f1e8",
    keycapLo: "#cfc7b9",
    keyside: "#a99f90",
    keysideHi: "#d6cec0",
    whisker: "rgba(255,255,255,0.30)",
    blush: (a) => `rgba(244,150,145,${0.55 * a})`,
    washA: 0.18,
    shadow1: "rgba(30,24,20,0.15)",
    shadow2: "rgba(30,24,20,0.08)",
    phoneA: "#ddd5c6",
    phoneB: "#f4efe4",
    phoneBand: "#ccc3b2",
    note: "#736a5d",
  };
}

type PxFn = (x: number, y: number, w: number, h: number, c: string) => void;

// shared eye painter (6 wide)
function paintEye(px: PxFn, pal: Palette, ex: number, yy0: number, style: EyeStyle, pdx: number, pdy: number) {
  if (style === "sleep" || style === "blink") {
    px(ex, yy0 + 4, 6, 2, pal.eyeLine);
    return;
  }
  if (style === "happy") {
    px(ex, yy0 + 3, 2, 2, pal.eyeLine);
    px(ex + 1, yy0 + 2, 2, 1, pal.eyeLine);
    px(ex + 2, yy0 + 1, 2, 1, pal.eyeLine);
    px(ex + 3, yy0 + 2, 2, 1, pal.eyeLine);
    px(ex + 4, yy0 + 3, 2, 2, pal.eyeLine);
    return;
  }
  const wide = style === "wide";
  const h = wide ? 8 : 7;
  const yy = wide ? yy0 - 1 : yy0;
  px(ex + 1, yy, 4, h, pal.eyeFill);
  px(ex, yy + 1, 6, h - 2, pal.eyeFill);
  if (pal.darkFur) {
    // light eye base with a dark pupil that follows the cursor
    const ppx = ex + 2 + Math.max(-1, Math.min(1, pdx));
    const ppy = yy + 2 + Math.max(-1, Math.min(1, pdy));
    px(ppx, ppy, 2, 3, pal.pupil);
    px(ppx, ppy, 1, 1, "rgba(255,255,255,0.7)");
  } else {
    // dark eye with a moving shine
    px(ex + 1 + Math.max(0, pdx), yy + 1 + Math.max(0, pdy), 2, 2, pal.shine);
    px(ex + 3 + Math.min(0, pdx), yy + 4 + Math.min(1, pdy), 1, 2, "rgba(255,255,255,0.4)");
  }
}

function drawCat(ctx: CanvasRenderingContext2D, pose: Pose, pal: Palette) {
  const px: PxFn = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const bob = pose.bob || 0;
  const lx = pose.lookX || 0;

  // silhouette mask — outline derives from it so all shapes stay connected
  const mask: boolean[][] = [];
  for (let y = 0; y < LH; y++) mask.push(new Array(LW).fill(false));
  const on = (x: number, y: number) => {
    if (y >= 0 && y < LH && x >= 0 && x < LW) mask[y][x] = true;
  };
  const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) on(x, y);
  };
  const fillRound = (x0: number, y0: number, x1: number, y1: number, r: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x < x0 + r ? x0 + r - x : x > x1 - r ? x - (x1 - r) : 0;
        const dy = y < y0 + r ? y0 + r - y : y > y1 - r ? y - (y1 - r) : 0;
        if (dx * dx + dy * dy <= r * r + r * 0.6) on(x, y);
      }
    }
  };

  const HT = 24 + bob; // head top
  const HB = HT + 22; // head bottom
  const EY = HT + 8; // eye row

  // head with rounded top and cheek bulge, body below
  fillRound(10, HT, 56, HB, 9);
  fillRound(9, HT + 10, 57, HB - 3, 4);
  fillRound(16, HB - 4, 50, FLOOR, 6);

  // ears: slim triangles, tips leaning slightly outward; flick folds the tip
  const earL = pose.earL || 0;
  const earR = pose.earR || 0;
  const ear = (cx: number, dir: number, fold: number) => {
    const apexY = 17 + bob + fold * 2;
    const rows = 10 - fold * 2;
    for (let i = 0; i <= rows; i++) {
      const half = Math.round(0.5 + i * 0.55);
      const shift = Math.round((rows - i) * 0.35) * dir;
      fillRect(cx - half + shift, apexY + i, cx + half + shift, apexY + i);
    }
  };
  ear(17, -1, earL);
  ear(49, 1, earR);

  // tail: rests on the floor to the right, tip sways
  const sway = Math.sin(pose.tailPhase || 0);
  const tipLift = 3 + sway * 3;
  const joints: [number, number][] = [
    [50, FLOOR - 2],
    [55, FLOOR - 2],
    [60, FLOOR - 3],
    [63, FLOOR - 4 - tipLift * 0.4],
    [65, FLOOR - 4 - tipLift],
  ];
  const R = 2;
  for (let i = 0; i < joints.length; i++) {
    const jx = Math.round(joints[i][0]);
    const jy = Math.round(joints[i][1]);
    fillRound(jx - R, jy - R, jx + R, jy + R, 1);
    if (i > 0) {
      const mx = Math.round((joints[i][0] + joints[i - 1][0]) / 2);
      const my = Math.round((joints[i][1] + joints[i - 1][1]) / 2);
      fillRound(mx - R, my - R, mx + R, my + R, 1);
    }
  }
  const tipY = Math.round(FLOOR - 4 - tipLift);

  // outline + fill
  const wash = pose.overheat ? `rgba(235,90,70,${pal.washA})` : null;
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      if (!mask[y][x]) continue;
      const edge =
        !(mask[y - 1] && mask[y - 1][x]) ||
        !(mask[y + 1] && mask[y + 1][x]) ||
        !mask[y][x - 1] ||
        !mask[y][x + 1];
      px(x, y, 1, 1, edge ? pal.out : pal.fur);
      if (wash && !edge) px(x, y, 1, 1, wash);
    }
  }

  // inner ears
  const innerEar = (cx: number, dir: number, fold: number) => {
    const apexY = 20 + bob + fold * 2;
    const rows = 5 - fold * 2;
    for (let i = 0; i <= rows; i++) {
      const half = Math.round(i * 0.45);
      const shift = Math.round((rows - i) * 0.35) * dir;
      px(cx - half + shift, apexY + i, half * 2 + 1, 1, pal.ear);
    }
  };
  innerEar(17, -1, earL);
  innerEar(49, 1, earR);

  // forehead tabby stripes + tail rings + shading
  px(27 + lx, HT + 2, 2, 5, pal.mark);
  px(32 + lx, HT + 1, 2, 6, pal.mark);
  px(37 + lx, HT + 2, 2, 5, pal.mark);
  px(63, tipY - 1, 4, 2, pal.mark);
  px(56, FLOOR - 3, 2, 2, pal.mark);
  px(19, HB - 2, 28, 1, pal.shade);
  px(17, HB + 2, 1, FLOOR - HB - 6, pal.shade);
  px(48, HB + 2, 1, FLOOR - HB - 6, pal.shade);
  px(19, FLOOR - 2, 28, 1, pal.shade);

  // eyes
  const pdx = Math.max(-2, Math.min(2, Math.round(pose.pupil.x * 2)));
  const pdy = Math.max(-1, Math.min(2, Math.round(pose.pupil.y * 1.5)));
  paintEye(px, pal, 19 + lx, EY, pose.eyes, pdx, pdy);
  paintEye(px, pal, 41 + lx, EY, pose.eyes, pdx, pdy);

  if (pose.brows) {
    px(19 + lx, EY - 4, 6, 2, pal.eyeLine);
    px(41 + lx, EY - 4, 6, 2, pal.eyeLine);
  }

  // muzzle patch + nose + mouth
  const MX = 33 + lx;
  px(MX - 5, EY + 6, 11, 5, pal.muzzle);
  px(MX - 3, EY + 11, 7, 2, pal.muzzle);
  px(MX - 1, EY + 7, 3, 2, pal.nose);
  px(MX - 1, EY + 7, 3, 1, pal.noseHi);
  if (pose.mouth === "open") {
    px(MX - 1, EY + 10, 3, 3, pal.mouth);
    px(MX - 1, EY + 12, 3, 1, pal.mouthIn);
  } else if (pose.mouth === "smile" || pose.mouth === "purr") {
    px(MX - 3, EY + 10, 1, 1, pal.mouth);
    px(MX - 2, EY + 11, 2, 1, pal.mouth);
    px(MX, EY + 11, 1, 1, pal.mouth);
    px(MX + 1, EY + 11, 2, 1, pal.mouth);
    px(MX + 3, EY + 10, 1, 1, pal.mouth);
  }

  // blush
  if (pose.blush > 0) {
    px(12, EY + 6, 5, 3, pal.blush(pose.blush));
    px(49, EY + 6, 5, 3, pal.blush(pose.blush));
  }

  // whiskers
  px(11, EY + 3, 2, 1, pal.whisker);
  px(10, EY + 7, 2, 1, pal.whisker);
  px(53, EY + 3, 2, 1, pal.whisker);
  px(54, EY + 7, 2, 1, pal.whisker);

  // headphones while music plays
  if (pose.phones) {
    // band: continuous elliptical arc from cup to cup over the head
    const bandCY = EY - 3; // meets the cup tops
    const bandY = (x: number) => {
      const u = (x - 33) / 25;
      return Math.round(bandCY - 12 * Math.sqrt(Math.max(0, 1 - u * u)));
    };
    for (let x = 8; x <= 58; x++) {
      const y0 = bandY(x);
      const y1 = bandY(Math.min(58, x + 1));
      const top = Math.min(y0, y1);
      const bot = Math.max(y0, y1) + 1;
      px(x, top, 1, bot - top + 1, pal.phoneBand);
    }
    // ear cups on the head sides
    const cup = (x0: number, padSide: number) => {
      px(x0 + 1, EY - 3, 5, 1, pal.out);
      px(x0 + 1, EY + 6, 5, 1, pal.out);
      px(x0, EY - 2, 1, 8, pal.out);
      px(x0 + 6, EY - 2, 1, 8, pal.out);
      px(x0 + 1, EY - 2, 5, 8, pal.phoneA);
      px(x0 + (padSide > 0 ? 4 : 1), EY - 1, 2, 6, pal.phoneB);
    };
    cup(5, 1);
    cup(54, -1);
  }

  const slide = pose.typing ? (pose.typeSlide ?? 1) : 0;
  const armsUp = slide > 0.9;

  if (!armsUp) {
    // resting front paws (drawn before the board so the board covers them mid-slide)
    const paw = (x0: number) => {
      const y = FLOOR - 4;
      px(x0 - 1, y, 1, 4, pal.out);
      px(x0 + 9, y, 1, 4, pal.out);
      px(x0, y - 1, 9, 1, pal.out);
      px(x0, y, 9, 4, pal.fur);
      px(x0 + 3, y + 2, 1, 2, pal.shade);
      px(x0 + 6, y + 2, 1, 2, pal.shade);
    };
    paw(20);
    paw(37);
  }

  if (slide > 0.02) {
    const dy = Math.round((1 - slide) * 14); // board rises from below the floor
    const hitL = pose.typeHitL || 0;
    const hitR = pose.typeHitR || 0;
    // tilted keyboard board in FRONT of the cat's lower body
    const KT = FLOOR - 8 + dy;
    const KB = FLOOR + 2 + dy;
    for (let y = KT; y <= KB && y < LH; y++) {
      const t = (y - KT) / (KB - KT);
      const half = Math.round(13 + t * 4);
      if (y === KT || y === KB) {
        px(CX - half, y, half * 2 + 1, 1, pal.out);
      } else {
        px(CX - half, y, 1, 1, pal.out);
        px(CX + half, y, 1, 1, pal.out);
        px(CX - half + 1, y, half * 2 - 1, 1, y === KT + 1 ? pal.keysideHi : pal.keyside);
      }
    }
    // two chunky keycaps (pressed cap sinks)
    const key = (kx: number, pressed: number) => {
      const ky = KT + 2 + pressed;
      px(kx - 1, ky - 1, 11, 7 - pressed, pal.out);
      px(kx, ky, 9, 5 - pressed, pal.keycap);
      if (!pressed) px(kx, ky, 9, 1, pal.keycapHi);
      px(kx, ky + 4 - pressed, 9, 1, pal.keycapLo);
    };
    key(20, hitL);
    key(37, hitR);
    if (armsUp) {
      // short arms from the chest reaching over the board, paws tapping keys
      const arm = (kx: number, hit: number) => {
        const pawTop = KT - 4 + hit * 3;
        const ax = kx + 2;
        px(ax - 1, HB + 2, 7, pawTop - (HB + 2), pal.out);
        px(ax, HB + 2, 5, pawTop - (HB + 2), pal.fur);
        px(kx, pawTop, 9, 4, pal.out);
        px(kx + 1, pawTop + 1, 7, 2, pal.fur);
        px(kx + 3, pawTop + 2, 1, 1, pal.shade);
        px(kx + 5, pawTop + 2, 1, 1, pal.shade);
      };
      arm(20, hitL);
      arm(37, hitR);
    }
  }
}

function drawShadow(ctx: CanvasRenderingContext2D, squish: number, pal: Palette) {
  const px: PxFn = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const inset = Math.round((1 - squish) * 6);
  px(17 + inset, FLOOR + 1.5, 34 - inset * 2, 2, pal.shadow1);
  px(22 + inset, FLOOR + 3.5, 24 - inset * 2, 1.4, pal.shadow2);
}

// focus-mode peek: head + paws gripping the bottom screen edge, Kilroy style
function drawPeek(ctx: CanvasRenderingContext2D, pose: PeekPose, pal: Palette) {
  const px: PxFn = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const rise = pose.rise;
  const dy = Math.round((1 - rise) * PH) - Math.round(pose.pop || 0);

  const mask: boolean[][] = [];
  for (let y = 0; y < PH; y++) mask.push(new Array(PW).fill(false));
  const on = (x: number, y: number) => {
    if (y >= 0 && y < PH && x >= 0 && x < PW) mask[y][x] = true;
  };
  const fillRect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) on(x, y);
  };
  const fillRound = (x0: number, y0: number, x1: number, y1: number, r: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x < x0 + r ? x0 + r - x : x > x1 - r ? x - (x1 - r) : 0;
        const dyy = y < y0 + r ? y0 + r - y : y > y1 - r ? y - (y1 - r) : 0;
        if (dx * dx + dyy * dyy <= r * r + r * 0.6) on(x, y);
      }
    }
  };

  const HT = 10 + dy; // head top; head bottom continues past the canvas edge
  const EY = HT + 8;

  fillRound(6, HT, 50, HT + 30, 10);

  const earL = pose.earL || 0;
  const earR = pose.earR || 0;
  const ear = (cx: number, dir: number, fold: number) => {
    const apexY = HT - 7 + fold * 2;
    const rows = 9 - fold * 2;
    for (let i = 0; i <= rows; i++) {
      const half = Math.round(0.5 + i * 0.55);
      const shift = Math.round((rows - i) * 0.35) * dir;
      fillRect(cx - half + shift, apexY + i, cx + half + shift, apexY + i);
    }
  };
  ear(13, -1, earL);
  ear(43, 1, earR);

  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      if (!mask[y][x]) continue;
      const edge =
        !(mask[y - 1] && mask[y - 1][x]) ||
        (y + 1 < PH && !mask[y + 1][x]) || // bottom row is the screen edge — no outline there
        !mask[y][x - 1] ||
        !mask[y][x + 1];
      px(x, y, 1, 1, edge ? pal.out : pal.fur);
    }
  }

  const innerEar = (cx: number, dir: number, fold: number) => {
    const apexY = HT - 4 + fold * 2;
    const rows = 4 - fold;
    for (let i = 0; i <= rows; i++) {
      const half = Math.round(i * 0.45);
      const shift = Math.round((rows - i) * 0.35) * dir;
      px(cx - half + shift, apexY + i, half * 2 + 1, 1, pal.ear);
    }
  };
  innerEar(13, -1, earL);
  innerEar(43, 1, earR);

  px(22, HT + 2, 2, 5, pal.mark);
  px(27, HT + 1, 2, 6, pal.mark);
  px(32, HT + 2, 2, 5, pal.mark);

  const pdx = Math.max(-2, Math.min(2, Math.round(pose.pupil.x * 2)));
  const pdy = Math.max(-1, Math.min(2, Math.round(pose.pupil.y * 1.5)));
  paintEye(px, pal, 14, EY, pose.eyes, pdx, pdy);
  paintEye(px, pal, 36, EY, pose.eyes, pdx, pdy);

  // tiny nose peeking over the rim (chin stays below the edge)
  px(27, EY + 7, 3, 2, pal.nose);
  px(27, EY + 7, 3, 1, pal.noseHi);

  if (pose.blush > 0) {
    px(8, EY + 6, 4, 3, pal.blush(pose.blush));
    px(44, EY + 6, 4, 3, pal.blush(pose.blush));
  }

  // paws gripping the bottom edge, toes hooked over the rim
  const paw = (x0: number) => {
    const y0 = PH - 7 + Math.min(4, Math.max(0, dy));
    px(x0, y0, 10, 1, pal.out);
    px(x0 - 1, y0 + 1, 1, 6, pal.out);
    px(x0 + 10, y0 + 1, 1, 6, pal.out);
    px(x0, y0 + 1, 10, 6, pal.fur);
    px(x0 + 3, y0 + 1, 1, 3, pal.shade);
    px(x0 + 6, y0 + 1, 1, 3, pal.shade);
  };
  paw(1);
  paw(45);
}

// ---------- component ----------

export default function PixelPet({
  isWriting = false,
  celebrate = 0,
  timerDone = 0,
  theme = "light",
  focusMode = false,
  musicPlaying = false,
}: PixelPetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [bubble, setBubble] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const moodRef = useRef<Mood>("idle");
  const writingRef = useRef(isWriting);
  const focusRef = useRef(focusMode);
  const musicRef = useRef(musicPlaying);
  const palRef = useRef<Palette>(makePal(theme === "dark"));
  const frameRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const mouseRef = useRef({ x: 0, y: 0 }); // relative to cat center
  const lastMouseRef = useRef({ x: 0, y: 0, t: Date.now() });
  const lastActivityRef = useRef(Date.now());

  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<number[]>([]);

  const pupilRef = useRef({ x: 0, y: 0 }); // smoothed
  const lastTypeRef = useRef(0); // last keystroke — keeps the keyboard out between words
  const typeSlideRef = useRef(0); // smoothed 0..1 keyboard slide
  const riseRef = useRef(0); // smoothed 0..1 peek rise
  const duckUntilRef = useRef(0); // peek hides below the edge until this time
  const blinkRef = useRef({ until: 0, next: Date.now() + 3000 });
  const earRef = useRef({ side: 0, until: 0, next: Date.now() + 7000 });
  const gazeRef = useRef({ x: 0, y: 0, until: 0, next: Date.now() + 5000 });
  const petMeterRef = useRef({ dist: 0, lastX: 0, lastY: 0, lastT: 0 });
  const jumpRef = useRef({ t0: 0 });
  const wobbleRef = useRef({ t0: 0, amp: 0 });
  const stretchRef = useRef(0);
  const dragRef = useRef({ active: false, moved: false, offX: 0, offY: 0, lastX: 0, lastY: 0, lastT: 0 });
  const revertTimer = useRef<number | null>(null);

  const setMood = (m: Mood) => {
    moodRef.current = m;
  };

  const restMood = useCallback((): Mood => (writingRef.current ? "writing" : "idle"), []);

  const scheduleRevert = useCallback(
    (ms: number) => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
      revertTimer.current = window.setTimeout(() => {
        if (!dragRef.current.active) setMood(restMood());
        setBubble(null);
      }, ms);
    },
    [restMood],
  );

  const spawn = (p: Partial<Particle> & Pick<Particle, "type">) => {
    particlesRef.current.push({
      x: CX,
      y: 12,
      vx: 0,
      vy: -0.5,
      life: 1,
      decay: 0.02,
      ...p,
    });
    if (particlesRef.current.length > 40) particlesRef.current.shift();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.type === "heart") {
        ctx.fillStyle = "#f2848f";
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.fillRect(p.x + 3, p.y, 2, 2);
        ctx.fillRect(p.x, p.y + 1, 5, 2);
        ctx.fillRect(p.x + 1, p.y + 3, 3, 1);
        ctx.fillRect(p.x + 2, p.y + 4, 1, 1);
      } else if (p.type === "steam") {
        ctx.fillStyle = "#c7cdd4";
        ctx.fillRect(p.x, p.y, 3, 3);
      } else if (p.type === "sparkle") {
        ctx.fillStyle = "#f5c94f";
        ctx.fillRect(p.x + 2, p.y, 1, 5);
        ctx.fillRect(p.x, p.y + 2, 5, 1);
      } else if (p.type === "zzz") {
        ctx.fillStyle = "rgba(130,140,185,0.9)";
        ctx.fillRect(p.x, p.y, 4, 1);
        ctx.fillRect(p.x + 2, p.y + 1, 1, 1);
        ctx.fillRect(p.x + 1, p.y + 2, 1, 1);
        ctx.fillRect(p.x, p.y + 3, 4, 1);
      } else if (p.type === "note") {
        // little eighth note
        ctx.fillStyle = palRef.current.note;
        ctx.fillRect(p.x + 3, p.y, 1, 5);
        ctx.fillRect(p.x + 4, p.y, 2, 1);
        ctx.fillRect(p.x + 5, p.y + 1, 1, 2);
        ctx.fillRect(p.x, p.y + 4, 3, 2);
      }
      ctx.restore();
    }
  };

  // main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const now = Date.now();
      const frame = frameRef.current;
      const t = frame * 0.05;
      const mood = moodRef.current;
      const pal = palRef.current;
      const peeking = focusRef.current;

      // keep the canvas sized for the current mode
      const wantW = peeking ? PW : LW;
      const wantH = peeking ? PH : LH;
      if (canvas.width !== wantW || canvas.height !== wantH) {
        canvas.width = wantW;
        canvas.height = wantH;
      }

      // idle -> sleep after 30s of no interaction (never mid-jam)
      if (
        !dragRef.current.active &&
        mood !== "overheat" &&
        !writingRef.current &&
        !musicRef.current &&
        now - lastActivityRef.current > 30000
      ) {
        if (mood !== "sleep") setMood("sleep");
      } else if (mood === "sleep" && now - lastActivityRef.current < 30000) {
        setMood(restMood());
      }

      // scheduled micro-behaviors: blink, ear flick, gaze wander
      const blink = blinkRef.current;
      if (now > blink.next) {
        blink.until = now + 130;
        blink.next = now + 1800 + Math.random() * 4200;
      }
      const ear = earRef.current;
      if (now > ear.next) {
        ear.side = Math.random() > 0.5 ? 1 : 2;
        ear.until = now + 320;
        ear.next = now + 5000 + Math.random() * 9000;
      }
      const gaze = gazeRef.current;
      if (mood === "idle" && now > gaze.next) {
        gaze.x = (Math.random() - 0.5) * 2.4;
        gaze.y = (Math.random() - 0.5) * 1.6;
        gaze.until = now + 900 + Math.random() * 1400;
        gaze.next = now + 4000 + Math.random() * 8000;
      }

      // pet meter decay
      petMeterRef.current.dist = Math.max(0, petMeterRef.current.dist - 3);

      // ambient particles
      if (mood === "sleep" && frame % 55 === 0)
        spawn({ type: "zzz", x: (peeking ? PW / 2 : CX) + 14, y: peeking ? 6 : 12, vx: 0.12, vy: -0.28, decay: 0.011 });
      if (mood === "overheat" && frame % 7 === 0)
        spawn({ type: "steam", x: CX - 12 + Math.random() * 24, y: 10, vx: (Math.random() - 0.5) * 0.4, vy: -0.65, decay: 0.03 });
      if (mood === "purr" && frame % 12 === 0)
        spawn({ type: "heart", x: (peeking ? PW / 2 : CX) - 16 + Math.random() * 32, y: peeking ? 8 : 13, vx: (Math.random() - 0.5) * 0.3, vy: -0.5, decay: 0.02 });
      if (mood === "happy" && frame % 9 === 0)
        spawn({ type: "sparkle", x: (peeking ? PW / 2 : CX) - 18 + Math.random() * 36, y: (peeking ? 4 : 10) + Math.random() * 8, vx: (Math.random() - 0.5) * 0.4, vy: -0.35, decay: 0.035 });
      if (musicRef.current && !peeking && frame % 42 === 0)
        spawn({ type: "note", x: CX - 20 + Math.random() * 40, y: 10 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.24, vy: -0.32, decay: 0.014 });

      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) ps.splice(i, 1);
      }

      // keyboard stays out ~2s past the last keystroke, sliding smoothly
      const typingActive = !peeking && (now - lastTypeRef.current < 2200 || mood === "overheat");
      typeSlideRef.current += ((typingActive ? 1 : 0) - typeSlideRef.current) * 0.18;
      if (typeSlideRef.current < 0.01) typeSlideRef.current = 0;

      // pupil target
      let tx = 0;
      let ty = 0;
      if (mood === "sleep") {
        tx = 0;
        ty = 0;
      } else if (typingActive && (mood === "writing" || mood === "idle")) {
        ty = 1.2; // watching its own paws type
        tx = Math.sin(t * 2.2) * 0.6;
      } else if (mood === "idle" && musicRef.current && !peeking) {
        // vibing: eyes drift slowly with the music
        tx = Math.sin(t * 1.1) * 0.8;
        ty = 0.2;
      } else if (mood === "idle" && now < gazeRef.current.until && !peeking) {
        tx = gazeRef.current.x;
        ty = gazeRef.current.y;
      } else {
        tx = mouseRef.current.x * 0.02;
        ty = mouseRef.current.y * 0.02;
      }
      pupilRef.current.x += (tx - pupilRef.current.x) * 0.15;
      pupilRef.current.y += (ty - pupilRef.current.y) * 0.15;

      // squash / stretch / wobble
      let sx = 1;
      let sy = 1;
      if (dragRef.current.active) {
        sy = 1 + stretchRef.current;
        sx = 1 - stretchRef.current * 0.45;
      }
      const wob = wobbleRef.current;
      if (wob.amp > 0.001) {
        const el = (now - wob.t0) / 1000;
        const w = wob.amp * Math.exp(-6 * el) * Math.sin(el * 30);
        sx += w;
        sy -= w;
        if (el > 0.9) wob.amp = 0;
      }

      // celebration hop: two springy jumps
      let jumpY = 0;
      if (jumpRef.current.t0 > 0) {
        const el = (now - jumpRef.current.t0) / 1000;
        if (el < 0.9) {
          const hop = (u: number, height: number) => (u > 0 && u < 1 ? Math.sin(u * Math.PI) * height : 0);
          jumpY = hop(el / 0.38, 8) + hop((el - 0.42) / 0.34, 5);
        } else {
          jumpRef.current.t0 = 0;
        }
      }

      ctx.clearRect(0, 0, wantW, wantH);
      ctx.imageSmoothingEnabled = false;

      const eyes: EyeStyle =
        mood === "sleep"
          ? "sleep"
          : mood === "happy" || mood === "purr"
            ? "happy"
            : mood === "hunt" || mood === "grabbed" || mood === "overheat"
              ? "wide"
              : now < blinkRef.current.until
                ? "blink"
                : "open";

      if (peeking) {
        // rise over the edge; duck below it briefly when poked
        const ducked = now < duckUntilRef.current;
        const riseTarget = ducked ? 0.06 : 1;
        riseRef.current += (riseTarget - riseRef.current) * 0.1;
        const breathe = Math.sin(t * 1.1) * 0.6;
        drawPeek(
          ctx,
          {
            pupil: { ...pupilRef.current },
            eyes: eyes === "open" && mood === "idle" ? "wide" : eyes, // curious by default
            blush: mood === "purr" ? 1 : mood === "happy" ? 0.8 : 0.25,
            earL: earRef.current.side === 1 && now < earRef.current.until ? 1 : 0,
            earR: earRef.current.side === 2 && now < earRef.current.until ? 1 : 0,
            rise: riseRef.current,
            pop: jumpY * 0.6 + breathe,
          },
          pal,
        );
      } else {
        riseRef.current = 0;
        const lean = mood === "hunt" ? Math.max(-3, Math.min(3, Math.round(mouseRef.current.x * 0.03))) : 0;
        const typing = typeSlideRef.current > 0;
        // paws tap only while keys are actually being pressed
        const tapping = now - lastTypeRef.current < 700 || mood === "overheat";
        const typeBeat = tapping && Math.sin(t * 7) > 0;
        const typeBeat2 = tapping && Math.sin(t * 7) <= 0;
        const music = musicRef.current;
        // while music plays the cat nods to the beat; otherwise a slow breathe
        const breathing = Math.sin(t * (music ? 3.6 : 1.4)) > 0.35 ? 1 : 0;
        const pose: Pose = {
          bob: mood === "sleep" ? 1 : breathing,
          tailPhase:
            t *
            (mood === "hunt" || mood === "happy"
              ? 3.4
              : mood === "sleep"
                ? 0.5
                : mood === "purr"
                  ? 2.4
                  : music
                    ? 2.3
                    : 1.3),
          pupil: { ...pupilRef.current },
          eyes,
          mouth:
            mood === "happy"
              ? "smile"
              : mood === "purr"
                ? "purr"
                : mood === "overheat" || mood === "grabbed"
                  ? "open"
                  : "idle",
          brows: mood === "overheat",
          blush: mood === "purr" ? 1 : mood === "happy" ? 0.8 : mood === "overheat" ? 1 : music ? 0.45 : 0.3,
          earL: earRef.current.side === 1 && now < earRef.current.until ? 1 : 0,
          earR: earRef.current.side === 2 && now < earRef.current.until ? 1 : 0,
          overheat: mood === "overheat",
          lookX: lean,
          typing,
          typeSlide: typeSlideRef.current,
          typeHitL: typeBeat ? 1 : 0,
          typeHitR: typeBeat2 ? 1 : 0,
          phones: music,
        };

        // shadow stays on the ground; shrinks while the cat is airborne
        if (!dragRef.current.active) drawShadow(ctx, 1 - jumpY * 0.05, pal);

        const pivotY = FLOOR + 1;
        ctx.save();
        ctx.translate(CX, pivotY - jumpY);
        ctx.scale(sx, sy);
        ctx.translate(-CX, -pivotY);
        drawCat(ctx, pose, pal);
        ctx.restore();
      }

      drawParticles(ctx);

      frameRef.current += 1;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theme + focus + music props -> refs
  useEffect(() => {
    palRef.current = makePal(theme === "dark");
  }, [theme]);
  useEffect(() => {
    musicRef.current = musicPlaying;
    if (musicPlaying) lastActivityRef.current = Date.now();
  }, [musicPlaying]);
  useEffect(() => {
    focusRef.current = focusMode;
    if (focusMode) {
      // entering focus: drop drag position and settle into the peek
      dragRef.current.active = false;
      setDragging(false);
      riseRef.current = 0;
      setMood(restMood());
      setBubble(null);
    }
  }, [focusMode, restMood]);

  // typing state (ignore the editor's initial content pulse on mount)
  const mountTime = useRef(Date.now());
  useEffect(() => {
    writingRef.current = isWriting;
    if (isWriting) {
      lastActivityRef.current = Date.now();
      if (Date.now() - mountTime.current > 1500) lastTypeRef.current = Date.now();
      if (moodRef.current === "idle" || moodRef.current === "sleep") setMood("writing");
    } else if (moodRef.current === "writing") {
      setMood("idle");
    }
  }, [isWriting]);

  // save celebration: happy hop + sparkles
  const celebrateSeen = useRef(celebrate);
  useEffect(() => {
    if (celebrate === celebrateSeen.current) return;
    celebrateSeen.current = celebrate;
    lastActivityRef.current = Date.now();
    jumpRef.current.t0 = Date.now();
    setMood("happy");
    setBubble("saved!");
    for (let i = 0; i < 6; i++)
      spawn({ type: "sparkle", x: 12 + Math.random() * 44, y: 8 + Math.random() * 10, vx: (Math.random() - 0.5) * 0.5, vy: -0.4, decay: 0.028 });
    scheduleRevert(1400);
  }, [celebrate, scheduleRevert]);

  // timer finished: joyful double hop (or a happy pop over the edge in focus mode)
  const timerSeen = useRef(timerDone);
  useEffect(() => {
    if (timerDone === timerSeen.current) return;
    timerSeen.current = timerDone;
    lastActivityRef.current = Date.now();
    jumpRef.current.t0 = Date.now();
    setMood("happy");
    setBubble("time's up! break~");
    for (let i = 0; i < 5; i++) {
      spawn({ type: "heart", x: 10 + Math.random() * 40, y: 6 + Math.random() * 8, vx: (Math.random() - 0.5) * 0.4, vy: -0.45, decay: 0.02 });
      spawn({ type: "sparkle", x: 10 + Math.random() * 44, y: 6 + Math.random() * 10, vx: (Math.random() - 0.5) * 0.5, vy: -0.4, decay: 0.03 });
    }
    scheduleRevert(2600);
  }, [timerDone, scheduleRevert]);

  // mouse: eye follow + hunt + drag + petting
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
      lastActivityRef.current = Date.now();

      if (dragRef.current.active) {
        const d = dragRef.current;
        const dt = Math.max(1, Date.now() - d.lastT);
        const vx = (e.clientX - d.lastX) / dt;
        const vy = (e.clientY - d.lastY) / dt;
        if (Math.abs(e.clientX - d.lastX) + Math.abs(e.clientY - d.lastY) > 3) d.moved = true;
        const nx = Math.max(4, Math.min(window.innerWidth - r.width - 4, e.clientX - d.offX));
        const ny = Math.max(4, Math.min(window.innerHeight - r.height - 4, e.clientY - d.offY));
        setPos({ x: nx, y: ny });
        stretchRef.current = Math.min(0.3, Math.abs(vy) * 0.12 + 0.08);
        if (Math.abs(vx) > 0.6) wobbleRef.current = { t0: Date.now(), amp: Math.min(0.28, Math.abs(vx) * 0.12) };
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        d.lastT = Date.now();
        return;
      }

      // petting: rub the cat's head back and forth
      const overHead =
        e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.top + r.height * 0.6;
      const pm = petMeterRef.current;
      const now = Date.now();
      if (overHead && now - pm.lastT < 120) {
        pm.dist += Math.abs(e.clientX - pm.lastX) + Math.abs(e.clientY - pm.lastY);
        if (pm.dist > 130 && moodRef.current !== "purr" && moodRef.current !== "overheat") {
          pm.dist = 0;
          setMood("purr");
          if (!focusRef.current) setBubble("purrr~");
          scheduleRevert(1600);
        }
      }
      pm.lastX = e.clientX;
      pm.lastY = e.clientY;
      pm.lastT = now;

      // hunt: fast cursor near the cat (not while peeking — it stays out of the way)
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      const speed = Math.hypot(dx, dy) / Math.max(1, now - lastMouseRef.current.t);
      if (
        !focusRef.current &&
        speed > 1.6 &&
        Math.abs(mouseRef.current.x) < 170 &&
        Math.abs(mouseRef.current.y) < 130 &&
        (moodRef.current === "idle" || moodRef.current === "sleep" || moodRef.current === "writing")
      ) {
        setMood("hunt");
        scheduleRevert(500);
      }
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);
      stretchRef.current = 0;
      wobbleRef.current = { t0: Date.now(), amp: 0.24 };
      setMood("happy");
      scheduleRevert(800);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scheduleRevert]);

  // keyboard: overheat when typing very fast (never while peeking)
  useEffect(() => {
    const onKey = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      lastTypeRef.current = now;
      keysRef.current.push(now);
      keysRef.current = keysRef.current.filter((k) => now - k < 1100);
      if (moodRef.current === "sleep") setMood(restMood());
      if (!focusRef.current && keysRef.current.length >= 9 && moodRef.current !== "overheat") {
        setMood("overheat");
        setBubble("!!");
        scheduleRevert(1400);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scheduleRevert, restMood]);

  // keep the cat on screen when the window shrinks
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p) return p;
        const r = containerRef.current?.getBoundingClientRect();
        const w = r?.width ?? LW * SCALE;
        const h = r?.height ?? LH * SCALE;
        return {
          x: Math.max(4, Math.min(window.innerWidth - w - 4, p.x)),
          y: Math.max(4, Math.min(window.innerHeight - h - 4, p.y)),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // grab (mochi drag) — while peeking a poke makes it duck shyly instead
  const onMouseDown = (e: React.MouseEvent) => {
    if (focusRef.current) return;
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      moved: false,
      offX: e.clientX - r.left,
      offY: e.clientY - r.top,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: Date.now(),
    };
    setDragging(true);
    setMood("grabbed");
    stretchRef.current = 0.1;
  };

  const onClick = (e: React.MouseEvent) => {
    if (focusRef.current) {
      duckUntilRef.current = Date.now() + 1100; // shy duck below the edge, then peek back
      return;
    }
    if (dragRef.current.moved) return; // was a drag, not a pet
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const relY = (e.clientY - r.top) / r.height;
    if (relY < 0.5) {
      setMood("purr");
      setBubble("purrr~");
      scheduleRevert(1500);
    } else {
      setMood("happy");
      setBubble("meow!");
      scheduleRevert(1100);
    }
  };

  const style: React.CSSProperties = focusMode
    ? {}
    : pos
      ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
      : {};

  return (
    <div
      ref={containerRef}
      className={`fixed z-[65] select-none ${
        focusMode ? "bottom-0 right-10" : pos ? "" : "bottom-[60px] right-5"
      }`}
      style={style}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <motion.div whileHover={{ scale: dragging || focusMode ? 1 : 1.04 }} className="relative">
        <canvas
          ref={canvasRef}
          className={focusMode ? "cursor-pointer" : dragging ? "cursor-grabbing" : "cursor-grab"}
          style={{
            width: (focusMode ? PW : LW) * SCALE,
            height: (focusMode ? PH : LH) * SCALE,
            imageRendering: "pixelated",
          }}
        />

        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className={`absolute ${focusMode ? "-top-6" : "top-1"} left-1/2 -translate-x-1/2 px-2.5 py-[3px] rounded-full bg-[var(--text-color)] !text-[var(--background)] text-[10px] font-semibold tracking-wide whitespace-nowrap pointer-events-none shadow-md`}
            >
              {bubble}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
