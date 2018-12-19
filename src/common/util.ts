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

/**
 * Aggregate the given equal-length arrays
 *
 * Apply f sequentially to each pair of values in the given arrays
 */
export function zip<T, U, V>(arr1: T[], arr2: U[], f: (T, U) => V): V[] {
    if (arr1.length !== arr2.length) {
        throw new Error(`length of ${arr1} and ${arr2} doesn't match`);
    }

    return arr1.map((value, index) => {
        return f(value, arr2[index]);
    });
}
