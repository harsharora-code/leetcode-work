/*
 * Static test-case store — the worker owns judging.
 *
 * Keyed by problemId, matching the ids in the frontend dataset
 * (frontend/lib/problems.ts). Each spec describes the user's function
 * (name + C++ signature) and two sets of test cases:
 *
 *   - sampleTests: run on "Run" (the visible examples)
 *   - hiddenTests: added on "Submit" (LeetCode-style hidden cases)
 *
 * "Run"    judges against sampleTests only.
 * "Submit" judges against sampleTests + hiddenTests.
 */

export type CppType = "int" | "bool" | "string" | "vector<int>"

export interface TestCase {
  args: unknown[]
  expected: unknown
}

export interface ProblemSpec {
  /** Function the user is expected to implement. */
  functionName: string
  /** C++ parameter types, in order (used to generate typed driver code). */
  params: CppType[]
  /** C++ return type. */
  returns: CppType
  /** Shown/used on "Run". */
  sampleTests: TestCase[]
  /** Extra cases used only on "Submit". */
  hiddenTests: TestCase[]
}

export const PROBLEM_SPECS: Record<string, ProblemSpec> = {
  // 1. Two Sum
  "1": {
    functionName: "twoSum",
    params: ["vector<int>", "int"],
    returns: "vector<int>",
    sampleTests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
    ],
    hiddenTests: [
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { args: [[-3, 4, 3, 90], 0], expected: [0, 2] },
    ],
  },

  // 3. Longest Substring Without Repeating Characters
  "3": {
    functionName: "lengthOfLongestSubstring",
    params: ["string"],
    returns: "int",
    sampleTests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
    ],
    hiddenTests: [
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0 },
      { args: [" "], expected: 1 },
      { args: ["dvdf"], expected: 3 },
      { args: ["abba"], expected: 2 },
    ],
  },

  // 20. Valid Parentheses
  "20": {
    functionName: "isValid",
    params: ["string"],
    returns: "bool",
    sampleTests: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
    ],
    hiddenTests: [
      { args: ["([)]"], expected: false },
      { args: ["{[]}"], expected: true },
      { args: ["]"], expected: false },
      { args: ["("], expected: false },
      { args: ["(("], expected: false },
    ],
  },

  // 21. Merge Two Sorted Lists (modelled as arrays)
  "21": {
    functionName: "merge",
    params: ["vector<int>", "vector<int>"],
    returns: "vector<int>",
    sampleTests: [
      { args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { args: [[], []], expected: [] },
    ],
    hiddenTests: [
      { args: [[], [0]], expected: [0] },
      { args: [[1, 2, 3], []], expected: [1, 2, 3] },
      { args: [[-5, -2, 0], [-1, 3]], expected: [-5, -2, -1, 0, 3] },
      { args: [[1, 1, 1], [1, 1]], expected: [1, 1, 1, 1, 1] },
      { args: [[2], [1]], expected: [1, 2] },
    ],
  },

  // 42. Trapping Rain Water
  "42": {
    functionName: "trap",
    params: ["vector<int>"],
    returns: "int",
    sampleTests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
    ],
    hiddenTests: [
      { args: [[1]], expected: 0 },
      { args: [[2, 0, 2]], expected: 2 },
      { args: [[3, 0, 0, 2, 0, 4]], expected: 10 },
      { args: [[0, 0, 0]], expected: 0 },
      { args: [[5, 4, 1, 2]], expected: 1 },
    ],
  },

  // 53. Maximum Subarray
  "53": {
    functionName: "maxSubArray",
    params: ["vector<int>"],
    returns: "int",
    sampleTests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
    ],
    hiddenTests: [
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-1]], expected: -1 },
      { args: [[-2, -1]], expected: -1 },
      { args: [[-5, -4, -3]], expected: -3 },
      { args: [[1, 2, 3, 4]], expected: 10 },
      { args: [[8, -19, 5, -4, 20]], expected: 21 },
    ],
  },

  // 70. Climbing Stairs
  "70": {
    functionName: "climbStairs",
    params: ["int"],
    returns: "int",
    sampleTests: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
    ],
    hiddenTests: [
      { args: [1], expected: 1 },
      { args: [4], expected: 5 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
      { args: [45], expected: 1836311903 },
    ],
  },

  // 121. Best Time to Buy and Sell Stock
  "121": {
    functionName: "maxProfit",
    params: ["vector<int>"],
    returns: "int",
    sampleTests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
    hiddenTests: [
      { args: [[1, 2]], expected: 1 },
      { args: [[2, 1]], expected: 0 },
      { args: [[1]], expected: 0 },
      { args: [[3, 2, 6, 5, 0, 3]], expected: 4 },
      { args: [[2, 4, 1]], expected: 2 },
    ],
  },

  // 217. Contains Duplicate
  "217": {
    functionName: "containsDuplicate",
    params: ["vector<int>"],
    returns: "bool",
    sampleTests: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
    ],
    hiddenTests: [
      { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
      { args: [[1]], expected: false },
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]], expected: false },
      { args: [[0, 0]], expected: true },
    ],
  },
}

export function getProblemSpec(problemId: string): ProblemSpec | undefined {
  return PROBLEM_SPECS[problemId]
}

/** Test cases to judge against for a given mode. */
export function getTestsForMode(spec: ProblemSpec, mode: "run" | "submit"): TestCase[] {
  return mode === "run"
    ? spec.sampleTests
    : [...spec.sampleTests, ...spec.hiddenTests]
}
