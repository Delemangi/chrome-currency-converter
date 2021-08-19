import * as currencies from "./currencies.json";

const APIKey: string = "V1G5ORWCEXUHDN2";
const cacheTime: number = 3600000; // Default: 1 hour
const historyDays: number = 14; // Default: 14 days

chrome.storage.local.set({"cacheTime": cacheTime, "historyDays": historyDays, "APIKey": APIKey});

chrome.runtime.onMessage.addListener((message) => {
    if (message.hasOwnProperty("APIKey")) {
        chrome.storage.local.set({"APIKey": message["APIKey"]});
    }

    if (message.hasOwnProperty("cacheTime")) {
        chrome.storage.local.set({"cacheTime": message["cacheTime"]});
    }

    if (message.hasOwnProperty("historyDays")) {
        chrome.storage.local.set({"historyDays": message["historyDays"]});
    }
})

chrome.runtime.onInstalled.addListener(() => {
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