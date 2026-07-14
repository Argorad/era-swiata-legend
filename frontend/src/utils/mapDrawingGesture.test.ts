import assert from "node:assert/strict";
import test from "node:test";
import { continuesPrimaryDrawingGesture, createLocalDrawingId, hasMeaningfulDrawingDrag, screenToMapWorld, startsPrimaryDrawingGesture } from "./mapDrawingGesture.ts";

test("rysowanie zaczyna wyłącznie lewy przycisk trzymany na pointerdown", () => {
    assert.equal(startsPrimaryDrawingGesture({ button: 0, buttons: 1, pointerType: "mouse" }), true);
    assert.equal(startsPrimaryDrawingGesture({ button: 0, buttons: 0, pointerType: "mouse" }), false);
    assert.equal(startsPrimaryDrawingGesture({ button: 2, buttons: 2, pointerType: "mouse" }), false);
});

test("pointermove bez wciśniętego lewego przycisku anuluje rysowanie", () => {
    assert.equal(continuesPrimaryDrawingGesture({ buttons: 1, pointerType: "mouse" }), true);
    assert.equal(continuesPrimaryDrawingGesture({ buttons: 0, pointerType: "mouse" }), false);
});

test("pojedynczy klik nie jest przeciągnięciem", () => {
    assert.equal(hasMeaningfulDrawingDrag([{ x: 10, y: 10 }, { x: 10, y: 10 }], 2), false);
    assert.equal(hasMeaningfulDrawingDrag([{ x: 10, y: 10 }, { x: 13, y: 14 }], 2), true);
});

test("lokalny identyfikator działa bez crypto.randomUUID w HTTP LAN", () => {
    assert.match(createLocalDrawingId(undefined), /^local-[a-z0-9-]+$/);
    assert.equal(createLocalDrawingId(() => "stable-id"), "local-stable-id");
});

test("współrzędne ekranu uwzględniają pan i zoom", () => {
    assert.deepEqual(screenToMapWorld(350, 260, { viewportLeft: 100, viewportTop: 60, offsetX: 50, offsetY: 40, scale: 2 }), { x: 100, y: 80 });
    assert.deepEqual(screenToMapWorld(725, 430, { viewportLeft: 100, viewportTop: 60, offsetX: 125, offsetY: 50, scale: 5 }), { x: 100, y: 64 });
});

test("współrzędne świata mogą leżeć poza obrazem", () => {
    assert.deepEqual(screenToMapWorld(25, 20, { viewportLeft: 100, viewportTop: 100, offsetX: 0, offsetY: 0, scale: 1 }), { x: -75, y: -80 });
    assert.throws(() => screenToMapWorld(0, 0, { viewportLeft: 0, viewportTop: 0, offsetX: 0, offsetY: 0, scale: 0 }), RangeError);
});
