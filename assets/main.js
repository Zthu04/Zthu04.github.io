(() => {
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#nav-links');
  if (!menu || !navigation) return;
  const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  sectionLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(max-width: 850px)').addEventListener('change', closeMenu);

  const filters = document.querySelector('.publication-filters');
  const publications = [...document.querySelectorAll('.publication')];
  const status = document.querySelector('#publication-status');
  if (filters) {
    filters.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        filters.querySelectorAll('button').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        let count = 0;
        publications.forEach(publication => {
          const year = publication.dataset.year;
          const show = filter === 'all' || year === filter || (filter === 'earlier' && Number(year) < 2025);
          publication.hidden = !show;
          if (show) count++;
        });
        status.textContent = `Showing ${count} journal ${count === 1 ? 'article' : 'articles'}${filter === 'all' ? ' from all years' : filter === 'earlier' ? ' before 2025' : ` from ${filter}`}.`;
        scheduleUpdate();
      });
    });
    filters.hidden = false;
  }

  const targetForHash = hash => {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return null; }
  };
  const revealTarget = hash => {
    const target = targetForHash(hash);
    const paper = target?.closest('.publication');
    if (paper?.hidden) filters?.querySelector('[data-filter="all"]').click();
    // Deep links may refer to content inside a collapsed native disclosure.
    let ancestor = target?.parentElement;
    while (ancestor) {
      if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    return target;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    revealTarget(link.hash);
    if (link.closest('.site-header')) closeMenu();
  });
  window.addEventListener('hashchange', () => {
    closeMenu();
    revealTarget(location.hash)?.scrollIntoView();
  });

  const sections = sectionLinks.map(link => targetForHash(link.hash)).filter(Boolean);
  const progress = document.querySelector('.reading-progress');
  const header = document.querySelector('.site-header');
  let scheduled = false;
  let activeId;
  function updateReadingPosition() {
    scheduled = false;
    const threshold = header.getBoundingClientRect().height + 130;
    let current = '';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= threshold) current = section.id;
    });
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0 && window.scrollY >= maxScroll - 3) current = sections[sections.length - 1]?.id || current;
    if (activeId !== current) {
      activeId = current;
      sectionLinks.forEach(link => {
        if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    if (progress) progress.style.transform = `scaleX(${maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0})`;
  }
  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateReadingPosition);
    }
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  // Images and expandable details can change the page length without a scroll.
  document.addEventListener('load', scheduleUpdate, true);
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', scheduleUpdate));
  if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(document.querySelector('main'));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.about-heading, .section-heading, .research-card, .thesis-overview, .contact-content').forEach(element => observer.observe(element));
  }

  menu.hidden = false;
  document.documentElement.classList.add('js');
  const year = document.querySelector('#copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  const initialTarget = revealTarget(location.hash);
  if (initialTarget) requestAnimationFrame(() => initialTarget.scrollIntoView());
  scheduleUpdate();
})();
