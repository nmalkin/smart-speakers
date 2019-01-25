import { ValidationResult, VerificationState } from './types';

/**
 * Check the current user's eligibility for the study.
 * If validation failed, then that status is preserved.
 * If validation succeeded but the user is ineligible, their status is updated.
 */
export function checkEligibility(result: ValidationResult): void {
    if (result.status !== VerificationState.loggedIn) {
        // Validation failed, so we keep the status as-is.
        // Then the appropriate error message can be displayed to the user.
        return;
    }

    // Check eligibility
    // A user is eligible if they have:
    // 1) At least 30 recordings
    if (
        !result.interactions ||
        !Array.isArray(result.interactions) ||
        result.interactions.length < 30
    ) {
        result.status = VerificationState.ineligible;
        return;
    }

    // 2) Had the device for at least 30 days
    const oldestInteraction = result.interactions
        .map(interaction => interaction.timestamp)
        .sort()[0];
    const elapsedMilliseconds = Date.now() - oldestInteraction;
    const elapsedDays = elapsedMilliseconds / (1000 * 60 * 60 * 24);
    if (elapsedDays < 30) {
        result.status = VerificationState.ineligible;
        return;
    }
    // Good news! Validation succeeded.
}
