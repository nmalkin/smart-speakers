let urls;
let dict;
let audio;
let seen = [];
let csrfToken;

const csrf_reg = /csrfToken = "(.*)"/g;
const exp_reg = /<audio id="audio-(.*)"> <s.*<\/audio>\n\s*.*\n\s*.*\n\s*.*\n\s*.*summaryCss">\n\s*(.*)<\/div/g;

function choose() {
    if (seen.length === urls.length) {
        document.getElementById('status').innerHTML = 'all recordings have been shown'
    }
    else{
        const random = urls[Math.floor(Math.random() * urls.length)];
        const audio_url = `https://www.amazon.com/hz/mycd/playOption?id=${random}`;
        console.log(audio_url);
        if (seen.includes(audio_url)){
            choose();
        }
        else {
            audio.src = audio_url;
            audio.controls = true;
            document.getElementById('transcript').innerHTML = dict[random];
            seen.push(audio_url);
        }
    }
}

function matchCSRF(pageText) {
    const match = pageText.match(csrf_reg);
    if (match == null) {
        return null;
    }
    return match[0].slice(13, -1);
}

function matchAudio(pageText) {
    let dict = {}
    let match = exp_reg.exec(pageText);
    while (match) {
        /* prune malformed ids. May want to revisit which of these are still accessible */
        if (match[0][121] === '/') {
            dict[match[1]] = match[2];
            console.log(match[1]);
        }
        match = exp_reg.exec(pageText);
    }
    return dict;
}

function getCSRF() {
    /* fetch the overview page */
    return fetch('https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/')
        .then(response => response.text())
        .then(text => {
            return matchCSRF(text);;
        })
        .catch(err => {
            console.log(err);
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
            
        });
}

async function getRecordings() {
    csrfToken = await getCSRF();
    console.log(csrfToken);
    if (csrfToken == null) {
        /* convert this later to its own error page */
        document.getElementById('status').innerHTML =
    'Fetching Audio failed. Please make sure you are logged in and try again (no CSRF match)';
    }
    else{
        dict = await getAudio();
        console.log(urls)
        if (dict == null){
            getRecordings();
        }
        else if (Object.keys(dict).length === 0) {
            document.getElementById('status').innerHTML =
                        'Retrieved no audio ID\'s. Please make sure you selected the correct device';
        }
        else {
            audio = document.createElement('audio');
            document.body.appendChild(audio);
            document.getElementById('status').innerHTML = 'Success!';
            audio.controls = true;
            urls = Object.keys(dict);
            choose();
        }
    }
}

getRecordings();
document.getElementById('choose').addEventListener('click', choose);
