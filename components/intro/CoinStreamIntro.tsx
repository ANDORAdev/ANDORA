"use client";

/**
 * CoinStreamIntro — the product in one move: stocks in, dollars out.
 *
 * A row of stock tokens (SPY, NVDA, AAPL, TSLA, META) drops in with their
 * Chainlink prices, then each breaks open into a stream of USDG coins. The
 * coins arc out and settle into the letters of ANDORA (positions sampled from
 * the real wordmark, each token feeding the letters above it), the dots
 * resolve into the crisp wordmark on the same canvas, and it flies into the
 * nav as the curtain lifts.
 */

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { BRAND } from "@/config/brand";
import { COLLATERAL_ASSETS, LOAN_ASSET } from "@/config/lending";
import { DESIGN } from "@/config/design";
import { formatUsd } from "@/lib/lending/format";
import { useLendingStore } from "@/lib/lending/store";
import LogoMark from "@/components/LogoMark";
import {
  EASE_IN_OUT,
  EASE_OUT,
  INTRO_BG,
  INTRO_Z,
  NAV_WORDMARK_PX,
  announceIntroDone,
  createCues,
  createIntroClock,
  createTimers,
  navLogoCenter,
  shouldPlayIntro,
  useEndOnInput,
} from "./introKit";

/** An ETF and four household names, so it reads as "any stock", not one. */
const STOCK_SYMBOLS = ["SPY", "NVDA", "AAPL", "TSLA", "META"];
const STOCKS = STOCK_SYMBOLS.map((s) => COLLATERAL_ASSETS.find((a) => a.symbol === s)).filter(
  (a): a is (typeof COLLATERAL_ASSETS)[number] => Boolean(a),
);
const WORD = BRAND.name.toUpperCase();
const MAX_COINS = 900;

const T = {
  drop: 300,
  dropStagger: 160,
  label: 850, // after each token starts dropping
  crack: 2600, // tokens and prices sit long enough to read
  crackStagger: 130,
  burstLag: 180, // first crack → first coins
  groupSpread: 350, // left-to-right delay across one token's letters
  jitter: 200,
  flight: 1300,
  resolve: 550, // dots → crisp wordmark
  hold: 1300, // crisp wordmark on screen before the exit
  exit: 1400,
};

const ACCENT = DESIGN.colors.accent;
const INK = DESIGN.colors.text;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function rgbOf(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const v = parseInt(color.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const [r = 0, g = 0, b = 0] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return [r, g, b];
}

/** Stable 0..1 jitter per coin, so every play looks the same. */
function jitter(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function CoinStreamIntro({ navLogoRef }: { navLogoRef: RefObject<HTMLElement | null> }) {
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!shouldPlayIntro()) return;
    const id = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const row = rowRef.current;
    const caption = captionRef.current;
    if (!playing || !root || !canvas || !row || !caption) return;

    const tokens = Array.from(row.querySelectorAll<HTMLDivElement>(".cs-token"));
    const labels = Array.from(row.querySelectorAll<HTMLDivElement>(".cs-label"));
    const timers = createTimers();
    const anims: Animation[] = [];
    let ended = false;
    let raf = 0;
    let cancelled = false;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontPx = Math.min(W * 0.15, 168);
    const geist = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    /** Same type on the sampling canvas and the visible one, so dots and word line up. */
    const setType = (c: CanvasRenderingContext2D) => {
      c.font = `800 ${fontPx}px ${geist ? `${geist}, ` : ""}${DESIGN.font.sans}`;
      if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${fontPx * 0.08}px`;
      c.textAlign = "center";
      c.textBaseline = "middle";
    };

    // Live prices load after mount, so read them when each label appears. No price yet: no number.
    const fillPrice = (j: number) => {
      const price = useLendingStore.getState().prices[STOCKS[j].symbol];
      labels[j].lastElementChild!.textContent = price ? formatUsd(price.usdCents) : "";
    };

    // Coin targets: the rendered wordmark sampled on a grid.
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);
    let delay = new Float32Array(0);
    let ctrlX = new Float32Array(0);
    let ctrlY = new Float32Array(0);
    let radius = 3;
    let wordMinX = cx;
    let wordMaxX = cx;
    // Glyph centre of the sampled word (fly origin).
    let gx = cx;
    let gy = cy;

    const sample = () => {
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      setType(o);
      o.fillStyle = "#fff";
      o.fillText(WORD, cx, cy);
      const data = o.getImageData(0, 0, W, H).data;

      let step = Math.max(4, Math.round(fontPx / 21));
      let points: number[] = [];
      for (;;) {
        points = [];
        for (let y = 0; y < H; y += step) {
          for (let x = 0; x < W; x += step) {
            if (data[(y * W + x) * 4 + 3] > 140) points.push(x, y);
          }
        }
        if (points.length / 2 <= MAX_COINS) break;
        step += 1;
      }
      radius = step * 0.42;

      const n = points.length / 2;
      tx = new Float32Array(n);
      ty = new Float32Array(n);
      sx = new Float32Array(n);
      sy = new Float32Array(n);
      delay = new Float32Array(n);
      ctrlX = new Float32Array(n);
      ctrlY = new Float32Array(n);
      let minY = Infinity;
      let maxY = -Infinity;
      wordMinX = Infinity;
      wordMaxX = -Infinity;
      for (let i = 0; i < n; i++) {
        tx[i] = points[i * 2];
        ty[i] = points[i * 2 + 1];
        wordMinX = Math.min(wordMinX, tx[i]);
        wordMaxX = Math.max(wordMaxX, tx[i]);
        minY = Math.min(minY, ty[i]);
        maxY = Math.max(maxY, ty[i]);
      }
      gx = (wordMinX + wordMaxX) / 2;
      gy = (minY + maxY) / 2;
    };

    /** Each token feeds the slice of the word above it; read token rects once. */
    const aimCoins = () => {
      const centers = tokens.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
      const count = centers.length;
      const span = Math.max(1, wordMaxX - wordMinX);
      for (let i = 0; i < tx.length; i++) {
        const frac = ((tx[i] - wordMinX) / span) * count;
        const j = Math.min(count - 1, Math.floor(frac));
        sx[i] = centers[j][0];
        sy[i] = centers[j][1];
        delay[i] = j * T.crackStagger + (frac - j) * T.groupSpread + jitter(i, 1) * T.jitter;
        const lift = (0.3 + jitter(i, 2) * 0.6) * fontPx;
        ctrlX[i] = sx[i] + (tx[i] - sx[i]) * 0.5 + (jitter(i, 3) - 0.5) * fontPx * 0.6;
        ctrlY[i] = Math.min(sy[i], ty[i]) - lift;
      }
    };

    setType(ctx);
    const drawWord = (alpha: number, color: string) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillText(WORD, cx, cy);
      ctx.globalAlpha = 1;
    };

    /** Draws the coins `t` ms after the first burst. */
    const drawCoins = (t: number, alpha = 1) => {
      const n = tx.length;
      ctx.globalAlpha = alpha;

      // Two batches (flying accent / landed ink): no per-coin fillStyle churn.
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = (t - delay[i]) / T.flight;
        if (p <= 0 || p >= 1) continue;
        const e = easeOutCubic(p);
        const u = 1 - e;
        const x = u * u * sx[i] + 2 * u * e * ctrlX[i] + e * e * tx[i];
        const y = u * u * sy[i] + 2 * u * e * ctrlY[i] + e * e * ty[i];
        const r = radius * (0.7 + 0.5 * (1 - p));
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.fillStyle = INK;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const since = t - delay[i] - T.flight;
        if (since < 0) continue;
        const pop = since < 120 ? 1 + 0.45 * (1 - since / 120) : 1;
        const r = radius * pop;
        ctx.moveTo(tx[i] + r, ty[i]);
        ctx.arc(tx[i], ty[i], r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const clock = createIntroClock();
    const cues = createCues();

    // 1. Tokens drop in one after another, then show their prices.
    tokens.forEach((token, j) => {
      const label = labels[j];
      token.style.opacity = "0";
      label.style.opacity = "0";
      const dropAt = T.drop + j * T.dropStagger;
      cues.at(dropAt, () => {
        token.style.opacity = "";
        anims.push(
          token.animate(
            [{ transform: "translateY(-62vh) scale(0.9)", opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: "translateY(0) scale(1)", opacity: 1 }],
            { duration: 1000, easing: "cubic-bezier(0.34, 1.45, 0.64, 1)", fill: "backwards" },
          ),
        );
      });
      cues.at(dropAt + T.label, () => {
        fillPrice(j);
        label.style.opacity = "";
        anims.push(label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: "backwards" }));
      });

      // 2. Each token strains, then breaks open.
      cues.at(T.crack + j * T.crackStagger, () => {
        anims.push(
          token.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.14, 0.9)", offset: 0.45 }, { transform: "scale(0.2)", opacity: 0 }],
            { duration: 450, easing: "ease-in", fill: "forwards" },
          ),
          label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }),
        );
      });
    });

    // Fonts must be ready before sampling the wordmark into coin targets.
    let sampled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      sample();
      sampled = true;
    });

    // One clock for every phase (see createIntroClock).
    const lastLanding = (STOCKS.length - 1) * T.crackStagger + T.groupSpread + T.jitter + T.flight;
    let phase: "tokens" | "coins" | "word" = "tokens";
    let burstAt = 0;
    let wordAt = 0;
    const frame = (now: number) => {
      const t = clock(now);
      cues.fire(t);
      if (phase === "tokens" && sampled && t >= T.crack + T.burstLag) {
        phase = "coins";
        burstAt = t;
        aimCoins();
        anims.push(caption.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 400, fill: "both" }));
      }
      if (phase === "coins" && t - burstAt >= lastLanding + 60) {
        phase = "word";
        wordAt = t;
      }
      if (phase === "coins" || phase === "word") {
        // 3. Coins land; the dots resolve into the crisp wordmark.
        const k = phase === "word" ? clamp01((t - wordAt) / T.resolve) : 0;
        ctx.clearRect(0, 0, W, H);
        drawCoins(t - burstAt, 1 - k);
        if (k > 0) drawWord(k, INK);
      }
      if (phase === "word" && t - wordAt >= T.hold) finale();
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const unmount = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setPlaying(false);
    };

    // 4. Curtain lifts, wordmark flies into the nav.
    const finale = () => {
      if (ended) return;
      ended = true;
      announceIntroDone();
      anims.push(
        root.querySelector<HTMLDivElement>(".cs-curtain")!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, easing: EASE_IN_OUT, fill: "forwards" }),
        caption.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" }),
      );

      let tries = 0;
      const aim = () => {
        const logo = navLogoRef.current;
        const target = navLogoCenter(logo);
        if (!target && tries++ < 20) {
          raf = requestAnimationFrame(aim);
          return;
        }
        const scale = NAV_WORDMARK_PX / fontPx;
        const dx = target ? target.x - gx : 0;
        const dy = target ? target.y - gy : -gy;
        canvas.style.transformOrigin = `${gx}px ${gy}px`;
        anims.push(
          canvas.animate(
            [{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 0.85 }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 }],
            { duration: 1150, easing: EASE_OUT, fill: "forwards" },
          ),
        );

        // Shift the ink to the nav wordmark's colour while it flies.
        const inkEl = logo?.querySelector("span span") as HTMLElement | null;
        const from = rgbOf(INK);
        const to = rgbOf(inkEl ? getComputedStyle(inkEl).color : INK);
        const flyStart = performance.now();
        const recolor = (now: number) => {
          const k = clamp01((now - flyStart) / 900);
          const mix = from.map((c, j) => Math.round(c + (to[j] - c) * k));
          ctx.clearRect(0, 0, W, H);
          drawWord(1, `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`);
          if (k < 1) raf = requestAnimationFrame(recolor);
        };
        raf = requestAnimationFrame(recolor);
      };
      raf = requestAnimationFrame(aim);
      timers.at(T.exit, unmount);
    };

    const skip = () => {
      if (ended) {
        unmount();
        return;
      }
      ended = true;
      cancelAnimationFrame(raf);
      announceIntroDone();
      anims.push(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }));
      timers.at(200, unmount);
    };

    endRef.current = skip;

    return () => {
      cancelled = true;
      timers.clear();
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      endRef.current = null;
    };
  }, [playing, navLogoRef]);

  useEndOnInput(playing, () => endRef.current?.());

  if (!playing) return null;

  return (
    <div ref={rootRef} className="cs-root" aria-hidden="true">
      <style>{CSS}</style>
      <div className="cs-curtain" />
      <canvas ref={canvasRef} className="cs-canvas" />
      <div ref={rowRef} className="cs-row">
        {STOCKS.map((asset) => (
          <div key={asset.symbol} className="cs-slot" style={{ "--cs-aspect": Math.min(asset.logoAspect ?? 1, 1.7) } as CSSProperties}>
            <div className="cs-token">
              {asset.logo && (
                <LogoMark
                  src={asset.logo}
                  height={40}
                  color={INK}
                  style={{ width: "calc(var(--cs-t) * 0.38 * var(--cs-aspect))", height: "calc(var(--cs-t) * 0.38)" }}
                />
              )}
            </div>
            <div className="cs-label">
              <span>{asset.symbol}</span>
              <span className="cs-price" />
            </div>
          </div>
        ))}
      </div>
      <div ref={captionRef} className="cs-caption">
        Stocks in <span style={{ color: ACCENT }}>→</span> {LOAN_ASSET.symbol} out
      </div>
    </div>
  );
}

const CSS = `
.cs-root {
  position: fixed; inset: 0; z-index: ${INTRO_Z}; user-select: none; -webkit-user-select: none;
  --cs-t: clamp(56px, 7.2vw, 104px);
}
.cs-curtain { position: absolute; inset: 0; background: ${INTRO_BG}; }
.cs-canvas { position: absolute; inset: 0; width: 100%; height: 100%; will-change: transform, opacity; }
.cs-row {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; gap: clamp(12px, 2.4vw, 36px);
}
.cs-slot { position: relative; }
.cs-token {
  width: var(--cs-t); height: var(--cs-t); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: ${DESIGN.colors.bgCard};
  box-shadow: inset 0 0 0 1px ${DESIGN.colors.borderStrong}, inset 0 -10px 24px rgba(0,0,0,0.45);
  will-change: transform, opacity;
}
.cs-label {
  position: absolute; left: 50%; top: calc(100% + 14px); transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px; white-space: nowrap;
  font-family: var(--font-mono); font-size: clamp(10px, 0.95vw, 13px); letter-spacing: 0.1em; color: ${INK};
}
.cs-price { color: ${DESIGN.colors.textMuted}; letter-spacing: 0.04em; }
.cs-caption {
  position: absolute; left: 0; right: 0; top: calc(50% + min(15vw, 168px) * 0.75);
  text-align: center; opacity: 0;
  font-family: var(--font-mono); font-size: clamp(11px, 1.1vw, 14px); letter-spacing: 0.16em;
  text-transform: uppercase; color: ${DESIGN.colors.textMuted};
}
`;
