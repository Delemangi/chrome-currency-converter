export function showStatus(element: JQuery<HTMLElement>, message: any): void {
    if (element.is(":hidden")) {
        element.show(500).text(message).delay(3000).hide(500);
    } else {
        element.text(message);
    }
}