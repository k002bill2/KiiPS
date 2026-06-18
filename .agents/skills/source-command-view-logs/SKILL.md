---
name: "source-command-view-logs"
description: "View logs for a specific KiiPS service"
---

# source-command-view-logs

Use this skill when the user asks to run the migrated source command `view-logs`.

## Command Template

# View KiiPS Service Logs

View the latest logs for a specified KiiPS service.

**Usage:** `/view-logs <service-name>`

**Examples:**
- `/view-logs KiiPS-UI`
- `/view-logs KiiPS-FD`
- `/view-logs KiiPS-APIGateway`

**Instructions for Codex:**

1. Navigate to the service directory
2. Determine the log file location:
   - Standard location: `logs/log.$(date "+%Y-%m-%d")-0.log`
   - Alternative: Check for `log_*.sh` script in the service directory
3. Display the last 100 lines of the log:
   ```bash
   tail -100 logs/log.$(date "+%Y-%m-%d")-0.log
   ```
4. Highlight any ERROR or WARN messages
5. If errors are found, offer to investigate further using:
   - Stack traces
   - Related code files
   - Exception handling in KiiPS-COMMON's GlobalExceptionHandler
