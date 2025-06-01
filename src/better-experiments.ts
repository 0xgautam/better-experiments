import { nanoid } from "nanoid";
import type {
  ABTestConfig,
  BetterExperimentConfig,
  ConversionEvent,
  StorageAdapter,
  TestAssignment,
  TestResults,
  UserAssignment,
  VariantValue,
} from "./types";
import { MemoryStorage } from "./storage/memory";
import { createUserHash } from "./utils/hash";

/**
 * BetterExperiments client - the main interface for A/B testing
 */
export class BetterExperiments {
  private storage: StorageAdapter;
  private debug: boolean;
  private cookieConfig: NonNullable<BetterExperimentConfig["cookie"]>;
  // private dashboardConfig?: BetterExperimentConfig["dashboard"];

  constructor(config: BetterExperimentConfig = {}) {
    this.storage = config.storage || new MemoryStorage();
    this.debug = config.debug || false;
    // this.dashboardConfig = config.dashboard;
    this.cookieConfig = {
      name: "better-ab-uid",
      path: "/",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      ...config.cookie,
    };

    if (this.debug) {
      console.log("[BetterExperiments] Client initialized with config:", {
        storage: this.storage.constructor.name,
        cookie: this.cookieConfig,
        // dashboard: this.dashboardConfig ? "enabled" : "disabled",
      });
    }
  }

  /**
   * Run an A/B test - returns assignment object with convert method
   */
  async test(
    testId: string,
    variants: VariantValue[],
    options?: {
      userId?: string;
      weights?: number[];
      metadata?: Partial<ABTestConfig["metadata"]>;
    }
  ): Promise<TestAssignment<VariantValue>> {
    const userId = await this.resolveUserId(options?.userId);

    if (this.debug) {
      console.log(
        `[BetterExperiments] Running test "${testId}" for user "${userId}"`
      );
    }

    // Get or create test configuration
    let testConfig = await this.storage.getTest(testId);

    if (!testConfig) {
      testConfig = await this.createTest({
        testId,
        variants,
        weights: options?.weights,
        metadata: {
          name: `Auto-generated test: ${testId}`,
          ...options?.metadata,
        },
      });
    }

    // Get user's variant assignment
    const assignment = await this.getAssignment(testId, userId);

    if (!assignment) {
      if (this.debug) {
        console.warn(
          `[BetterExperiments] No variant assigned for test "${testId}", returning first variant`
        );
      }

      // Create fallback assignment for first variant
      const fallbackAssignment: UserAssignment = {
        id: nanoid(),
        testId,
        userId,
        variant: variants[0]!,
        assignedAt: new Date(),
      };

      return {
        variant: variants[0]!,
        assignment: fallbackAssignment,
        convert: async () => {}, // No-op for fallback
      };
    }

    // Convert variant name back to variant value
    const selectedVariant = assignment.variant;

    if (this.debug) {
      console.log(
        `[BetterExperiments] User "${userId}" assigned variant "${
          assignment.variant
        }" (value: ${JSON.stringify(selectedVariant)})`
      );
    }

    // Sync to dashboard if configured
    // await this.syncToDashboard("assignment", { assignment, testConfig });

    // Return assignment object with convert method
    return {
      variant: selectedVariant!,
      assignment,
      convert: async (
        event: string = "conversion",
        metadata?: Record<string, any>
      ) => {
        await this.trackConversion(assignment, event, metadata);
      },
    };
  }

  /**
   * Create a new test manually (optional - tests are auto-created)
   */
  async createTest(
    config: Omit<ABTestConfig, "metadata"> & {
      metadata?: Partial<ABTestConfig["metadata"]>;
    }
  ): Promise<ABTestConfig> {
    const fullConfig: ABTestConfig = {
      ...config,
      active: config.active ?? true,
      weights:
        config.weights || this.generateEqualWeights(config.variants.length),
      metadata: {
        createdAt: new Date(),
        ...config.metadata,
      },
    };

    // Validate configuration
    this.validateTestConfig(fullConfig);

    await this.storage.saveTest(fullConfig);

    // Sync to dashboard if configured
    // await this.syncToDashboard("test_created", { test: fullConfig });

    if (this.debug) {
      console.log(
        `[BetterExperiments] Test "${fullConfig.testId}" created with variants:`,
        fullConfig.variants
      );
    }

    return fullConfig;
  }

  /**
   * Get test results and statistics
   */
  async getResults(testId: string): Promise<TestResults | null> {
    if (this.debug) {
      console.log(`[BetterExperiments] Fetching results for test "${testId}"`);
    }
    return this.storage.getTestResults(testId);
  }

  /**
   * Get all tests
   */
  async getTests(): Promise<ABTestConfig[]> {
    return this.storage.getAllTests();
  }

  /**
   * Stop/deactivate a test
   */
  async stopTest(testId: string): Promise<void> {
    const test = await this.storage.getTest(testId);
    if (test) {
      test.active = false;
      await this.storage.saveTest(test);

      // Sync to dashboard if configured
      // await this.syncToDashboard("test_stopped", { test });

      if (this.debug) {
        console.log(`[BetterExperiments] Test "${testId}" stopped`);
      }
    } else {
      if (this.debug) {
        console.warn(`[BetterExperiments] Test "${testId}" not found`);
      }
    }

    return;
  }

  /**
   * Get user's assignment for a specific test
   */
  async getAssignment(
    testId: string,
    userId?: string
  ): Promise<UserAssignment | null> {
    const actualUserId = await this.resolveUserId(userId);
    const test = await this.storage.getTest(testId);

    if (!test || !test.active) {
      return null;
    }

    // Check if user already has an assignment
    const existingAssignment = await this.storage.getAssignment(
      testId,
      actualUserId
    );

    if (existingAssignment) {
      return existingAssignment;
    }

    // Assign new variant
    const variant = this.assignVariant(
      testId,
      actualUserId,
      test.variants,
      test.weights!
    );

    // Save assignment
    const assignment: UserAssignment = {
      id: nanoid(),
      testId,
      userId: actualUserId,
      variant,
      assignedAt: new Date(),
    };

    await this.storage.saveAssignment(assignment);
    return assignment;
  }

  /**
   * Track conversion using assignment (internal method)
   */
  private async trackConversion(
    assignment: UserAssignment,
    event: string = "conversion",
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.debug) {
      console.log(
        `[BetterExperiments] Tracking event "${event}" for assignment "${assignment.id}"`
      );
    }

    const conversionEvent: ConversionEvent = {
      id: nanoid(),
      testId: assignment.testId,
      userId: assignment.userId,
      event,
      variant: assignment.variant,
      assignmentId: assignment.id,
      convertedAt: new Date(),
      metadata,
    };

    await this.storage.saveConversion(conversionEvent);

    // Sync to dashboard if configured
    // await this.syncToDashboard("conversion", { conversion: conversionEvent });

    if (this.debug) {
      console.log(
        `[BetterExperiments] Conversion tracked successfully with ID: ${conversionEvent.id}`
      );
    }
  }

  /**
   * Private methods
   */

  private async resolveUserId(providedUserId?: string): Promise<string> {
    if (providedUserId) {
      return providedUserId;
    }

    return this.defaultGetUserId();
  }

  private defaultGetUserId(): string {
    // Try to get from cookie first (browser environment)
    if (typeof document !== "undefined") {
      const cookieUserId = this.getCookieUserId();
      if (cookieUserId) {
        return cookieUserId;
      }
    }

    // Generate new user ID
    const userId = nanoid();

    // Set cookie if in browser
    if (typeof document !== "undefined") {
      this.setCookieUserId(userId);
    }

    return userId;
  }

  private getCookieUserId(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === this.cookieConfig.name) {
        return decodeURIComponent(value!);
      }
    }
    return null;
  }

  private setCookieUserId(userId: string): void {
    if (typeof document === "undefined") return;

    const cookieParts = [
      `${this.cookieConfig.name}=${encodeURIComponent(userId)}`,
    ];

    if (this.cookieConfig.path) {
      cookieParts.push(`path=${this.cookieConfig.path}`);
    }
    if (this.cookieConfig.domain) {
      cookieParts.push(`domain=${this.cookieConfig.domain}`);
    }
    if (this.cookieConfig.maxAge) {
      const expires = new Date(Date.now() + this.cookieConfig.maxAge);
      cookieParts.push(`expires=${expires.toUTCString()}`);
    }
    if (this.cookieConfig.secure) {
      cookieParts.push("secure");
    }
    if (this.cookieConfig.sameSite) {
      cookieParts.push(`samesite=${this.cookieConfig.sameSite}`);
    }

    document.cookie = cookieParts.join("; ");
  }

  private assignVariant(
    testId: string,
    userId: string,
    variants: VariantValue[],
    weights: number[]
  ): VariantValue {
    // Ensure variants and weights are not empty and have the same length
    if (variants.length === 0 || variants.length !== weights.length) {
      // Throw an error, or return a default/control variant
      console.error("Variants and weights mismatch or empty.");
      throw new Error(
        "Variants and weights must be non-empty and have the same length."
      );
    }

    // Create deterministic numeric hash from testId + userId
    const numericHash = createUserHash(testId + userId);

    // Convert to number between 0 and 1 (inclusive of 0, potentially inclusive of 1)
    // 0xffffffff is 2^32 - 1, the maximum value for an unsigned 32-bit integer.
    const hashNumber = numericHash / 0xffffffff;

    // Use weights to determine variant
    let cumulativeWeight = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += weights[i]!; // Assumes weights[i] is defined
      if (hashNumber <= cumulativeWeight) {
        return variants[i]!; // Assumes variants[i] is defined
      }
    }

    // Fallback to last variant.
    // This should ideally be hit only in edge cases like floating point inaccuracies
    // or if hashNumber is exactly 1.0 and the last variant's cumulative weight is 1.0.
    return variants[variants.length - 1]!;
  }

  private generateEqualWeights(variantCount: number): number[] {
    const weight = 1 / variantCount;
    return Array(variantCount).fill(weight);
  }

  private validateTestConfig(config: ABTestConfig): void {
    if (!config.testId) {
      throw new Error("Test ID is required");
    }
    if (!config.variants || config.variants.length < 2) {
      throw new Error("At least 2 variants are required");
    }
    if (config.weights && config.weights.length !== config.variants.length) {
      throw new Error("Weights array must match variants array length");
    }
    if (config.weights) {
      const sum = config.weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.001) {
        throw new Error("Weights must sum to 1");
      }
    }
  }

  // private async syncToDashboard(event: string, data: any): Promise<void> {
  //   if (!this.dashboardConfig || !this.dashboardConfig.apiKey) {
  //     return;
  //   }

  //   try {
  //     // Future implementation for syncing to hosted dashboard
  //     if (this.debug) {
  //       console.log(
  //         `[BetterExperiments] Would sync to dashboard: ${event}`,
  //         data
  //       );
  //     }

  //     // TODO: Implement actual HTTP request to dashboard API
  //     // await fetch(`${this.dashboardConfig.endpoint}/events`, {
  //     //   method: 'POST',
  //     //   headers: {
  //     //     'Authorization': `Bearer ${this.dashboardConfig.apiKey}`,
  //     //     'Content-Type': 'application/json'
  //     //   },
  //     //   body: JSON.stringify({
  //     //     event,
  //     //     projectId: this.dashboardConfig.projectId,
  //     //     data,
  //     //     timestamp: new Date().toISOString()
  //     //   })
  //     // });
  //   } catch (error) {
  //     if (this.debug) {
  //       console.warn("[BetterExperiments] Failed to sync to dashboard:", error);
  //     }
  //     // Don't throw - dashboard sync should be non-blocking
  //   }
  // }
}
