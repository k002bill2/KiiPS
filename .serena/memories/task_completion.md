# Task Completion Guidelines for KiiPS

When a task (feature development, bug fix, refactoring) is completed, follow these steps:

1. **Verify Changes**:
   - Ensure the code follows project conventions and CLAUDE.md rules.
   - For UI changes, verify both Light and Dark themes (`[data-theme=dark]`).
   - For SCSS changes, ensure successful compilation.

2. **Build Verification**:
   - Run the build from `KiiPS-HUB` for the affected module(s) using `mvn clean package -pl :module -am`.
   - Ensure the build is successful.

3. **Service Testing**:
   - Start the service using `./start.sh`.
   - Monitor the logs for any errors or exceptions during startup.
   - Verify the functionality in the browser or via API calls.

4. **Code Quality**:
   - Ensure minimal changes; avoid broad refactoring unless requested.
   - Check for any `NullPointerException` risks as they trigger P0 Slack alerts.

5. **Version Control**:
   - Perform `svn status` to see changed files.
   - Provide a concise and clear explanation of changes when handing over.
   - Note: Do NOT commit changes unless explicitly instructed.
