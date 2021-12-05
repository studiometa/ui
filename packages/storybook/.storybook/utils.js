/**
 * Promisified setTimeout;
 * @param  {number} delay The time to wait, defaults to 100.
 * @return {Promise<void>}
 */
export function wait(delay = 100) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Promisified requestAnimationFrame
 * @return {Promise<void>}
 */
export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
