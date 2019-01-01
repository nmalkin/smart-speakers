/**
 * This module handles error reporting if something went wrong.
 */

import * as Sentry from '@sentry/browser';
import { getStoredDevEnvironmentStatus } from './debug';

let reportErrors = false;

export function reportError(err) {
    if (reportErrors) {
        Sentry.captureException(err);
    }
    console.error(err);
}

export function reportIssue(message: string) {
    if (reportErrors) {
        Sentry.captureMessage(message);
    }
    console.warn(message);
}

export function addMetadata(description, data) {
    if (reportErrors) {
        Sentry.addBreadcrumb({
            message: description,
            data
        });
    }
}

export async function reportExecutionTime(
    name: string,
    actions: () => Promise<any>
) {
    const startTime = performance.now();
    await actions();
    const endTime = performance.now();
    const elapsed = endTime - startTime;
    const message = `Timer: ${name} took ${elapsed} milliseconds`;

    if (reportErrors) {
        Sentry.withScope(scope => {
            scope.setFingerprint([`timer: ${name}`]);
            Sentry.captureMessage(message, Sentry.Severity.Info);
        });
    }
    console.log(message);
}

interface MochaTest {
    title: string;
    err: Error;
}

function reportTestFailure(test: MochaTest) {
    if (reportErrors) {
        Sentry.withScope(scope => {
            scope.setFingerprint([`test failure: ${test.title}`]);
            scope.setTag('test.title', test.title);
            Sentry.captureException(test.err);
        });
    }
}

export async function initErrorHandling() {
    if (await getStoredDevEnvironmentStatus()) {
        console.log(
            'Extension is running in development environment; error reporting disabled.'
        );
    } else {
        reportErrors = true;
        Sentry.init({
            dsn: 'https://a249ee4ef05c47ffbc321a063b6d334d@sentry.io/1355815'
        });
    }

    // Allow content scripts to directly report errors via the window object
    // This is used by our patched Mocha library, which runs in a separate context.
    // tslint:disable-next-line: no-string-literal
    window['reportTestFailure'] = reportTestFailure;
}
