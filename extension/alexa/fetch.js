let urls;
let dict;
let audio;

const csrf_reg = /csrfToken = "(.*)"/g;
const exp_reg = /<audio id="audio-(.*)"> <s.*<\/audio>\n\s*.*\n\s*.*\n\s*.*\n\s*.*summaryCss">\n\s*(.*)<\/div/g;

function choose() {
    const random = urls[Math.floor(Math.random() * urls.length)];
    const audio_url = `https://www.amazon.com/hz/mycd/playOption?id=${random}`;
    console.log(audio_url);
    audio.src = audio_url;
    audio.controls = true;
    document.getElementById('transcript').innerHTML = dict[random];
}

function getRecordings() {
    /* fetch the overview page */
    fetch('https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/')
        .then(response => response.text())
        .then(text => {
            const match = text.match(csrf_reg);
            if (match == null) {
                document.getElementById('status').innerHTML =
                    'Fetching Audio failed. Please make sure you are logged in and try again (no CSRF match)';
                return;
            }
            const csrfToken = match[0].slice(13, -1);
            console.log(csrfToken);
        })
        .then(csrfToken => {
            /* make the AJAX request for the activity transcripts */
            fetch('https://www.amazon.com/hz/mycd/alexa/activityTranscripts', {
                method: 'POST',
                body: `csrfToken=${csrfToken}&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false`,
                mode: 'cors',
                redirect: 'follow',
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
            })
                .then(response => response.text())
                .then(text => {
                    console.log(text);
                    if (
                        text ===
                        '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
                    ) {
                        /* Try again if we get a validation error */
                        getRecordings();
                    }
                    urls = [];
                    dict = {};

                    let match = exp_reg.exec(text);
                    while (match) {
                        /* prune malformed ids. May want to revisit which of these are still accessible */
                        if (match[0][121] === '/') {
                            urls.push(match[1]);
                            dict[match[1]] = match[2];
                            console.log(match[1]);
                        }
                        match = exp_reg.exec(text);
                    }

                    /* requests often fail the first 1-2 times. Try again if we get nothing */
                    if (urls.length !== 0) {
                        const random =
                            urls[Math.floor(Math.random() * urls.length)];

                        const audio_url = `https://www.amazon.com/hz/mycd/playOption?id=${random}`;
                        audio = document.createElement('audio');
                        audio.src = audio_url;
                        audio.autoplay = false;
                        document.body.appendChild(audio);

                        document.getElementById('status').innerHTML =
                            'Success!';

                        audio.controls = true;
                        document.getElementById('transcript').innerHTML =
                            dict[random];
                    }
                });
        })
        .catch(err => {
            console.log(err);
        });
}

getRecordings();
document.getElementById('choose').addEventListener('click', choose);
