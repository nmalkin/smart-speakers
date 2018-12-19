import { selectUnseen, zip } from '../src/common/util';

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

    describe('zip', () => {
        test('it combines two equal-length arrays', () => {
            const combined = zip(['a', 'b', 'c'], [1, 2, 3], (a, b) => {
                return { a, b };
            });
            expect(combined).toEqual([
                { a: 'a', b: 1 },
                { a: 'b', b: 2 },
                { a: 'c', b: 3 }
            ]);
        });

        test('it throws on unequal arrays', () => {
            expect(() => {
                zip([1, 2, 3], [4, 5, 6, 7], () => {
                    return 0;
                });
            }).toThrow('length');
        });
    });
});
