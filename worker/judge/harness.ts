/*
 * Harness generation — wraps a user's submitted function with a driver that
 * runs every test case for the problem and compares results to expected.
 *
 * Output contract (both languages), a small line-based format the frontend
 * parses (see frontend/components/solve-view.tsx parseJudge):
 *   line 1:  "OK"  (all passed)  |  "FAILED"  (a case failed)
 *   then:    passed=<n>
 *            total=<n>
 *   on FAILED, additionally (before passed/total):
 *            index=<1-based failing case>
 *            input=<JSON of the failing args>
 *            expected=<JSON of the expected value>
 *            got=<the produced value, or "runtime error: ...">
 * Exit 0 when all pass, non-zero otherwise. The worker maps exit 0 -> Success,
 * non-zero -> Failure, timeout -> TLE.
 */

import type { CppType, ProblemSpec, TestCase } from "./testcases.ts"

/** A C++ double-quoted string literal whose runtime value is exactly `s`. */
function cppStringLiteral(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

/** JS: append a generic driver that calls the function by name. */
export function buildJs(spec: ProblemSpec, tests: TestCase[], userCode: string): string {
  const testsJson = JSON.stringify(tests)
  return `${userCode}

;(function __judge() {
  function __eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function __report(failed, i, t, got, passed, total) {
    if (failed) {
      console.log("FAILED");
      console.log("index=" + (i + 1));
      console.log("input=" + JSON.stringify(t.args));
      console.log("expected=" + JSON.stringify(t.expected));
      console.log("got=" + got);
    } else {
      console.log("OK");
    }
    console.log("passed=" + passed);
    console.log("total=" + total);
    process.exit(failed ? 1 : 0);
  }
  const __tests = ${testsJson};
  const __total = __tests.length;
  let __passed = 0;
  for (let __i = 0; __i < __total; __i++) {
    const __t = __tests[__i];
    let __got;
    try {
      __got = ${spec.functionName}(...__t.args);
    } catch (__e) {
      __report(true, __i, __t, "runtime error: " + ((__e && __e.message) ? __e.message : __e), __passed, __total);
    }
    if (__eq(__got, __t.expected)) {
      __passed++;
    } else {
      __report(true, __i, __t, JSON.stringify(__got), __passed, __total);
    }
  }
  __report(false, 0, null, "", __passed, __total);
})();
`
}

/** Emit a C++ literal for a value of the given type. */
function cppLiteral(type: CppType, value: unknown): string {
  switch (type) {
    case "int":
      return String(value as number)
    case "bool":
      return (value as boolean) ? "true" : "false"
    case "string":
      // JSON.stringify yields a valid C++ string literal for our test data.
      return JSON.stringify(value as string)
    case "vector<int>":
      return `{${(value as number[]).join(", ")}}`
  }
}

/** How to stringify a value of the return type (for the `got=` line). */
function cppToStr(type: CppType, expr: string): string {
  switch (type) {
    case "vector<int>":
      return `__vecToStr(${expr})`
    case "bool":
      return `(${expr} ? "true" : "false")`
    case "int":
      return `to_string(${expr})`
    case "string":
      return expr
  }
}

/** C++: prepend includes + a stringify helper, then user code, then main(). */
export function buildCpp(spec: ProblemSpec, tests: TestCase[], userCode: string): string {
  const total = tests.length

  const cases = tests
    .map((t: TestCase, i: number) => {
      const decls = spec.params
        .map((p, j) => `    ${p} a${j} = ${cppLiteral(p, t.args[j])};`)
        .join("\n")
      const callArgs = spec.params.map((_, j) => `a${j}`).join(", ")
      const expectedDecl = `    ${spec.returns} expected = ${cppLiteral(
        spec.returns,
        t.expected
      )};`
      // input/expected display strings are known at codegen time.
      const inputLit = cppStringLiteral(JSON.stringify(t.args))
      const expectedLit = cppStringLiteral(JSON.stringify(t.expected))
      return `  {
${decls}
    ${spec.returns} got = __sol.${spec.functionName}(${callArgs});
${expectedDecl}
    if (got == expected) { passed++; }
    else {
      cout << "FAILED\\n";
      cout << "index=${i + 1}\\n";
      cout << "input=" << ${inputLit} << "\\n";
      cout << "expected=" << ${expectedLit} << "\\n";
      cout << "got=" << ${cppToStr(spec.returns, "got")} << "\\n";
      cout << "passed=" << passed << "\\n";
      cout << "total=${total}\\n";
      return 1;
    }
  }`
    })
    .join("\n")

  return `#include <bits/stdc++.h>
using namespace std;

static string __vecToStr(const vector<int>& v) {
  string s = "[";
  for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += to_string(v[i]); }
  s += "]";
  return s;
}

${userCode}

int main() {
  int passed = 0;
  Solution __sol;
${cases}
  cout << "OK\\n";
  cout << "passed=" << passed << "\\n";
  cout << "total=${total}\\n";
  return 0;
}
`
}
