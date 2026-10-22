import assert from "node:assert/strict";
import test from "node:test";
import { hatWriteupFrom, imageGridFor } from "./hat-writeup";
import {
  moveItem,
  parseIdList,
  parseTextList,
  serializeIdList,
  serializeTextList,
} from "./list-values";
import { parseRecordImages } from "./record-image-refs";

const IMG = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;

test("imageGridFor follows the hat image grid rule", () => {
  const grids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
    const { rows, cols } = imageGridFor(n);
    return `${rows}x${cols}`;
  });
  assert.deepEqual(grids, ["0x0", "1x1", "1x2", "2x2", "2x2", "3x2", "3x2", "4x2", "4x2", "5x2", "5x2"]);
});

test("text lists round-trip, drop blanks, and open plain text as one entry", () => {
  assert.deepEqual(parseTextList(""), []);
  assert.deepEqual(parseTextList("Greet visitors"), ["Greet visitors"]);
  assert.deepEqual(parseTextList('["a", "", "b"]'), ["a", "b"]);
  assert.equal(serializeTextList(["a", "  ", "b"]), '["a","b"]');
  assert.equal(serializeTextList(["", " "]), "");
  assert.deepEqual(parseTextList(serializeTextList(["one\ntwo", "three"])), ["one\ntwo", "three"]);
});

test("id lists de-duplicate and accept a single id", () => {
  assert.deepEqual(parseIdList('["s1","s2","s1"]'), ["s1", "s2"]);
  assert.deepEqual(parseIdList("s1"), ["s1"]);
  assert.deepEqual(parseIdList("s1, s2"), ["s1", "s2"]);
  assert.equal(serializeIdList(["s1", "s1", ""]), '["s1"]');
  assert.equal(serializeIdList([]), "");
});

test("moveItem moves one entry and clamps the target", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 2, -5), ["c", "a", "b"]);
  const same = ["a", "b"];
  assert.equal(moveItem(same, 1, 1), same);
});

test("gallery images keep an optional description", () => {
  const raw = JSON.stringify([
    { id: IMG(1), name: "desk.jpg", description: "Front desk at opening" },
    { id: IMG(2), name: "phone.png" },
    { id: "not-an-id", name: "skip" },
  ]);
  assert.deepEqual(parseRecordImages(raw), [
    { id: IMG(1), name: "desk.jpg", description: "Front desk at opening" },
    { id: IMG(2), name: "phone.png" },
  ]);
  const long = parseRecordImages(JSON.stringify([{ id: IMG(3), name: "x", description: "d".repeat(500) }]));
  assert.equal(long[0].description?.length, 200);
});

test("hatWriteupFrom maps stored values and skips unknown holders", () => {
  const hat = hatWriteupFrom(
    {
      id: "hat-1",
      name: "Receptionist",
      status: "active",
      data: {
        holder_ids: '["s1","gone","s2"]',
        purposes: '["Make every visitor welcome"]',
        know_how: "Where the visitor log lives",
        duties: '["Open the front desk","Answer the phone"]',
        images: JSON.stringify([{ id: IMG(1), name: "desk.jpg", description: "Front desk" }]),
      },
    },
    new Map([
      ["s1", "Avery Clark"],
      ["s2", "Jordan Lee"],
    ]),
  );
  assert.equal(hat.recordId, "hat-1");
  assert.deepEqual(hat.holders, ["Avery Clark", "Jordan Lee"]);
  assert.deepEqual(hat.purposes, ["Make every visitor welcome"]);
  assert.deepEqual(hat.knowHow, ["Where the visitor log lives"]);
  assert.deepEqual(hat.duties, ["Open the front desk", "Answer the phone"]);
  assert.equal(hat.images[0].description, "Front desk");
});
