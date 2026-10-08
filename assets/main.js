(() => {
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#nav-links');
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
  const mobile = window.matchMedia('(max-width: 850px)');
  mobile.addEventListener('change', closeMenu);

  const filters = document.querySelector('.publication-filters');
  const publications = [...document.querySelectorAll('.publication')];
  const status = document.querySelector('#publication-status');
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
    });
  });

  const sections = [...document.querySelectorAll('main > .tab-content')];
  const sectionForHash = hash => {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    const target = document.getElementById(id);
    return target?.closest('main > .tab-content') || null;
  };
  const showSection = section => {
    sections.forEach(item => { item.hidden = item !== section; });
    sectionLinks.forEach(link => {
      if (link.hash === `#${section.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    closeMenu();
  };
  const revealTarget = hash => {
    const section = sectionForHash(hash);
    if (!section) return;
    const paper = publications.find(item => `#${item.id}` === hash);
    if (paper?.hidden) filters.querySelector('[data-filter="all"]').click();
    showSection(section);
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    revealTarget(link.hash);
  });
  window.addEventListener('hashchange', () => {
    if (!location.hash) showSection(sections[0]);
    else if (sectionForHash(location.hash)) {
      revealTarget(location.hash);
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    }
  });
  showSection(sectionForHash(location.hash) || sections[0]);
  revealTarget(location.hash);

  // Enable optional controls only after their handlers are ready.
  menu.hidden = false;
  filters.hidden = false;
  document.documentElement.classList.add('js');
  document.querySelector('#copyright-year').textContent = String(new Date().getFullYear());
})();
