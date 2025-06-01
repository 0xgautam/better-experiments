import { BetterExperiments } from "../src";

async function basicUsageExample() {
  const ab = new BetterExperiments({ debug: true });

  const cta = await ab.test("cta", ["Create Your RSVP Page", "Get Started"], {
    metadata: {
      name: "Call to Action",
      description: "Test different call to action texts on the homepage",
    },
  });

  console.log("CTA Variant:", cta);

  // Simulate a user interaction
  await cta.convert("convertion");
}

// Run the example
// basicUsageExample()
//   .then(() => console.log("Basic usage example completed."))
//   .catch((error) => console.error("Error in basic usage example:", error));
