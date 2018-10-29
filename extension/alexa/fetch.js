var urls;
var dict;
var audio;

let reg = /csrfToken = "(.*)"/g;
let audio_reg = /<audio id="(.*)">/g;
let exp_reg = /<audio id="audio-(.*)"> <s.*<\/audio>\n\s*.*\n\s*.*\n\s*.*\n\s*.*summaryCss">\n\s*(.*)<\/div/g;

// document.getElementById("play").addEventListener("click", play);
document.getElementById('choose').addEventListener('click', choose);

function choose() {
    var random = urls[Math.floor(Math.random() * urls.length)];
    var audio_url = 'https://www.amazon.com/hz/mycd/playOption?id=' + random;
    console.log(audio_url);
    //console.log(audio_url)

    // audio = new Audio();
    audio.src = audio_url;
    audio.controls = true;
    document.getElementById('transcript').innerHTML = dict[random];
}

var success = false;

function fetch() {
    var i = 0;

    while (i < 10) {
        // var get0 = new XMLHttpRequest();
        // get0.open("GET", "https://www.amazon.com", true);
        // var getprime = new XMLHttpRequest();
        // getprime.open("GET", "https://www.amazon.com/hz/mycd/ajax", true);

        /* initial get request for overview page */
        var get1 = new XMLHttpRequest();
        get1.open(
            'GET',
            'https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/',
            true
        );

        var csrfToken;
        get1.onreadystatechange = function() {
            if (get1.readyState === get1.DONE && get1.status === 200) {
                resp = get1.responseText;
                var match = resp.match(reg);

                if (match == null) {
                    document.getElementById('demo').innerHTML =
                        'Fetching Audio failed. Please make sure you are logged in and try again';
                    return;
                }

                csrfToken = match[0].slice(13, -1);
                console.log(csrfToken);

                /* final AJAX post for the activity transcripts */
                var final_post = new XMLHttpRequest();
                final_post.open(
                    'POST',
                    'https://www.amazon.com/hz/mycd/alexa/activityTranscripts',
                    true
                );
                final_post.setRequestHeader(
                    'Content-Type',
                    'application/x-www-form-urlencoded'
                );
                final_post.onreadystatechange = function() {
                    if (
                        final_post.readyState === final_post.DONE &&
                        final_post.status === 200
                    ) {
                        // console.log("* * * * * * * * * * *")

                        final_resp = final_post.responseText;
                        console.log(final_resp);

                        urls = new Array();
                        dict = {};
                        while ((match = exp_reg.exec(final_resp))) {
                            /* prune malformed ids. May want to revisit which of these are still accessible*/
                            if (match[0][121] === '/') {
                                urls.push(match[1]);
                                dict[match[1]] = match[2];
                                console.log(match[1]);
                            }
                        }

                        /* requests often fail the first 1-2 times. Try again if we get nothing*/
                        if (urls.length == 0) {
                            /* This ABSOLUTELY needs to be hardened. Failure means extension crashes */
                            if (i > 8) {
                                document.getElementById('demo').innerHTML =
                                    'Timeout Reached. Please try again';
                            }
                        } else {
                            var random =
                                urls[Math.floor(Math.random() * urls.length)];
                            //console.log(random)

                            var audio_url =
                                'https://www.amazon.com/hz/mycd/playOption?id=' +
                                random;
                            //console.log(audio_url)

                            // audio = new Audio();
                            // audio.src = audio_url;

                            audio = document.createElement('audio');
                            audio.src = audio_url;
                            audio.autoplay = false; //avoid the user has not interacted with your page issue
                            document.body.appendChild(audio);

                            document.getElementById('demo').innerHTML =
                                'Success!';
                            success = true;

                            audio.controls = true;
                            document.getElementById('transcript').innerHTML =
                                dict[random];

                            return;
                        }
                    }
                };

                /* Manually set date start to 00...0 and end to 99...9. Set batchsize as high as possible*/
                final_post.send(
                    'csrfToken=' +
                        csrfToken +
                        '&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false'
                );
            }
        };
        get1.send();
        i += 1;
    }
    document.getElementById('demo').innerHTML =
        'Audio files are being loaded. Please Wait...';
}

// function play(){
// 	audio.play();
// }

// function pause(){
// 	audio.play();
// }

// function restart(){
// 	audio.restartAudio(
// }

fetch();
