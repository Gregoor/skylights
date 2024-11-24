"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function lineToAngle(x1: number, y1: number, length: number, radians: number) {
  const x2 = x1 + length * Math.cos(radians),
    y2 = y1 + length * Math.sin(radians);
  return { x: x2, y: y2 };
}

const STARS_PER_PIXEL = 0.0005;

const METEOR_SPEED = { min: 12, max: 18 } as const;
const METEOR_OPACITY_DELTA = 0.01;
const TRAIL_LENGTH_DELTA = 0.01;
const METEOR_EMIT_INTERVAL_MS = 4_000;
const METEOR_LIFE_TIME = 500;
const MAX_TRAIL_LENGTH = 300;

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

class Meteor {
  x: number;
  y: number;
  opacity = 0;
  trailLengthDelta = 0;
  isSpawning = true;
  isDying = false;
  isDead = false;

  private vx = 0;
  private vy = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.speed = rand(METEOR_SPEED.min, METEOR_SPEED.max);
    while (true) {
      const angle = rand(0, 2 * Math.PI);
      // retry if angle is too straight
      if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) continue;
      this.heading = angle;
      break;
    }
  }

  get speed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  set speed(value: number) {
    const heading = this.heading;
    this.vx = Math.cos(heading) * value;
    this.vy = Math.sin(heading) * value;
  }

  get heading() {
    return Math.atan2(this.vy, this.vx);
  }

  set heading(value: number) {
    const speed = this.speed;
    this.vx = Math.cos(value) * speed;
    this.vy = Math.sin(value) * speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
}

function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor) {
  const { x, y } = meteor;
  const currentTrailLength = MAX_TRAIL_LENGTH * meteor.trailLengthDelta;
  const pos = lineToAngle(x, y, -currentTrailLength, meteor.heading);

  ctx.fillStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2, false);
  ctx.fill();
  const starLength = 5;
  ctx.beginPath();
  ctx.moveTo(x - 1, y + 1);

  ctx.lineTo(x, y + starLength);
  ctx.lineTo(x + 1, y + 1);

  ctx.lineTo(x + starLength, y);
  ctx.lineTo(x + 1, y - 1);

  ctx.lineTo(x, y + 1);
  ctx.lineTo(x, y - starLength);

  ctx.lineTo(x - 1, y - 1);
  ctx.lineTo(x - starLength, y);

  ctx.lineTo(x - 1, y + 1);
  ctx.lineTo(x - starLength, y);

  ctx.closePath();
  ctx.fill();

  //trail
  ctx.fillStyle = `rgba(255, 221, 157, ${meteor.opacity})`;
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 1);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineTo(x + 1, y + 1);
  ctx.closePath();
  ctx.fill();
}

export function Stars() {
  const { width, height } = useWindowSize();
  const starCount = useMemo(
    () => Math.floor(width * height * STARS_PER_PIXEL),
    [width, height],
  );
  const stars = useMemo(
    () =>
      Array.from({ length: starCount }).map(() => {
        const y = rand(0, height);
        return {
          x: rand(0, width),
          y,
          radius: rand(0.7, 1.2),
          opacity: rand(0, 100) / 100 - y / height / 4,
        };
      }),
    [height, starCount, width],
  );

  const meteorsRef = useRef<Meteor[]>([]);

  return (
    <>
      <canvas
        ref={(el) => {
          const ctx = el?.getContext("2d");
          if (!ctx) return;
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "white";
          for (const star of stars) {
            ctx.fillStyle = "white";
            ctx.globalAlpha = star.opacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
          }
        }}
        width={width}
        height={height}
        style={{
          zIndex: -1,
          position: "fixed",
          top: 0,
          width: "100vw",
          height: "100vh",
        }}
      />
      <canvas
        ref={(el) => {
          const ctx = el?.getContext("2d");
          if (!ctx) return;

          let animationFrameId: number | undefined;
          function update() {
            ctx?.clearRect(0, 0, width, height);

            for (const meteor of meteorsRef.current) {
              if (meteor.isSpawning) {
                meteor.opacity += METEOR_OPACITY_DELTA;
                if (meteor.opacity >= 1.0) {
                  meteor.isSpawning = false;
                  setTimeout(function () {
                    meteor.isDying = true;
                  }, METEOR_LIFE_TIME);
                }
              }
              if (meteor.isDying) {
                meteor.opacity -= METEOR_OPACITY_DELTA;
                if (meteor.opacity <= 0.0) {
                  meteor.isDying = false;
                  meteor.isDead = true;
                }
              }
              meteor.trailLengthDelta += TRAIL_LENGTH_DELTA;

              meteor.update();
              if (meteor.opacity > 0.0) {
                drawMeteor(ctx!, meteor);
              }
            }

            for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
              if (meteorsRef.current[i].isDead) {
                meteorsRef.current.splice(i, 1);
              }
            }
            animationFrameId = requestAnimationFrame(update);
          }

          update();

          const intervalId = setInterval(() => {
            meteorsRef.current.push(
              new Meteor(rand(0, width), rand(0, height)),
            );
          }, METEOR_EMIT_INTERVAL_MS);

          return () => {
            cancelAnimationFrame(animationFrameId!);
            clearInterval(intervalId);
          };
        }}
        width={width}
        height={height}
        style={{
          zIndex: -1,
          position: "fixed",
          top: 0,
          width: "100vw",
          height: "100vh",
        }}
      />
    </>
  );
}
