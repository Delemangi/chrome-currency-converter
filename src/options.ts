import {showStatus} from "./functions";
import * as phrases from "./phrases";

jQuery(() => {
    let APIKeyElement: JQuery<HTMLElement> = $("#api");
    let cacheTimeElement: JQuery<HTMLElement> = $("#cache");
    let historyDaysElement: JQuery<HTMLElement> = $("#history");

    chrome.storage.local.get(["APIKey", "cacheTime", "historyDays"], (result) => {
        if (result.hasOwnProperty("APIKey")) {
            APIKeyElement.val(result["APIKey"]);
        }

        if (result.hasOwnProperty("cacheTime")) {
            cacheTimeElement.val(result["cacheTime"]);
        }

        if (result.hasOwnProperty("historyDays")) {
            historyDaysElement.val(result["historyDays"]);
        }
    })

    APIKeyElement.on("change", () => {
        if (APIKeyElement.val() !== undefined && APIKeyElement.val() !== "") {
            chrome.runtime.sendMessage({"APIKey": APIKeyElement.val()});
            showStatus($("#options-success"), phrases.saved);
        } else {
            showStatus($("#options-error"), phrases.emptyField);
        }
    })

    cacheTimeElement.on("change", () => {
        if (cacheTimeElement.val() !== undefined && cacheTimeElement.val() !== "") {
            chrome.runtime.sendMessage({"cacheTime": cacheTimeElement.val()});
            showStatus($("#options-success"), phrases.saved);
        } else {
            showStatus($("#options-error"), phrases.emptyField);
        }
    })

    historyDaysElement.on("change", () => {
        if (historyDaysElement.val() !== undefined && historyDaysElement.val() !== "") {
            chrome.runtime.sendMessage({"historyDays": historyDaysElement.val()});
            showStatus($("#options-success"), phrases.saved);
        } else {
            showStatus($("#options-error"), phrases.emptyField);
        }
    })
})