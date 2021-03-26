import {
  evaluate,
  evaluateAsync,
  interpreterList,
  InterpreterSpec,
  InterpreterSpecList,
} from '@orioro/expression'
import {
  testCases,
  asyncResult,
  valueLabel,
  resultLabel,
  TestCases,
} from '@orioro/jest-util'

const _ellipsis = (str: string, maxlen = 50): string =>
  str.length > maxlen ? str.substr(0, maxlen - 1).concat('...') : str

const _evLabel = ([value, expression], result) =>
  `${valueLabel(value)} | ${_ellipsis(valueLabel(expression))} -> ${resultLabel(
    result
  )}`

const delay = (value, ms = 100) =>
  new Promise((resolve) => setTimeout(resolve.bind(null, value), ms))

export const $asyncEcho: InterpreterSpec = {
  sync: null,
  async: (context, value) => delay(value),
}

/**
 * @function prepareEvaluateTestCases
 * @param {InterpreterSpecList} interpreterSpecs
 * @returns {Function}
 */
export const prepareEvaluateTestCases = (
  interpreterSpecs: InterpreterSpecList
): {
  (cases: TestCases): void
  testSyncCases(cases: TestCases): void
  testAsyncCases(cases: TestCases): void
} => {
  const interpreters = interpreterList(interpreterSpecs)

  const testSyncCases = (cases: TestCases): void => {
    testCases(
      cases,
      (value, expression) =>
        evaluate(
          {
            interpreters,
            scope: { $$VALUE: value },
          },
          expression
        ),
      ([value, expression], result) =>
        `sync - ${_evLabel([value, expression], result)}`
    )
  }

  const testAsyncCases = (cases: TestCases): void => {
    testCases(
      cases.map((_case) => {
        const result = _case[_case.length - 1]
        const args = _case.slice(0, -1)

        return [...args, asyncResult(result)]
      }),
      (value, expression) =>
        evaluateAsync(
          {
            interpreters,
            scope: { $$VALUE: value },
          },
          expression
        ),
      ([value, expression], result) =>
        `async - ${_evLabel([value, expression], result)}`
    )
  }

  const testSyncAndAsync = (cases: TestCases) => {
    testSyncCases(cases)
    testAsyncCases(cases)
  }

  testSyncAndAsync.testSyncCases = testSyncCases
  testSyncAndAsync.testAsyncCases = testAsyncCases

  return testSyncAndAsync
}
