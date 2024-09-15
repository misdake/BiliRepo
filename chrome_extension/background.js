function injectedFunction(hostname, cookies) {
  console.log("injected!", hostname, cookies);
  let s = document.createElement('div');
  s.style.visibility = 'hidden';
  s.id = "script-cookies";
  s.dataset.cookies = cookies;
  document.body.appendChild(s)
}

async function onTabComplete(tab, url) {
  url = new URL(tab.url);

  let domain = url.hostname;
  let name = undefined;

  domain = ".bilibili.com";
  name = "SESSDATA";

  try {
    let cookies = await chrome.cookies.getAll({ domain, name });

    cookies = JSON.stringify(cookies);
    console.log("inject!", domain, cookies)

    chrome.scripting.executeScript({
      target : {tabId : tab.id},
      func : injectedFunction,
      args : [ url.hostname, cookies, new Date() ],
    });

  } catch (error) {
    console.log(`Unexpected error: ${error.message}`);
  }
}

chrome.tabs.onUpdated.addListener(function (tabId , info, tab) {
  if (info.status === 'complete' && tab && tab.url) {
    if (tab.url.startsWith("https://www.bilibili.com/video/")) {
      onTabComplete(tab);
    }
  }
});
