import { useState } from 'react';
import { api } from '../services/api';
import { TestSummary, TestResultItem } from '../types';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, Terminal, AlertTriangle } from 'lucide-react';

export function TestRunnerPanel() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const data = await api.runTests();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run test suite');
    } finally {
      setIsRunning(false);
    }
  };

  const groupedResults = summary?.results.reduce<Record<string, TestResultItem[]>>(
    (acc, item) => {
      if (!acc[item.suite]) acc[item.suite] = [];
      acc[item.suite].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Verification & Concurrency Test Runner
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Executes the pure unit test suite (including all 8 overlap table cases from the specification), API integration tests, and the simultaneous concurrency race test.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests Now'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span>You can also run tests from terminal:</span>
          <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
            npm test
          </code>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Test Suite Execution Error</div>
            <div className="text-rose-700 text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Total Test Cases</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {summary.summary.total}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <div className="text-xs text-emerald-700 font-medium">Passed</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              {summary.summary.passed}
            </div>
          </div>

          <div
            className={`bg-white p-4 rounded-xl border shadow-xs ${
              summary.summary.failed > 0
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-slate-200'
            }`}
          >
            <div
              className={`text-xs font-medium ${
                summary.summary.failed > 0 ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              Failed
            </div>
            <div
              className={`text-2xl font-bold mt-1 font-mono ${
                summary.summary.failed > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {summary.summary.failed}
            </div>
          </div>
        </div>
      )}

      {groupedResults && (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([suiteName, suiteTests]) => (
            <div
              key={suiteName}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
            >
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 tracking-wide">
                  {suiteName}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {suiteTests.filter((t) => t.passed).length}/{suiteTests.length} Passed
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {suiteTests.map((test, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div
                          className={`font-medium ${
                            test.passed ? 'text-slate-800' : 'text-rose-700'
                          }`}
                        >
                          {test.name}
                        </div>
                        {test.error && (
                          <div className="mt-1 p-2 bg-rose-50 rounded border border-rose-200 font-mono text-[11px] text-rose-800">
                            {test.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-slate-400 font-mono tabular-nums shrink-0">
                      {test.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!summary && !isRunning && !error && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">
            No test run initiated yet
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Click the button above to run the full test suite against this backend instance.
          </p>
          <button
            onClick={handleRunTests}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Run All Tests
          </button>
        </div>
      )}
    </div>
  );
}
