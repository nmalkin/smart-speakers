import { Interaction } from './types';

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

/** Wait for the specified time
 * @param time number of milliseconds to wait
 */
export function sleep(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time));
}

export function summarize(interactions: Interaction[]): object {
    const report = {};
    interactions.forEach(interaction => {
        const date = new Date(interaction.timestamp);
        const day = date.getUTCDate();
        const week = Math.floor(day / 7);
        const tag = `${date.getUTCFullYear()}-${date.getUTCMonth() +
            1}.${week}`;
        if (!(tag in report)) {
            report[tag] = { interactions: 0, recordings: 0 };
        }
        report[tag].interactions += 1;
        if (interaction.recordingAvailable) {
            report[tag].recordings += 1;
        }
    });
    return report;
}

/**
 * Randomly shuffle the given array in place using the Fisher–Yates shuffle
 * code from https://stackoverflow.com/a/12646864
 */
export function shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Return true if given array is sorted in ascending order
 * via https://stackoverflow.com/a/53833620
 */

export const isSortedAscending = (arr: any[]): boolean =>
    arr.every((v, i, a) => !i || a[i - 1] <= v);
