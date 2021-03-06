
// Import WEB APIs
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// HTML5 media contraints
const constraints = { video: true, audio: true };

// Configure Speech-to-Text via the Mozilla/W3C scritped web speech API
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';

localStorage["first"] = "false";

// The global firebase database object
let db = firebase.database();

// This variable tracks the extent of the conversation
let speech_index = 0;

// Configure Speech Recognition event listeners

recognition.onresult = function(event) {
  if (event.results.length > 0) {
    document.querySelector("#captions").innerText = event.results[speech_index][0].transcript;
    console.log(event.results[speech_index][0].transcript);
    console.log("AUDIO DETECTED");
    speech_index++;
  }
}

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

// Enable button onclick media device initialization; e is the event the event listener proceeds the action on
document.querySelector("#present").addEventListener("click", e => init(e));

// Firebase User Interaction Response (POST/GET from Realtime Database)
document.querySelector("#create").addEventListener("click", e => create_class(e));
document.querySelector("#join").addEventListener("click", e => join_class(e));

// The entire lowercase alphabet used in the random class code generation procedure
const alphabet_low = "abcdefghijklmnopqrstuvwxyz";

// The json object used for initial teacher classroom creation substitution; the stream will contain chronological lists of text with associated users
const teacher_key = {
  teacher: "Teacher",
  stream: {}
};

// This method generates a classroom code and then creates a new "classroom" in the Firebase server
function create_class (e) {

  // Generate a random classcode
  let class_code = generate_classcode();

  // Create a new entry (new "classroom") in the firebase realtime database under the new class code and push the code to it
  let updates = {};
  updates["/" + class_code] = teacher_key;

  // Update the actual firebase realtime database
  db.ref().child("classrooms").update(updates);

  // Store the current classroom code in the web cache (local storage API)
  localStorage["classcode"] = class_code;
  // Store the privelage of the current user in the web cached
  localStorage["privelage"] = "teacher";

  // Redirect the user to their classroom page
  window.location.href = "classroom.html";

}

// This function joins the user to a selected classroom
function join_class (e) {

  // Get the classcode string the user entered
  let class_code = document.querySelector("#class-code-input").value;

  console.log(class_code);

  // Store the current classroom code in the web cache (local storage API)
  localStorage["classcode"] = class_code;
  // Store the privelage of the current user in the web cached
  localStorage["privelage"] = "student";
  localStorage["first"] = "true";

  // Redirect the user to their classroom page
  window.location.href = "classroom.html";

}

// This function returns a random string as a "class code"
function generate_classcode () {

  // Class code string to be appended
  let code = "";

  // Generate a random sequence of 8 alphabet characters
  for (let i = 0; i<8; i++) {
    code += alphabet_low.charAt(Math.floor(Math.random() * Math.floor(26)));
  }

  return code;

}

// Overlay effect functions
function overlay_on() {
  document.getElementById("overlay").style.display = "block";
}

function overlay_off() {
  document.getElementById("overlay").style.display = "none";
}
