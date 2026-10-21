# Reflection

**Name / Andrew ID: Emma Ma / zm**

**Recitation group members (Task 2): Samantha Lu**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

My Wordle property that the result always has exactly five colors is valid but
weak. The spec says there should be one color for each of the five
positions, so a correct implementation should always pass it. However, it doesn't tell me whether any of those colors are right. It would catch an off-by-one
bug where a loop stops early and only adds four colors to the result.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

`mergesIntegerNeighbors` was flaky because the random intervals didn't reliably
leave a gap of exactly one between endpoints. The coverage property could catch
the bug, including at fractional points, but a lot of generated intervals
overlapped and hid it. For example, `[1, 2]` and `[3, 4]` need to stay separate
because neither interval covers 2.5.

I added a targeted generator for the already-separated property. It builds each
interval with a nonnegative width, then starts the next one at the previous end
plus one. That makes every consecutive pair have exactly the kind of gap this
bug incorrectly fills. The new property checks that these intervals stay
unchanged, so we no longer have to hope the general generator produces them.

Before (excerpt from the runner):

```text
  ~ mergesIntegerNeighbors  flaky: killed in 4/5 runs  by: preserves point coverage
      Counterexample: [[[11,11],[0,10]],0]
      AssertionError: expected true to be false // Object.is equality
```

After adding the targeted generator and property (excerpt):

```text
  ✔ mergesIntegerNeighbors  killed  by: preserves point coverage; preserves already separated intervals
      Counterexample: [[[0,5],[6,6]],0]
      AssertionError: expected true to be false // Object.is equality
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

For `touchingNotMerged`, the runner printed:

```text
Counterexample: [[[0,20],[20,20]]]
AssertionError: expected 20 to be less than 20
```

The spec says closed intervals that touch must merge, and these two both
contain 20. The correct result is `[[0, 20]]`, but the mutant leaves two
intervals touching at 20, which breaks the requirement that consecutive
output intervals have a strict gap.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

In my OpenCode feature, users could select lines of their program and choose
how detailed an explanation they wanted. I could use property-based testing for
the module that turns that selection and depth into an explanation request.
That gives us something concrete to check without having to judge the wording
of an AI-generated explanation.

- **Invariant:** The code snippet sent for explanation should contain exactly
  the selected lines, in their original order, with their whitespace preserved.
  It shouldn't drop the last selected line or include an extra line beside it.
- **Metamorphic:** If I keep the file and selection the same and only change
  the explanation depth, the selected code in the request should stay the same.
  The depth setting should change to match what I picked.

I could do this by generating a nonempty array of source lines, then choose a valid start line and an end line at or after it, both inside that file. I'd also generate one of the depth options the feature actually supports. I'd include single-line selections, the whole file, selections at either end, blank lines, and indented code. 