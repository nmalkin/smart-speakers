import {
    matchCSRF,
    getInteractionFromMatch,
    extractAudio,
    timestampFromAudioID,
    filterUsableInteractions
} from '../src/common/alexa/amazon';

const sampleCSRF =
    'var isDesktop = "true"; ' +
    '				var csrfToken = "gMEhI0aNH1xlXvtJF/wsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA"; ' +
    '		        var kindleAppsSupported = false; ' +
    '		        var myxWebsiteConfig = {};';

const sampleTranscript =
    '<audio id="audio-A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
    '                     <span class="playButton" id="playIcon-50" attr="A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
    '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
    '                     </span>\n' +
    '                    <div class="summaryCss">\n' +
    '                          “when is kingdom hearts three coming out”</div>\n' +
    '                      </span>\n';

describe('matchCSRF', () => {
    test('finds and encodes csrf token', () => {
        expect.assertions(1);
        const token =
            'gMEhI0aNH1xlXvtJF%2FwsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA';
        expect(matchCSRF(sampleCSRF)).toEqual(token);
    });

    test("it throws an error if it can't find the token", () => {
        const page =
            'var isDesktop = "true"; ' +
            '				var someOtherToken = "gMEhI0aNH1xlXvtJF/wsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA"; ' +
            '		        var kindleAppsSupported = false; ' +
            '		        var myxWebsiteConfig = {};';
        expect(() => {
            matchCSRF(page);
        }).toThrowError('CSRF token');
    });
});

describe('filterUsableInteractions', () => {
    test('it filters interactions where the transcripts says Text not available', () => {
        expect(
            filterUsableInteractions([
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript: 'something'
                },
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript:
                        'Text not available – audio was not intended for Alexa'
                },
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript: 'something else'
                }
            ]).length
        ).toEqual(2);
    });

    test("it filters interactions even when the Text not available isn't the exact full string", () => {
        expect(
            filterUsableInteractions([
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript: 'something'
                },
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript: 'Text not available'
                },
                {
                    audioID: 'IGNORED',
                    url: 'IGNORED',
                    timestamp: 0,
                    recordingAvailable: true,
                    transcript: 'something else'
                }
            ]).length
        ).toEqual(2);
    });
});

describe('getInteractionFromMatch', () => {
    test('it returns an interaction', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        expect(
            getInteractionFromMatch(['matched text', id, 'transcript'])
        ).toMatchObject({
            url:
                'https://www.amazon.com/hz/mycd/playOption?id=A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1',
            transcript: 'transcript'
        });
    });

    test('it throws an error if audio id is invalid', () => {
        const id =
            '!A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        expect(() => {
            getInteractionFromMatch(['matched text', id, 'transcript']);
        }).toThrowError('audio ID');
    });

    test('it returns null if not enough components matched', () => {
        expect(() => {
            getInteractionFromMatch(['missing', 'matches']);
        }).toThrowError('missing fields');
    });
});

describe('extractAudio', () => {
    test('returns the correct transcript', () => {
        const [result] = extractAudio(sampleTranscript);
        expect(result[0].transcript).toEqual(
            '“when is kingdom hearts three coming out”'
        );
    });

    test('returns the correct URL', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        const [result] = extractAudio(sampleTranscript);
        expect(result[0].url).toEqual(
            `https://www.amazon.com/hz/mycd/playOption?id=${id}`
        );
    });

    test('returns the correct interaction', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        const [result] = extractAudio(sampleTranscript);
        expect(result[0]).toMatchObject({
            url: `https://www.amazon.com/hz/mycd/playOption?id=${id}`,
            transcript: '“when is kingdom hearts three coming out”',
            timestamp: Date.UTC(2018, 9, 13, 20, 57, 10)
        });
    });

    test('returns an error if audio ID is malformed', () => {
        const page =
            '<audio id="audio-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
            '                     <span class="playButton" id="playIcon-50" attr="A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
            '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
            '                     </span>\n' +
            '                    <div class="summaryCss">\n' +
            '                          “when is kingdom hearts three coming out”</div>\n' +
            '                      </span>\n';

        const [, errors] = extractAudio(page);
        expect(errors.length).toBeGreaterThan(0);
    });

    test('handles TextClient audioIDs', () => {
        const page =
            '<audio id="audio-TextClient:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-TextClient:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
            '                     <span class="playButton" id="playIcon-50" attr="TextClient:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'TextClient:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
            '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
            '                     </span>\n' +
            '                    <div class="summaryCss">\n' +
            '                          “this is a textclient example”</div>\n' +
            '                      </span>\n';
        const [interactions] = extractAudio(page);
        expect(interactions.length).toBeGreaterThan(0);
    });

    test('returns empty array if nothing is found', () => {
        const [interactions] = extractAudio('a test string without audio');
        expect(interactions).toEqual([]);
    });
});

describe('timestampFromAudioID', () => {
    test('it produces the right timestamp', () => {
        let id =
            'A3S5BH2HU6VAYF:1.0/2018/11/01/23/G090LF0964950683/15:15::TNIH_2V.9053daa8-8164-1193-bf4e-293caba0d27cYXV/1';
        expect(timestampFromAudioID(id)).toEqual(1541114115000);

        id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        expect(timestampFromAudioID(id)).toEqual(
            Date.UTC(2018, 9, 13, 20, 57, 10)
        );
    });

    test('it throws if timestamp is invalid', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/YYYY/11/DD/23/G090LF0964950683/15:15::TNIH_2V.9053daa8-8164-1193-bf4e-293caba0d27cYXV/1';
        expect(() => {
            timestampFromAudioID(id);
        }).toThrow('failed to find timestamp');
    });
});
