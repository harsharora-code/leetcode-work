import type { Language } from "./api"

export type Difficulty = "Easy" | "Medium" | "Hard"

export interface Example {
  input: string
  output: string
  explanation?: string
}

export type StarterCode = Record<Language, string>

export interface Problem {
  id: string
  slug: string
  title: string
  difficulty: Difficulty
  tags: string[]
 
  summary: string
  
  description: string
  examples: Example[]
  constraints: string[]
  starterCode: StarterCode
  acceptance: number
}

const two_sum: Problem = {
  id: "1",
  slug: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  tags: ["Array", "Hash Table"],
  summary: "Return indices of the two numbers that add up to a target.",
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Implement the \`twoSum\` method. Your solution is run against several hidden test cases.`,
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    { input: "nums = [3,3], target = 6", output: "[0,1]" },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  acceptance: 52.4,
  starterCode: {
    js: `function twoSum(nums, target) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here

        return {};
    }
};`,
  },
}

const valid_parentheses: Problem = {
  id: "20",
  slug: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  tags: ["String", "Stack"],
  summary: "Determine if the input string of brackets is valid.",
  description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if open brackets are closed by the same type of bracket, in the correct order, and every close bracket has a matching open bracket.`,
  examples: [
    { input: 's = "()"', output: "true" },
    { input: 's = "()[]{}"', output: "true" },
    { input: 's = "(]"', output: "false" },
  ],
  constraints: [
    "1 <= s.length <= 10^4",
    "s consists of parentheses only '()[]{}'.",
  ],
  acceptance: 40.7,
  starterCode: {
    js: `function isValid(s) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your code here

        return false;
    }
};`,
  },
}

const merge_two_sorted_lists: Problem = {
  id: "21",
  slug: "merge-two-sorted-lists",
  title: "Merge Two Sorted Lists",
  difficulty: "Easy",
  tags: ["Array", "Two Pointers"],
  summary: "Merge two sorted arrays into one sorted array.",
  description: `You are given two sorted integer arrays \`a\` and \`b\`.

Merge them into a single array sorted in non-decreasing order and return it.

(Modelled with arrays rather than linked-list pointers so the harness can pass inputs directly.)`,
  examples: [
    { input: "a = [1,2,4], b = [1,3,4]", output: "[1,1,2,3,4,4]" },
    { input: "a = [], b = []", output: "[]" },
    { input: "a = [], b = [0]", output: "[0]" },
  ],
  constraints: [
    "0 <= a.length, b.length <= 50",
    "-100 <= a[i], b[i] <= 100",
    "Both arrays are sorted in non-decreasing order.",
  ],
  acceptance: 64.1,
  starterCode: {
    js: `function merge(a, b) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    vector<int> merge(vector<int>& a, vector<int>& b) {
        // Write your code here

        return {};
    }
};`,
  },
}

const best_time_to_buy_sell_stock: Problem = {
  id: "121",
  slug: "best-time-to-buy-and-sell-stock",
  title: "Best Time to Buy and Sell Stock",
  difficulty: "Easy",
  tags: ["Array", "Dynamic Programming"],
  summary: "Maximize profit from a single buy/sell of a stock.",
  description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.

Maximize your profit by choosing a single day to buy and a later day to sell. Return the maximum profit, or \`0\` if none is possible.`,
  examples: [
    {
      input: "prices = [7,1,5,3,6,4]",
      output: "5",
      explanation: "Buy at 1 (day 2), sell at 6 (day 5), profit = 5.",
    },
    { input: "prices = [7,6,4,3,1]", output: "0" },
  ],
  constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
  acceptance: 54.9,
  starterCode: {
    js: `function maxProfit(prices) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your code here

        return 0;
    }
};`,
  },
}

const contains_duplicate: Problem = {
  id: "217",
  slug: "contains-duplicate",
  title: "Contains Duplicate",
  difficulty: "Easy",
  tags: ["Array", "Hash Table", "Sorting"],
  summary: "Check whether any value appears at least twice.",
  description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice, and \`false\` if every element is distinct.`,
  examples: [
    { input: "nums = [1,2,3,1]", output: "true" },
    { input: "nums = [1,2,3,4]", output: "false" },
    { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true" },
  ],
  constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
  acceptance: 61.8,
  starterCode: {
    js: `function containsDuplicate(nums) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your code here

        return false;
    }
};`,
  },
}

const climbing_stairs: Problem = {
  id: "70",
  slug: "climbing-stairs",
  title: "Climbing Stairs",
  difficulty: "Easy",
  tags: ["Math", "Dynamic Programming", "Memoization"],
  summary: "Count distinct ways to climb to the top.",
  description: `You are climbing a staircase that takes \`n\` steps to reach the top.

Each time you can climb \`1\` or \`2\` steps. Return the number of distinct ways to climb to the top.`,
  examples: [
    { input: "n = 2", output: "2", explanation: "1+1, or 2." },
    { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, 2+1." },
  ],
  constraints: ["1 <= n <= 45"],
  acceptance: 52.3,
  starterCode: {
    js: `function climbStairs(n) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Write your code here

        return 0;
    }
};`,
  },
}

const maximum_subarray: Problem = {
  id: "53",
  slug: "maximum-subarray",
  title: "Maximum Subarray",
  difficulty: "Medium",
  tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
  summary: "Find the contiguous subarray with the largest sum.",
  description: `Given an integer array \`nums\`, find the contiguous subarray with the largest sum and return that sum.`,
  examples: [
    {
      input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
      output: "6",
      explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
    },
    { input: "nums = [1]", output: "1" },
    { input: "nums = [5,4,-1,7,8]", output: "23" },
  ],
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  acceptance: 51.0,
  starterCode: {
    js: `function maxSubArray(nums) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your code here

        return 0;
    }
};`,
  },
}

const longest_substring: Problem = {
  id: "3",
  slug: "longest-substring-without-repeating-characters",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  tags: ["Hash Table", "String", "Sliding Window"],
  summary: "Length of the longest substring without repeating characters.",
  description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
  examples: [
    { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' },
    { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b".' },
    { input: 's = "pwwkew"', output: "3" },
  ],
  constraints: [
    "0 <= s.length <= 5 * 10^4",
    "s consists of English letters, digits, symbols and spaces.",
  ],
  acceptance: 34.7,
  starterCode: {
    js: `function lengthOfLongestSubstring(s) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your code here

        return 0;
    }
};`,
  },
}

const trapping_rain_water: Problem = {
  id: "42",
  slug: "trapping-rain-water",
  title: "Trapping Rain Water",
  difficulty: "Hard",
  tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
  summary: "Compute how much water can be trapped after raining.",
  description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
  examples: [
    { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
    { input: "height = [4,2,0,3,2,5]", output: "9" },
  ],
  constraints: [
    "n == height.length",
    "1 <= n <= 2 * 10^4",
    "0 <= height[i] <= 10^5",
  ],
  acceptance: 61.5,
  starterCode: {
    js: `function trap(height) {
  // Write your code here

}`,
    cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        // Write your code here

        return 0;
    }
};`,
  },
}

const PROBLEMS: Problem[] = [
  two_sum,
  longest_substring,
  valid_parentheses,
  merge_two_sorted_lists,
  maximum_subarray,
  climbing_stairs,
  best_time_to_buy_sell_stock,
  contains_duplicate,
  trapping_rain_water,
]

export function getAllProblems(): Problem[] {
  return PROBLEMS
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return PROBLEMS.find((p) => p.slug === slug)
}

export function getAllTags(): string[] {
  return Array.from(new Set(PROBLEMS.flatMap((p) => p.tags))).sort()
}
