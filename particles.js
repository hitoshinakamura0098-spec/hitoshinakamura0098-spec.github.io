(function(){
  const canvas = document.getElementById('bgNet');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, points;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.max(30, Math.floor((w * h) / 24000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3
    }));
  }

  function tick(){
    ctx.clearRect(0, 0, w, h);

    for (const p of points){
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    const linkDist = Math.min(150, w / 5);
    for (let i = 0; i < points.length; i++){
      for (let j = i + 1; j < points.length; j++){
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist){
          ctx.strokeStyle = `rgba(143,184,255,${0.16 * (1 - dist / linkDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(180,205,255,0.7)';
    for (const p of points){
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
})();
