/**
 * Phone number validation utility for Indian mobile numbers.
 * Uses a fast regex pre-check followed by libphonenumber-js for accurate validation.
 */
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
    isValid: boolean;
    error?: string;
    /** E.164 normalized form, e.g. "+919876543210" */
    normalized?: string;
}

/**
 * Validate an international mobile phone number.
 *
 * - Strips whitespace, dashes, dots, and parentheses
 * - Rejects obviously non-numeric inputs
 * - Parses with libphonenumber-js dynamically based on defaultCountry
 * - Ensures the number is a MOBILE type
 * - Returns E.164 normalized string on success
 */
export function validatePhoneNumber(value: string, defaultCountry: CountryCode = 'IN'): PhoneValidationResult {
    if (!value || !value.trim()) {
        return { isValid: false, error: 'Mobile number is required' };
    }

    // Strip spaces, dashes, dots, parentheses
    const cleaned = value.replace(/[\s\-().]/g, '');

    // Reject non-numeric characters (except leading +)
    if (!/^\+?\d+$/.test(cleaned)) {
        return { isValid: false, error: 'Only digits are allowed (optionally prefixed with +)' };
    }

    // Full validation with libphonenumber-js
    const phone = parsePhoneNumberFromString(cleaned, defaultCountry);
    if (!phone || !phone.isValid()) {
        return { isValid: false, error: 'Please enter a valid mobile number' };
    }

    // Ensure it's a mobile number type
    const phoneType = phone.getType();
    if (phoneType && phoneType !== 'MOBILE' && phoneType !== 'FIXED_LINE_OR_MOBILE') {
        return { isValid: false, error: 'Please enter a valid mobile number, not a landline' };
    }

    return {
        isValid: true,
        normalized: phone.format('E.164'),  // e.g. "+919876543210" or "+447911123456"
    };
}

/**
 * Validate phone number only if a value is provided (for optional fields).
 * Returns valid if empty/blank.
 */
export function validateOptionalPhoneNumber(value: string, defaultCountry: CountryCode = 'IN'): PhoneValidationResult {
    if (!value || !value.trim()) {
        return { isValid: true };
    }
    return validatePhoneNumber(value, defaultCountry);
}

/**
 * Strip non-phone characters from input, keeping only digits and a leading +.
 * Use this in onChange handlers to sanitize input.
 */
export function sanitizePhoneInput(value: string): string {
    // Allow + only at the start
    const first = value.charAt(0);
    const rest = value.slice(1).replace(/[^\d]/g, '');
    if (first === '+') {
        return '+' + rest;
    }
    return (first.replace(/[^\d]/g, '') + rest);
}

/**
 * Format a phone number for display cleanly based on standard lengths or E.164.
 * Uses libphonenumber-js directly if valid, falling back to soft formatting.
 */
export function formatPhoneDisplay(value: string, defaultCountry: CountryCode = 'IN'): string {
    const cleaned = value.replace(/[\s\-().]/g, '');
    const phone = parsePhoneNumberFromString(cleaned, defaultCountry);
    
    if (phone && phone.isValid()) {
        return phone.formatInternational(); // E.g., "+44 7911 123456" or "+91 98765 43210"
    }
    
    // Fallback if somewhat invalid but user typed digits
    return value;
}
