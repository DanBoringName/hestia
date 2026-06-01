import { describe, expect, it } from 'vitest';
import { UserId } from './user.js';
import {
  ExpertiseVerification,
  InvalidVerificationError,
} from './expertise-verification.js';

describe('ExpertiseVerification.unverified', () => {
  it('is the self-asserted, unverified state', () => {
    const verification = ExpertiseVerification.unverified();

    expect(verification.method).toBe('unverified');
    expect(verification.isVerified).toBe(false);
  });
});

describe('ExpertiseVerification.byEmailDomain', () => {
  it('trims the institution and lower-cases the email domain', () => {
    const verification = ExpertiseVerification.byEmailDomain({
      institution: '  University of Cambridge  ',
      emailDomain: 'Cam.AC.uk',
    });

    expect(verification.method).toBe('email-domain');
    expect(verification.isVerified).toBe(true);
    const details = verification.match({
      unverified: () => null,
      emailDomain: (d) => d,
      manualReview: () => null,
    });
    expect(details).toEqual({ institution: 'University of Cambridge', emailDomain: 'cam.ac.uk' });
  });

  it('rejects an empty institution or email domain', () => {
    expect(() =>
      ExpertiseVerification.byEmailDomain({ institution: '  ', emailDomain: 'cam.ac.uk' }),
    ).toThrow(InvalidVerificationError);
    expect(() =>
      ExpertiseVerification.byEmailDomain({ institution: 'Cambridge', emailDomain: '  ' }),
    ).toThrow(InvalidVerificationError);
  });
});

describe('ExpertiseVerification.byManualReview', () => {
  it('carries the reviewer and a trimmed evidence reference', () => {
    const reviewerId = UserId('usr_admin');
    const verification = ExpertiseVerification.byManualReview({
      reviewerId,
      evidenceRef: '  evidence/diploma-42.pdf  ',
    });

    expect(verification.method).toBe('manual-review');
    expect(verification.isVerified).toBe(true);
    const details = verification.match({
      unverified: () => null,
      emailDomain: () => null,
      manualReview: (d) => d,
    });
    expect(details).toEqual({ reviewerId, evidenceRef: 'evidence/diploma-42.pdf' });
  });

  it('rejects an empty evidence reference', () => {
    expect(() =>
      ExpertiseVerification.byManualReview({ reviewerId: UserId('usr_admin'), evidenceRef: '   ' }),
    ).toThrow(InvalidVerificationError);
  });
});

describe('ExpertiseVerification equality', () => {
  it('treats same-method, same-detail verifications as equal', () => {
    const a = ExpertiseVerification.byEmailDomain({ institution: 'NIH', emailDomain: 'nih.gov' });
    const b = ExpertiseVerification.byEmailDomain({ institution: 'NIH', emailDomain: 'NIH.gov' });

    expect(a.equals(b)).toBe(true);
    expect(ExpertiseVerification.unverified().equals(ExpertiseVerification.unverified())).toBe(
      true,
    );
  });

  it('distinguishes different methods or details', () => {
    const emailDomain = ExpertiseVerification.byEmailDomain({
      institution: 'NIH',
      emailDomain: 'nih.gov',
    });
    const manual = ExpertiseVerification.byManualReview({
      reviewerId: UserId('usr_admin'),
      evidenceRef: 'ref',
    });

    expect(emailDomain.equals(manual)).toBe(false);
    expect(emailDomain.equals(ExpertiseVerification.unverified())).toBe(false);
    expect(
      emailDomain.equals(
        ExpertiseVerification.byEmailDomain({ institution: 'MIT', emailDomain: 'mit.edu' }),
      ),
    ).toBe(false);
  });
});

describe('InvalidVerificationError', () => {
  it('carries a validation code and category', () => {
    const error = new InvalidVerificationError('institution is empty');

    expect(error.code).toBe('INVALID_VERIFICATION');
    expect(error.category).toBe('validation');
  });
});
