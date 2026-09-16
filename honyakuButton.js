
const startBtn=document.querySelector('#start-btn');

const startBtn2=document.querySelector('#start-btn2');

const repBtn = document.querySelector('#rep-btn');
const transBtn = document.querySelector('#trans-btn');
const reverseBtn = document.querySelector('#reverse-btn');

const resultDiv = document.querySelector('#result-div');
const japaneseDiv = document.querySelector('#input-div');

const inputselector = document.getElementById('inputtag');
const outputselector = document.getElementById('outputtag');

var inputTag = document.getElementById('inputtag2').jap.value;
var outputTag = document.getElementById('outputtag2').eng.value;
var translatedSentense = '';
var originalSentense = '';

SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
var recognition = new SpeechRecognition();
recognition.lang = inputTag;
recognition.interimResults = true;
recognition.continuous = false;

var recognition2 = new SpeechRecognition();
recognition2.lang = outputTag;
recognition2.interimResults = true;
recognition2.continuous = false;

function translate(scripttext){
    let urladd='https://script.google.com/macros/s/AKfycbxn85uDVijnIBFqQEeP13_4I5DrwivCHZq7BaZRPjSxlhiS3r52USbL0MpNxDBDRPon/exec?text='
    let urlsequence=urladd+scripttext+'&souce='+inputTag+'&target='+outputTag;
    fetch(urlsequence)
    .then(rresponse=>{
        return rresponse.text();
    })
    .then(ttext=>{
        resultDiv.innerHTML=ttext;
        speechSynthesis.cancel();
        translatedSentense = ttext;
        multispeaknow(translatedSentense,outputTag);
        recognition.stop();
        recognition2.stop();
    });
}

function translate2(scripttext){
    let urladd='https://script.google.com/macros/s/AKfycbxn85uDVijnIBFqQEeP13_4I5DrwivCHZq7BaZRPjSxlhiS3r52USbL0MpNxDBDRPon/exec?text='
    let urlsequence=urladd+scripttext+'&souce='+outputTag+'&target='+inputTag;
    fetch(urlsequence)
    .then(rresponse=>{
        return rresponse.text();
    })
    .then(ttext=>{
        japaneseDiv.innerHTML=ttext;
        speechSynthesis.cancel();
        translatedSentense = ttext;
        multispeaknow(translatedSentense,inputTag);
        recognition.stop();
        recognition2.stop();
    });
}

document.getElementById('inputtag2').onchange = function(){
    inputTag=document.getElementById('inputtag2').jap.value;
    recognition.lang = inputTag;
    
}

document.getElementById('outputtag2').onchange = function(){
    outputTag=document.getElementById('outputtag2').eng.value;
    recognition2.lang = outputTag;
}

recognition.onresult = (event) => {
    speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    }
    if(event.results[0].isFinal){
        originalSentense=event.results[0][0].transcript;
        japaneseDiv.innerHTML=originalSentense;
        //document.forms["input"].elements["elem"].value=originalSentense;
        translate(originalSentense);
    }
}

recognition2.onresult = (event) => {
    speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    }
    if(event.results[0].isFinal){
        originalSentense=event.results[0][0].transcript;
        resultDiv.innerHTML=originalSentense;
        //document.forms["input"].elements["elem"].value=originalSentense;
        translate2(originalSentense);
    }
}

startBtn.onclick = () => {
    recognition.stop();
    recognition2.stop();
    recognition.lang = inputTag;
    speechSynthesis.cancel();
    recognition.start();
}

startBtn2.onclick = () => {
    recognition.stop();
    recognition2.stop();
    recognition2.lang = outputTag;
    speechSynthesis.cancel();
    recognition2.start();
}

repBtn.onclick = () => {
    speechSynthesis.cancel();
    multispeaknow(translatedSentense,outputTag);
}

transBtn.onclick =() =>{
    translate(originalSentense);
}

reverseBtn.onclick =() =>{
    var option_states = document.querySelectorAll("select[name=jap] option");
    for (var state of option_states){
        if(state.value===outputTag){
            state.selected = true;
        }else{
            state.selected = false;
        }
    }
    var option_states2 = document.querySelectorAll("select[name=eng] option");
    for (var state of option_states2){
        if(state.value===inputTag){
            state.selected = true;
        }else{
            state.selected = false;
        }
    }
    inputTag=document.getElementById('inputtag2').jap.value;
    outputTag=document.getElementById('outputtag2').eng.value;
    recognition.stop();
    recognition2.stop();
    recognition.lang = inputTag;
    recognition2.lang = outputTag;
    speechSynthesis.cancel();
    /*
    recognition.start();
    */
}
