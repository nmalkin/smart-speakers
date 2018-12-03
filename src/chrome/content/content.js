import { fetchAudioGoogle } from '../../common/google/google';
import { getRecordings } from '../../common/alexa/amazon';

let device = '';
let verified = false;
let urls = [];
let transcripts = [];
const seen = [];

const messageListener = async function messageListener(event) {
    if (event.source !== window) {
        // pass
    } else if (event.data === 'alexa') {
        device = 'alexa';
        const dict = await getRecordings();
        urls = Object.keys(dict);
        transcripts = Object.values(dict);
        if (urls.length > 0) {
            // additional screening logic
            verified = true;
        }
    } else if (event.data === 'google') {
        device = 'google';
        const data = await fetchAudioGoogle();
        urls = data.urls;
        transcripts = data.transcripts;
        if (urls.length > 0) {
            // additional screening logic
            verified = true;
        }
    } else if (event.data === 'verify') {
        window.postMessage({ type: 'verification', value: verified }, '*');
    } else if (event.data === 'retry') {
        window.postMessage(device, '*');
        setTimeout(() => {
            window.postMessage('verify', '*');
        }, 2000);
    } else if (event.data === 'recording') {
        let index = Math.floor(Math.random() * urls.length);
        while (seen.includes(index)) {
            index = Math.floor(Math.random() * urls.length);
        }
        seen.push(index);
        const url = urls[index];
        const transcript = transcripts[index];
        window.postMessage({ type: 'audio', url, transcript }, '*');
    }
};

window.addEventListener('message', messageListener, false);
