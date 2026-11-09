# Simulator Workflow State Machine

## Finite State Machine Sequence

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> SIMULATOR_HOME: Operator Selects Simulator
    SIMULATOR_HOME --> SIMULATOR_MENU: OCR detects "Start Test" (Conf >= 80%)
    SIMULATOR_MENU --> SCENARIO_PREVIEW: OCR detects "Find Test Scenario" (Conf >= 80%)
    SCENARIO_PREVIEW --> TEST_LOADING: OCR detects "Begin Test" (Conf >= 80%)
    TEST_LOADING --> TEST_SCENE: OCR detects "Preparing test scenario" (Conf >= 75%)
    TEST_SCENE --> RESULT: OCR detects "Safe Interaction Area" / Action Completed
    RESULT --> COMPLETED: OCR detects "Test Completed" (Conf >= 80%)
    RESULT --> SIMULATOR_HOME: Operator or Schedule resets sequence
    COMPLETED --> IDLE: Workflow Run Finished

    SIMULATOR_HOME --> ERROR: Low Confidence or Unexpected Screen
    SIMULATOR_MENU --> ERROR: Target Window Closed or Changed
    TEST_SCENE --> ERROR: Out-of-bounds Interaction Detected
```

## State Definitions & Required Evidence

| State | Expected Phrase | Min Confidence | Timeout (ms) | Retry Limit | Action Permitted |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IDLE` | N/A | 0% | 0 | 0 | None |
| `SIMULATOR_HOME` | `Start Test` | 80% | 10,000 | 3 | `CLICK_START_TEST` |
| `SIMULATOR_MENU` | `Find Test Scenario` | 80% | 10,000 | 3 | `CLICK_FIND_SCENARIO` |
| `SCENARIO_PREVIEW` | `Begin Test` | 80% | 10,000 | 3 | `CLICK_BEGIN_TEST` |
| `TEST_LOADING` | `Preparing test scenario` | 75% | 15,000 | 5 | None (Observe Only) |
| `TEST_SCENE` | `Safe Interaction Area` | 80% | 15,000 | 3 | `CLICK_SCENE_TARGET` |
| `RESULT` | `Test Completed`, `Return Home`| 80% | 10,000 | 3 | `CLICK_RETURN_HOME` |
| `COMPLETED` | N/A | 80% | 0 | 0 | None |
