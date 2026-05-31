const ipc = require('electron').ipcRenderer

// close app
function closeApp(e) {
  e.preventDefault();
  ipc.send('close');
}

function minApp(e) {
  ipc.send('minimize');
}

document.getElementById('closeBtn').addEventListener('click', closeApp);
document.getElementById('minimize-app').addEventListener('click', minApp);

document.getElementById('go').addEventListener('click', () => {
  goToUrl();
});

document.getElementById('back').addEventListener('click', () => goBack());
document.getElementById('forward').addEventListener('click', () => goForward());
document.getElementById('reload').addEventListener('click', () => refresh());

let jsonBookmarks = [];
const tabs = [];
let activeTabId = null;

function loadBookmarks() {
  const saved = localStorage.getItem('bookmarks');
  try {
    jsonBookmarks = saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to parse bookmarks:', err);
    jsonBookmarks = [];
  }
}

function saveBookmarks() {
  localStorage.setItem('bookmarks', JSON.stringify(jsonBookmarks));
}

function getBookmarkLabel(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '');
    return host || url;
  } catch (err) {
    return url;
  }
}

function renderBookmarks() {
  const bookmarksList = document.getElementById('bookmarks-list');
  bookmarksList.innerHTML = '';

  if (!jsonBookmarks.length) {
    const emptyMessage = document.createElement('div');
    emptyMessage.textContent = 'No saved bookmarks.';
    emptyMessage.className = 'bookmark-empty';
    bookmarksList.appendChild(emptyMessage);
    return;
  }

  jsonBookmarks.forEach((bookmark) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';

    const link = document.createElement('a');
    link.href = bookmark;
    link.textContent = getBookmarkLabel(bookmark);
    link.title = bookmark;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab) activeTab.webview.loadURL(bookmark);
    });

    const removeButton = document.createElement('button');
    removeButton.className = 'bookmark-remove';
    removeButton.textContent = '✕';
    removeButton.title = 'Remove bookmark';
    removeButton.addEventListener('click', () => {
      removeBookmark(bookmark);
    });

    item.appendChild(link);
    item.appendChild(removeButton);
    bookmarksList.appendChild(item);
  });
}

function bookmark() {
  const activeTab = getActiveTab();
  if (!activeTab) return;

  const currentURL = activeTab.webview.getURL();
  if (!currentURL) return;

  if (jsonBookmarks.includes(currentURL)) {
    console.log(`Bookmark already exists: ${currentURL}`);
    return;
  }

  jsonBookmarks.push(currentURL);
  saveBookmarks();
  renderBookmarks();
  console.log(`Bookmark added: ${currentURL}`);
}

function removeBookmark(bookmarkToRemove) {
  jsonBookmarks = jsonBookmarks.filter((bookmark) => bookmark !== bookmarkToRemove);
  saveBookmarks();
  renderBookmarks();
}

function showSavedBookmarks() {
  const bookmarksList = document.getElementById('bookmarks-list');
  if (bookmarksList.style.display === 'none' || bookmarksList.style.display === '') {
    bookmarksList.style.display = 'flex';
  } else {
    bookmarksList.style.display = 'none';
  }
  renderBookmarks();
}

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) || tabs[0] || null;
}

function getTabLabel(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '') || 'New Tab';
  } catch (err) {
    return 'New Tab';
  }
}

function initTabs() {
  if (!tabs.length) {
    createTab(document.getElementById('url').value || 'https://www.google.com');
  }
}

function createTab(url = 'https://www.google.com') {
  const tabsContainer = document.getElementById('tabs');
  const webviewContainer = document.getElementById('webview-container');
  const tabId = `tab-${Date.now()}-${tabs.length}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tab-button';
  button.dataset.tabId = tabId;
  button.textContent = getTabLabel(url);
  button.title = url;
  button.addEventListener('click', () => switchTab(tabId));

  const closeButton = document.createElement('span');
  closeButton.className = 'tab-close';
  closeButton.textContent = '✕';
  closeButton.title = 'Close tab';
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    closeTab(tabId);
  });

  button.appendChild(closeButton);
  tabsContainer.appendChild(button);

  const webview = document.createElement('webview');
  webview.dataset.tabId = tabId;
  webview.src = url;
  webview.className = 'my-webview';
  webview.style.display = 'none';
  webviewContainer.appendChild(webview);

  tabs.push({ id: tabId, url, button, webview });
  switchTab(tabId);
}

function switchTab(tabId) {
  const target = tabs.find((tab) => tab.id === tabId);
  if (!target) return;

  tabs.forEach((tab) => {
    const isActive = tab.id === tabId;
    tab.button.classList.toggle('active-tab', isActive);
    tab.webview.style.display = isActive ? 'flex' : 'none';
  });

  activeTabId = tabId;
  const urlInput = document.getElementById('url');
  if (urlInput) urlInput.value = target.webview.getURL();
}

function closeTab(tabId) {
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return;

  const [removedTab] = tabs.splice(index, 1);
  removedTab.button.remove();
  removedTab.webview.remove();

  if (activeTabId === tabId) {
    const nextTab = tabs[index] || tabs[index - 1];
    if (nextTab) {
      switchTab(nextTab.id);
    } else {
      createTab('https://www.google.com');
    }
  }
}

function goToUrl() {
  const url = document.getElementById('url').value;
  const activeTab = getActiveTab();
  if (!activeTab) return;
  {
    createTab(url);
    return;
  }
 
  const destination = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://www.google.com/search?q=${encodeURIComponent(url)}`;

  activeTab.webview.loadURL(destination);
  activeTab.url = destination;
  activeTab.button.textContent = getTabLabel(destination);
  activeTab.button.title = destination;
  // also go to it when user presses enter
  document.getElementById('url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      goToUrl();
    }
  })};


function refresh() {
  const activeTab = getActiveTab();
  if (activeTab) activeTab.webview.reload();
}

function goBack() {
  const activeTab = getActiveTab();
  if (activeTab && activeTab.webview.canGoBack()) {
    activeTab.webview.goBack();
  }
}

function goForward() {
  const activeTab = getActiveTab();
  if (activeTab && activeTab.webview.canGoForward()) {
    activeTab.webview.goForward();
  }
}
