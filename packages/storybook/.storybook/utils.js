/**
 * Promisified setTimeout;
 * @param  {number} delay The time to wait
 * @return {Promise<void>}
 */
export function wait(delay = 500) {
  return new Promise(resolve => setTimeout(resolve, delay));
}
