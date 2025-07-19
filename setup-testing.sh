#!/bin/bash

# FlexFit Testing Environment Setup
# Makes all test scripts executable and installs dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 FlexFit Testing Environment Setup${NC}"
echo "===================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install missing dependencies
install_dependencies() {
    echo -e "\n${YELLOW}📦 Checking dependencies...${NC}"
    
    local missing_deps=()
    
    # Check required tools
    if ! command_exists docker; then
        missing_deps+=("docker")
    else
        echo "✅ Docker: $(docker --version)"
    fi
    
    if ! command_exists "docker compose" && ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    else
        if command_exists "docker compose"; then
            echo "✅ Docker Compose: $(docker compose version)"
        else
            echo "✅ Docker Compose: $(docker-compose --version)"
        fi
    fi
    
    if ! command_exists java; then
        missing_deps+=("java")
    else
        echo "✅ Java: $(java -version 2>&1 | head -n1)"
    fi
    
    if ! command_exists mvn; then
        missing_deps+=("maven")
    else
        echo "✅ Maven: $(mvn --version | head -n1)"
    fi
    
    if ! command_exists python3; then
        missing_deps+=("python3")
    else
        echo "✅ Python: $(python3 --version)"
    fi
    
    if ! command_exists jq; then
        missing_deps+=("jq")
    else
        echo "✅ jq: $(jq --version)"
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "\n${RED}❌ Missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  - ${RED}$dep${NC}"
        done
        
        echo -e "\n${YELLOW}💡 Installation instructions:${NC}"
        echo "Ubuntu/Debian:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y docker.io docker-compose openjdk-17-jdk maven python3 python3-pip jq"
        echo ""
        echo "macOS:"
        echo "  brew install docker docker-compose openjdk@17 maven python3 jq"
        echo ""
        echo "Please install missing dependencies and run this script again."
        exit 1
    fi
    
    echo -e "${GREEN}✅ All system dependencies are installed${NC}"
}

# Function to install Python dependencies
install_python_deps() {
    echo -e "\n${YELLOW}🐍 Installing Python test dependencies...${NC}"
    
    local python_deps=("pytest" "pytest-cov" "requests" "fastapi" "httpx")
    
    for dep in "${python_deps[@]}"; do
        if python3 -c "import $dep" 2>/dev/null; then
            echo "✅ $dep already installed"
        else
            echo "📦 Installing $dep..."
            pip3 install "$dep" --user
        fi
    done
    
    # Install GenAI worker dependencies if requirements.txt exists
    if [ -f "genai/requirements.txt" ]; then
        echo "📦 Installing GenAI worker dependencies..."
        pip3 install -r genai/requirements.txt --user
    fi
    
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
}

# Function to make scripts executable
make_scripts_executable() {
    echo -e "\n${YELLOW}🔨 Making test scripts executable...${NC}"
    
    local scripts=(
        "run-all-tests.sh"
        "run-unit-tests.sh" 
        "run-integration-tests.sh"
        "test-endpoints.sh"
        "setup-testing.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            echo "✅ Made $script executable"
        else
            echo "⚠️  $script not found"
        fi
    done
    
    echo -e "${GREEN}✅ Test scripts are now executable${NC}"
}

# Function to create test directories
create_test_directories() {
    echo -e "\n${YELLOW}📁 Creating test directories...${NC}"
    
    mkdir -p test-reports
    mkdir -p test-data
    
    echo "✅ Created test-reports directory"
    echo "✅ Created test-data directory"
    
    echo -e "${GREEN}✅ Test directories created${NC}"
}

# Function to verify setup
verify_setup() {
    echo -e "\n${YELLOW}🔍 Verifying setup...${NC}"
    
    # Check if Docker is running
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker daemon is running"
    else
        echo -e "${YELLOW}⚠️  Docker daemon is not running. Please start Docker.${NC}"
    fi
    
    # Check if test scripts are executable
    local executable_count=0
    for script in run-all-tests.sh run-unit-tests.sh run-integration-tests.sh; do
        if [ -x "$script" ]; then
            executable_count=$((executable_count + 1))
        fi
    done
    
    echo "✅ $executable_count test scripts are executable"
    
    # Check Python test dependencies
    if python3 -c "import pytest" 2>/dev/null; then
        echo "✅ Python testing framework is ready"
    else
        echo "❌ Python testing framework setup failed"
    fi
    
    echo -e "${GREEN}✅ Setup verification complete${NC}"
}

# Function to show usage examples
show_usage_examples() {
    echo -e "\n${BLUE}📖 Usage Examples${NC}"
    echo "=================="
    echo ""
    echo "Run all tests:"
    echo -e "  ${GREEN}./run-all-tests.sh${NC}"
    echo ""
    echo "Run only unit tests:"
    echo -e "  ${GREEN}./run-unit-tests.sh${NC}"
    echo ""
    echo "Run only integration tests:"
    echo -e "  ${GREEN}./run-integration-tests.sh${NC}"
    echo ""
    echo "Run all tests with coverage and reports:"
    echo -e "  ${GREEN}./run-all-tests.sh -a -c -r${NC}"
    echo ""
    echo "Manual API endpoint testing:"
    echo -e "  ${GREEN}./test-endpoints.sh${NC}"
    echo ""
    echo "Clean environment and run all tests:"
    echo -e "  ${GREEN}./run-all-tests.sh --clean -a${NC}"
    echo ""
    echo -e "For more options, run: ${GREEN}./run-all-tests.sh --help${NC}"
}

# Main execution
main() {
    install_dependencies
    install_python_deps
    make_scripts_executable
    create_test_directories
    verify_setup
    
    echo -e "\n${GREEN}🎉 Testing environment setup complete!${NC}"
    
    show_usage_examples
    
    echo -e "\n${BLUE}💡 Next Steps:${NC}"
    echo "1. Start your services: docker compose up -d"
    echo "2. Run tests: ./run-all-tests.sh"
    echo "3. Check test reports in: test-reports/"
    
    echo -e "\n${GREEN}Happy testing! 🚀${NC}"
}

# Check if running as script or sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 