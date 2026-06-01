const { ipcRenderer } = require('electron');

// close app
function closeApp(e) {
  e.preventDefault();
  ipcRenderer.send('close');
}

function minApp(e) {
  ipcRenderer.send('minimize');
}

document.getElementById('closeBtn').addEventListener('click', closeApp);
document.getElementById('minimize-app').addEventListener('click', minApp);

document.getElementById('go').addEventListener('click', () => {
  goToUrl();
});

document.getElementById('back').addEventListener('click', () => goBack());
document.getElementById('forward').addEventListener('click', () => goForward());
document.getElementById('reload').addEventListener('click', () => refresh());
document.getElementById('cookies').addEventListener('click', () => toggleCookiesPanel());
document.getElementById('refresh-cookies').addEventListener('click', () => refreshCookies());
document.getElementById('clear-cookies').addEventListener('click', () => clearCookies());
document.getElementById('set-cookie-form').addEventListener('submit', (event) => setCookie(event));

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

function toggleCookiesPanel() {
  const panel = document.getElementById('cookie-panel');
  const isVisible = panel.classList.toggle('visible');
  panel.style.display = isVisible ? 'flex' : 'none';
  if (isVisible) {
    refreshCookies();
  }
}

function updateCookieStatus(message) {
  const status = document.getElementById('cookie-status');
  if (status) status.textContent = message;
}

function renderCookies(cookies) {
  const list = document.getElementById('cookie-list');
  list.innerHTML = '';

  if (!cookies || !cookies.length) {
    list.innerHTML = '<div class="cookie-item">No cookies found for this tab.</div>';
    return;
  }

  cookies.forEach((cookie) => {
    const item = document.createElement('div');
    item.className = 'cookie-item';
    item.innerHTML = `
      <div><strong>${cookie.name}</strong>=${cookie.value}</div>
      <div>Domain: ${cookie.domain}</div>
      <div>Path: ${cookie.path}</div>
      <div>${cookie.secure ? 'Secure' : 'Not secure'} · ${cookie.httpOnly ? 'HttpOnly' : 'Readable'}</div>
    `;
    list.appendChild(item);
  });
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
  loadBookmarks();
  renderBookmarks();

  if (!tabs.length) {
    createTab(document.getElementById('url').value || 'https://www.google.com');
  }
}

function createTab(url = 'https://www.google.com') {
  const tabsContainer = document.getElementById('tabs');
  const webviewContainer = document.getElementById('WebContentsView');
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

async function refreshCookies() {
  const activeTab = getActiveTab();
  if (!activeTab) {
    updateCookieStatus('No active tab selected.');
    renderCookies([]);
    return;
  }

  const url = activeTab.webview.getURL() || activeTab.url;
  const webContentsId = activeTab.webview.getWebContentsId?.();
  if (!url || !webContentsId) {
    updateCookieStatus('Unable to determine active tab URL or web contents.');
    renderCookies([]);
    return;
  }

  try {
    const cookies = await ipcRenderer.invoke('cookies-get', webContentsId, url);
    renderCookies(cookies);
    updateCookieStatus(`${cookies.length} cookies found for ${new URL(url).hostname}`);
  } catch (err) {
    console.error('Failed to load cookies:', err);
    updateCookieStatus('Failed to load cookies.');
    renderCookies([]);
  }
}

async function clearCookies() {
  const activeTab = getActiveTab();
  if (!activeTab) {
    updateCookieStatus('No active tab selected.');
    return;
  }

  const url = activeTab.webview.getURL() || activeTab.url;
  const webContentsId = activeTab.webview.getWebContentsId?.();
  if (!url || !webContentsId) {
    updateCookieStatus('Unable to determine active tab URL or web contents.');
    return;
  }

  try {
    await ipcRenderer.invoke('cookies-clear', webContentsId, url);
    updateCookieStatus('Cookies cleared.');
    refreshCookies();
  } catch (err) {
    console.error('Failed to clear cookies:', err);
    updateCookieStatus('Failed to clear cookies.');
  }
}

async function setCookie(event) {
  event.preventDefault();
  const activeTab = getActiveTab();
  if (!activeTab) {
    updateCookieStatus('No active tab selected.');
    return;
  }

  const url = activeTab.webview.getURL() || activeTab.url;
  const webContentsId = activeTab.webview.getWebContentsId?.();
  const name = document.getElementById('cookie-name').value.trim();
  const value = document.getElementById('cookie-value').value.trim();

  if (!url || !webContentsId) {
    updateCookieStatus('Unable to determine active tab URL or web contents.');
    return;
  }

  if (!name || !value) {
    updateCookieStatus('Cookie name and value are required.');
    return;
  }

  try {
    await ipcRenderer.invoke('cookies-set', webContentsId, { url, name, value });
    document.getElementById('cookie-name').value = '';
    document.getElementById('cookie-value').value = '';
    updateCookieStatus(`Cookie set: ${name}`);
    refreshCookies();
  } catch (err) {
    console.error('Failed to set cookie:', err);
    updateCookieStatus('Failed to set cookie.');
  }
}
/// stop looking at my code nerd


function saveSettings() {
// stuff for settings value (like on or off)
const magnifierEnabled = document.getElementById('enable-magnifier').checked;
localStorage.setItem('magnifierEnabled', magnifierEnabled);

}

function loadSettings() {
  const magnifier = document.getElementById('magnifier');

  if (localStorage.getItem('magnifierEnabled') === 'true') {
    magnifier.style.display = 'flex';
  } else {
    magnifier.style.display = 'none';
  }
}
/// gave up for the day on 5/31/26 at 9:54