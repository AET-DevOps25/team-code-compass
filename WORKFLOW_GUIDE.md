# 🚀 FlexFit Development Workflow Guide

## 📋 Branch Strategy

### Current Setup
- **main**: Production-ready code (not used as default)
- **development**: Main development branch (should be set as default)
- **feature/***: Feature branches for new work

## 🔄 CI/CD Pipeline Strategy

### ✅ What Triggers CI/CD
- **Push to feature branches**: `feature/*` → Unit + Integration tests
- **Push to development**: Full pipeline (Unit + Integration + System tests)
- **Push to main**: Full pipeline + Build & Package
- **Pull Requests**: Unit + Integration tests
- **Manual trigger**: Choose test level (unit-only, integration-only, system-only, quick, full)

### 🧪 Test Levels by Branch Type

| Branch Type | Unit Tests | Integration Tests | System Tests | Build & Package |
|-------------|------------|------------------|--------------|-----------------|
| feature/*   | ✅         | ✅               | ⏭️           | ⏭️              |
| development | ✅         | ✅               | ✅           | ⏭️              |
| main        | ✅         | ✅               | ✅           | ✅              |
| PR          | ✅         | ✅               | ⏭️           | ⏭️              |

## 🌊 Recommended Workflow

### 1. Feature Development
```bash
# Create feature branch from development
git checkout development
git pull origin development
git checkout -b feature/your-feature-name

# Make your changes
# CI/CD will run unit + integration tests automatically

# Push to test CI/CD
git push -u origin feature/your-feature-name
```

### 2. Testing CI/CD Changes
- ✅ **Feature branches**: Perfect for testing CI/CD changes
- ✅ **Fast feedback**: Only unit + integration tests
- ✅ **Safe**: Won't affect main development workflow

### 3. Merging to Development
```bash
# Create PR from feature branch to development
# CI/CD will run full validation
# After approval, merge to development
```

### 4. Release to Production
```bash
# Create PR from development to main
# Full pipeline including system tests and build
# Deploy from main branch
```

## 🔧 Manual Testing Options

You can manually trigger the pipeline with different test levels:

1. Go to GitHub Actions tab
2. Select "FlexFit CI/CD Pipeline"
3. Click "Run workflow"
4. Choose test level:
   - **unit-only**: Just unit tests (fastest)
   - **integration-only**: Just integration tests
   - **system-only**: Just system tests
   - **quick**: Unit + Integration (good for feature testing)
   - **full**: All tests (complete validation)

## 🎯 Key Benefits

### For Feature Branches
- **Fast feedback**: ~5-10 minutes instead of 20-30 minutes
- **Safe testing**: Test CI/CD changes without affecting main workflow
- **Early detection**: Catch issues before they reach development

### For Development/Main
- **Full validation**: Complete test suite ensures quality
- **Automated builds**: Ready-to-deploy artifacts
- **Comprehensive reporting**: Full test coverage

## 🚨 Important Notes

1. **Never push directly to development/main** - Always use feature branches
2. **Test CI/CD changes on feature branches first**
3. **Use manual triggers for debugging specific test levels**
4. **Feature branches are perfect for iterating on CI/CD improvements**

## 📊 Current Status

✅ **CI/CD Pipeline**: Single, comprehensive workflow
✅ **Java 21**: Aligned with service configurations  
✅ **Feature Branch Support**: Safe testing environment
✅ **Unit Tests**: All passing with proper database isolation
✅ **Integration Tests**: Service communication validated
✅ **System Tests**: End-to-end workflow verification

## 🔗 Next Steps

1. **Set development as default branch** (GitHub settings)
2. **Create PR from feature branch to development**
3. **Test the full pipeline**
4. **Merge to development when ready**

---

*This workflow ensures safe, efficient development while maintaining high code quality through automated testing.* 