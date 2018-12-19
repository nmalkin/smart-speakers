import { selectUnseen } from '../src/common/util';

describe('utility functions', () => {
    describe('selectUnseen', () => {
        test('it selects all numbers in the expected range', () => {
            const collect = { 0: false, 1: false, 2: false };
            for (let i = 0; i < 100; i += 1) {
                const chosen = selectUnseen(3, []);
                collect[chosen] = true;
            }
            const allTrue = collect[0] && collect[1] && collect[2];
            expect(allTrue).toBeTruthy();
        });

        test('it excludes numbers that have been seen', () => {
            const collect = { 0: false, 1: false, 2: false };
            for (let i = 0; i < 100; i += 1) {
                const chosen = selectUnseen(3, [1]);
                collect[chosen] = true;
            }
            expect(collect[1]).not.toBeTruthy();
        });

        test('it throws an error if it no number can be selected', () => {
            expect(() => {
                const chosen = selectUnseen(3, [2, 0, 1]);
            }).toThrow('all numbers seen');
        });
    });
});
