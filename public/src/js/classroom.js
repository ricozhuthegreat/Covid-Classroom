
// Import WEB APIs for tts and stt
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

var synth = window.speechSynthesis;
let pitch = 1.0;
let rate = 1.0;

var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();

analyser.fftSize = 2048;
const bufferDimension = analyser.fftSize;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

analyser.getByteTimeDomainData(dataArray);

voice_analysis();

// Voice analysis
function voice_analysis () {

  // Update the rate by how frequently different peaks occur next to each other
  rate = (bufferDimension/bufferLength)/bufferLength + 1.0;

  console.log("RATE:" + rate);

  // Update the pitch by checking the range/variance of volume peaks/valleys (maxima and minima)
  pitch = 2 * (analyser.maxDedibels - analyser.minDecibels);

  console.log("PITCH:" + pitch);

}

console.log(dataArray);

// Retreive the cached variableS
const class_code = localStorage["classcode"];
const privelage = localStorage["privelage"];

if (localStorage["first"] === "true") {
  overlay_on();
} else {
  overlay_off();
}

// HTML5 media contraints
const media_constraints = { video: true, audio: true };
const media_constraints_rest = { video: true, audio: false };

// Configure Speech-to-Text via the Mozilla/W3C scritped web speech API
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';

// The global firebase database object
let db = firebase.database();

// This variable tracks the extent of the conversation
let speech_index = 0;

// The name of the student
let student_name = localStorage["student_name"];

if (privelage === "teacher") {
  student_name = "Teacher";
  // Show the classroom code
  document.getElementById("code-display").innerText = class_code;
}

// The speech stream on the firebase realtime database
let speech_stream_ref = firebase.database().ref("classrooms/" + class_code + "/stream");

// Attach a stream listener to the database reference
speech_stream_ref.on("child_added", function(data) {
  show_captions(data);
  synthesis_captions(data);
});

function show_captions (data) {
  document.querySelector("#captions").innerText = data.val().name + ": " + data.val().text;
}

function synthesis_captions (data) {

  if (synth.speaking) {
    console.error('speechSynthesis.speaking');
    return;
  }

  if (data.val().name === student_name) {
    console.log("SAME SPEAKER");
    return;
  }

  // Get the spoken sentence
  let blurb = data.val().text;

  let speech_synthesizer = new SpeechSynthesisUtterance(blurb);

  speech_synthesizer.onend = function (event) {
    console.log('SpeechSynthesisUtterance.onend');
  }
  speech_synthesizer.onerror = function (event) {
    console.error('SpeechSynthesisUtterance.onerror');
  }

  speech_synthesizer.pitch = pitch;
  speech_synthesizer.rate = rate;

  let voice = "Google US English";

  synth.speak(speech_synthesizer);

}

// Configure Speech Recognition event listeners

recognition.onresult = function(event) {

  if (event.results.length > 0) {

    let client_speech = event.results[speech_index][0].transcript;
    console.log(client_speech);
    console.log("AUDIO DETECTED");
    speech_index++;

    // Post update to the Firebase database speech stream
    let new_speech_ref = speech_stream_ref.push();
    // Append the current username and text to the new speech reference stream updater
    new_speech_ref.set({
      name: student_name,
      text: client_speech
    });

  }

}

// This method handles an successful approval; it continues setng up the rest of the stream
function handleSuccess(stream) {

  // VIDEO SETTINGS

  // The video media player stream element
  const video = document.querySelector("#student-stream");
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
    const stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

// Enable button onclick media device initialization; e is the event the event listener proceeds the action on
document.querySelector("#present").addEventListener("click", e => init(e));

// Firebase responsive document elements
document.getElementById("join-class").addEventListener("click", e => join_class_as_student(e));

// This function adds the student formally to the classroom
function join_class_as_student (e) {
  student_name = document.querySelector("#sname").value;
  localStorage["first"] = "false";
  localStorage["student_name"] = student_name;
  overlay_off();
}

// Overlay effect functions
function overlay_on() {
  document.getElementById("overlay").style.display = "block";
}

function overlay_off() {
  document.getElementById("overlay").style.display = "none";
}
