/**
 * Get the index of the closest number to the target.
 */
export function getClosestIndex(numbers: number[], target: number): number {
  let index = 0;
  let min = Number.POSITIVE_INFINITY;
  let closestIndex = 0;

  for (const number of numbers) {
    const absoluteDiff = Math.abs(number - target);

    if (absoluteDiff < min) {
      closestIndex = index;
      min = absoluteDiff;
    }

    index += 1;
  }

  return closestIndex;
}
