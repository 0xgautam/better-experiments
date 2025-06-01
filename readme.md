# 🧪 Better-Experiments

> Developer-first A/B testing framework with built-in dashboard

[![npm version](https://badge.fury.io/js/better-ab.svg)](https://badge.fury.io/js/better-experiments)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Better-Experiments** makes A/B testing as simple as writing a feature flag. No complex setup, no vendor lock-in, no data science degree required.

## ✨ Features

- 🚀 **2-minute setup** - Get testing in minutes, not hours
- 🎯 **Developer-first** - Clean API that just works
- 🔒 **Privacy-focused** - Cookie-based, no external tracking
- 📊 **Built-in analytics** - View results without third-party tools
- 🔧 **Self-hosted** - Your data stays with you
- ⚡ **Lightweight** - Minimal dependencies, maximum performance
- 🌐 **Universal** - Works in browser, Node.js, edge functions
- 🛡️ **Type-safe** - Full TypeScript support with perfect inference

## 🚀 Quick Start

### Installation

```bash
npm install better-experiments
# or
yarn add better-experiments
# or
pnpm add better-experiments
```

### Basic Usage

```typescript
import { BetterExperiments } from "better-experiments";

// Initialize the client
const ab = new BetterExperiments();

// Test different button colors - returns assignment object
const buttonTest = await ab.test("button-color", ["red", "blue", "green"]);

// Use the variant in your UI
console.log(`User sees ${buttonTest.variant} button`);

// Track conversions directly!
await buttonTest.convert("click");
await buttonTest.convert("signup");
```

That's it! 🎉

## 📖 Examples

### Headlines & Copy Testing

```typescript
import { BetterExperiments } from "better-experiments";

const ab = new BetterExperiments();

// Test different headlines
const headerTest = await ab.test("homepage-headline", [
  "Welcome to Our Amazing Product",
  "Transform Your Business Today",
  "The Tool You've Been Waiting For",
]);

// Use the selected headline
document.querySelector("h1").textContent = headerTest.variant;

// Track conversion when user signs up
document.querySelector("#signup").addEventListener("click", async () => {
  await headerTest.convert("signup");
});
```

### Feature Flags & Rollouts

```typescript
const ab = new BetterExperiments();

// Gradual feature rollout
const dashboardTest = await ab.test("new-dashboard", [false, true]);

if (dashboardTest.variant) {
  // Show new dashboard
  loadNewDashboard();
  await dashboardTest.convert("feature_enabled");
} else {
  // Show old dashboard
  loadOldDashboard();
  await dashboardTest.convert("control_group");
}
```

### Complex Variants with TypeScript

```typescript
const ab = new BetterExperiments();

// Test complex objects with full type safety
const pricingTest = await ab.test(
  "pricing-strategy",
  [
    { plan: "monthly", price: 29, features: ["basic"] },
    {
      plan: "yearly",
      price: 290,
      features: ["basic", "advanced"],
      discount: "2 months free",
    },
  ],
  {
    weights: [0.7, 0.3], // 70% monthly, 30% yearly
    metadata: {
      name: "Pricing Strategy Test",
      description: "Testing monthly vs yearly prominence",
    },
  }
);

// TypeScript knows the variant structure!
console.log(
  `Plan: ${pricingTest.variant.plan}, Price: ${pricingTest.variant.price}`
);

// Track purchase with metadata
await pricingTest.convert("purchase", {
  amount: pricingTest.variant.price,
  plan: pricingTest.variant.plan,
});
```

### Multiple Tests for Same User

```typescript
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
```

### Advanced Configuration

```typescript
import { BetterExperiments } from "better-experiments";

const ab = new BetterExperiments({
  storage : CustomStorageAdaptor()
  debug: false, // Disable in production
});

// Create test with full control
await ab.createTest({
  testId: "enterprise-feature",
  variants: ["control", "experiment"],
  weights: [0.8, 0.2],
  metadata: {
    name: "Enterprise Feature Rollout",
    description: "Gradual rollout of new admin features",
  },
});

const featureTest = await ab.test("enterprise-feature", ["old-ui", "new-ui"]);
```

## 📊 Viewing Results

```typescript
const ab = new BetterExperiments();

// Run some tests...
const buttonTest = await ab.test("button-test", ["red", "blue", "green"]);
await buttonTest.convert("click");

// Get detailed results
const results = await ab.getResults("button-test");
console.log(results);

/*
{
  config: { testId: 'button-test', variants: ['red', 'blue', 'green'] },
  variants: [
    {
      variant: 'red',
      totalUsers: 100,
      totalConversions: 15,
      conversionRate: 0.15,
      events: { click: 15 }
    },
    {
      variant: 'blue', 
      totalUsers: 95,
      totalConversions: 22,
      conversionRate: 0.23,
      events: { click: 22 }
    },
    {
      variant: 'green',
      totalUsers: 105,
      totalConversions: 12,
      conversionRate: 0.11,
      events: { click: 12 }
    }
  ],
  stats: {
    durationDays: 7,
    winner: 'blue',
    isSignificant: true
  }
}
*/

// Get all tests
const allTests = await ab.getTests();
console.log(`Running ${allTests.filter((t) => t.active).length} active tests`);
```

## 🔧 API Reference

### BetterExperiments Client

```typescript
const ab = new BetterExperiments(config?: BetterExperimentConfig);
```

**Configuration Options:**

- `storage?: StorageAdapter` - Custom storage adapter (defaults to MemoryStorage)
- `debug?: boolean` - Enable debug logging

### Core Methods

**`ab.test<T>(testId, variants, options?): Promise<TestAssignment<T>>`**

- Runs A/B test and returns assignment object
- `testId`: Unique identifier for the test
- `variants`: Array of variant values to test
- `options`: Optional configuration (weights, metadata, userId override)

**`TestAssignment.convert(event?, metadata?): Promise<void>`**

- Track conversion for this specific assignment
- `event`: Event name (defaults to 'conversion')
- `metadata`: Optional event metadata

**Other Methods:**

- `ab.getResults(testId)` - Get test results and statistics
- `ab.getTests()` - Get all test configurations
- `ab.createTest(config)` - Manually create a test (optional)
- `ab.stopTest(testId)` - Deactivate a test

### TestAssignment Object

```typescript
interface TestAssignment<T> {
  variant: T; // The selected variant value
  assignment: UserAssignment; // Full assignment details
  convert(event?, metadata?): Promise<void>; // Conversion tracking method
}
```

## 🏗️ Storage Adapters

### Memory Storage (Default)

Perfect for development and testing:

```typescript
import { BetterExperiments, MemoryStorage } from "better-ab";

const ab = new BetterExperiments({
  storage: new MemoryStorage(),
});
```

### Custom Storage

Implement the `StorageAdapter` interface for your database:

```typescript
import { StorageAdapter } from "better-experiments";

class PostgresStorage implements StorageAdapter {
  // Implement required methods
  async saveTest(config) {
    /* ... */
  }
  async getTest(testId) {
    /* ... */
  }
  async saveAssignment(assignment) {
    /* ... */
  }
  async getAssignment(testId, userId) {
    /* ... */
  }
  async saveConversion(event) {
    /* ... */
  }
  async getConversions(testId) {
    /* ... */
  }
  async getTestResults(testId) {
    /* ... */
  }
  // ... other methods
}

const ab = new BetterExperiments({
  storage: new PostgresStorage(),
});
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check

# Clean build files
npm run clean
```

## 🌟 Why Better-Experiments?

### Traditional A/B Testing Libraries

```typescript
// Complex setup, separate tracking
const variant = await abTest.getVariant("test-id", userId);
// Later... easy to mess up IDs
await abTest.track("test-id", userId, "conversion"); // ❌ Error-prone
```

### Better-Experiments

```typescript
// Simple, impossible to mess up
const test = await ab.test("test-id", ["A", "B"]);
await test.convert("conversion"); // ✅ Always correct
```

### Unique Benefits

- **🎯 Assignment-based tracking** - Eliminates ID mismatch bugs
- **🔒 Privacy-first** - No external tracking, your data stays with you
- **⚡ Zero-config** - Works out of the box, scales with custom storage
- **🧠 Type-safe** - Full TypeScript support with perfect inference

## 🗺️ Roadmap

- [ ] SQLite storage adapter
- [ ] PostgreSQL storage adapter
- [ ] Statistical significance calculation
- [ ] React/Vue component wrappers
- [ ] Advanced analytics and segmentation
- [ ] Visual experiment editor

## 📄 License

MIT © Gautam Ahuja

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our repository.

---

**Better-Experiments** - Making A/B testing accessible to every developer 🚀
