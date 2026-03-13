(() => {
  const sections = document.querySelectorAll('.section');
  const navDotsContainer = document.getElementById('navDots');
  const currentNumEl = document.getElementById('currentNum');
  const totalNumEl = document.getElementById('totalNum');
  const total = sections.length;
  let current = 0;
  let isAnimating = false;
  const ANIM_DURATION = 1500;

  const labels = [
    'Início',
    'Fluxo de Dados',
    'Orquestração',
    'Meta+',
    'DP',
    'Fiscal',
    'Contábil',
    'Produtos',
    'AuditoriaCS',
    'PCDAP'
  ];

  // Create nav dots
  sections.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', labels[i] || `Seção ${i}`);
    const label = document.createElement('span');
    label.className = 'dot-label';
    label.textContent = labels[i] || `Seção ${i}`;
    dot.appendChild(label);
    dot.addEventListener('click', () => goTo(i));
    navDotsContainer.appendChild(dot);
  });

  totalNumEl.textContent = String(total - 1).padStart(2, '0');
  updateCounter();

  function updateCounter() {
    let display;
    if (current === 0) display = '—';
    else if (current === 1) display = 'MAP';
    else if (current === 2) display = 'FLOW';
    else display = String(current).padStart(2, '0');
    currentNumEl.textContent = display;
}

  function updateDots() {
    navDotsContainer.querySelectorAll('.nav-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function goTo(target) {
    if (target === current || isAnimating || target < 0 || target >= total) return;
    isAnimating = true;

    const direction = target > current ? 'down' : 'up';
    const currentSection = sections[current];
    const nextSection = sections[target];

    currentSection.classList.remove('active');
    currentSection.classList.add(direction === 'down' ? 'exit-up' : 'exit-down');

    nextSection.classList.remove('exit-up', 'exit-down');
    void nextSection.offsetWidth;
    nextSection.classList.add('active');

    current = target;
    updateCounter();
    updateDots();

    if (nextSection.id === 'data-map') {
      setTimeout(drawLineageConnections, 600);
    }

    setTimeout(() => {
      currentSection.classList.remove('exit-up', 'exit-down');
      isAnimating = false;
    }, ANIM_DURATION);
  }

  let wheelAccum = 0;
  const WHEEL_THRESHOLD = 50;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isAnimating) return;
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
      if (wheelAccum > 0) goTo(current + 1);
      else goTo(current - 1);
      wheelAccum = 0;
    }
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(current + 1);
      else goTo(current - 1);
    }
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); goTo(current - 1); }
  });

  function drawLineageConnections() {
    const svg = document.getElementById('mapConnections');
    if (!svg) return;
    svg.innerHTML = '';

    const relationships = [
      { from: 'src-unico', to: 'dash-1' },
      { from: 'src-python', to: 'dash-1' },
      { from: 'src-gclick', to: 'dash-1' },
      { from: 'src-unico', to: 'dash-2' },
      { from: 'src-unico', to: 'dash-3' },
      { from: 'src-unico', to: 'dash-4' },
      { from: 'src-rf', to: 'dash-5' },
      { from: 'src-od', to: 'dash-6' },
      { from: 'src-unico', to: 'dash-7' },
      { from: 'src-od', to: 'dash-7' }
    ];

    const svgRect = svg.getBoundingClientRect();

    relationships.forEach(rel => {
      const startEl = document.getElementById(rel.from);
      const endEl = document.getElementById(rel.to);

      if (startEl && endEl) {
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        const x1 = startRect.right - svgRect.left;
        const y1 = startRect.top + startRect.height / 2 - svgRect.top;
        const x2 = endRect.left - svgRect.left;
        const y2 = endRect.top + endRect.height / 2 - svgRect.top;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cp1x = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp1x} ${y2}, ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-line');
        svg.appendChild(path);
      }
    });
  }

  window.addEventListener('resize', drawLineageConnections);
  
  document.querySelectorAll('.map-node.dashboard').forEach(node => {
    node.addEventListener('click', () => {
      const index = parseInt(node.getAttribute('data-goto'));
      goTo(index);
    });
  });

})();

(() => {
  const container = document.getElementById('floatingIconsContainer');
  if (!container) return;
  const icons = ['excel.png', 'grafico.png', 'python.png', 'sql.png'];
  const speeds = ['speed-1', 'speed-2', 'speed-3', 'speed-4', 'speed-5'];
  const copiasPerIcon = 3;
  let iconIndex = 0;
  const iconElements = [];
  const lastAdjustTime = new Map();
  const ADJUST_COOLDOWN = 500;
  const MIN_DISTANCE = 120;

  icons.forEach((icon) => {
    for (let i = 0; i < copiasPerIcon; i++) {
      const floatingIcon = document.createElement('img');
      floatingIcon.src = `imagens/${icon}`;
      floatingIcon.className = `floating-icon ${speeds[Math.floor(Math.random() * speeds.length)]}`;
      const size = Math.random() * 40 + 40;
      floatingIcon.style.width = size + 'px';
      floatingIcon.style.height = size + 'px';
      floatingIcon.style.transition = 'left 0.3s ease-out';
      
      const leftPercentage = (iconIndex * (100 / (icons.length * copiasPerIcon))) + 5;
      floatingIcon.style.left = leftPercentage + '%';
      floatingIcon.style.top = Math.random() * 100 - 150 + 'px';
      floatingIcon.style.animationDelay = -(Math.random() * 60) + 's';
      
      container.appendChild(floatingIcon);
      const id = `icon-${iconIndex}`;
      iconElements.push({ id, element: floatingIcon, originalLeft: leftPercentage, currentOffset: 0 });
      lastAdjustTime.set(id, 0);
      iconIndex++;
    }
  });

  function checkAndResolveCollisions() {
    const now = Date.now();
    for (let i = 0; i < iconElements.length; i++) {
      const iconData1 = iconElements[i];
      const rect1 = iconData1.element.getBoundingClientRect();
      const center1 = { x: rect1.left + rect1.width/2, y: rect1.top + rect1.height/2 };

      for (let j = i + 1; j < iconElements.length; j++) {
        const iconData2 = iconElements[j];
        const rect2 = iconData2.element.getBoundingClientRect();
        const center2 = { x: rect2.left + rect2.width/2, y: rect2.top + rect2.height/2 };

        const dx = center1.x - center2.x;
        const dy = center1.y - center2.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < MIN_DISTANCE) {
          [iconData1, iconData2].forEach(data => {
            if (now - lastAdjustTime.get(data.id) > ADJUST_COOLDOWN) {
              const dir = center1.x < center2.x ? (data === iconData1 ? -1 : 1) : (data === iconData1 ? 1 : -1);
              data.currentOffset = Math.max(-15, Math.min(15, data.currentOffset + dir * 2));
              data.element.style.left = (data.originalLeft + data.currentOffset) + '%';
              lastAdjustTime.set(data.id, now);
            }
          });
        }
      }
    }
    requestAnimationFrame(checkAndResolveCollisions);
  }
  checkAndResolveCollisions();
})();