/**
 * settlingLoop — requestAnimationFrame loop that sleeps once its animation
 * settles, and is woken again by input (e.g. mousemove). Keeps cursor-follow
 * effects smooth without burning CPU while nothing moves.
 *
 * `step` runs once per frame and returns true while still moving.
 */
export function createSettlingLoop(step: () => boolean) {
  let raf = 0;
  const frame = () => {
    raf = step() ? requestAnimationFrame(frame) : 0;
  };
  return {
    wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/** Distance under which a normalised 0..1 lerp counts as settled. */
export const SETTLE_EPSILON = 0.0005;
