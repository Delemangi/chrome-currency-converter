import * as currencies from "./currencies.json";

const cacheTime: number = 3600000; // Default: 1 hour

chrome.storage.local.set({"cacheTime": 3600000});

chrome.runtime.onMessage.addListener((message) => {
    if (message.hasOwnProperty("NewAPIKey")) {
        chrome.storage.local.set({"APIKey": message["NewAPIKey"]});
    }

    if (message.hasOwnProperty("NewCacheTime")) {
        chrome.storage.local.set({"cacheTime": message["NewCacheTime"]});
    }
})

chrome.runtime.onInstalled.addListener(async ({reason}) => {
    if (reason == "install") {
        chrome.runtime.openOptionsPage();
    }

    setValidCurrencies();
    setCurrencies();
})

function setValidCurrencies() {
    let validCurrencies = [];

    for (let curr of currencies) {
        validCurrencies.push(curr["value"]);
    }

    chrome.storage.local.set({"validCurrencies": validCurrencies});
}

function setCurrencies() {
    for (let curr of currencies) {
        curr["label"] += " " + curr["value"];
    }

    chrome.storage.local.set({"currencies": currencies});
}