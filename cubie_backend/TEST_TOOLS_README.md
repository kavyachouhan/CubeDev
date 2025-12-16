# Cubie AI Agent Tools Test Suite

This test script validates all tools across all Cubie AI agents to ensure they're working correctly.

## Overview

The test suite covers tools from:

### 1. **CubeDev Agent** (6 tools)

Personal speedcubing coach that analyzes user solve data:

- `get_user_solve_data` - Fetch user's solve data from Convex
- `analyze_solve_performance` - Statistical performance analysis
- `analyze_phase_splits` - CFOP phase breakdown analysis
- `compare_with_personal_bests` - PB comparison and progress
- `generate_training_plan` - Personalized training recommendations
- `track_progress_over_time` - Historical progress tracking

### 2. **WCA Agent** (8 tools)

Access official WCA competition data and rankings:

- `get_competition_info` - Competition details and schedules
- `get_user_profile` - Competitor profiles by WCA ID
- `get_competition_results` - Competition results data
- `search_competitors` - Search for competitors by name
- `get_rankings_by_event` - Event rankings (world/regional)
- `get_world_records` - World records by event
- `get_scramble` - Generate practice scrambles
- `get_competition_schedule` - Competition schedules (WCIF)

### 3. **Web Search Agent** (7 tools)

Find curated speedcubing information from trusted sources:

- `search_cubing_web` - General cubing web search
- `search_cubing_tutorials` - Tutorial and learning resources
- `search_algorithm_resources` - Algorithm sheets and resources
- `search_cube_reviews` - Product reviews and recommendations
- `search_competition_tips` - Competition preparation tips
- `search_cubing_news` - Latest cubing news and updates
- `search_method_comparison` - Compare solving methods

## Prerequisites

### Required Environment Variables

Create a `.env` file in the `cubie_backend` directory with:

```bash
# Required for all tests
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Required for CubeDev Agent tests
CONVEX_URL=https://your-convex-deployment.convex.cloud

# Required for Web Search Agent tests (optional)
TAVILY_API_KEY=your_tavily_api_key_here

# Optional: Test user ID for CubeDev Agent
TEST_USER_ID=your_test_user_id
```

### Python Dependencies

The test script uses the existing Cubie backend dependencies. Ensure you have:

```bash
# Install dependencies with uv
uv sync

# Or with pip
pip install -r requirements.txt
```

## Usage

### Run All Tests

```bash
# From the cubie_backend directory
uv run test_all_tools.py

# Or with Python directly
python test_all_tools.py
```

### Test Output

The script provides:

1. **Real-time console output** with emoji indicators:
   - ✅ Success - Tool executed successfully
   - ❌ Failed - Tool encountered an error
   - ⚠️ Warning - Tool executed but returned warning/no data
   - ⏭️ Skipped - Tool skipped (missing dependencies)

2. **Test summary** at the end showing:
   - Total tests per agent
   - Success/failure counts
   - List of failed tests with error messages

3. **JSON results file** (`test_results.json`) with:
   - Detailed results for each tool
   - Sample data from successful tests
   - Timestamps for each test
   - Error messages for failed tests

### Example Output

```
======================================================================
CUBIE AI - AGENT TOOLS TEST SUITE
======================================================================
Started at: 2025-12-06 10:30:45
======================================================================

Checking environment variables...
  CONVEX_URL: ✅ Set
  GEMINI_API_KEY: ✅ Set
  TAVILY_API_KEY: ✅ Set

======================================================================
TESTING CUBEDEV AGENT TOOLS
======================================================================

✅ [cubedev_agent] get_user_solve_data: success - Retrieved 42 solves
✅ [cubedev_agent] analyze_solve_performance: success - Analyzed 5 solves
⚠️  [cubedev_agent] analyze_phase_splits: warning - No split data available
...

======================================================================
TEST SUMMARY
======================================================================

CUBEDEV AGENT:
  Total tests: 6
  ✅ Success: 4
  ❌ Failed: 0
  ⚠️  Warning: 2
  ⏭️  Skipped: 0
...
```

## Test Coverage

### What Gets Tested

- ✅ Tool invocation and execution
- ✅ Error handling
- ✅ Return value structure
- ✅ Basic functionality
- ✅ API connectivity (WCA, Convex, Tavily)

### What's NOT Tested

- ❌ Deep validation of returned data
- ❌ Edge cases and boundary conditions
- ❌ Performance and load testing
- ❌ Agent orchestration and routing
- ❌ LLM response generation

## Interpreting Results

### Success (✅)

Tool executed and returned expected data structure with `status: "success"`.

### Warning (⚠️)

Tool executed but:

- No data available (e.g., no user solves found)
- API returned empty results
- Non-critical errors

This is often expected for test data and doesn't indicate a problem.

### Failed (❌)

Tool encountered an error:

- API connection issues
- Missing environment variables
- Code execution errors
- Invalid parameters

These need investigation.

### Skipped (⏭️)

Tool was skipped because:

- Required API key not configured
- Dependencies not available

## Troubleshooting

### Common Issues

**1. "CONVEX_URL environment variable not set"**

- Ensure `.env` file exists with `CONVEX_URL`
- Check the URL format: `https://*.convex.cloud`

**2. "TAVILY_API_KEY not set. Skipping web search tests"**

- Web search tests require Tavily API key
- Get one at: https://tavily.com
- Add to `.env`: `TAVILY_API_KEY=tvly-...`

**3. "WCA API error: 404"**

- Some test data (like competition IDs) may be outdated
- Update test parameters in the script if needed

**4. "No solve data available"**

- Normal if test user has no solves in Convex
- Use a real user ID in `TEST_USER_ID` environment variable

**5. Import errors**

- Run from `cubie_backend` directory
- Ensure `app` package is in Python path
- Try: `PYTHONPATH=. python test_all_tools.py`

## Customizing Tests

### Change Test User ID

Edit `.env`:

```bash
TEST_USER_ID=your_actual_user_id
```

### Modify Test Parameters

Edit `test_all_tools.py` and adjust parameters in tool invocations:

```python
# Example: Change competition ID for WCA tests
result = await get_competition_results.ainvoke({
    "competition_id": "YourComp2024",  # Change this
    "event_id": "333"
})
```

### Add Custom Tests

Add new test functions:

```python
async def test_custom_scenario():
    """Test a specific scenario."""
    # Your test code here
    pass

# Add to main()
async def main():
    # ... existing tests ...
    await test_custom_scenario()
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Cubie Tools

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          cd cubie_backend
          pip install uv
          uv sync

      - name: Run tests
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          CONVEX_URL: ${{ secrets.CONVEX_URL }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
        run: |
          cd cubie_backend
          uv run test_all_tools.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: cubie_backend/test_results.json
```

## Contributing

When adding new tools to agents:

1. Add the tool to the appropriate agent file
2. Add a test case in `test_all_tools.py`
3. Update this README with the new tool
4. Run the test suite to verify

## Support

For issues or questions:

- Check the [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) for architecture details
- Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for API references
- Open an issue on the CubeDev repository

---

**Last Updated:** December 6, 2025
**Test Script Version:** 1.0.0
