import * as phrases from "./phrases";

let successShown: boolean = false;
let errorShown: boolean = false;

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
            showSuccess();
        } else {
            showOptionsError(phrases.emptyField);
        }
    })

    cacheTimeElement.on("change", () => {
        if (cacheTimeElement.val() !== undefined && cacheTimeElement.val() !== "") {
            chrome.runtime.sendMessage({"NewCacheTime": cacheTimeElement.val() * 1000});
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

    if (!successShown) {
        successShown = true;

        element.show(500);
        element.text(phrases.saved);
        sleep(5000).then(() => {
            element.hide(500);
            successShown = false;
        });
    } else {
        element.text(phrases.saved);
    }
}

function showOptionsError(error: any) {
    let element: any = $("#options-error");

    if (!errorShown) {
        errorShown = true;

        element.show(500);
        element.text(error);
        sleep(5000).then(() => {
            element.hide(500);
            errorShown = false;
        });
    } else {
        element.text(error);
    }
}