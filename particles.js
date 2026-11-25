(function(){
  const canvas = document.getElementById('bgNet');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = {
    light: { dot: 'rgba(60,125,180,0.82)', link: '60,125,180', alpha: 0.32 },
    dark: { dot: 'rgba(180,205,255,0.75)', link: '143,184,255', alpha: 0.26 }
  };
  let width = 1;
  let height = 1;
  let points = [];
  let frameId = null;
  let previousTime = null;

  function createPoint(){
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  }

  function draw(){
    const palette = document.documentElement.dataset.theme === 'dark' ? colors.dark : colors.light;
    const linkDistance = Math.min(145, Math.max(95, width / 4));
    const linkDistanceSquared = linkDistance * linkDistance;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (let i = 0; i < points.length; i++){
      for (let j = i + 1; j < points.length; j++){
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= linkDistanceSquared) continue;
        const alpha = palette.alpha * (1 - Math.sqrt(distanceSquared) / linkDistance);
        ctx.strokeStyle = `rgba(${palette.link},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = palette.dot;
    for (const point of points){
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function stop(){
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
  }

  function tick(now){
    frameId = null;
    if (document.hidden || reducedMotion.matches){
      previousTime = null;
      return;
    }

    const dt = previousTime === null ? 0 : Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;
    for (const point of points){
      point.x += point.vx * dt;
      point.y += point.vy * dt;
      if (point.x <= 0){
        point.x = 0;
        point.vx = Math.abs(point.vx);
      } else if (point.x >= width){
        point.x = width;
        point.vx = -Math.abs(point.vx);
      }
      if (point.y <= 0){
        point.y = 0;
        point.vy = Math.abs(point.vy);
      } else if (point.y >= height){
        point.y = height;
        point.vy = -Math.abs(point.vy);
      }
    }

    draw();
    frameId = requestAnimationFrame(tick);
  }

  function syncAnimation(){
    stop();
    if (document.hidden) return;
    draw();
    if (!reducedMotion.matches) frameId = requestAnimationFrame(tick);
  }

  function resize(){
    const oldWidth = width;
    const oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    points.forEach((point) => {
      point.x = point.x / oldWidth * width;
      point.y = point.y / oldHeight * height;
    });
    const count = Math.min(70, Math.max(26, Math.floor(width * height / 24000)));
    points = points.slice(0, count);
    while (points.length < count) points.push(createPoint());
    syncAnimation();
  }

  const themeObserver = new MutationObserver(() => {
    if (!document.hidden) draw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('resize', resize);
  if (reducedMotion.addEventListener){
    reducedMotion.addEventListener('change', syncAnimation);
  } else {
    reducedMotion.addListener(syncAnimation);
  }

  resize();
})();
