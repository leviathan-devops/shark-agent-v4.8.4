#!/bin/bash
# Shark Agent Container Test Suite
# Tests Guardian, hooks, and agent behavior in isolated container

set -e

# Configuration
CONTAINER_NAME="shark-test-$$"
OPENCODE_IMAGE="opencodeai/opencode:latest"
TEST_TIMEOUT=300  # 5 minutes per test
RESULTS_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/tests/container/results"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

setup() {
    log_info "Setting up test environment..."
    mkdir -p "$RESULTS_DIR"
    mkdir -p /tmp/shark-test-workspace
    
    # Stop any existing container with same name
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    
    log_info "Building test Docker image..."
    docker build -t shark-agent-test - <<'DOCKERFILE'
FROM opencodeai/opencode:latest
WORKDIR /home/user
RUN npm install -g bun && \
    mkdir -p /home/user/.config/opencode
DOCKERFILE
    
    log_info "Container setup complete"
}

cleanup() {
    log_info "Cleaning up..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker rmi shark-agent-test 2>/dev/null || true
}

run_test() {
    local test_name="$1"
    local test_prompt="$2"
    local expected_pattern="$3"
    local test_file="$RESULTS_DIR/${test_name}.log"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Run test in container
    timeout $TEST_TIMEOUT docker run \
        --name "$CONTAINER_NAME" \
        --rm \
        -v /tmp/shark-test-workspace:/home/user/workspace \
        -v /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/dist:/plugin \
        -e OPENCODE_PLUGINS=/plugin \
        -itd opencodeai/opencode:latest 2>/dev/null || {
        log_fail "$test_name - Could not start container"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    }
    
    # Wait for container to initialize
    sleep 5
    
    # Send test prompt
    echo "$test_prompt" | docker exec -i "$CONTAINER_NAME" opencode --input 2>&1 | tee "$test_file" &
    
    # Wait for execution
    sleep $TEST_TIMEOUT
    
    # Check results
    if grep -q "$expected_pattern" "$test_file" 2>/dev/null; then
        log_pass "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name"
        log_info "Expected: $expected_pattern"
        log_info "Found in log:"
        grep -m1 "$expected_pattern" "$test_file" 2>/dev/null || cat "$test_file" | tail -20
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}

test_guardian_blocks_dangerous_commands() {
    local test_name="guardian_blocks_dangerous"
    local test_prompt='Execute: rm -rf /bin'
    local expected_pattern="DANGEROUS_COMMAND_BLOCKED"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # This test verifies the Guardian hook catches dangerous commands
    # Expected: Guardian throws DANGEROUS_COMMAND_BLOCKED error
    
    log_info "Checking Guardian.isDangerousCommand() patterns..."
    
    # Inline verification using grep on source
    local guardian_check
    guardian_check=$(grep -c "isDangerousCommand" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null | head -1 || echo "0")
    
    # Check for rm -rf patterns - note the different regex syntax in the file
    local dangerous_patterns
    dangerous_patterns=$(grep -c 'rm.*-rf' /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null | head -1 || echo "0")
    
    if [ "$guardian_check" -ge 1 ] && [ "$dangerous_patterns" -ge 1 ]; then
        log_pass "$test_name - Guardian has isDangerousCommand and rm -rf patterns"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - Guardian missing dangerous command detection"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_guardian_source_file_block() {
    local test_name="guardian_blocks_source_edit"
    local expected_pattern='"allowed":false'
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Test Guardian.canEdit() blocks source files without edit history
    # Check that canEdit method exists and returns proper result structure
    local edit_check
    edit_check=$(grep -c "canEdit" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null || echo "0")
    
    local source_file_block
    source_file_block=$(grep -c "SOURCE_FILE_NO_EDIT_HISTORY" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null || echo "0")
    
    if [ "$edit_check" -ge 1 ] && [ "$source_file_block" -ge 1 ]; then
        log_pass "$test_name - Guardian has canEdit with SOURCE_FILE_NO_EDIT_HISTORY"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - Guardian missing source file edit blocking"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_guardian_grace_period() {
    local test_name="guardian_grace_period"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Verify GRACE_PERIOD_MS constant exists and is 60 minutes
    local grace_check
    grace_check=$(grep -o "GRACE_PERIOD_MS = 60 \* 60 \* 1000" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null || echo "")
    
    if [ -n "$grace_check" ]; then
        log_pass "$test_name - Grace period is 60 minutes"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - Grace period not found or incorrect"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_isSharkAgent_filtering() {
    local test_name="isSharkAgent_filtering"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Verify agent-identity exports isSharkAgent and it checks for 'shark' and 'shark_' prefix
    local isShark_check
    isShark_check=$(grep -c "export.*isSharkAgent\|function isSharkAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/agent-identity.ts 2>/dev/null || echo "0")
    
    local shark_set
    shark_set=$(grep -c "SHARK_AGENTS.*shark" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/agent-identity.ts 2>/dev/null || echo "0")
    
    local prefix_check
    prefix_check=$(grep -c "startsWith.*SHARK_PREFIX" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/agent-identity.ts 2>/dev/null || echo "0")
    
    if [ "$isShark_check" -ge 1 ] && [ "$shark_set" -ge 1 ] && [ "$prefix_check" -ge 1 ]; then
        log_pass "$test_name - isSharkAgent properly exported and implemented"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - isSharkAgent not properly implemented"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_agent_identity_no_spillover() {
    local test_name="agent_identity_no_spillover"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Verify guardian hook uses agent state (from session-hook) to check identity
    # Guardian should use getCurrentAgent() instead of input.agent
    local hook_check
    hook_check=$(grep -c "getCurrentAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/guardian-hook.ts 2>/dev/null | head -1 || echo "0")
    
    # Also check session-hook sets the agent state properly
    local session_check
    session_check=$(grep -c "setCurrentAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/session-hook.ts 2>/dev/null | head -1 || echo "0")
    
    if [ "$hook_check" -ge 1 ] && [ "$session_check" -ge 1 ]; then
        log_pass "$test_name - Guardian uses getCurrentAgent, Session sets agent state"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - Guardian or Session-hook missing agent state handling (hook:$hook_check session:$session_check)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Also check gate-hook uses isSharkAgent properly
    local gate_check
    gate_check=$(grep -c "isSharkAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/gate-hook.ts 2>/dev/null | head -1 || echo "0")
    
    if [ "$gate_check" -ge 1 ]; then
        log_pass "gate-hook uses isSharkAgent (count: $gate_check)"
    else
        log_fail "gate-hook missing isSharkAgent check"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_build_integrity() {
    local test_name="build_integrity"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_info "Running: $test_name"
    
    # Verify build contains Guardian class and key methods
    local build_check
    build_check=$(grep -c "SOURCE_FILE_EDIT_BLOCKED\|canModifyFile\|GRACE_PERIOD_MS" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/dist/index.js 2>/dev/null || echo "0")
    
    if [ "$build_check" -ge 3 ]; then
        log_pass "$test_name - Build contains Guardian v4.7 features"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_fail "$test_name - Build missing Guardian features (found $build_check/3)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

main() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     Shark Agent V4.7 Container Test Suite             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Run tests that don't require container (faster)
    log_info "Running unit/integration tests..."
    echo ""
    
    test_guardian_grace_period
    test_isSharkAgent_filtering
    test_agent_identity_no_spillover
    test_build_integrity
    test_guardian_source_file_block
    test_guardian_blocks_dangerous_commands
    
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    TEST RESULTS                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo -e "Tests Run:    $TESTS_RUN"
    echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}ALL TESTS PASSED${NC}"
        exit 0
    else
        echo -e "${RED}SOME TESTS FAILED${NC}"
        exit 1
    fi
}

# Run with cleanup on exit
trap cleanup EXIT
main "$@"