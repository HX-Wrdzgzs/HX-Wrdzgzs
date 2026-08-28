const revealItems = document.querySelectorAll('.section-reveal');
const navLinks = [...document.querySelectorAll('.nav a')];
const glow = document.querySelector('.pointer-glow');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sections = [...document.querySelectorAll('main section[id]')];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      link.classList.toggle(
        'is-active',
        link.getAttribute('href') === `#${visible.target.id}`
      );
    });
  },
  { rootMargin: '-25% 0px -55% 0px', threshold: [0.08, 0.2, 0.4] }
);

sections.forEach((section) => sectionObserver.observe(section));

if (window.matchMedia('(pointer: fine)').matches && glow) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
    glow.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
}
