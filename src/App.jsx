import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";

const TOTAL_FRAMES = 240;
const framePath = (index) =>
  `/frames/ezgif-frame-${String(index).padStart(3, "0")}.webp`;

const detailScenes = [
  {
    start: 0,
    eyebrow: "911 Carrera",
    title: "Pure presence",
    copy: "A low, wide stance and unmistakable silhouette comes into view as light moves across the bodywork.",
    specs: [
      ["379 hp", "Power"],
      ["4.0 s", "0-60 mph"],
      ["RWD", "Drive"]
    ],
    corner: "bottom-right"
  },
  {
    start: 0.28,
    eyebrow: "Aerodynamics",
    title: "Shape the air",
    copy: "Clean surfacing, precise proportions, and a planted profile keep the shape composed from every angle.",
    specs: [
      ["182 mph", "Max speed"],
      ["Top track", "Character"],
      ["Sport aero", "Balance"]
    ],
    corner: "top-left"
  },
  {
    start: 0.56,
    eyebrow: "Performance",
    title: "Built to respond",
    copy: "The rear-mounted flat-six delivers instant character, pairing everyday control with a focused sports-car pulse.",
    specs: [
      ["331 lb-ft", "Torque"],
      ["PDK", "Gearbox"],
      ["Flat-six", "Engine"]
    ],
    corner: "bottom-left"
  },
  {
    start: 0.82,
    eyebrow: "Interior",
    title: "Driver first",
    copy: "Every detail is arranged around the person at the wheel: clear, direct, and ready for the next corner.",
    specs: [
      ["2+2", "Layout"],
      ["Analog feel", "Controls"],
      ["Digital core", "Cockpit"]
    ],
    corner: "top-right"
  }
];

export default function App() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const framesRef = useRef([]);
  const renderedFrameRef = useRef(-1);
  const [loadedFrames, setLoadedFrames] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 72,
    damping: 28,
    mass: 0.22
  });
  const loaderProgress = Math.round((loadedFrames / TOTAL_FRAMES) * 100);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.025], [1, 0]);
  const detailsOpacity = useTransform(scrollYProgress, [0.015, 0.06], [1, 1]);
  const detailsY = useTransform(scrollYProgress, [0.015, 0.06], [0, 0]);

  const activeScene = detailScenes[activeSceneIndex];

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const image = framesRef.current[frameIndex];

    if (!canvas || !context || !image || !image.complete || image.naturalWidth === 0) {
      return;
    }

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const drawWidth = canvasWidth;
    const drawHeight = canvasWidth / imageRatio;
    const drawX = 0;
    const drawY = (canvasHeight - drawHeight) / 2;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    renderedFrameRef.current = frameIndex;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!canvas || !context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    renderedFrameRef.current = -1;
    drawFrame(Math.max(0, renderedFrameRef.current));
  }, [drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    contextRef.current = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    let isMounted = true;
    const loadedImages = [];

    for (let index = 1; index <= TOTAL_FRAMES; index += 1) {
      const image = new Image();
      image.onload = image.onerror = () => {
        if (!isMounted) {
          return;
        }

        setLoadedFrames((count) => {
          const nextCount = count + 1;

          if (nextCount === TOTAL_FRAMES) {
            setIsReady(true);
            requestAnimationFrame(() => drawFrame(0));
          }

          return nextCount;
        });
      };

      image.src = framePath(index);
      loadedImages.push(image);
    }

    framesRef.current = loadedImages;

    return () => {
      isMounted = false;
    };
  }, [drawFrame]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setHasScrolled(progress > 0.001);

    const sceneIndex = detailScenes.reduce(
      (activeIndex, scene, index) => (progress >= scene.start ? index : activeIndex),
      0
    );

    setActiveSceneIndex((currentIndex) =>
      currentIndex === sceneIndex ? currentIndex : sceneIndex
    );
  });

  useMotionValueEvent(smoothProgress, "change", (progress) => {
    if (!isReady) {
      return;
    }

    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(progress * TOTAL_FRAMES))
    );

    if (frameIndex !== renderedFrameRef.current) {
      drawFrame(frameIndex);
    }
  });

  const loaderVariants = useMemo(
    () => ({
      visible: { opacity: 1, visibility: "visible" },
      hidden: {
        opacity: 0,
        visibility: "hidden",
        transition: { duration: 0.45, ease: "easeOut" }
      }
    }),
    []
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        id="frame-canvas"
        aria-label="Scroll-driven car animation"
      />

      <motion.nav
        className="site-nav"
        aria-label="Main navigation"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <a className="site-nav__brand" href="#">
          Porsche
        </a>
        <div className="site-nav__links">
          <a href="#">Design</a>
          <a href="#">Drive</a>
          <a href="#">Explore</a>
        </div>
      </motion.nav>

      <motion.aside
        className="vehicle-details"
        aria-live="polite"
        style={{ opacity: detailsOpacity, y: detailsY }}
      >
        <motion.div
          key={activeScene.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="vehicle-details__eyebrow">{activeScene.eyebrow}</p>
          <h1 className="vehicle-details__title">{activeScene.title}</h1>
          <p className="vehicle-details__copy">{activeScene.copy}</p>
          <div className="vehicle-details__specs" aria-label="Vehicle specifications">
            {activeScene.specs.map(([value, label]) => (
              <span key={label}>
                <span className="vehicle-details__spec-value">{value}</span>
                <span className="vehicle-details__spec-label">{label}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </motion.aside>

      <motion.div
        className="loader"
        aria-live="polite"
        animate={isReady ? "hidden" : "visible"}
        variants={loaderVariants}
      >
        <div className="loader__content">
          <div className="loader__meta">
            <span>Loading</span>
            <span>{loaderProgress}%</span>
          </div>
          <div className="loader__track">
            <motion.div
              className="loader__bar"
              animate={{ width: `${loaderProgress}%` }}
              transition={{ duration: 0.18, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div className="scroll-hint" style={{ opacity: hintOpacity }}>
        Scroll to explore
      </motion.div>
    </>
  );
}
