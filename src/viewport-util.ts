/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
function createTestElement(): HTMLElement {
    const testElement: HTMLElement = document.createElement("div");
    testElement.style.cssText = "position: fixed; top: 0; height: 100vh; pointer-events: none;";
    document.documentElement.insertBefore(testElement, document.documentElement.firstChild);
    return testElement;
}

function removeTestElement(element: HTMLElement) {
    document.documentElement.removeChild(element);
}

function checkSizes() {
    const vhTest = createTestElement();
    const windowHeight = window.visualViewport.height;
    const vh = vhTest.offsetHeight;
    const offset = vh - windowHeight;
    removeTestElement(vhTest);
    return vh - offset;
}

function updateCssVar(cssVarName: string, result: number) {
    document.documentElement.style.setProperty(`--${cssVarName}`, `${result}px`);
}

function updateVhOffset() {
    updateCssVar("vh-offset", checkSizes());
}

let pendingUpdate = false;
function onWindowUpdate(e: Event) {
    if (pendingUpdate) return;
    pendingUpdate = true;

    requestAnimationFrame(() => {
        pendingUpdate = false;
        window.scrollTo(0, 0);
        updateVhOffset();
    });
}

export default function setupViewportHandlers() {
    if (window.visualViewport) {
        updateVhOffset();
        window.visualViewport.addEventListener("scroll", onWindowUpdate);
        window.visualViewport.addEventListener("resize", onWindowUpdate);
        window.addEventListener("orientationchange", onWindowUpdate);
    }
}