# Governance

## Current Status

AgentLog is maintained by [Braintied](https://braintied.com). The specification is in **Draft** status (v0.1.0).

## Decision Making

During the Draft phase, decisions are made by the maintainers with community input via GitHub Issues and Pull Requests.

## Spec Changes

Changes to the core specification require:

1. A GitHub Issue describing the proposed change and rationale
2. Community discussion period (minimum 7 days for non-trivial changes)
3. A Pull Request with updated schema, types, validators, and examples
4. Maintainer approval

### Change Categories

| Category | Process | Version Impact |
|----------|---------|---------------|
| Typo/clarification | PR directly | Patch |
| New optional field | Issue + PR | Minor |
| New event type | Issue + discussion + PR | Minor |
| Required field change | Issue + extended discussion + PR | Major |
| Breaking schema change | RFC process | Major |

## Versioning

The specification uses [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to required fields or event structure
- **Minor**: New optional fields, new event types, new converters
- **Patch**: Clarifications, typo fixes, documentation improvements

## Future Governance

As adoption grows, we intend to:

1. Establish a Technical Steering Committee with representatives from adopting tools
2. Formalize the RFC process for major changes
3. Evaluate donation to a foundation (Linux Foundation AAIF) once multiple tools produce the format

## Code of Conduct

Be respectful. Be constructive. Focus on the work. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
