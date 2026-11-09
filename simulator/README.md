# Local Test Simulator

## Overview
This local simulator provides a predictable multi-scene Windows target application designed specifically for measuring OCR accuracy, testing bounding box extraction, and validating finite state transitions without interacting with third-party software.

## Implemented Scenes
1. **`HOME`**: Initial landing screen displaying `Start Test` button.
2. **`MENU`**: Scenario selection menu featuring `Find Test Scenario`.
3. **`PREVIEW`**: Army & scenario inspection screen with `Begin Test`.
4. **`LOADING`**: Non-interactive preparation screen displaying `Preparing test scenario...`.
5. **`TEST_SCENE`**: Interactive canvas with selectable objects enclosed inside a marked **Safe Interaction Area**.
6. **`RESULT`**: Final completion metrics screen displaying `Test Completed` and `Return Home`.

## Safety Boundary
All mouse and keyboard input dispatches are strictly restricted to this simulator. The Rust safety guard verifies window handle validity, foreground status, and keyword matching before every action dispatch.
