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

        test('it allows other interactions', async () => {
            const result = await goodInteraction({
                recordingAvailable: false,
                transcript: 'a test transcript',
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
        test('it randomizes the order of interactions', () => {
            const interactions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
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
    });
});
