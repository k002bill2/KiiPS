# Code Quality Evaluation Rubric

This rubric evaluates the quality of code generated or modified by AI agents.

Passing Score: 0.70

---

## Criteria: Correctness
Does the code correctly implement the intended functionality?
- Handles the specified use cases properly
- Produces expected outputs for given inputs
- No logical errors or bugs

**Scoring:**
- 1.0: Fully correct, handles all cases
- 0.7: Mostly correct, minor issues
- 0.5: Partially correct, some bugs
- 0.2: Major issues, many bugs
- 0.0: Does not work

---

## Criteria: Code Style
Does the code follow project conventions and best practices?
- Consistent naming conventions (camelCase for JS, snake_case for Python)
- Proper indentation and formatting
- Follows language idioms

**Scoring:**
- 1.0: Exemplary style, follows all conventions
- 0.7: Good style, minor inconsistencies
- 0.5: Acceptable, several style issues
- 0.2: Poor style, hard to read
- 0.0: Unreadable or grossly non-standard

---

## Criteria: Error Handling
Does the code properly handle errors and edge cases?
- Validates inputs appropriately
- Catches and handles exceptions
- Provides meaningful error messages
- Fails gracefully

**Scoring:**
- 1.0: Comprehensive error handling
- 0.7: Good coverage of common errors
- 0.5: Basic error handling
- 0.2: Minimal error handling
- 0.0: No error handling, crashes on errors

---

## Criteria: Documentation
Is the code properly documented?
- Functions have docstrings/JSDoc comments
- Complex logic is explained
- README/instructions updated if needed

**Scoring:**
- 1.0: Excellent documentation
- 0.7: Good documentation, minor gaps
- 0.5: Basic documentation
- 0.2: Minimal comments
- 0.0: No documentation

---

## Criteria: Security
Does the code follow security best practices?
- No hardcoded secrets or credentials
- Input validation and sanitization
- Protection against common vulnerabilities (XSS, SQL injection)
- Proper authentication/authorization checks

**Scoring:**
- 1.0: Security-conscious, no issues
- 0.7: Good security, minor concerns
- 0.5: Acceptable, some gaps
- 0.2: Security issues present
- 0.0: Critical security vulnerabilities

---

## Weight Distribution
- Correctness: 30%
- Code Style: 15%
- Error Handling: 20%
- Documentation: 15%
- Security: 20%
