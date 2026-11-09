use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorkflowState {
    Idle,
    SimulatorHome,
    SimulatorMenu,
    ScenarioPreview,
    TestLoading,
    TestScene,
    Result,
    Completed,
    Unknown,
    Error,
}

impl WorkflowState {
    pub fn as_str(&self) -> &'static str {
        match self {
            WorkflowState::Idle => "IDLE",
            WorkflowState::SimulatorHome => "SIMULATOR_HOME",
            WorkflowState::SimulatorMenu => "SIMULATOR_MENU",
            WorkflowState::ScenarioPreview => "SCENARIO_PREVIEW",
            WorkflowState::TestLoading => "TEST_LOADING",
            WorkflowState::TestScene => "TEST_SCENE",
            WorkflowState::Result => "RESULT",
            WorkflowState::Completed => "COMPLETED",
            WorkflowState::Unknown => "UNKNOWN",
            WorkflowState::Error => "ERROR",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "IDLE" => WorkflowState::Idle,
            "SIMULATOR_HOME" => WorkflowState::SimulatorHome,
            "SIMULATOR_MENU" => WorkflowState::SimulatorMenu,
            "SCENARIO_PREVIEW" => WorkflowState::ScenarioPreview,
            "TEST_LOADING" => WorkflowState::TestLoading,
            "TEST_SCENE" => WorkflowState::TestScene,
            "RESULT" => WorkflowState::Result,
            "COMPLETED" => WorkflowState::Completed,
            "ERROR" => WorkflowState::Error,
            _ => WorkflowState::Unknown,
        }
    }

    pub fn is_valid_transition(&self, target: &WorkflowState) -> bool {
        match (self, target) {
            (WorkflowState::Idle, WorkflowState::SimulatorHome) => true,
            (WorkflowState::SimulatorHome, WorkflowState::SimulatorMenu) => true,
            (WorkflowState::SimulatorMenu, WorkflowState::ScenarioPreview) => true,
            (WorkflowState::ScenarioPreview, WorkflowState::TestLoading) => true,
            (WorkflowState::TestLoading, WorkflowState::TestScene) => true,
            (WorkflowState::TestScene, WorkflowState::Result) => true,
            (WorkflowState::Result, WorkflowState::Completed) => true,
            (WorkflowState::Result, WorkflowState::SimulatorHome) => true,
            (WorkflowState::Completed, WorkflowState::Idle) => true,
            (WorkflowState::Completed, WorkflowState::SimulatorHome) => true,
            (_, WorkflowState::Error) => true,
            _ => false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub id: Option<i64>,
    pub workflow_id: Option<i64>,
    pub step_order: i32,
    pub name: String,
    pub expected_state: String,
    pub required_phrases: Vec<String>,
    pub minimum_confidence: f32,
    pub timeout_ms: u64,
    pub retry_limit: i32,
    pub simulator_action: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub steps: Vec<WorkflowStep>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

pub fn get_default_workflow() -> Workflow {
    Workflow {
        id: Some(1),
        name: "Standard Simulator Verification".to_string(),
        description: "Validates local simulator through Home -> Menu -> Preview -> Loading -> Test Scene -> Result".to_string(),
        enabled: true,
        steps: vec![
            WorkflowStep {
                id: Some(1),
                workflow_id: Some(1),
                step_order: 1,
                name: "Verify Home Screen".to_string(),
                expected_state: "SIMULATOR_HOME".to_string(),
                required_phrases: vec!["Start Test".to_string()],
                minimum_confidence: 80.0,
                timeout_ms: 10000,
                retry_limit: 3,
                simulator_action: Some("CLICK_START_TEST".to_string()),
                notes: Some("Checks Home screen and triggers test start in simulator".to_string()),
            },
            WorkflowStep {
                id: Some(2),
                workflow_id: Some(1),
                step_order: 2,
                name: "Select Scenario".to_string(),
                expected_state: "SIMULATOR_MENU".to_string(),
                required_phrases: vec!["Find Test Scenario".to_string()],
                minimum_confidence: 80.0,
                timeout_ms: 10000,
                retry_limit: 3,
                simulator_action: Some("CLICK_FIND_SCENARIO".to_string()),
                notes: Some("Confirms scenario selection menu".to_string()),
            },
            WorkflowStep {
                id: Some(3),
                workflow_id: Some(1),
                step_order: 3,
                name: "Preview Test Environment".to_string(),
                expected_state: "SCENARIO_PREVIEW".to_string(),
                required_phrases: vec!["Begin Test".to_string()],
                minimum_confidence: 80.0,
                timeout_ms: 10000,
                retry_limit: 3,
                simulator_action: Some("CLICK_BEGIN_TEST".to_string()),
                notes: Some("Previews scene and launches test execution".to_string()),
            },
            WorkflowStep {
                id: Some(4),
                workflow_id: Some(1),
                step_order: 4,
                name: "Wait for Preparation".to_string(),
                expected_state: "TEST_LOADING".to_string(),
                required_phrases: vec!["Preparing test scenario".to_string()],
                minimum_confidence: 75.0,
                timeout_ms: 15000,
                retry_limit: 5,
                simulator_action: None,
                notes: Some("Observes loading state without clicking".to_string()),
            },
            WorkflowStep {
                id: Some(5),
                workflow_id: Some(1),
                step_order: 5,
                name: "Interact Safe Scene Area".to_string(),
                expected_state: "TEST_SCENE".to_string(),
                required_phrases: vec!["Safe Interaction Area".to_string()],
                minimum_confidence: 80.0,
                timeout_ms: 15000,
                retry_limit: 3,
                simulator_action: Some("CLICK_SCENE_TARGET".to_string()),
                notes: Some("Simulates interaction only inside marked safe zone".to_string()),
            },
            WorkflowStep {
                id: Some(6),
                workflow_id: Some(1),
                step_order: 6,
                name: "Verify Results".to_string(),
                expected_state: "RESULT".to_string(),
                required_phrases: vec!["Test Completed".to_string(), "Return Home".to_string()],
                minimum_confidence: 80.0,
                timeout_ms: 10000,
                retry_limit: 3,
                simulator_action: Some("CLICK_RETURN_HOME".to_string()),
                notes: Some("Records completion metrics and returns to initial state".to_string()),
            },
        ],
        created_at: Some(chrono::Utc::now().to_rfc3339()),
        updated_at: Some(chrono::Utc::now().to_rfc3339()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_state_transitions() {
        assert!(WorkflowState::Idle.is_valid_transition(&WorkflowState::SimulatorHome));
        assert!(WorkflowState::SimulatorHome.is_valid_transition(&WorkflowState::SimulatorMenu));
        assert!(WorkflowState::SimulatorMenu.is_valid_transition(&WorkflowState::ScenarioPreview));
        assert!(WorkflowState::ScenarioPreview.is_valid_transition(&WorkflowState::TestLoading));
        assert!(WorkflowState::TestLoading.is_valid_transition(&WorkflowState::TestScene));
        assert!(WorkflowState::TestScene.is_valid_transition(&WorkflowState::Result));
        assert!(WorkflowState::Result.is_valid_transition(&WorkflowState::Completed));
    }

    #[test]
    fn test_invalid_state_transitions() {
        assert!(!WorkflowState::Idle.is_valid_transition(&WorkflowState::TestScene));
        assert!(!WorkflowState::SimulatorHome.is_valid_transition(&WorkflowState::Result));
        assert!(!WorkflowState::TestLoading.is_valid_transition(&WorkflowState::SimulatorHome));
    }

    #[test]
    fn test_default_workflow_integrity() {
        let wf = get_default_workflow();
        assert_eq!(wf.steps.len(), 6);
        assert_eq!(wf.steps[0].expected_state, "SIMULATOR_HOME");
        assert_eq!(wf.steps[5].expected_state, "RESULT");
    }
}
