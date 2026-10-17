import { getDataSource } from '../infrastructure/database/data-source.js';
import { seedDatabase } from '../infrastructure/database/seeder.js';
import { runBookingRulesUnitTests, TestResult } from './booking-rules.test.js';
import { runApiIntegrationTests } from './api.test.js';
import { runConcurrencyTests } from './concurrency.test.js';

export async function runAllTests(): Promise<{
  summary: { total: number; passed: number; failed: number };
  results: TestResult[];
}> {
  const dataSource = await getDataSource();
  await seedDatabase(dataSource);

  const unitResults = runBookingRulesUnitTests();
  const apiResults = await runApiIntegrationTests(dataSource);
  const concurrencyResults = await runConcurrencyTests(dataSource);

  const allResults = [...unitResults, ...apiResults, ...concurrencyResults];
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  return {
    summary: {
      total: allResults.length,
      passed,
      failed,
    },
    results: allResults,
  };
}

// CLI runner if executed directly
if (process.argv[1]?.endsWith('run-all-tests.ts') || process.argv[1]?.endsWith('run-all-tests.js')) {
  (async () => {
    console.log('\n======================================================');
    console.log('   Running Meeting Room Booking System Test Suite');
    console.log('======================================================\n');

    try {
      const { summary, results } = await runAllTests();

      let currentSuite = '';
      for (const res of results) {
        if (res.suite !== currentSuite) {
          currentSuite = res.suite;
          console.log(`\n--- ${currentSuite} ---`);
        }
        const symbol = res.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`  ${symbol} [${res.durationMs}ms] ${res.name}`);
        if (!res.passed && res.error) {
          console.log(`       Error: ${res.error}`);
        }
      }

      console.log('\n======================================================');
      console.log(
        `Results: ${summary.passed}/${summary.total} passed (${summary.failed} failed)`
      );
      console.log('======================================================\n');

      if (summary.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (e) {
      console.error('Fatal test error:', e);
      process.exit(1);
    }
  })();
}
