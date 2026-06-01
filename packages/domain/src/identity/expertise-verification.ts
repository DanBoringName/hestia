import { DomainError } from '../shared/domain-error.js';
import type { UserId } from './user.js';

export type VerificationMethod = 'unverified' | 'email-domain' | 'manual-review';

interface UnverifiedState {
  readonly method: 'unverified';
}

interface EmailDomainState {
  readonly method: 'email-domain';
  readonly institution: string;
  readonly emailDomain: string;
}

interface ManualReviewState {
  readonly method: 'manual-review';
  readonly reviewerId: UserId;
  readonly evidenceRef: string;
}

type VerificationState = UnverifiedState | EmailDomainState | ManualReviewState;

export interface VerificationMatchers<T> {
  readonly unverified: () => T;
  readonly emailDomain: (details: { readonly institution: string; readonly emailDomain: string }) => T;
  readonly manualReview: (details: { readonly reviewerId: UserId; readonly evidenceRef: string }) => T;
}

export class InvalidVerificationError extends DomainError {
  readonly code = 'INVALID_VERIFICATION';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`Invalid verification: ${reason}.`);
  }
}

/**
 * How (and whether) an {@link ExpertiseClaim} has been verified. A closed set
 * of methods today — self-asserted, institutional email domain, or human review
 * of uploaded evidence. ORCID is a future variant: add a state and a matcher
 * branch; the rest of the API is unaffected.
 *
 * Distinct from account email confirmation, which is an auth-adapter concern.
 */
export class ExpertiseVerification {
  private constructor(private readonly state: VerificationState) {}

  static unverified(): ExpertiseVerification {
    return new ExpertiseVerification({ method: 'unverified' });
  }

  static byEmailDomain(props: {
    institution: string;
    emailDomain: string;
  }): ExpertiseVerification {
    const institution = props.institution.trim();
    const emailDomain = props.emailDomain.trim().toLowerCase();

    if (institution.length === 0) {
      throw new InvalidVerificationError('institution is empty');
    }
    if (emailDomain.length === 0) {
      throw new InvalidVerificationError('email domain is empty');
    }

    return new ExpertiseVerification({ method: 'email-domain', institution, emailDomain });
  }

  static byManualReview(props: {
    reviewerId: UserId;
    evidenceRef: string;
  }): ExpertiseVerification {
    const evidenceRef = props.evidenceRef.trim();

    if (evidenceRef.length === 0) {
      throw new InvalidVerificationError('evidence reference is empty');
    }

    return new ExpertiseVerification({
      method: 'manual-review',
      reviewerId: props.reviewerId,
      evidenceRef,
    });
  }

  get method(): VerificationMethod {
    return this.state.method;
  }

  get isVerified(): boolean {
    return this.state.method !== 'unverified';
  }

  /** Exhaustively handle each verification method — used at the boundary to render badges or serialize. */
  match<T>(matchers: VerificationMatchers<T>): T {
    switch (this.state.method) {
      case 'unverified':
        return matchers.unverified();
      case 'email-domain':
        return matchers.emailDomain({
          institution: this.state.institution,
          emailDomain: this.state.emailDomain,
        });
      case 'manual-review':
        return matchers.manualReview({
          reviewerId: this.state.reviewerId,
          evidenceRef: this.state.evidenceRef,
        });
    }
  }

  equals(other: ExpertiseVerification): boolean {
    const a = this.state;
    const b = other.state;

    if (a.method === 'unverified' || b.method === 'unverified') {
      return a.method === b.method;
    }
    if (a.method === 'email-domain' && b.method === 'email-domain') {
      return a.institution === b.institution && a.emailDomain === b.emailDomain;
    }
    if (a.method === 'manual-review' && b.method === 'manual-review') {
      return a.reviewerId === b.reviewerId && a.evidenceRef === b.evidenceRef;
    }
    return false;
  }
}
