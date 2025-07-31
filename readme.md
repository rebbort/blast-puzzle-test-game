# Blast Puzzle Test Game

[![CI](https://github.com/rebbort/blast-puzzle-test-game/actions/workflows/build.yml/badge.svg)](https://github.com/rebbort/blast-puzzle-test-game/actions/workflows/build.yml)
[![Tests](https://github.com/rebbort/blast-puzzle-test-game/actions/workflows/build.yml/badge.svg?label=Tests)](https://github.com/rebbort/blast-puzzle-test-game/actions/workflows/build.yml)

This project contains a prototype for a Blast puzzle game. The badge above shows the status of the CI workflow which runs linting and type checking on every push to `main`.

## Running tests

Install dependencies once with `npm install` if needed, then run:

```bash
npm test
```

This executes the Jest suite defined in the `tests` folder.

## Events

All engine-wide events are defined in [`EventNames.ts`](assets/scripts/core/events/EventNames.ts). Use these constants when emitting or subscribing instead of string literals.
The global `EventBus` tracks listeners and warns in development when an emitted event has no subscribers.

## FSM integration

`GameScene.ts` composes the core classes and starts the `GameStateMachine` when the scene loads. See `tools/fsm-smoke.ts` for a minimal script demonstrating the event flow from user input to state transitions.

## QA

For manual mobile checks see the [UI Test Checklist](docs/UI_TEST_CHECKLIST.md).
