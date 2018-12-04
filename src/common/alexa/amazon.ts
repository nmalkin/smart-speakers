const csrfReg = /csrfToken = "(.*)"/g;
const expReg = /<audio id="audio-(.*)"> <s.*<\/audio>\n\s*.*\n\s*.*\n\s*.*\n\s*.*summaryCss">\n\s*(.*)<\/div/g;
let csrfToken;

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
            console.log(url);
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

function getAudio() {
    /* make the AJAX request for the activity transcripts */
    return fetch('https://www.amazon.com/hz/mycd/alexa/activityTranscripts', {
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
                text !==
                '{"ERROR":"{\\"success\\":false,\\"error\\":\\"CSRF_VALIDATION_FAILED\\"}"}'
            ) {
                return matchAudio(text);
            }
            return null;
        });
}

async function getRecordings() {
    csrfToken = await getCSRF();
    console.log(csrfToken);
    if (csrfToken == null) {
        return [];
    }
    const dict = await getAudio();
    if (dict == null) {
        /* harden this just in case */
        return getRecordings();
    }
    return dict;
}

export { matchCSRF, matchAudio, getRecordings };
