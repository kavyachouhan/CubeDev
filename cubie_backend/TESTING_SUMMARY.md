# 🧪 Cubie AI Testing Suite - Complete Package

## 📦 What's Included

This testing suite provides comprehensive testing for all Cubie AI agent tools:

### Test Scripts

1. **`test_all_tools.py`** - Full comprehensive test suite
   - Tests all 21 tools across all agents
   - Detailed logging and reporting
   - JSON output for CI/CD integration
   - ~2-3 minutes runtime

2. **`test_quick.py`** - Quick smoke test
   - Tests 5 critical tools
   - Fast validation (~30 seconds)
   - Perfect for development workflow
   - Returns exit codes for automation

3. **`run_tests.py`** - Interactive test runner
   - Menu-driven interface
   - Environment validation
   - Easy test selection

### Documentation

1. **`TEST_TOOLS_README.md`** - Comprehensive testing guide
   - Setup instructions
   - Usage examples
   - Troubleshooting
   - CI/CD integration

2. **`TOOLS_REFERENCE.md`** - Complete tools reference
   - All 21 tools documented
   - Usage examples
   - Parameter details
   - Return value structures

---

## 🚀 Quick Start

### 1. Setup Environment

Create `.env` file:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
CONVEX_URL=https://your-deployment.convex.cloud
TAVILY_API_KEY=your_tavily_key  # Optional
TEST_USER_ID=test_user_id       # Optional
```

### 2. Install Dependencies

```bash
cd cubie_backend
uv sync
```

### 3. Run Tests

**Option A: Interactive Menu**

```bash
uv run run_tests.py
```

**Option B: Quick Test**

```bash
uv run test_quick.py
```

**Option C: Full Test**

```bash
uv run test_all_tools.py
```

---

## 📊 Tool Coverage

### CubeDev Agent (6 tools) ✅

- ✅ get_user_solve_data
- ✅ analyze_solve_performance
- ✅ analyze_phase_splits
- ✅ compare_with_personal_bests
- ✅ generate_training_plan
- ✅ track_progress_over_time

### WCA Agent (8 tools) ✅

- ✅ get_competition_info
- ✅ get_user_profile
- ✅ get_competition_results
- ✅ search_competitors
- ✅ get_rankings_by_event
- ✅ get_world_records
- ✅ get_scramble
- ✅ get_competition_schedule

### Web Search Agent (7 tools) ✅

- ✅ search_cubing_web
- ✅ search_cubing_tutorials
- ✅ search_algorithm_resources
- ✅ search_cube_reviews
- ✅ search_competition_tips
- ✅ search_cubing_news
- ✅ search_method_comparison

**Total: 21 tools tested**

---

## 📁 File Structure

```
cubie_backend/
├── test_all_tools.py          # Full test suite
├── test_quick.py              # Quick smoke test
├── run_tests.py               # Interactive runner
├── TEST_TOOLS_README.md       # Testing guide
├── TOOLS_REFERENCE.md         # Tools documentation
├── TESTING_SUMMARY.md         # This file
├── test_results.json          # Generated: test results
└── app/
    └── agents/
        ├── cubedev_agent.py
        ├── wca_agent.py
        ├── web_search_agent.py
        └── router_agent.py
```

---

## 🎯 Common Use Cases

### Development Workflow

```bash
# Before committing changes
uv run test_quick.py

# If quick test passes, run full test
uv run test_all_tools.py
```

### CI/CD Pipeline

```bash
# In GitHub Actions or similar
uv run test_all_tools.py
# Check exit code and test_results.json
```

### Debugging Specific Agent

```bash
# Run full test, filter results
uv run test_all_tools.py
# Check test_results.json for specific agent
```

### API Validation

```bash
# After deploying new Convex functions
uv run test_all_tools.py
# Verify CubeDev agent tests pass
```

---

## 🔍 Reading Test Results

### Console Output

```
✅ Success - Tool works correctly
❌ Failed  - Tool error, needs investigation
⚠️  Warning - Tool works but no data (often OK for test data)
⏭️  Skipped - Missing dependencies (e.g., no API key)
```

### JSON Output (`test_results.json`)

```json
{
  "cubedev_agent": [
    {
      "tool": "get_user_solve_data",
      "status": "success",
      "message": "Retrieved 42 solves",
      "timestamp": "2025-12-06T10:30:45.123Z",
      "sample_data": {...}
    }
  ],
  "timestamp": "2025-12-06T10:30:45.000Z"
}
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue            | Solution                                |
| ---------------- | --------------------------------------- |
| Import errors    | Run from `cubie_backend/` directory     |
| Missing API keys | Add to `.env` file                      |
| No user data     | Normal for test users, use real user ID |
| WCA 404 errors   | Test competition IDs may be outdated    |
| Tavily errors    | Check API key and rate limits           |

### Debug Mode

Add to test scripts:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 📈 Success Criteria

### Quick Test

- ✅ 80%+ pass rate (4/5 tests)
- ⚠️ 60-79% pass rate (3/5 tests)
- ❌ <60% pass rate (0-2/5 tests)

### Full Test

- ✅ 85%+ pass rate (18+/21 tests)
- ⚠️ 70-84% pass rate (15-17/21 tests)
- ❌ <70% pass rate (<15/21 tests)

Note: Some warnings are expected for test data (e.g., no user solves)

---

## 🔄 Maintenance

### Adding New Tools

1. Add tool to agent file
2. Import in `test_all_tools.py`
3. Add test case in appropriate function
4. Update documentation:
   - `TOOLS_REFERENCE.md`
   - This file (update counts)
5. Run tests to verify

### Updating Test Data

Edit test parameters in `test_all_tools.py`:

```python
# Example: Change WCA ID for testing
result = await get_user_profile.ainvoke({
    "wca_id": "YOUR_TEST_WCA_ID"
})
```

---

## 📞 Support Resources

- **Architecture:** See `SYSTEM_DOCUMENTATION.md`
- **API Reference:** See `QUICK_REFERENCE.md`
- **Tools Details:** See `TOOLS_REFERENCE.md`
- **Testing Guide:** See `TEST_TOOLS_README.md`

---

## ✅ Pre-Release Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Full test suite passes (85%+)
- [ ] No critical failures (❌)
- [ ] WCA API accessible
- [ ] Convex connection working
- [ ] Tavily API working (if used)
- [ ] Test with real user data
- [ ] Review `test_results.json`
- [ ] Check all warning messages
- [ ] Verify API rate limits

---

## 🎓 Testing Best Practices

1. **Run quick test frequently** - Fast feedback loop
2. **Run full test before commits** - Catch regressions
3. **Check warnings** - May indicate configuration issues
4. **Use real test data** - Better validation than mocks
5. **Monitor API rates** - Avoid hitting limits
6. **Update tests with tools** - Keep tests current
7. **Review JSON output** - Detailed insights
8. **Test on clean environment** - Catch dependency issues

---

## 📊 Test Metrics

Target metrics for test suite:

- **Coverage:** 100% of tools (21/21)
- **Runtime:** <3 minutes (full), <30s (quick)
- **Success Rate:** 85%+ expected
- **Reliability:** No flaky tests
- **Documentation:** 100% of tools documented

---

## 🚢 Deployment Integration

### GitHub Actions Example

```yaml
- name: Test Cubie Tools
  run: uv run test_all_tools.py
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    CONVEX_URL: ${{ secrets.CONVEX_URL }}

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: cubie_backend/test_results.json
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

cd cubie_backend
uv run test_quick.py

if [ $? -ne 0 ]; then
    echo "❌ Quick tests failed. Commit aborted."
    exit 1
fi
```

---

## 📝 Version History

- **v1.0.0** (2025-12-06)
  - Initial test suite
  - 21 tools covered
  - 3 test scripts
  - Complete documentation

---

## 🎉 Summary

This testing suite provides:

✅ **Comprehensive Coverage** - All 21 tools tested  
✅ **Multiple Test Modes** - Quick, full, interactive  
✅ **Clear Documentation** - Setup, usage, troubleshooting  
✅ **Easy Integration** - CI/CD ready  
✅ **Developer Friendly** - Fast feedback, clear output  
✅ **Production Ready** - Validation before deployment

---

**Ready to test? Run:** `uv run run_tests.py`

---

_Last Updated: December 6, 2025_  
_Version: 1.0.0_  
_Cubie AI Testing Suite_
