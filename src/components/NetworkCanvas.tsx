"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  pulseSpeed: number;
}

interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0 to 1
  speed: number;
  life: number; // fades out near end
}

export default function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let nodes: Node[] = [];
    let signals: Signal[] = [];
    let time = 0;

    const CONNECTION_DIST = 180;
    const NODE_COUNT = 70;
    const MAX_SIGNALS = 25;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }

    function init() {
      resize();
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;

      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.8,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.03 + 0.008,
      }));
    }

    // Find connected pairs for signal spawning
    function spawnSignal() {
      if (signals.length >= MAX_SIGNALS) return;

      // Pick a random node, find a neighbor
      const i = Math.floor(Math.random() * nodes.length);
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          signals.push({
            fromIdx: i,
            toIdx: j,
            progress: 0,
            speed: 0.008 + Math.random() * 0.015,
            life: 1,
          });
          return;
        }
      }
    }

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      time++;

      ctx!.clearRect(0, 0, w, h);

      // Update node positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        if (node.x < -10) node.x = w + 10;
        if (node.x > w + 10) node.x = -10;
        if (node.y < -10) node.y = h + 10;
        if (node.y > h + 10) node.y = -10;
      }

      // Draw connections (dim static lines)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Spawn new signals periodically
      if (time % 8 === 0) spawnSignal();

      // Update and draw signals (the flickering pulses)
      signals = signals.filter((sig) => {
        sig.progress += sig.speed;

        if (sig.progress >= 1) return false;

        const from = nodes[sig.fromIdx];
        const to = nodes[sig.toIdx];
        if (!from || !to) return false;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Kill signal if nodes drifted too far apart
        if (dist > CONNECTION_DIST * 1.2) return false;

        const px = from.x + dx * sig.progress;
        const py = from.y + dy * sig.progress;

        // Signal brightness — bright in middle, fades at edges
        const edgeFade = Math.sin(sig.progress * Math.PI);
        const flicker = 0.6 + Math.sin(time * 0.3 + sig.progress * 20) * 0.4;
        const alpha = edgeFade * flicker * 0.9;

        // Draw the glowing connection line (brighter where signal is)
        const grad = ctx!.createLinearGradient(from.x, from.y, to.x, to.y);
        const sigPos = sig.progress;
        const spread = 0.08;
        grad.addColorStop(Math.max(0, sigPos - spread * 2), "rgba(245, 158, 11, 0)");
        grad.addColorStop(Math.max(0, sigPos - spread), `rgba(251, 191, 36, ${alpha * 0.3})`);
        grad.addColorStop(sigPos, `rgba(251, 191, 36, ${alpha})`);
        grad.addColorStop(Math.min(1, sigPos + spread), `rgba(245, 158, 11, ${alpha * 0.3})`);
        grad.addColorStop(Math.min(1, sigPos + spread * 2), "rgba(245, 158, 11, 0)");

        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);
        ctx!.lineTo(to.x, to.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Draw signal dot
        ctx!.beginPath();
        ctx!.arc(px, py, 2 + edgeFade * 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx!.fill();

        // Glow around signal dot
        ctx!.beginPath();
        ctx!.arc(px, py, 6 + edgeFade * 4, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 158, 11, ${alpha * 0.15})`;
        ctx!.fill();

        // Light up destination node when signal arrives
        if (sig.progress > 0.85) {
          const burstAlpha = (sig.progress - 0.85) / 0.15 * 0.4;
          ctx!.beginPath();
          ctx!.arc(to.x, to.y, 8, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(251, 191, 36, ${burstAlpha})`;
          ctx!.fill();
        }

        return true;
      });

      // Draw nodes
      for (const node of nodes) {
        const glow = (Math.sin(node.pulse) + 1) / 2;
        const alpha = 0.25 + glow * 0.35;

        // Outer glow
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.r + 4, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(217, 119, 6, ${alpha * 0.08})`;
        ctx!.fill();

        // Node dot
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.r + glow * 0.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 158, 11, ${alpha})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
