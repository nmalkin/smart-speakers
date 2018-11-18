function checkSignedOut(text) {
    const regex = /FootprintsMyactivitySignedoutUi/;
    return text.search(regex) > -1;
}

function extractCsrfToken(text) {
    const regex = /window\.HISTORY_xsrf='(\S{44})'/;
    const token = text.match(regex)[1];
    return token;
}

function fetchCsrfToken() {
    return fetch('https://myactivity.google.com/item?product=29').then(
        async response => {
            const restxt = await response.text();
            if (checkSignedOut(restxt)) {
                return '';
            }
            return extractCsrfToken(restxt);
        }
    );
}

async function fetchAudioGoogle() {
    const sig = await fetchCsrfToken();
    if (sig === '') {
        return [];
    }
    return fetch(
        'https://myactivity.google.com/item?product=29&jspb=1&jsv=myactivity_20181016-0717_1',
        {
            method: 'POST',
            body: `{"sig":"${sig}"}`
        }
    ).then(async response => {
        const restxt = await response.text();
        const data = JSON.parse(restxt.slice(6))[0];
        return data;
    });
}

 module.exports = { checkSignedOut, extractCsrfToken, fetchAudioGoogle }; 
