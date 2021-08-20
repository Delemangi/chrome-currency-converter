import * as currencies from "./currencies.json";

const cacheTime: number = 3600000; // Default: 1 hour
const historyDays: number = 14; // Default: 14 days
const roundDigits: number = 2; // Default: 2 digits

chrome.storage.local.set({
    "cacheTime": cacheTime,
    "historyDays": historyDays,
    "roundDigits": roundDigits
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.hasOwnProperty("cacheTime")) {
        chrome.storage.local.set({"cacheTime": message["cacheTime"]});
    }

    if (message.hasOwnProperty("historyDays")) {
        chrome.storage.local.set({"historyDays": message["historyDays"]});
    }

    if (message.hasOwnProperty("roundDigits")) {
        chrome.storage.local.set({"roundDigits": message["roundDigits"]});
    }
})

chrome.runtime.onInstalled.addListener(() => {
    setValidCurrencies();
    setCurrencies();
})

function setValidCurrencies(): void {
    let validCurrencies: string[] = [];

    for (let curr of currencies) {
        validCurrencies.push(curr["value"]);
    }

    chrome.storage.local.set({"validCurrencies": validCurrencies});
}

function setCurrencies(): void {
    for (let curr of currencies) {
        curr["label"] += " " + curr["value"];
    }

    chrome.storage.local.set({"currencies": currencies});
}