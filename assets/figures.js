(() => {
  const dialog = document.querySelector('.figure-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const figures = [...document.querySelectorAll('.thesis-figure, .paper-figure')].map(figure => {
    const link = figure.querySelector('.thesis-figure-image, .publication-image');
    const image = link.querySelector('img');
    const title = figure.querySelector('h4') || figure.closest('.publication').querySelector('h3');
    const caption = figure.querySelector('figcaption').cloneNode(true);
    caption.querySelectorAll('h4, a, .thesis-figure-links, .caption-label').forEach(node => node.remove());
    return { element: figure, link, src: link.href, alt: image.alt, title: title.textContent, caption: caption.textContent.trim() };
  });
  if (!figures.length) return;

  const viewport = dialog.querySelector('.figure-viewer-viewport');
  const image = dialog.querySelector('.figure-viewer-image');
  const message = dialog.querySelector('.figure-viewer-state');
  const title = dialog.querySelector('#figure-viewer-title');
  const count = dialog.querySelector('#figure-viewer-count');
  const caption = dialog.querySelector('.figure-viewer-caption');
  const original = dialog.querySelector('#figure-viewer-original');
  const zoomOutput = dialog.querySelector('#figure-viewer-zoom');
  const zoomIn = dialog.querySelector('[data-figure-action="zoom-in"]');
  const zoomOut = dialog.querySelector('[data-figure-action="zoom-out"]');
  const pointers = new Map();
  let current = 0;
  let opener;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let fitWidth = 0;
  let fitHeight = 0;
  let pinchDistance = 0;
  let pinchZoom = 1;

  const render = () => {
    const width = fitWidth * zoom;
    const height = fitHeight * zoom;
    const maxX = Math.max(0, (width - viewport.clientWidth) / 2);
    const maxY = Math.max(0, (height - viewport.clientHeight) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
    image.style.width = `${width}px`;
    image.style.left = `calc(50% + ${panX}px)`;
    image.style.top = `calc(50% + ${panY}px)`;
    zoomOutput.value = `${Math.round(zoom * 100)}%`;
    zoomIn.disabled = zoom >= 5;
    zoomOut.disabled = zoom <= 1;
    viewport.classList.toggle('is-zoomed', zoom > 1);
  };
  const fit = () => {
    if (!image.naturalWidth || image.hidden) return;
    const ratio = Math.min((viewport.clientWidth - 32) / image.naturalWidth, (viewport.clientHeight - 32) / image.naturalHeight, 1);
    fitWidth = image.naturalWidth * ratio;
    fitHeight = image.naturalHeight * ratio;
    render();
  };
  const reset = () => {
    zoom = 1;
    panX = panY = 0;
    fit();
  };
  const setZoom = value => {
    if (image.hidden) return;
    zoom = Math.max(1, Math.min(5, value));
    render();
  };
  const showFigure = index => {
    current = (index + figures.length) % figures.length;
    const figure = figures[current];
    title.textContent = figure.title;
    count.textContent = `${current + 1} / ${figures.length}`;
    caption.textContent = figure.caption;
    original.href = figure.src;
    image.alt = figure.alt;
    image.hidden = true;
    message.hidden = false;
    message.textContent = 'Loading figure…';
    viewport.setAttribute('aria-busy', 'true');
    pointers.clear();
    viewport.classList.remove('is-dragging', 'is-zoomed');
    zoom = 1;
    panX = panY = 0;
    render();
    image.src = figure.src;
  };
  image.addEventListener('load', () => {
    image.hidden = false;
    message.hidden = true;
    viewport.removeAttribute('aria-busy');
    reset();
  });
  image.addEventListener('error', () => {
    message.textContent = 'Unable to load this figure. Use “Open original” to view the source image.';
    viewport.removeAttribute('aria-busy');
  });

  const open = (index, control) => {
    opener = control;
    dialog.showModal();
    document.body.classList.add('figure-viewer-open');
    showFigure(index);
    dialog.querySelector('[data-figure-action="close"]').focus();
  };
  figures.forEach((figure, index) => {
    figure.link.classList.add('is-interactive-figure');
    figure.link.setAttribute('aria-haspopup', 'dialog');
    figure.link.setAttribute('aria-label', `Explore figure: ${figure.title}`);
    figure.element.querySelectorAll('a').forEach(link => {
      if (link.href !== figure.src) return;
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        open(index, link);
      });
    });
  });
  document.querySelectorAll('.research-card').forEach(card => {
    const paper = document.getElementById(card.querySelector('.research-card-link').hash.slice(1));
    const index = figures.findIndex(figure => paper.contains(figure.element));
    const thumbnail = card.querySelector('.research-card-image img');
    if (index < 0 || !thumbnail) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'figure-preview-button is-interactive-figure';
    button.setAttribute('aria-label', `Explore figure: ${figures[index].title}`);
    button.setAttribute('aria-haspopup', 'dialog');
    thumbnail.replaceWith(button);
    button.append(thumbnail);
    button.addEventListener('click', () => open(index, button));
  });

  const actions = {
    close: () => dialog.close(),
    previous: () => showFigure(current - 1),
    next: () => showFigure(current + 1),
    'zoom-in': () => setZoom(zoom * 1.25),
    'zoom-out': () => setZoom(zoom / 1.25),
    reset
  };
  dialog.querySelectorAll('[data-figure-action]').forEach(button => {
    button.addEventListener('click', () => actions[button.dataset.figureAction]());
  });
  dialog.addEventListener('close', () => {
    pointers.clear();
    viewport.classList.remove('is-dragging');
    document.body.classList.remove('figure-viewer-open');
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') setZoom(zoom * 1.25);
    else if (event.key === '-') setZoom(zoom / 1.25);
    else if (event.key === '0') reset();
    else if (event.key.startsWith('Arrow')) {
      if (zoom > 1) {
        if (event.key === 'ArrowLeft') panX += 50;
        if (event.key === 'ArrowRight') panX -= 50;
        if (event.key === 'ArrowUp') panY += 50;
        if (event.key === 'ArrowDown') panY -= 50;
        render();
      } else if (event.key === 'ArrowLeft') showFigure(current - 1);
      else if (event.key === 'ArrowRight') showFigure(current + 1);
    } else return;
    event.preventDefault();
  });
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom * Math.exp(-event.deltaY * .002));
  }, { passive: false });
  const distance = () => {
    const [first, second] = [...pointers.values()];
    return Math.hypot(first.x - second.x, first.y - second.y);
  };
  viewport.addEventListener('pointerdown', event => {
    if (image.hidden || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
    if (pointers.size === 2) {
      pinchDistance = distance();
      pinchZoom = zoom;
    }
  });
  viewport.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinchDistance > 0) setZoom(pinchZoom * distance() / pinchDistance);
    else if (pointers.size === 1 && zoom > 1) {
      panX += event.clientX - previous.x;
      panY += event.clientY - previous.y;
      render();
    }
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
    if (!pointers.size) viewport.classList.remove('is-dragging');
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => viewport.addEventListener(type, release));
  new ResizeObserver(() => { if (dialog.open) fit(); }).observe(viewport);
})();
