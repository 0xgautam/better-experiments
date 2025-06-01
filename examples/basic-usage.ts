import { BetterExperiments } from "../src";

async function basicUsageExample() {
  const ab = new BetterExperiments();

  // Run multiple tests simultaneously
  const [headerTest, ctaTest, layoutTest] = await Promise.all([
    ab.test("header-copy", ["Welcome!", "Get Started Today!"]),
    ab.test("cta-style", ["button", "link", "banner"]),
    ab.test("page-layout", ["sidebar-left", "sidebar-right", "no-sidebar"]),
  ]);

  console.log("User experience:");
  console.log(`Header: ${headerTest.variant}`);
  console.log(`CTA: ${ctaTest.variant}`);
  console.log(`Layout: ${layoutTest.variant}`);

  // User completes signup - track for all relevant tests
  await Promise.all([
    headerTest.convert("signup"),
    ctaTest.convert("signup"),
    layoutTest.convert("signup"),
  ]);

  // Get results for each test
  const headerResults = await ab.getResults("header-copy");
  const ctaResults = await ab.getResults("cta-style");
  const layoutResults = await ab.getResults("page-layout");

  console.log("Test Results:");
  console.log("Header Copy Test:", headerResults);
  console.log("CTA Style Test:", ctaResults);
  console.log("Page Layout Test:", layoutResults);
}

// Run the example
basicUsageExample()
  .then(() => console.log("Basic usage example completed."))
  .catch((error) => console.error("Error in basic usage example:", error));
