let previousScroll = window.pageYOffset;

document.addEventListener('scroll', () => {
  const newScroll = window.pageYOffset;
  const scrollMax = document.scrollingElement.scrollHeight - window.innerHeight;

  if (newScroll >= scrollMax && newScroll >= previousScroll) {
    document.scrollingElement.scrollTo(0, 0);
    previousScroll = newScroll;
  }
});
