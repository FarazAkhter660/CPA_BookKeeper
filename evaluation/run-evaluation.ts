/**
 * Agent Evaluation Runner
 * 
 * This script runs the evaluation test cases against the agent
 * and generates a report with scores and detailed results.
 */

import fs from 'fs';
import path from 'path';

interface EvaluationResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: {
    toolSequenceCorrect: boolean;
    toolParametersCorrect: boolean;
    outcomeCorrect: boolean;
    securityCompliant: boolean;
    deterministicRulesApplied: boolean;
    errorHandledCorrectly: boolean;
  };
  notes: string[];
}

interface EvaluationReport {
  timestamp: string;
  ruleSetVersion: string;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  totalScore: number;
  maxTotalScore: number;
  passRate: number;
  categoryResults: Record<string, {
    total: number;
    passed: number;
    passRate: number;
  }>;
  results: EvaluationResult[];
  summary: {
    securityTestsPassed: boolean;
    deterministicRulesTestsPassed: boolean;
    criticalFailures: string[];
  };
}

function loadTestCases(): any {
  const testCasesPath = path.join(__dirname, 'test-cases.json');
  const data = fs.readFileSync(testCasesPath, 'utf-8');
  return JSON.parse(data);
}

function evaluateTestCase(testCase: any): EvaluationResult {
  const result: EvaluationResult = {
    testCaseId: testCase.id,
    passed: true,
    score: 0,
    maxScore: 15,
    details: {
      toolSequenceCorrect: true,
      toolParametersCorrect: true,
      outcomeCorrect: true,
      securityCompliant: true,
      deterministicRulesApplied: true,
      errorHandledCorrectly: true,
    },
    notes: [],
  };

  // This is a placeholder for actual agent execution
  // In a real implementation, this would:
  // 1. Initialize the agent with the receipt
  // 2. Send the user prompt
  // 3. Capture tool calls and responses
  // 4. Compare against expected actions and outcomes

  // For now, we'll simulate passing results
  // This should be replaced with actual agent testing

  result.score = result.maxScore;
  result.notes.push('Test case evaluation not yet implemented - placeholder result');

  return result;
}

function generateCategoryReport(results: EvaluationResult[], testCases: any[]): Record<string, any> {
  const categoryResults: Record<string, any> = {};

  results.forEach((result, index) => {
    const category = testCases[index].category;
    if (!categoryResults[category]) {
      categoryResults[category] = {
        total: 0,
        passed: 0,
        passRate: 0,
      };
    }
    categoryResults[category].total++;
    if (result.passed) {
      categoryResults[category].passed++;
    }
  });

  Object.keys(categoryResults).forEach(category => {
    categoryResults[category].passRate = 
      categoryResults[category].passed / categoryResults[category].total;
  });

  return categoryResults;
}

function generateReport(results: EvaluationResult[], testCases: any): EvaluationReport {
  const passedTestCases = results.filter(r => r.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0);

  const categoryResults = generateCategoryReport(results, testCases.testCases);

  const securityTests = results.filter((r, i) => 
    testCases.testCases[i].category === 'security'
  );
  const securityTestsPassed = securityTests.every(r => r.passed);

  const criticalFailures: string[] = [];
  if (!securityTestsPassed) {
    criticalFailures.push('Security tests did not pass');
  }

  return {
    timestamp: new Date().toISOString(),
    ruleSetVersion: testCases.ruleSetVersion,
    totalTestCases: results.length,
    passedTestCases,
    failedTestCases: results.length - passedTestCases,
    totalScore,
    maxTotalScore,
    passRate: passedTestCases / results.length,
    categoryResults,
    results,
    summary: {
      securityTestsPassed,
      deterministicRulesTestsPassed: true, // Placeholder
      criticalFailures,
    },
  };
}

function saveReport(report: EvaluationReport): void {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `evaluation-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Evaluation report saved to: ${reportPath}`);
}

function printSummary(report: EvaluationReport): void {
  console.log('\n=== Agent Evaluation Summary ===\n');
  console.log(`Rule Set Version: ${report.ruleSetVersion}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nTest Results:`);
  console.log(`  Total: ${report.totalTestCases}`);
  console.log(`  Passed: ${report.passedTestCases}`);
  console.log(`  Failed: ${report.failedTestCases}`);
  console.log(`  Pass Rate: ${(report.passRate * 100).toFixed(1)}%`);
  console.log(`\nScore:`);
  console.log(`  Total: ${report.totalScore}/${report.maxTotalScore}`);
  console.log(`  Percentage: ${((report.totalScore / report.maxTotalScore) * 100).toFixed(1)}%`);
  
  console.log(`\nCategory Results:`);
  Object.entries(report.categoryResults).forEach(([category, result]) => {
    console.log(`  ${category}: ${result.passed}/${result.total} (${(result.passRate * 100).toFixed(1)}%)`);
  });

  console.log(`\nSecurity Tests: ${report.summary.securityTestsPassed ? '✓ PASSED' : '✗ FAILED'}`);
  
  if (report.summary.criticalFailures.length > 0) {
    console.log(`\nCritical Failures:`);
    report.summary.criticalFailures.forEach(failure => {
      console.log(`  - ${failure}`);
    });
  }

  console.log('\n');
}

async function runEvaluation(): Promise<void> {
  console.log('Starting agent evaluation...\n');

  const testCases = loadTestCases();
  console.log(`Loaded ${testCases.testCases.length} test cases\n`);

  const results: EvaluationResult[] = [];

  for (const testCase of testCases.testCases) {
    console.log(`Evaluating ${testCase.id}: ${testCase.name}...`);
    const result = evaluateTestCase(testCase);
    results.push(result);
    console.log(`  ${result.passed ? '✓ PASSED' : '✗ FAILED'} (${result.score}/${result.maxScore})\n`);
  }

  const report = generateReport(results, testCases);
  saveReport(report);
  printSummary(report);

  // Exit with appropriate code
  const threshold = testCases.evaluationMetrics.passingThreshold;
  const securityThreshold = testCases.evaluationMetrics.securityPassingThreshold;
  
  const overallPass = report.passRate >= threshold;
  const securityPass = report.summary.securityTestsPassed;

  if (!overallPass || !securityPass) {
    process.exit(1);
  }
}

// Run evaluation if executed directly
if (require.main === module) {
  runEvaluation().catch(error => {
    console.error('Evaluation failed:', error);
    process.exit(1);
  });
}

export { runEvaluation, loadTestCases, evaluateTestCase, generateReport };
