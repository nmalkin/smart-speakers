const csrfReg = /csrfToken = "(.*)"/g;
const expReg = /<audio id="audio-(.*)">[\w\W]*?<div class="summaryCss">\s*(.*?)\s*<\/div/g;

function matchCSRF(pageText) {
    const match = pageText.match(csrfReg);
    if (match == null) {
        return null;
    }
    console.log(match);
    return encodeURIComponent(match[0].slice(13, -1));
}

function matchAudio(pageText) {
    const dict = {};
    let match = expReg.exec(pageText);
    while (match) {
        /* prune malformed ids. May want to revisit which of these are still accessible */
        if (match[0][121] === '/') {
            const transcript = match[2];
            const url = `https://www.amazon.com/hz/mycd/playOption?id=${
                match[1]
            }`;
            dict[url] = transcript;
        }
        match = expReg.exec(pageText);
    }
    return dict;
}

function getCSRF() {
    /* fetch the overview page */
    return fetch(
        'https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/'
    )
        .then(response => response.text())
        .then(text => matchCSRF(text))
        .catch(err => {
            console.log(err);
            return null;
        });
}

function getAudio(tok) {
    /* make the AJAX request for the activity transcripts */
    return fetch('https://www.amazon.com/hz/mycd/alexa/activityTranscripts', {
        method: 'POST',
        body: `csrfToken=${tok}&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false`,
        mode: 'cors',
        redirect: 'follow',
        headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
        })
    })
        .then(response => response.text())
        .then(text => {
            if (
                text !==
                '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
            ) {
                return matchAudio(text);
            }
            return null;
        });
}

export { matchCSRF, matchAudio, getCSRF, getAudio };
