
// Import WEB APIs
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// HTML5 media contraints
const constraints = { video: true, audio: true };

// Configure Speech-to-Text via the Mozilla/W3C scritped web speech API
const recognition = new SpeechRecognition();

// Configure Speech Recognition event listeners

recognition.onresult = function(event) {
  if (event.results.length > 0) {
    document.querySelector("#captions").innerText = event.results[0][0].transcript;
    console.log(event.results[0][0].transcript);
  }
}

/*recognition.onspeechend = function() {
  recognition.stop();
}*/

// This method handles an successful approval; it continues setng up the rest of the stream
function handleSuccess(stream) {

  // VIDEO SETTINGS

  // The video media player stream element
  const video = document.querySelector("#camera-stream");
  const videoTracks = stream.getVideoTracks();
  window.stream = stream;
  video.srcObject = stream;

  // AUDIO SETTINGS

  // Create audio context capture device (chrome only)
  let audioContext = new AudioContext();

  // Create an audio filter node with its associated cutoff frequencies (to avoid feedback noises)
  let filterNode = audioContext.createBiquadFilter();
  filterNode.type = 'highpass';
  filterNode.frequency.value = 10000;

  // Create a gain node (to change audio volume)
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.5;

  // The audio media player stream element
  const mediaStreamSource =
    audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(filterNode);
    filterNode.connect(gainNode);
  // Connect the gain node to the destination (i.e. play the sound)
  gainNode.connect(audioContext.destination);

  // Enable the voice speech API
  recognition.start();

}

// This method logs out any potential errors loading the media devices
function handleError(error) {
  console.log(error);
}

// This asyncronous function awaits for the user to approve the web stream element and then sets up the stream
async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

// Enable button onclick media device initialization
document.querySelector("#present").addEventListener('click', e => init(e));
