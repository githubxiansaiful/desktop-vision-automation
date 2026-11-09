use desktop_vision_automation_lib::safety::*;
use desktop_vision_automation_lib::workflow::*;

#[test]
fn test_state_machine_valid_transitions() {
    assert!(WorkflowState::Idle.is_valid_transition(&WorkflowState::SimulatorHome));
    assert!(WorkflowState::SimulatorHome.is_valid_transition(&WorkflowState::SimulatorMenu));
    assert!(WorkflowState::SimulatorMenu.is_valid_transition(&WorkflowState::ScenarioPreview));
    assert!(WorkflowState::ScenarioPreview.is_valid_transition(&WorkflowState::TestLoading));
    assert!(WorkflowState::TestLoading.is_valid_transition(&WorkflowState::TestScene));
    assert!(WorkflowState::TestScene.is_valid_transition(&WorkflowState::Result));
    assert!(WorkflowState::Result.is_valid_transition(&WorkflowState::Completed));
    assert!(WorkflowState::Result.is_valid_transition(&WorkflowState::SimulatorHome));
}

#[test]
fn test_state_machine_invalid_transitions() {
    // Cannot skip directly from Idle into active TestScene
    assert!(!WorkflowState::Idle.is_valid_transition(&WorkflowState::TestScene));
    // Cannot jump from Home directly to Results without running tests
    assert!(!WorkflowState::SimulatorHome.is_valid_transition(&WorkflowState::Result));
    // Cannot jump backwards from Loading to Home directly
    assert!(!WorkflowState::TestLoading.is_valid_transition(&WorkflowState::SimulatorHome));
}

#[test]
fn test_emergency_stop_mechanism() {
    assert!(!is_emergency_stopped());
    trigger_emergency_stop();
    assert!(is_emergency_stopped());
    reset_emergency_stop();
    assert!(!is_emergency_stopped());
}

#[test]
fn test_default_simulator_workflow() {
    let wf = get_default_workflow();
    assert_eq!(wf.steps.len(), 6);
    assert_eq!(wf.steps[0].expected_state, "SIMULATOR_HOME");
    assert_eq!(wf.steps[1].expected_state, "SIMULATOR_MENU");
    assert_eq!(wf.steps[2].expected_state, "SCENARIO_PREVIEW");
    assert_eq!(wf.steps[3].expected_state, "TEST_LOADING");
    assert_eq!(wf.steps[4].expected_state, "TEST_SCENE");
    assert_eq!(wf.steps[5].expected_state, "RESULT");

    for step in &wf.steps {
        assert!(step.minimum_confidence >= 75.0);
        assert!(step.timeout_ms >= 5000);
        assert!(!step.required_phrases.is_empty());
    }
}

#[test]
fn test_safety_guard_rejections() {
    let approved = vec!["Simulator".to_string(), "Desktop Vision".to_string()];

    // Handle 0 is invalid
    let res = validate_safety_guards(0, &approved);
    assert!(res.is_err());
    let err_msg = res.unwrap_err();
    assert!(err_msg.contains("Safety violation") || err_msg.contains("no longer exists") || is_emergency_stopped());
}
