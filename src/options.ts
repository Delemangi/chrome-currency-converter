import {showStatus} from "./functions";
import * as phrases from "./phrases";

jQuery(() => {
    let APIKeyElement: any = $("#api");
    let cacheTimeElement: any = $("#cache");

    chrome.storage.local.get(["APIKey", "cacheTime"], (result) => {
        if (result.hasOwnProperty("APIKey")) {
            APIKeyElement.val(result["APIKey"]);
        }

        if (result.hasOwnProperty("cacheTime")) {
            cacheTimeElement.val(+result["cacheTime"] / 1000);
        }
    })

    APIKeyElement.on("change", () => {
        if (APIKeyElement.val() !== undefined && APIKeyElement.val() !== "") {
            chrome.runtime.sendMessage({"NewAPIKey": APIKeyElement.val()});
            showStatus($("#options-success"), phrases.saved);
        } else {
            showStatus($("#options-error"), phrases.emptyField);
        }
    })

    cacheTimeElement.on("change", () => {
        if (cacheTimeElement.val() !== undefined && cacheTimeElement.val() !== "") {
            chrome.runtime.sendMessage({"NewCacheTime": cacheTimeElement.val() * 1000});
            showStatus($("#options-success"), phrases.saved);
        } else {
            showStatus($("#options-error"), phrases.emptyField);
        }
    })

    $("#options-success").hide();
    $("#options-error").hide();
})