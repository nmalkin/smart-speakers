function fetchCsrfGoogle() {
    return fetch('https://myactivity.google.com/item?product=29').then(
        async response => {
            const signedout_regex = /FootprintsMyactivitySignedoutUi/;
            const restxt = await response.text();
            console.log(restxt);
            if (restxt.search(signedout_regex) > -1) {
                return '';
            }
            const token_regex = /window\.HISTORY_xsrf='(\S{44})'/;
            const sig = restxt.match(token_regex)[1];
            return sig;
        }
    );
}

async function fetchAudioGoogle() {
    const sig = await fetchCsrfGoogle();
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
