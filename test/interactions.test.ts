import { goodInteraction } from '../src/common/interactions';

describe('content script functios', async () => {
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
});
