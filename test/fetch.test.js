const fetchlib = require('../extension/alexa/fetchlib');

const sampleCSRF =
    'var isDesktop = "true"; \
					var csrfToken = "gMEhI0aNH1xlXvtJF/wsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA"; \
			        var kindleAppsSupported = false; \
			        var myxWebsiteConfig = {};';

const sampleTranscript =
    '<audio id="audio-A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"> <source id="audioSource-A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1"></audio>\n' +
    '                     <span class="playButton" id="playIcon-50" attr="A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1" onclick="playOption(\'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1\', 50)">\n' +
    '                     <img id="playOptionIcon-50" style="width: 20px;" src = "https://m.media-amazon.com/images/G/01/digital/fiona/myx/ic_play_normal._CB1531740338_.png" />\n' +
    '                     </span>\n' +
    '                    <div class="summaryCss">\n' +
    '                          “when is kingdom hearts three coming out”</div>\n' +
    '                      </span>\n';

test('finds csrf token', () => {
    expect.assertions(1);
    let contents = sampleCSRF;

    const token =
        'gMEhI0aNH1xlXvtJF/wsG4uemtItdFMJBHDp9xYAAAAJAAAAAFvfRMJyYXcAAAAA';
    expect(fetchlib.matchCSRF(contents)).toEqual(token);
});

test('displays the correct transcript', () => {
    let transcript =
        'A3S5BH2HU6VAYF:1.0/2018/10/13/20/G090LF1181840BFC/57:10::TNIH_2V.a9baef64-be15-4776-8e84-f1830509730bZXV/1';
    fetchlib.dict = fetchlib.matchAudio(sampleTranscript);
    expect(Object.keys(fetchlib.dict).length).toEqual(1);
    expect(fetchlib.dict[transcript]).toEqual(
        '“when is kingdom hearts three coming out”'
    );
});
