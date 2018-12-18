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
}
