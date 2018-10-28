var urls
var audio

let reg = /csrfToken = "(.*)"/g
let audio_reg = /<audio id="(.*)">/g

// document.getElementById("play").addEventListener("click", play);
document.getElementById("choose").addEventListener("click", choose);

function choose(){
	var random = urls[Math.floor(Math.random() * urls.length)]
	var audio_url = "https://www.amazon.com/hz/mycd/playOption?id=" + random
	console.log(audio_url)
	//console.log(audio_url)

	// audio = new Audio();
	audio.src = audio_url;
	audio.controls = true;
}

function fetch(){

	var i = 0

	while (i < 20){


		var get0 = new XMLHttpRequest();
		get0.open("GET", "https://www.amazon.com", true);

		/* initial get request for overview page */
		var get1 = new XMLHttpRequest();
		get1.open("GET", "https://www.amazon.com/hz/mycd/myx#/home/alexaPrivacy/home", true);

		var csrfToken;
		get1.onload = function() {
			if (get1.readyState === get1.DONE && get1.status === 200) {
				// console.log("* * * * * * * * * * *")
		        // console.log(get1.response);
		        console.log(get1.responseText);
				resp = get1.responseText
				var match = resp.match(reg)
				if (match == null){
					document.getElementById("demo").innerHTML = "Fetching Audio failed. Please make sure you are logged in and try again";
					return
				}
				csrfToken = match[0].slice(13, -1)
				console.log(csrfToken)

				/* Request for review tab URL */
				var get2 = new XMLHttpRequest();
				get2.open("GET", "https://www.amazon.com/gp/digital/fiona/manage/features/order-history/ajax/blank.html/ref=kinw_myk_dsk_alexaPrivacy_reviewVoice_myx_selected?", true);
				get2.onload = function() {
					if (get2.readyState === get2.DONE && get2.status === 200) {
						// console.log("* * * * * * * * * * *")
			            console.log(get2.response);

			            /* First POST for AJAX */
					    var post1 = new XMLHttpRequest();
						post1.open("POST", 'https://www.amazon.com/hz/mycd/ajax', true);
						post1.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
						post1.onload = function() {
							if (post1.readyState === post1.DONE && post1.status === 200) {
					            // console.log("* * * * * * * * * * *")
					            console.log(post1.response);
								
								var get3 = new XMLHttpRequest();
								get3.open("GET", "https://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js?_=1539498376041", true);
								get3.onload = function() {
									if (get3.readyState === get3.DONE && get3.status === 200) {
										// console.log("* * * * * * * * * * *")
							            console.log(get3.response);

										/* Second POST */
							            var post2 = new XMLHttpRequest();
										post2.open("POST", 'https://www.amazon.com/hz/mycd/ajax', true);
										post2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
										post2.onload = function() {
											if (post2.readyState === post2.DONE && post2.status === 200) {
										            // console.log("* * * * * * * * * * *")
										            console.log(post2.response);

										            //  Uses a CSRF token so this will probably need to be adapted to scan the previous html
													var post3 = new XMLHttpRequest();
													post3.open("POST", 'https://www.amazon.com/hz/mycd/ajax', true);
													post3.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
													post3.onload = function() {
														if (post3.readyState === post3.DONE && post3.status === 200) {
												            // console.log("* * * * * * * * * * *")
												            console.log(post3.response);

												            /* final AJAX post for the activity transcripts */
												            var final_post = new XMLHttpRequest();
															final_post.open("POST", 'https://www.amazon.com/hz/mycd/alexa/activityTranscripts', true);
															final_post.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
															final_post.onload = function() {
																if (final_post.readyState === final_post.DONE && final_post.status === 200) {
														            // console.log("* * * * * * * * * * *")
														           
														            final_resp = final_post.responseText
														            console.log(final_resp);

														            urls = new Array()
														            while (match = audio_reg.exec(final_resp)) {

														            	/* prune malformed ids. May want to revisit which of these are still accessible*/
														            	if (match[0][121] === '/'){
														            		urls.push(match[0].slice(17,-135))
														            		console.log(match[0].slice(17,-135))
														            	}
														            }

														            /* requests often fail the first 1-2 times. Try again if we get nothing*/
														            if (urls.length == 0){

														            	/* This ABSOLUTELY needs to be hardened. Failure means extension crashes */
														            	if (i > 19){
																			document.getElementById("demo").innerHTML = "Fetching Audio failed. Please relog and try again";
														            	}
														            }
														            else{
														            	var random = urls[Math.floor(Math.random() * urls.length)]
														            	//console.log(random)

														            	var audio_url = "https://www.amazon.com/hz/mycd/playOption?id=" + random
														            	//console.log(audio_url)

														            	// audio = new Audio();
														            	// audio.src = audio_url;

														            	audio = document.createElement('audio');
																	    audio.src = audio_url;
																	    audio.autoplay = false; //avoid the user has not interacted with your page issue
																	    document.body.appendChild(audio);
																		
																		document.getElementById("demo").innerHTML = "Success!";
																		
																		audio.controls = true;	

														            	return;
														            }
														        }
														    }
														    
														    /* Manually set date start to 00...0 and end to 99...9. Set batchsize as high as possible*/
														    final_post.send("csrfToken=" + csrfToken + "&rangeType=custom&startDate=000000000000&endDate=9999999999999&batchSize=999999&shouldParseStartDate=false&shouldParseEndDate=false")
												        }
												    }
													post3.send("csrfToken=" + csrfToken + "&data=%7B%22param%22%3A%7B%22LogCSM%22%3A%7B%22metrics%22%3A%5B%7B%22key%22%3A%22desktop_alexaPrivacy_ah_1%22%2C%22value%22%3A1%7D%5D%7D%7D%7D")
									        }
									    }
										post2.send("data=%7B%22param%22%3A%7B%22GetTimestamp%22%3A%7B%22rangeType%22%3A%22today%22%7D%7D%7D&csrfToken=" + csrfToken)
									}
								}
								get3.send()
							}
						}
						post1.send("data=%7B%22param%22%3A%7B%22LogPageInfo%22%3A%7B%22pageInfo%22%3A%7B%22subPageType%22%3A%22kinw_myk_dsk_alexaPrivacy_reviewVoice_myx_selected%22%7D%7D%7D%7D&csrfToken=" + csrfToken)
				    }
				}
				get2.send();
		    }
		}
		get1.send();
		i+=1;
	}
	document.getElementById("demo").innerHTML = "Please Wait";
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
