import { act, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { patientToday } from "../data/patientToday.js";

/**
 * The bootstrap.
 *
 * main.jsx is three lines with no exports: it reaches for the mount node and
 * mounts the app into it as a module side effect. The only way to exercise that
 * is to give the document the element index.html provides and then import the
 * module, so that is what this does — resetting the registry first so the side
 * effect runs even if something else has already imported it.
 *
 * The id is READ FROM index.html rather than written out here, because the
 * contract spans two files and the realistic failure lives on the other side of
 * it: rename the container in index.html alone and `getElementById` comes back
 * null, `createRoot(null)` throws, and the built app is dead on load with
 * nothing painted. A test that supplies the id it then goes looking for pins
 * only the main.jsx half, stays green through the half that actually breaks,
 * and fires a false red on a rename applied consistently to both files.
 *
 * One test, because there is one thing to prove: the app really mounts into the
 * node index.html provides.
 */

// Jest compiles this file to CommonJS, so `__dirname` exists and `import.meta`
// does not (a test that uses it fails to load).
const INDEX_HTML = readFileSync(
  join(__dirname, "..", "..", "index.html"),
  "utf8",
);

/** The empty container(s) index.html leaves for React to mount into. */
const MOUNT_IDS = [
  ...INDEX_HTML.matchAll(/<div\s+id="([^"]+)"\s*>\s*<\/div>/g),
].map(([, id]) => id);

describe("main.jsx", () => {
  afterEach(() => {
    for (const id of MOUNT_IDS) document.getElementById(id)?.remove();
    jest.dontMock("react");
    jest.dontMock("react-dom/client");
    jest.resetModules();
  });

  it("mounts the app into the node index.html provides", async () => {
    // "The empty div in index.html" only identifies an element if there is
    // exactly one of them; two would make the id below an arbitrary pick.
    expect(MOUNT_IDS).toHaveLength(1);

    const host = document.createElement("div");
    host.id = MOUNT_IDS[0];
    document.body.append(host);

    jest.resetModules();
    // Jest resets node_modules too: keep the React and ReactDOM that RTL's act
    // drives, or main.jsx renders through a second copy act cannot flush.
    jest.doMock("react", () => React);
    jest.doMock("react-dom/client", () => ReactDOMClient);
    await act(async () => {
      await import("../main.jsx");
    });

    // Queried inside `host` specifically: mounting anywhere else is the failure
    // this is looking for. The heading comes from the data module rather than a
    // copied string, so approved copy edits do not turn it red.
    expect(
      within(host).getByRole("heading", {
        level: 1,
        name: patientToday.header.greeting,
      }),
    ).toBeInTheDocument();
  });
});
