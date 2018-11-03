let urls;
let dict;
let audio;

const csrf_reg = /csrfToken = "(.*)"/g;
const audio_reg = /<audio id="(.*)">/g;
const exp_reg = /<audio id="audio-(.*)"> <s.*<\/audio>\n\s*.*\n\s*.*\n\s*.*\n\s*.*summaryCss">\n\s*(.*)<\/div/g;

function choose() {
    const random = urls[Math.floor(Math.random() * urls.length)];
    const audio_url = `https://www.amazon.com/hz/mycd/playOption?id=${random}`;
    console.log(audio_url);
    audio.src = audio_url;
    audio.controls = true;
    document.getElementById('transcript').innerHTML = dict[random];
}

function get(){
	const getreq = new XMLHttpRequest();
	getreq.open('GET',
            'https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/',
            true)
	getreq.onreadystatechange = function() {
		if (getreq.readyState === getreq.DONE && getreq.status === 200){
			resp = getreq.responseText
			var match = resp.match(csrf_reg);
			if (match == null) {
                    document.getElementById('status').innerHTML =
                        'Fetching Audio failed. Please make sure you are logged in and try again (no CSRF match)';
                    return;
                }
            var csrfToken = match[0].slice(13, -1);
            console.log(csrfToken);
            post(csrfToken);
		}
	}
	getreq.send();
}

function post(csrfToken){
	const postreq = new XMLHttpRequest();
	postreq.open(
                    'POST',
                    'https://www.amazon.com/hz/mycd/alexa/activityTranscripts',
                    true
                );
	postreq.setRequestHeader(
                    'Content-Type',
                    'application/x-www-form-urlencoded'
                );
	postreq.onreadystatechange = function() {
		if (postreq.readyState == postreq.DONE && postreq.status == 200){
			postresp = postreq.responseText;
			console.log(postresp)
			urls = new Array();
			dict = {}

			while ((match = exp_reg.exec(postresp))) {
                /* prune malformed ids. May want to revisit which of these are still accessible */
                if (match[0][121] === '/') {
                    urls.push(match[1]);
                    dict[match[1]] = match[2];
                    console.log(match[1]);
                }
            }

            /* requests often fail the first 1-2 times. Try again if we get nothing */
            if (urls.length == 0) {
                document.getElementById('status').innerHTML =
                    'Unable to fetch any Audio';
            } else {
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
		}
	}
	postreq.send(
                `csrfToken=${csrfToken}&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false`
            );
}

get();
document.getElementById('choose').addEventListener('click', choose);


