# Archive - Legacy Claude Desktop Files

This directory contains legacy files from the Claude Desktop (MCP-based) architecture.
They are preserved for reference but are **not active** in the current Claude Code environment.

## Current Architecture

The KiiPS agent system has migrated from Claude Desktop to **Claude Code**:
- `CLAUDE.md` + `.claude/skills/` replaces `system prompt.txt`
- `.claude/agents/` replaces `.agent/workflows/`
- `.claude/hooks/` replaces MCP-based tool orchestration

## Files

| File | Original Purpose | Replaced By |
|------|-----------------|-------------|
| `claude-desktop/system prompt.txt` | Claude Desktop v5.4 system prompt | `CLAUDE.md` |
| `claude-desktop/agent/rules/` | Agent rules (taskmaster, devworkflow) | `.claude/rules/`, `.claude/agents/shared/` |
| `claude-desktop/agent/workflows/` | Workflow definitions | `.claude/agents/managers/` |

## When to Reference

- Understanding the original MCP tool architecture
- Porting remaining workflow logic to Claude Code hooks/skills
- Historical context for design decisions
