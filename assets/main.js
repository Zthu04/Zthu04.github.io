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
  const mobile = window.matchMedia('(max-width: 800px)');
  mobile.addEventListener('change', closeMenu);

  const markCurrentSection = id => {
    sectionLinks.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const sections = [...document.querySelectorAll('main section[id]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      const current = sections.find(section => visible.has(section.id));
      if (current) markCurrentSection(current.id);
    }, { rootMargin: '-100px 0px -45% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }
  sectionLinks.forEach(link => link.addEventListener('click', () => markCurrentSection(link.hash.slice(1))));

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

  // Enable optional controls only after their handlers are ready.
  menu.hidden = false;
  filters.hidden = false;
  document.documentElement.classList.add('js');
  document.querySelector('#copyright-year').textContent = String(new Date().getFullYear());
})();
