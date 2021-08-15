import * as currencies from "./currencies.json";

chrome.storage.local.set({"cacheTime": 3600000});

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