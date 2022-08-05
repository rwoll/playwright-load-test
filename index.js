const os = require("os");
const fs = require("fs");
const { chromium, firefox, webkit, expect } = require("@playwright/test");
const browsers = [chromium, firefox, webkit];

const TRIALS = 3;
const MAX_PARALLEL_TESTS = 150;
const STEP_SIZE = 50;
const OUT_FILENAME = "results.txt";

const _logs = [];
const log = (msg) => {
  _logs.push(msg);
  console.log(msg);
};

log(
  [
    "platform",
    "browser",
    "parallel contexts",
    "overall time",
    "avg",
    "pass rate",
    "pass count",
  ].join("\t")
);

(async () => {
  for (const browserType of browsers) {
    const browser = await browserType.launch();
    for (let size = 1; size <= MAX_PARALLEL_TESTS; size += STEP_SIZE) {
      for (let trial = 0; trial < TRIALS; trial++) {
        const tests = [];
        for (let i = 0; i < size; i++)
          tests.push(async () => {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto("http://example.com/");
            await expect(page.locator("body")).toContainText("example");
            await context.close();
          });

        const start = Date.now();
        const outcomes = await Promise.all(
          tests.map((test) =>
            test()
              .then((e) => "pass")
              .catch((e) => "fail")
          )
        );
        const end = Date.now();
        const pass = outcomes.filter((o) => o === "pass").length;
        const ellapsed = end - start;
        const passPct = Math.floor((pass / size) * 100);
        log(
          [
            os.platform(),
            browser.browserType().name(),
            size,
            ellapsed + "ms",
            Math.ceil(ellapsed / size) + "ms",
            passPct + "%",
            pass,
          ].join("\t")
        );

        // If perf is so bad, cut it short and move on
        if (passPct < 50 || ellapsed > 10 * 60 * 1000 /* 10 minutes */) {
          trial = Infinity;
          size = Infinity;
        }
      }
      if (size === 1) size = 0;
    }
    await browser.close();
  }
  fs.writeFileSync(OUT_FILENAME, _logs.join("\n"));
  console.error();
  console.error("results written to " + OUT_FILENAME);
})();
