import { goodInteraction, orderInteractions } from '../src/common/interactions';
import { isSortedAscending } from '../src/common/util';

describe('interaction-related functions', async () => {
    describe('goodInteraction', async () => {
        test('it filters out interactions that include banned strings', async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: 'Google Assistant',
                url: '',
                timestamp: 0
            });
            expect(result).toBeFalsy();
        });

        test('the regular expressions catch whitespace', async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: `   Alexa
                 `,
                url: '',
                timestamp: 0
            });
            expect(result).toBeFalsy();
        });

        test('it allows other interactions', async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: 'a test transcript',
                url: '',
                timestamp: 0
            });
            expect(result).toBeTruthy();
        });

        test("partial matchse don't fail", async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: 'Alexa do something',
                url: '',
                timestamp: 0
            });
            expect(result).toBeTruthy();
        });

        test('it catches bad interactions with extraneous whitespace', async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: '  Google Assistant    ',
                url: '',
                timestamp: 0
            });
            expect(result).toBeFalsy();
        });
    });

    describe('orderInteractions', () => {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        test('it randomizes the order of interactions', () => {
            const interactions = numbers.map(i => {
                return {
                    testId: i,
                    recordingAvailable: false,
                    transcript: 'a test transcript',
                    url: '',
                    timestamp: 0
                };
            });
            let ids = interactions.map(interaction => interaction.testId);
            expect(isSortedAscending(ids)).toBeTruthy(); // sanity check

            orderInteractions(interactions);
            ids = interactions.map(interaction => interaction.testId);
            expect(isSortedAscending(ids)).toBeFalsy(); // will fail with small probability
        });

        test('it puts interactions with recordings first', () => {
            const testCutoff = 10;
            const interactions = numbers.map(i => {
                return {
                    testId: i,
                    recordingAvailable: i <= testCutoff,
                    transcript: 'a test transcript',
                    url: '',
                    timestamp: 0
                };
            });
            let ids = interactions.map(interaction => interaction.testId);
            expect(isSortedAscending(ids)).toBeTruthy(); // sanity check

            orderInteractions(interactions);
            ids = interactions.map(interaction => interaction.testId);
            expect(isSortedAscending(ids)).toBeFalsy(); // will fail with small probability

            numbers.forEach(n => {
                const index = ids.indexOf(n);
                if (n <= testCutoff) {
                    expect(index).toBeLessThan(testCutoff);
                } else {
                    expect(index).toBeGreaterThanOrEqual(testCutoff);
                }
            });
        });
    });
});
