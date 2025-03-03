# CRITICAL INSTRUCTIONS

- Do not hallucinate or make up function calls, variables, or arguments that are not in your training data.
- Deduplicate relentlessly. Extract common variables and code into ternary operators or const functions.
- Use async/await whenever possible. If necessary, fall back to Promises.

# Best Practices

- Optimize for a cyclomatic complexity of less than 6-9. Write additional functions if needed.
- Regularly review and refactor the codebase to reduce complexity and maintain clarity.
- Favor functional programming paradigms, avoiding mutable state wherever possbile.

# General Instructions

- For functions and variables, be descriptive and use camelCase. Be clear about "get", "create", "delete", etc.
- If you notice potential bugs or improvements in the surrounding code, write them out in comments.
- Write code that is **DRY, concise, readable, maintainable, and well-structured**.

# TypeScript Specifics

- Access objects safely, properly using "?." and "??". Sparingly use "!" when appropriate.
- Use modern TypeScript 5+ features like "satisfies", "infer", "asserts", "asConst", etc.
- All functions should be in arrow syntax and assigned to a constant. Do not use Classes.
- Prefer the mapReduce pattern when possible, especially for arrays, sets, and maps.

# Pulumi Specifics

- Clearly specify and adhere to resource dependencies to avoid race conditions.
- Use `pulumi.interpolate` and `.apply()` correctly for composing Outputs.
- When using multiple Outputs, use `pulumi.all` to combine them.

# Documentation Instructions

- Use JSDoc-style comments, specifying types, parameters, and return values clearly.
- Your audience are seasoned principal engineers, so avoid over-explaining simple concepts.
- Write clear and concise comments explaining the "why", not just the "what".
