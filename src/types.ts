/**
 * Core types for Better-Experiments A/B testing framework
 */

export interface ABTestConfig {
  /** Unique identifier for the test */
  testId: string;
  /** Array of variant names/identifiers */
  variants: VariantValue[];
  /** Weight distribution for variants (optional, defaults to equal distribution) */
  weights?: number[];
  /** Whether the test is currently active */
  active?: boolean;
  /** Test metadata */
  metadata?: {
    name?: string;
    description?: string;
    createdAt?: Date;
    createdBy?: string;
  };
}

export interface UserAssignment {
  /** Unique identifier for this assignment */
  id: string;
  /** Test identifier */
  testId: string;
  /** User identifier (cookie ID, user ID, etc.) */
  userId: string;
  /** Assigned variant */
  variant: VariantValue;
  /** Timestamp of assignment */
  assignedAt: Date;
  /** Optional metadata for this assignment */
  metadata?: Record<string, any>;
}

export interface TestAssignment<T = any> {
  /** The variant value assigned to the user */
  variant: T;
  /** Full assignment details */
  assignment: UserAssignment;
  /** Method to track conversions for this assignment */
  convert(event?: string, metadata?: Record<string, any>): Promise<void>;
}

export interface ConversionEvent {
  /** Unique identifier for this conversion */
  id: string;
  /** Test identifier */
  testId: string;
  /** User identifier */
  userId: string;
  /** Event name/type */
  event: string;
  /** Assigned variant at time of conversion */
  variant: VariantValue;
  /** Assignment ID that led to this conversion */
  assignmentId: string;
  /** Timestamp of conversion */
  convertedAt: Date;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

export interface TestResults {
  /** Test configuration */
  config: ABTestConfig;
  /** Results per variant */
  variants: VariantResults[];
  /** Test statistics */
  stats: TestStats;
}

export interface VariantResults {
  /** Variant name */
  variant: VariantValue;
  /** Total users assigned to this variant */
  totalUsers: number;
  /** Total conversions for this variant */
  totalConversions: number;
  /** Conversion rate (conversions / users) */
  conversionRate: number;
  /** Conversion events breakdown */
  events: Record<string, number>;
}

export interface TestStats {
  /** Total test duration in days */
  durationDays: number;
  /** Statistical significance (if calculable) */
  significance?: number;
  /** Confidence interval */
  confidenceInterval?: number;
  /** Whether results are statistically significant */
  isSignificant?: boolean;
  /** Recommended winner variant (if any) */
  winner?: VariantValue;
}

export interface StorageAdapter {
  /** Save test configuration */
  saveTest(config: ABTestConfig): Promise<void>;
  /** Get test configuration */
  getTest(testId: string): Promise<ABTestConfig | null>;
  /** Get all tests */
  getAllTests(): Promise<ABTestConfig[]>;
  /** Save user assignment */
  saveAssignment(assignment: UserAssignment): Promise<void>;
  /** Get user assignment for a test */
  getAssignment(testId: string, userId: string): Promise<UserAssignment | null>;
  /** Get assignment by unique ID */
  getAssignmentById(assignmentId: string): Promise<UserAssignment | null>;
  /** Save conversion event */
  saveConversion(event: ConversionEvent): Promise<void>;
  /** Get all conversions for a test */
  getConversions(testId: string): Promise<ConversionEvent[]>;
  /** Get test results with statistics */
  getTestResults(testId: string): Promise<TestResults | null>;
}

export interface BetterExperimentConfig {
  /** Storage adapter for persisting data */
  storage?: StorageAdapter;

  /** Cookie configuration for browser environments */
  cookie?: {
    name?: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
  };

  /** Debug mode */
  debug?: boolean;

  /** Hosted dashboard configuration (for paid offering) */
  // dashboard?: {
  //   /** API key for hosted dashboard */
  //   apiKey?: string;
  //   /** Project identifier */
  //   projectId?: string;
  // };
}

export type VariantValue = string | number | boolean | object;
