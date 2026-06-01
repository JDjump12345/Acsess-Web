const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe 'electronAPI' object to the frontend window
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app')
});
/*
function loadSettings() {
const talkbackEnabled = localStorage.getItem('talkbackEnabled') === 'true';
if (talkbackEnabled) {
let voice = new SpeechSynthesisUtterance();
const textmouseisover = document.querySelectorAll(':hover')[0];
 /// when keypress of `, read the text under mouse
 document.addEventListener('keypress', (e) => {
  if (e.key === '`') {
const textmouseisover = document.querySelectorAll(':hover')[0];
voice.text = textmouseisover.textContent || textmouseisover.innerText || "No text found under mouse.";
window.speechSynthesis.speak(voice);
  }
});
voice.text = textmouseisover.textContent || textmouseisover.innerText || "No text found under mouse.";
window.speechSynthesis.speak(voice);
}
}
*/
document.onkeypress = function(e) {
  if (e.key === 'Enter') {
    goToUrl();
  }
};
document.onkeypress = function(e) {
  if (e.key === 'q') {
    ReadForMe();
  }
};
function ReadForMe()  {
let voice = new SpeechSynthesisUtterance();
window.getSelection().toString();
voice.text = window.getSelection().toString() || "No text selected.";
window.speechSynthesis.speak(voice);
}

/// ima go do research on how to make the talkback read stuff even in the webview tag