---
name: effort-scaling
description: Guide for determining appropriate agent resource allocation based on task complexity
---

# Effort Scaling Guide

Determine appropriate resource allocation before spawning agents.

**Source**: [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

## Complexity Matrix

| Complexity | Agents | Tool Calls | Token Cost | Time |
|------------|--------|------------|------------|------|
| **Trivial** | 0 | 1-3 | ~1K | <1min |
| **Simple** | 1 | 3-10 | ~5K | 1-3min |
| **Moderate** | 2-3 | 10-30 | ~50K | 5-10min |
| **Complex** | 5+ | 30+ | ~150K | 15-30min |

## Decision Flowchart

```
START
  |
  |- Is it a typo/single-line fix?
  |   +- YES -> TRIVIAL (direct edit)
  |
  |- Is it one file, one concern?
  |   +- YES -> SIMPLE (1 agent)
  |
  |- Multiple files OR JSP+Controller+Mapper?
  |   +- YES -> MODERATE (2-3 agents)
  |
  +- System-wide OR 5+ concerns?
      +- YES -> COMPLEX (5+ agents)
```

## Quick Assessment Checklist

Before spawning agents, score each:

| Factor | Score 0 | Score 1 | Score 2 |
|--------|---------|---------|---------|
| Files to modify | 1 | 2-4 | 5+ |
| Layers involved | 1 | 2 | 3+ (Controller+Service+Mapper+JSP) |
| Tests needed | None | Unit (JUnit) | Integration |
| Exploration needed | No | Some | Extensive |

**Total Score:**
- 0-2: Trivial/Simple
- 3-5: Moderate
- 6+: Complex

## Examples by Task Type

### Trivial (0 agents)
- Fix typo in JSP label
- Update version number in pom.xml
- Add comment to Java code
- Rename single variable

### Simple (1 agent)
- Add loading spinner to JSP page
- Create new utility method
- Add single REST API endpoint
- Write JUnit tests for existing service

### Moderate (2-3 agents)
- New JSP page with RealGrid + REST API
- Feature with Controller + Service + Mapper + JSP
- SCSS dark theme for multiple components
- Add form with validation (JSP + Controller)

### Complex (5+ agents)
- New business module (full Controller/Service/Mapper/JSP stack)
- Cross-module feature (FD + IL + COMMON)
- System-wide refactoring across multiple services
- Performance optimization across DB + API + UI layers

## Token Economics

Multi-agent systems use ~15x more tokens than single-agent.

| Approach | Tokens | Cost | Time |
|----------|--------|------|------|
| Single agent | 10K | $ | 5min |
| 3 parallel agents | 50K | $$$ | 3min |
| 5 parallel agents | 150K | $$$$$ | 5min |

**Use multi-agent when:**
- Time savings justify token cost
- Quality/coverage requirements high
- Tasks are truly parallelizable

**Use single-agent when:**
- Simple, focused task
- Sequential dependencies
- Token budget limited

## Agent Selection Guide

### By Task Domain

| Domain | Primary Agent | Support |
|--------|---------------|---------|
| Architecture review | kiips-architect | - |
| API/Service development | kiips-developer | - |
| JSP/SCSS UI work | kiips-ui-designer | - |
| RealGrid table | kiips-realgrid-generator | kiips-ui-designer |
| Code refactoring | code-simplifier | - |
| Quality validation | checklist-generator | - |
| Full feature | kiips-developer + kiips-ui-designer | checklist-generator |
| Maven build | build-manager -> kiips-developer | - |
| Deployment | deployment-manager -> kiips-developer | checklist-generator |

### By Dependency Order (Feature Development)

```
1. kiips-architect
   +- Architecture review, schema design

2. kiips-developer
   +- Controller + Service + Mapper implementation

3. kiips-ui-designer / kiips-realgrid-generator
   +- JSP page + RealGrid + SCSS (depends on API endpoints)

4. checklist-generator
   +- Quality validation checklist

5. code-simplifier (optional)
   +- Post-implementation refactoring
```

### Manager-Orchestrated Workflows

```
build-manager
   +- Coordinates: kiips-developer for Maven builds
   +- Skill: kiips-build

feature-manager
   +- Coordinates: architect -> developer -> ui-designer -> checklist
   +- Skills: kiips-feature-planner, checklist-generator

ui-manager
   +- Coordinates: kiips-ui-designer, kiips-realgrid-generator
   +- Skills: kiips-ui-component-builder, kiips-realgrid-guide,
              kiips-quality, kiips-quality, kiips-scss

deployment-manager
   +- Coordinates: kiips-developer for deployment pipeline
   +- Skills: kiips-build, kiips-logs
```

## Common Mistakes

### Over-scaling
- Using 3 agents for a properties config change
- Spawning checklist agent for exploratory work
- Complex delegation for simple single-file edits

### Under-scaling
- One agent for Controller + Service + Mapper + JSP + SCSS
- Sequential work when parallel possible (backend + frontend)
- No tests for significant features

## Integration

This guide is referenced by:
- `primary-coordinator.md` - Uses for effort decisions
- `parallel-coordinator/SKILL.md` - Embedded in workflow
- Manager agents - For sub-task scaling within their domains

---

**Version**: 2.0.0-KiiPS | **Last Updated**: 2026-02-06
