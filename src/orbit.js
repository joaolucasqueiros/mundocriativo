// Move the cards around an ellipse in 3D space, keeping their artwork readable.
export const ORBIT_TRANSITION_MS = 650;

export function createOrbit(stage, slides, isInteracting) {
  const step = 360 / slides.length;
  let angle = 0;
  let radius;
  let playing = false;
  let frame = 0;
  let lastTime = 0;
  let transition;

  function draw() {
    slides.forEach((slide, index) => {
      const radians = (((index - 2) * step - angle) * Math.PI) / 180;
      const sine = Math.sin(radians);
      const cosine = Math.cos(radians);
      const scale = 0.78 + 0.22 * cosine;
      slide.style.transform = `translate3d(${sine * radius}px, ${sine * 10}px, ${cosine * radius}px) translateY(-50%) rotateY(${-sine * 10}deg) rotateZ(${-3 + sine * 3}deg) scale(${scale})`;
      slide.style.opacity = String(0.85 + 0.15 * cosine);
      slide.style.zIndex = String(Math.round(101 + cosine * 100));
    });
  }

  function resize() {
    radius =
      parseFloat(getComputedStyle(stage).getPropertyValue("--orbit-radius")) ||
      140;
    draw();
  }

  function tick(now) {
    frame = 0;
    const elapsed = lastTime ? Math.min(now - lastTime, 64) : 0;
    lastTime = now;
    if (!isInteracting()) {
      if (transition) {
        transition.elapsed += elapsed;
        const progress = Math.min(transition.elapsed / ORBIT_TRANSITION_MS, 1);
        // Ease both ends so each image arrives gently and rests in the center.
        const eased =
          progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        angle = transition.from + transition.delta * eased;
        if (progress === 1) transition = undefined;
      }
      draw();
    }
    if (playing && transition) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!frame && playing && transition && !document.hidden) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  resize();
  window.addEventListener("resize", resize);

  return {
    start() {
      playing = true;
      schedule();
    },
    stop() {
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
    },
    remaining() {
      return transition ? ORBIT_TRANSITION_MS - transition.elapsed : 0;
    },
    goTo(index) {
      const target = ((index - 2 + slides.length) % slides.length) * step;
      const delta = ((((target - angle + 180) % 360) + 360) % 360) - 180;
      transition = { from: angle, delta, elapsed: 0 };
      schedule();
    },
  };
}
