import type {
  ABTestConfig,
  ConversionEvent,
  StorageAdapter,
  TestResults,
  UserAssignment,
  VariantResults,
} from "../types";

/**
 * In-memory storage adapter for development and testing
 * Data is lost when the process restarts
 */
export class MemoryStorage implements StorageAdapter {
  private tests: Map<string, ABTestConfig> = new Map();
  private assignments: Map<string, UserAssignment> = new Map();
  private conversions: ConversionEvent[] = [];

  async saveTest(config: ABTestConfig): Promise<void> {
    this.tests.set(config.testId, { ...config });
  }

  async getTest(testId: string): Promise<ABTestConfig | null> {
    return this.tests.get(testId) || null;
  }

  async getAllTests(): Promise<ABTestConfig[]> {
    return Array.from(this.tests.values());
  }

  async saveAssignment(assignment: UserAssignment): Promise<void> {
    const key = `${assignment.testId}:${assignment.userId}`;
    this.assignments.set(key, { ...assignment });
  }

  async getAssignment(
    testId: string,
    userId: string
  ): Promise<UserAssignment | null> {
    const key = `${testId}:${userId}`;
    return this.assignments.get(key) || null;
  }

  async getAssignmentById(
    assignmentId: string
  ): Promise<UserAssignment | null> {
    for (const assignment of this.assignments.values()) {
      if (assignment.id === assignmentId) {
        return assignment;
      }
    }
    return null;
  }

  async saveConversion(event: ConversionEvent): Promise<void> {
    this.conversions.push({ ...event });
  }

  async getConversions(testId: string): Promise<ConversionEvent[]> {
    return this.conversions.filter((c) => c.testId === testId);
  }

  async getTestResults(testId: string): Promise<TestResults | null> {
    const config = await this.getTest(testId);
    if (!config) {
      return null;
    }

    // Get all assignments for this test
    const assignments = Array.from(this.assignments.values()).filter(
      (a) => a.testId === testId
    );

    // Get all conversions for this test
    const conversions = await this.getConversions(testId);

    // Calculate results per variant
    const variantResults: VariantResults[] = config.variants.map((variant) => {
      const variantAssignments = assignments.filter(
        (a) => a.variant === variant
      );
      const variantConversions = conversions.filter(
        (c) => c.variant === variant
      );

      // Group conversions by event type
      const events: Record<string, number> = {};
      for (const conversion of variantConversions) {
        events[conversion.event] = (events[conversion.event] || 0) + 1;
      }

      const totalUsers = variantAssignments.length;
      const totalConversions = variantConversions.length;

      return {
        variant,
        totalUsers,
        totalConversions,
        conversionRate: totalUsers > 0 ? totalConversions / totalUsers : 0,
        events,
      };
    });

    // Calculate basic test statistics
    const firstAssignment = assignments[0];
    const lastConversion = conversions[conversions.length - 1];
    const durationDays =
      firstAssignment && lastConversion
        ? Math.ceil(
            (lastConversion.convertedAt.getTime() -
              firstAssignment.assignedAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    // Simple winner detection (highest conversion rate)
    const winner = variantResults.reduce((prev, current) =>
      current.conversionRate > prev.conversionRate ? current : prev
    );

    return {
      config,
      variants: variantResults,
      stats: {
        durationDays,
        winner: winner.conversionRate > 0 ? winner.variant : undefined,
        // TODO: Add proper statistical significance calculation
        isSignificant: false,
      },
    };
  }

  /**
   * Utility methods for debugging/testing
   */

  async clear(): Promise<void> {
    this.tests.clear();
    this.assignments.clear();
    this.conversions = [];
  }

  async getStats(): Promise<{
    testsCount: number;
    assignmentsCount: number;
    conversionsCount: number;
  }> {
    return {
      testsCount: this.tests.size,
      assignmentsCount: this.assignments.size,
      conversionsCount: this.conversions.length,
    };
  }
}
