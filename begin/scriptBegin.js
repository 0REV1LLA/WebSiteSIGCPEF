const scrollRevealOption = {
  origin: 'right',
  distance: '50px',
  duration: 800,
  easing: 'ease-out',
  opacity: 0,
  scale: 0.9
};

ScrollReveal().reveal('.header-logo img', {
  ...scrollRevealOption,
  delay: 1020
});

ScrollReveal().reveal('.header-tittle h2', {
  ...scrollRevealOption,
  delay: 1020
});

ScrollReveal().reveal('.header-links, a', {
  ...scrollRevealOption,
  interval: 400,
  delay: 1200
});

ScrollReveal().reveal('.section-begin', {
  ...scrollRevealOption,
  origin: "top",
  delay: 800
});

ScrollReveal().reveal('footer p', {
  ...scrollRevealOption,
  origin: "bottom",
  delay: 1000
});
