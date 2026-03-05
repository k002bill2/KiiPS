# KiiPS Code Style and Conventions

## General Principles
- **Multi-module Maven Structure**: Always use the parent project `KiiPS-HUB` to manage dependencies and build modules.
- **Microservices Communication**: Services communicate via REST APIs through the `KIIPS-APIGateway`. Shared logic is placed in `KiiPS-COMMON`, and shared DAOs are in `KiiPS-UTILS`.

## Naming Conventions
- **Controllers**: Frequently named `*controll` instead of `controller`.
- **Services**: Typically follow standard Spring naming conventions.
- **DAOs**: Use prefix like `TB_*` (e.g., `TB_SY*`) for domain-specific tables.

## Frontend (SCSS & JSP)
- **Dark Theme**: Use ONLY the `[data-theme=dark]` selector. Avoid `.dark` or `.theme-dark` classes.
- **Styling**: Edit SCSS files (`.scss`) and never directly modify CSS files.
- **Layout**: Do not change layout properties (width, height, display, position, margin, padding) unless specifically requested. Use existing variables like `$dark-bg`, `$dark-color-2`.
- **JSP Standards**: Follow the `kiips-page-pattern-guide` for standard page structures, including standard includes for filters, buttons, and grids.

## Error Handling
- Use the `GlobalExceptionHandler` in `KiiPS-COMMON`.
- Exception levels:
  - **P0 (Critical)**: `NullPointerException` (Immediate Slack notification)
  - **P1 (High)**: `RuntimeException`
  - **P2 (Medium)**: `Exception` (Standard alert)
