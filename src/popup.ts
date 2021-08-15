import * as phrases from "./phrases";
import * as Awesomplete from "awesomplete";

const maxCurrencies: number = 5;
const initialCurrencies: number = 2;
let currentCurrencies: number = 0;
let currentID: number = 1;
let currenciesList: string[];
let validCurrenciesList: string[];

let APIKey: string;
let cacheTime: number;

chrome.storage.local.get(["currencies", "validCurrencies"], ({currencies, validCurrencies}) => {
    currenciesList = currencies;
    validCurrenciesList = validCurrencies;
})

chrome.storage.local.get(["APIKey", "cacheTime"], (result) => {
    if (result.APIKey !== undefined) {
        APIKey = result.APIKey;
    }

    if (result.cacheTime !== undefined) {
        cacheTime = result.cacheTime;
    }
})

chrome.runtime.onMessage.addListener((message) => {
    if (message.hasOwnProperty("APIKeyChanged")) {
        APIKey = message["APIKeyChanged"];
    }

    if (message.hasOwnProperty("cacheTimeChanged")) {
        cacheTime = message["cacheTimeChanged"];
    }
})

jQuery(() => {
    initConversion();
    initHistory();

    $("#conversion-error").hide();
    $("#history-error").hide();
})

function initConversion() {
    for (let i = 0; i < initialCurrencies; i++) {
        addCurrency();
    }

    $("#add-currency").on("click", () => {
        addCurrency();
    })

    $(".buttons").prop("disabled", true);
}

function initHistory() {
    let element1: HTMLElement | null = document.getElementById("currency-1");
    let element2: HTMLElement | null = document.getElementById("currency-2");

    setDropdown(element1);
    setDropdown(element2);

    $(".currencies").on("change", () => {
        const from: any = $("#currency-1").val();
        const to: any = $("#currency-2").val();

        if (isValidCurrency(from) && isValidCurrency(to)) {
            getHistory(from, to);
        } else {
            showHistoryError(phrases.unsupportedCurrency);
        }
    })
}

function sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function isValidCurrency(currency: any) {
    return validCurrenciesList.includes(currency);
}

function getID(element: any) {
    // HTMLElement
    if (element.hasOwnProperty("target")) {
        return +element.target.id.toString().split("-")[1];
    }
    // JQuery<HTMLElement>
    else {
        return +element.id.toString().split("-")[1];
    }
}

function getURL(from: string, to: string, mode: number) {
    // API key not set
    if (APIKey === undefined) {
        return "";
    }

    // Currency conversion
    if (mode === 1) {
        return "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" + from + "&to_currency=" + to + "&apikey=" + APIKey;
    }
    // Currency history
    else if (mode === 2) {
        return "https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=" + from + "&to_symbol=" + to + "&apikey=" + APIKey;
    }
    // None of the above
    else {
        return "";
    }
}

function setDropdown(element: HTMLElement | null) {
    if (element !== null) {
        let ap = new Awesomplete(element, {
            list: currenciesList,
            minChars: 1,
            maxItems: 10
        })
        ap.open();
    }
}

function addCurrency() {
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

function initDropdown() {
    $("#currency-dropdowns").append("<input class=\"form-control m-2 dropdowns\" id=\"dropdown-" + currentID + "\">");

    setDropdown(document.getElementById("dropdown-" + currentID));

    $("#dropdown-" + currentID).on("change", (element) => {
        const ID: number = getID(element);
        const to: any = $("#dropdown-" + ID).val();
        const dropdowns: any = $(".dropdowns");
        const status = $("#status-" + ID);

        if (isValidCurrency(to)) {
            status.text("");

            for (let i of dropdowns) {
                if (isValidCurrency($(i).val())) {
                    let from: any = $(i).val();
                    let value: any = $("#input-" + getID(i)).val();

                    console.log(getID(i));

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

function initInput() {
    $("#currency-inputs").append("<div class=\"awesomplete\"><input class=\"form-control m-2 inputs\" id=\"input-" + currentID + "\" type=\"number\"></div>")
    let input: any = $("#input-" + currentID);

    input.val("0.00");

    input.on("change", (element: any) => {
        const ID = getID(element);
        const value = $("#input-" + ID).val();
        const elements = $(".dropdowns");
        const dropdown = $("#dropdown-" + ID);
        const from = dropdown.val();

        if (isValidCurrency(dropdown.val())) {
            for (let i of elements) {
                if (getID(i) !== ID && isValidCurrency($(i).val())) {
                    let to = $(i).val();

                    if (from === to)
                        continue;

                    $("#status-" + getID(i)).text(phrases.converting);
                    getRate(from, to, value, getID(i));
                }
            }
        }
    })
}

function initButton() {
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

function initStatus() {
    $("#currency-statuses").append("<p class=\"statuses\" id=\"status-" + currentID + "\"></p>");
    $("#status-" + currentID).text(phrases.selectCurrency);
}

function getRate(from: any, to: any, value: any, ID: number) {
    const key: string = from + "-" + to;
    const oppositeKey: string = to + "-" + from;
    const status = $("#status-" + ID);

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
            showConversionError(phrases.notConfigured);
            status.text("");
        } else if (APIKey === undefined) {
            showConversionError(phrases.APIKeyNotSet);
            status.text("");
        } else if (cacheTime === undefined) {
            showConversionError(phrases.cacheTimeNotSet);
            status.text("");
        }
    })
}

function cacheRate(from: any, to: any, value: any, ID: number) {
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

                            if (response["Error Message"] === phrases.responseInvalidCurrency) {
                                showConversionError(phrases.unsupportedCurrency);
                            } else if (response["Error Message"] === phrases.responseInvalidAPIKey) {
                                showConversionError(phrases.invalidAPIKey);
                            }
                        } else if (response.hasOwnProperty("Note")) {
                            showConversionError(phrases.rateLimited);
                        } else {
                            showConversionError(phrases.unexpectedResponse);
                        }
                    },
                    error: (response) => {
                        showConversionError(response);
                    }
                })
            } else if (result.hasOwnProperty("Note")) {
                showConversionError(phrases.rateLimited);
            } else {
                showConversionError(phrases.unexpectedResponse);
            }
        },
        error: (result) => {
            showConversionError(result);
        }
    })
}

function showConversionRate(rate: any, value: any, ID: number) {
    const status = $("#status-" + ID);
    const input = $("#input-" + ID);

    if (!isNaN(rate)) {
        input.val((value * rate).toFixed(2));
        status.text("");
    } else if (isNaN(rate)) {
        showConversionError(phrases.requestNotFinished);
        status.text("");
    } else {
        status.text(phrases.requestFailed);
    }
}

function showConversionError(error: any) {
    let element: any = $("#conversion-error");

    element.show(500);
    element.text(error);
    sleep(5000).then(() => {
        element.hide(500);
    });
}

function getHistory(from: any, to: any) {
    const key: string = from + "~" + to;
    const oppositeKey: string = to + "~" + from;

    chrome.storage.local.get([key, oppositeKey], (result) => {
        if (APIKey !== undefined && cacheTime !== undefined) {
            if (result.hasOwnProperty(key) && result[key]["timestamp"] + cacheTime > Date.now()) {
                showHistoryRate(from, to, result[key]);
            } else if (result.hasOwnProperty(oppositeKey) && result[oppositeKey]["timestamp"] + cacheTime > Date.now()) {
                showHistoryRate(from, to, result[oppositeKey]);
            } else {
                cacheHistory(from, to);
            }
        } else if (APIKey === undefined && cacheTime === undefined) {
            showHistoryError(phrases.notConfigured);
        } else if (APIKey === undefined) {
            showHistoryError(phrases.APIKeyNotSet);
        } else if (cacheTime === undefined) {
            showHistoryError(phrases.cacheTimeNotSet);
        }
    })
}

function cacheHistory(from: any, to: any) {
    const key: string = from + "~" + to;
    const oppositeKey: string = to + "~" + from;

    $.ajax({
        url: getURL(from, to, 2),
        type: "GET",
        dataType: "json",
        success: (result) => {
            if (result.hasOwnProperty("Time Series FX (Daily)")) {
                let history: any = result["Time Series FX (Daily)"];
                history["timestamp"] = Date.now();

                let obj: { [index: string]: any } = {};
                obj[key] = history;

                chrome.storage.local.set(obj);

                showHistoryRate(from, to, history);
            } else if (result.hasOwnProperty("Error Message")) {
                [from, to] = [to, from];

                $.ajax({
                    url: getURL(from, to, 2),
                    type: "GET",
                    dataType: "json",
                    success: (response) => {
                        if (result.hasOwnProperty("Time Series FX (Daily)")) {
                            let history: any = result["Time Series FX (Daily)"];
                            history["timestamp"] = Date.now();

                            let obj: { [index: string]: any } = {};
                            obj[oppositeKey] = history;

                            chrome.storage.local.set(obj);

                            showHistoryRate(from, to, history);
                        } else if (response.hasOwnProperty("Error Message")) {
                            if (response["Error Message"] === phrases.responseInvalidCurrency) {
                                showHistoryError(phrases.unsupportedCurrency);
                            } else if (response["Error Message"] === phrases.responseInvalidAPIKey) {
                                showHistoryError(phrases.invalidAPIKey);
                            }
                        } else if (response.hasOwnProperty("Note")) {
                            showHistoryError(phrases.rateLimited);
                        } else {
                            showHistoryError(phrases.unexpectedResponse);
                        }
                    },
                    error: (response) => {
                        showHistoryError(response);
                    }
                })
            } else if (result.hasOwnProperty("Note")) {
                showHistoryError(phrases.rateLimited);
            } else {
                showHistoryError(phrases.unexpectedResponse);
            }
        },
        error: (result) => {
            showHistoryError(result);
        }
    })
}

function showHistoryRate(from: any, to: any, history: any) {
//
}

function showHistoryError(error: any) {
    let element: any = $("#history-error");

    element.show(500);
    element.text(error);
    sleep(5000).then(() => {
        element.hide(500);
    });
}