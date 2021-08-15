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
            chrome.storage.local.set({"APIKey": APIKeyElement.val()});
            chrome.runtime.sendMessage({"APIKeyChanged": APIKeyElement.val()});
            showSuccess();
        } else {
            showOptionsError(phrases.emptyField);
        }
    })

    cacheTimeElement.on("change", () => {
        if (cacheTimeElement.val() !== undefined && cacheTimeElement.val() !== "") {
            chrome.storage.local.set({"cacheTime": +cacheTimeElement.val() * 1000});
            chrome.runtime.sendMessage({"cacheTimeChanged": cacheTimeElement.val()});
            showSuccess();
        } else {
            showOptionsError(phrases.emptyField);
        }
    })

    $("#options-success").hide();
    $("#options-error").hide();
})

function sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function showSuccess() {
    let element: any = $("#options-success");

    element.show(500);
    element.text(phrases.success);
    sleep(5000).then(() => {
        element.hide(500);
    });
}

function showOptionsError(error: any) {
    let element: any = $("#options-error");

    element.show(500);
    element.text(error);
    sleep(5000).then(() => {
        element.hide(500);
    });
}