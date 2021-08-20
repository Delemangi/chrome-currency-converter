import {showStatus} from "./functions";
import * as phrases from "./phrases";
import Chart from 'chart.js/auto';
import * as Awesomplete from "awesomplete";

const maxCurrencies: number = 5;
const initialCurrencies: number = 2;
let currentCurrencies: number = 0;
let currentID: number = 1;
let currenciesList: string[] = [];
let validCurrenciesList: string[] = [];
let chart: Chart;

let APIKey: string;
let cacheTime: number;
let historyDays: number;
let roundDigits: number;

chrome.storage.local.get(["currencies", "validCurrencies", "APIKey", "cacheTime", "historyDays", "roundDigits"], (result) => {
    currenciesList = result.currencies;
    validCurrenciesList = result.validCurrencies;

    if (result.APIKey !== undefined) {
        APIKey = result.APIKey;
    }

    if (result.cacheTime !== undefined) {
        cacheTime = result.cacheTime;
    }

    if (result.historyDays !== undefined) {
        historyDays = result.historyDays;
    }

    if (result.roundDigits !== undefined) {
        roundDigits = result.roundDigits;
    }
})

chrome.runtime.onMessage.addListener((message) => {
    if (message.hasOwnProperty("APIKey")) {
        APIKey = message["NewAPIKey"];
    }

    if (message.hasOwnProperty("cacheTime")) {
        cacheTime = message["NewCacheTime"];
    }

    if (message.hasOwnProperty("historyDays")) {
        historyDays = message["historyDays"];
    }

    if (message.hasOwnProperty("roundDigits")) {
        roundDigits = message["roundDigits"];
    }
})

function isValidCurrency(currency: any): boolean {
    return validCurrenciesList.includes(currency);
}

function getID(element: any): number {
    // Event
    if (element.hasOwnProperty("target")) {
        return element.target.id.toString().split("-")[1];
    }
    // HTMLElement
    else {
        return element.id.toString().split("-")[1];
    }
}

function getURL(from: string, to: string, mode: number): string {
    if (APIKey !== undefined) {
        // Currency conversion
        if (mode === 1) {
            return "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" + from + "&to_currency=" + to + "&apikey=" + APIKey;
        }
        // Currency history
        else if (mode === 2) {
            return "https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=" + from + "&to_symbol=" + to + "&apikey=" + APIKey;
        }
        // Cryptocurrency history
        else if (mode === 3) {
            return "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=" + from + "&market=" + to + "&apikey=" + APIKey;
        }
        // None of the above
        else {
            return "";
        }
    }
    // No API key
    else {
        return "";
    }
}

jQuery(() => {
    initConversion();
    initHistory();
})

function initConversion(): void {
    for (let i = 0; i < initialCurrencies; i++) {
        addCurrency();
    }

    $("#add-currency").on("click", () => {
        addCurrency();
    })

    $(".buttons").prop("disabled", true);
}

function initHistory(): void {
    let element1: HTMLElement | null = document.getElementById("currency-1");
    let element2: HTMLElement | null = document.getElementById("currency-2");

    setDropdown(element1);
    setDropdown(element2);

    $(".currencies").on("change", () => {
        const from: any = $("#currency-1").val();
        const to: any = $("#currency-2").val();

        if (to === from) {
            return;
        }

        if (to && from) {
            if (isValidCurrency(from) && isValidCurrency(to)) {
                getHistory(from, to);
            } else {
                showStatus($("#history-error"), phrases.invalidCurrency);
            }
        }
    })
}

function setDropdown(element: HTMLElement | null): void {
    if (element !== null) {
        let ap = new Awesomplete(element, {
            list: currenciesList,
            minChars: 1,
            maxItems: 10
        })
        ap.open();
    }
}

function addCurrency(): void {
    if (currentCurrencies + 1 === maxCurrencies) {
        $("#add-currency").prop("disabled", true);
    }

    initDropdown();
    initInput();
    initButton();
    initStatus();

    currentCurrencies++;
    currentID++;

    $(".buttons").prop("disabled", false);
}

function initDropdown(): void {
    $("#currency-dropdowns").append("<input class=\"form-control m-2 dropdowns\" id=\"dropdown-" + currentID + "\">");

    setDropdown(document.getElementById("dropdown-" + currentID));

    $("#dropdown-" + currentID).on("change", (element) => {
        const ID: number = getID(element);
        const to: any = $("#dropdown-" + ID).val();
        const dropdowns: any = $(".dropdowns");
        const status: JQuery<HTMLElement> = $("#status-" + ID);

        if (isValidCurrency(to)) {
            status.text("");

            for (let e of dropdowns) {
                if (isValidCurrency($(e).val())) {
                    let from: any = $(e).val();
                    let value: any = $("#input-" + getID(e)).val();

                    if (from === to)
                        continue;

                    status.text(phrases.converting);
                    getRate(from, to, value, ID);

                    break;
                }
            }
        } else {
            status.text(phrases.invalidCurrency);
        }
    })
}

function initInput(): void {
    $("#currency-inputs").append("<div class=\"awesomplete\"><input class=\"form-control m-2 inputs\" id=\"input-" + currentID + "\" type=\"number\"></div>")
    let input: any = $("#input-" + currentID);

    input.val("0.00");

    input.on("change", (element: any) => {
        const ID: number = getID(element);
        const value: any = $("#input-" + ID).val();
        const elements: any = $(".dropdowns");
        const dropdown: any = $("#dropdown-" + ID);
        const from: any = dropdown.val();

        if (isValidCurrency(dropdown.val())) {
            for (let e of elements) {
                if (getID(e) !== ID && isValidCurrency($(e).val())) {
                    let to: any = $(e).val();

                    if (from === to)
                        continue;

                    $("#status-" + getID(e)).text(phrases.converting);
                    getRate(from, to, value, getID(e));
                }
            }
        }
    })
}

function initButton(): void {
    $("#currency-buttons").append("<button class=\"btn-close m-2 buttons\" id=\"button-" + currentID + "\" type=\"button\" aria-label=\"Close\"></button>")

    $("#button-" + currentID).on("click", (element) => {
        if (currentCurrencies > 2) {
            let ID: number = getID(element);

            $("#dropdown-" + ID).parent().remove();
            $("#input-" + ID).parent().remove();
            $("#button-" + ID).remove();
            $("#status-" + ID).remove();
            $("#add-currency").prop("disabled", false);
            currentCurrencies--;
        }

        if (currentCurrencies === 2) {
            $(".buttons").prop("disabled", true);
        }
    })
}

function initStatus(): void {
    $("#currency-statuses").append("<p class=\"statuses\" id=\"status-" + currentID + "\"></p>");
    $("#status-" + currentID).text(phrases.selectCurrency);
}

function getRate(from: any, to: any, value: any, ID: number) {
    const key: string = from + "-" + to;
    const oppositeKey: string = to + "-" + from;
    const status: JQuery<HTMLElement> = $("#status-" + ID);

    chrome.storage.local.get([key, oppositeKey], (result) => {
        if (APIKey !== undefined && cacheTime !== undefined) {
            if (result.hasOwnProperty(key) && result[key]["timestamp"] + cacheTime > Date.now()) {
                showConversionRate(result[key]["rate"], value, ID);
            } else if (result.hasOwnProperty(oppositeKey) && result[oppositeKey]["timestamp"] + cacheTime > Date.now()) {
                showConversionRate(1 / +result[oppositeKey]["rate"], value, ID);
            } else {
                cacheRate(from, to, value, ID);
            }
        } else if (APIKey === undefined && cacheTime === undefined) {
            showStatus($("#conversion-error"), phrases.notConfigured);
        } else if (APIKey === undefined) {
            showStatus($("#conversion-error"), phrases.APIKeyNotSet);
        } else if (cacheTime === undefined) {
            showStatus($("#conversion-error"), phrases.cacheTimeNotSet);
        } else {
            showStatus($("#conversion-error"), phrases.unknownError);
        }

        if (APIKey === undefined || cacheTime === undefined) {
            status.text("");
        }
    })
}

function cacheRate(from: any, to: any, value: any, ID: number): void {
    const key: string = from + "-" + to;
    const oppositeKey: string = to + "-" + from;

    $.ajax({
        url: getURL(from, to, 1),
        type: "GET",
        dataType: "json",
        success: (result) => {
            if (result.hasOwnProperty("Realtime Currency Exchange Rate")) {
                const rate: string | number = result["Realtime Currency Exchange Rate"]["5. Exchange Rate"];

                let obj: { [index: string]: any } = {};
                obj[key] = {"rate": rate, "timestamp": Date.now()};

                chrome.storage.local.set(obj);

                showConversionRate(rate, value, ID);
            } else if (result.hasOwnProperty("Error Message")) {
                [from, to] = [to, from];

                $.ajax({
                    url: getURL(from, to, 1),
                    type: "GET",
                    dataType: "json",
                    success: (response) => {
                        if (response.hasOwnProperty("Realtime Currency Exchange Rate")) {
                            const rate: string | number = response["Realtime Currency Exchange Rate"]["5. Exchange Rate"];

                            let obj: { [index: string]: any } = {};
                            obj[oppositeKey] = {"rate": rate, "timestamp": Date.now()};

                            chrome.storage.local.set(obj);

                            showConversionRate(1 / +rate, value, ID);
                        } else if (response.hasOwnProperty("Error Message")) {
                            $("#status-" + ID).text("");

                            if (response["Error Message"].includes(phrases.responseInvalidAPICall)) {
                                showStatus($("#conversion-error"), phrases.unsupportedCurrency);
                            } else if (response["Error Message"] === phrases.responseInvalidAPIKey) {
                                showStatus($("#conversion-error"), phrases.invalidAPIKey);
                            }
                        } else if (response.hasOwnProperty("Note")) {
                            showStatus($("#conversion-error"), phrases.rateLimited);
                        } else {
                            showStatus($("#conversion-error"), phrases.unknownError);
                        }
                    },
                    error: (response) => {
                        showStatus($("#conversion-error"), response);
                    }
                })
            } else if (result.hasOwnProperty("Note")) {
                showStatus($("#conversion-error"), phrases.rateLimited);
            } else {
                showStatus($("#conversion-error"), phrases.unknownError);
            }
        },
        error: (result) => {
            showStatus($("#conversion-error"), result);
        }
    })
}

function showConversionRate(rate: any, value: any, ID: number): void {
    const status: JQuery<HTMLElement> = $("#status-" + ID);
    const input: JQuery<HTMLElement> = $("#input-" + ID);

    status.text("");

    // roundDigits not set
    if (isNaN(roundDigits)) {
        showStatus($("#conversion-error"), phrases.roundDigitsNotSet);
    }
    // Valid rate, value and ID
    else if (!isNaN(rate) && !isNaN(value) && !isNaN(ID)) {
        input.val((value * rate).toFixed(roundDigits));
    }
    // Invalid rate, value or ID
    else {
        showStatus($("#conversion-error"), phrases.unknownError);
    }
}

function getHistory(from: any, to: any): void {
    const key: string = from + "~" + to;
    const oppositeKey: string = to + "~" + from;

    chrome.storage.local.get([key, oppositeKey], (result) => {
        if (APIKey !== undefined && cacheTime !== undefined) {
            if (result.hasOwnProperty(key) && result[key]["timestamp"] + cacheTime > Date.now()) {
                processHistoryData(from, to, result[key], 1);
            } else if (result.hasOwnProperty(oppositeKey) && result[oppositeKey]["timestamp"] + cacheTime > Date.now()) {
                processHistoryData(from, to, result[oppositeKey], 2);
            } else {
                cacheHistory(from, to);
            }
        } else if (APIKey === undefined && cacheTime === undefined && historyDays === undefined) {
            showStatus($("#history-error"), phrases.notConfigured);
        } else if (APIKey === undefined) {
            showStatus($("#history-error"), phrases.APIKeyNotSet);
        } else if (cacheTime === undefined) {
            showStatus($("#history-error"), phrases.cacheTimeNotSet);
        } else if (historyDays === undefined) {
            showStatus($("#history-error"), phrases.historyDaysNotSet);
        } else {
            showStatus($("#history-error"), phrases.unknownError);
        }
    })
}

function cacheHistory(from: any, to: any): void {
    const key: string = from + "~" + to;

    $.ajax({
        url: getURL(from, to, 2),
        type: "GET",
        dataType: "json",
        success: (result) => {
            if (result.hasOwnProperty("Time Series FX (Daily)")) {
                let history: { [index: string]: any } = result["Time Series FX (Daily)"];
                history["timestamp"] = Date.now();

                let obj: { [index: string]: any } = {};
                obj[key] = history;

                chrome.storage.local.set(obj);

                processHistoryData(from, to, history, 1);
            } else if (result.hasOwnProperty("Error Message")) {
                $.ajax({
                    url: getURL(from, to, 3),
                    type: "GET",
                    dataType: "json",
                    success: (response) => {
                        if (response.hasOwnProperty("Time Series (Digital Currency Daily)")) {
                            let history: { [index: string]: any } = response["Time Series (Digital Currency Daily)"];
                            history["timestamp"] = Date.now();

                            let obj: { [index: string]: any } = {};
                            obj[key] = history;

                            chrome.storage.local.set(obj);

                            processHistoryData(from, to, history, 3);
                        } else if (response.hasOwnProperty("Error Message")) {
                            if (response["Error Message"].includes(phrases.responseInvalidAPICall)) {
                                showStatus($("#history-error"), phrases.unsupportedCurrency);
                            } else if (response["Error Message"] === phrases.responseInvalidAPIKey) {
                                showStatus($("#history-error"), phrases.invalidAPIKey);
                            }
                        } else if (response.hasOwnProperty("Note")) {
                            showStatus($("#history-error"), phrases.rateLimited);
                        } else {
                            showStatus($("#history-error"), phrases.unknownError);
                        }
                    },
                    error: (response) => {
                        showStatus($("#history-error"), response);
                    }
                })
            } else if (result.hasOwnProperty("Note")) {
                showStatus($("#history-error"), phrases.rateLimited);
            } else {
                showStatus($("#history-error"), phrases.unknownError);
            }
        },
        error: (result) => {
            showStatus($("#history-error"), result);
        }
    })
}

function processHistoryData(from: any, to: any, history: any, mode: number): void {
    let days: string[] = [];
    let points: number[] = [];

    // Currency
    if (mode === 1) {
        for (let i = 0; i < historyDays; i++) {
            let obj: [string, any] = Object.entries(history)[i];
            days.push(obj[0]);
            points.push(obj[1]["4. close"]);
        }

        showHistoryRate(from, to, days, points);
    }
    // Reverse currency
    else if (mode === 2) {
        for (let i = 0; i < historyDays; i++) {
            let obj: [string, any] = Object.entries(history)[i];
            days.push(obj[0]);
            points.push(1 / obj[1]["4. close"]);
        }

        showHistoryRate(to, from, days, points);
    }
    // Cryptocurrency
    else if (mode === 3) {
        for (let i = 0; i < historyDays; i++) {
            let obj: [string, any] = Object.entries(history)[i];
            days.push(obj[0]);
            points.push(obj[1]["4a. close (" + to + ")"]);
        }

        showHistoryRate(from, to, days, points);
    }
    // Reverse cryptocurrency
    else if (mode === 4) {
        for (let i = 0; i < historyDays; i++) {
            let obj: [string, any] = Object.entries(history)[i];
            days.push(obj[0]);
            points.push(1 / obj[1]["4a. close (" + to + ")"]);
        }

        showHistoryRate(to, from, days, points);
    }
}

function showHistoryRate(from: any, to: any, days: string[], points: number[]): void {
    let data = {
        labels: days,
        datasets: [
            {
                label: from + " vs " + to,
                backgroundColor: "#0d6efd",
                borderColor: "#0d6efd",
                data: points
            }
        ]
    }
    let config: any = {
        type: "line",
        data: data,
        options: {}
    };

    if ($("canvas").length === 0) {
        $("#canvas").append("<canvas id=\"chart\"></canvas>");
    } else {
        chart.destroy();
    }

    let element: any = document.getElementById("chart");
    chart = new Chart(element, config);
}