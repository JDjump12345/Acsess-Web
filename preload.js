const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe 'electronAPI' object to the frontend window
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app')
});

/// DO NOT MODIFY CODE ABOVE THIS LINE IT IS TO HANDE THE WINDOWS CONTROL BUTTONS
document.onkeypress = function(e) {
  if (e.key === 'q') {
    createTab(); // ts is useless it dont even work rn
  }
};
document.onkeypress = function(e) {
  if (e.key === '~') {

    ReadForMe(); /// function that reads the selected test (if the setting is on)
}
  
};
function ReadForMe()  {
let voice = new SpeechSynthesisUtterance();
checkimgalt();
window.getSelection().toString();
voice.text = window.getSelection().toString() || "No text selected.";
window.speechSynthesis.speak(voice);
}

function checkimgalt() {
  if (localStorage.getItem('talkbackEnabled') === 'true') {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('mouseover', () => {
      const altText = img.getAttribute('alt');
    console.log('Mouse over image with alt text:', altText);
      if (altText) {
        let voice = new SpeechSynthesisUtterance();
        voice.text = altText;
        window.speechSynthesis.speak(voice);
      }
      });
    });
  }
}

function dowloadRequest(info) {
  const downloadRequestDiv = document.getElementById('Download-Request');
  const downloadInfoP = document.getElementById('download-info');
  const saveButton = document.getElementById('Save-download');
  const declineButton = document.getElementById('Decline-download');

  downloadInfoP.textContent = `Do you want to download ${info.filename}?`;

  saveButton.onclick = () => {
    ipcRenderer.send('download-file', info.url);
    downloadRequestDiv.style.display = 'none';
  };

  declineButton.onclick = () => {
    ipcRenderer.send('decline-download', info.url);
    downloadRequestDiv.style.display = 'none';
  };

  downloadRequestDiv.style.display = 'block';
}
/// ima go do research on how to make the talkback read stuff even in the webview tag turns out all i had to do is add it to preload i guess, and then it works in the webview tag too, which is pretty cool ngl. also added a setting to turn it on and off (settings page is very basic for now, but it works) 