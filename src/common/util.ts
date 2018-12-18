/**
 * Selects an integer at random between 0 and max, if it doesn't appear in `seen`
 *
 * @param max the chosen number will be less than (but not equal to) max.
 * @param seen the integers that have already been seen
 */
export function selectUnseen(max: number, seen: number[]): number {
    if (seen.length >= max) {
        throw new Error('all numbers seen');
    }
    const randomInt = () => Math.floor(Math.random() * max);
    let index = randomInt();
    while (seen.includes(index)) {
        index = randomInt();
    }
    return index;
}
