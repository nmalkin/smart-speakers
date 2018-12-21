import {
    matchCSRF,
    matchAudio,
    validAudioID,
    getInteractionFromMatch,
    extractAudio
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

    test("it returns null if it can't find the token", () => {
        const page =
            'var isDesktop = "true"; ' +
            '				var someOtherToken = "gMEhI0aNH1xlXvtJF/wsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA"; ' +
            '		        var kindleAppsSupported = false; ' +
            '		        var myxWebsiteConfig = {};';
        expect(matchCSRF(page)).toBeNull();
    });
});

describe('validAudioID', () => {
    test('it matches a valid ID', () => {
        expect(
            validAudioID(
                'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1'
            )
        ).toBeTruthy();
    });

    test('it rejects an invalid ID', () => {
        expect(
            validAudioID(
                '_A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1'
            )
        ).toBeFalsy();
    });
});

describe('getInteractionFromMatch', () => {
    test('it returns an interaction', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        expect(
            getInteractionFromMatch(['matched text', id, 'transcript'])
        ).toEqual({
            url:
                'https://www.amazon.com/hz/mycd/playOption?id=A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1',
            transcript: 'transcript'
        });
    });

    test('it returns null if audio id is invalid', () => {
        const id =
            '!A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        expect(
            getInteractionFromMatch(['matched text', id, 'transcript'])
        ).toBeNull();
    });

    test('it returns null if not enough components matched', () => {
        const id = expect(
            getInteractionFromMatch(['missing', 'matches'])
        ).toBeNull();
    });
});

describe('extractAudio', () => {
    test('returns the correct transcript', () => {
        const id =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        const result = extractAudio(sampleTranscript);
        expect(result[0]).toEqual({
            url: `https://www.amazon.com/hz/mycd/playOption?id=${id}`,
            transcript: '“when is kingdom hearts three coming out”'
        });
    });

    test('skips action if audio ID is malformed', () => {
        const page =
            '<audio id="audio-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
            '                     <span class="playButton" id="playIcon-50" attr="A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
            '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
            '                     </span>\n' +
            '                    <div class="summaryCss">\n' +
            '                          “when is kingdom hearts three coming out”</div>\n' +
            '                      </span>\n';

        const result = extractAudio(page);
        expect(result).toEqual([]);
    });

    test('returns empty dict if nothing is found', () => {
        expect(matchAudio('a test string without audio')).toEqual({});
    });
});

describe('matchAudio', () => {
    test('displays the correct transcript', () => {
        const transcript =
            'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
        const dict = matchAudio(sampleTranscript);
        expect(Object.keys(dict).length).toEqual(1);
        expect(
            dict[`https://www.amazon.com/hz/mycd/playOption?id=${transcript}`]
        ).toEqual('“when is kingdom hearts three coming out”');
    });

    test('skips action if audio ID is malformed', () => {
        const page =
            '<audio id="audio-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-A3S5BH2HU6VAYF::1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
            '                     <span class="playButton" id="playIcon-50" attr="A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
            '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
            '                     </span>\n' +
            '                    <div class="summaryCss">\n' +
            '                          “when is kingdom hearts three coming out”</div>\n' +
            '                      </span>\n';

        const dict = matchAudio(page);
        expect(dict).toEqual({});
    });

    test('returns empty dict if nothing is found', () => {
        expect(matchAudio('a test string without audio')).toEqual({});
    });
});
