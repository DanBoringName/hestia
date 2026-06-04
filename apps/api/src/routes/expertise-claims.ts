import type {
  ClaimExpertise,
  RevokeExpertiseVerification,
  VerifyExpertise,
} from '@hestia/application';
import type { ExpertiseClaim } from '@hestia/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// INTERIM: userId is the acting user, taken from the body until Better Auth
// supplies it from the session.
const claimBody = z.object({
  userId: z.string(),
  tag: z.string(),
});

const verificationBody = z.discriminatedUnion('method', [
  z.object({ method: z.literal('email-domain'), institution: z.string(), emailDomain: z.string() }),
  z.object({ method: z.literal('manual-review'), reviewerId: z.string(), evidenceRef: z.string() }),
]);

type SerializedVerification =
  | { method: 'unverified' }
  | { method: 'email-domain'; institution: string; emailDomain: string }
  | { method: 'manual-review'; reviewerId: string; evidenceRef: string };

function serialize(claim: ExpertiseClaim) {
  const verification = claim.verification.match<SerializedVerification>({
    unverified: () => ({ method: 'unverified' }),
    emailDomain: (d) => ({ method: 'email-domain', institution: d.institution, emailDomain: d.emailDomain }),
    manualReview: (d) => ({ method: 'manual-review', reviewerId: d.reviewerId, evidenceRef: d.evidenceRef }),
  });

  return {
    id: claim.id,
    userId: claim.userId,
    tag: claim.tag.value,
    verified: claim.isVerified,
    verification,
    claimedAt: claim.claimedAt.toISOString(),
    verifiedAt: claim.verifiedAt?.toISOString() ?? null,
  };
}

export function registerExpertiseClaimRoutes(
  app: FastifyInstance,
  claimExpertise: ClaimExpertise,
  verifyExpertise: VerifyExpertise,
  revokeExpertiseVerification: RevokeExpertiseVerification,
): void {
  app.post('/expertise-claims', async (request, reply) => {
    const parsed = claimBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    const claim = await claimExpertise.execute(parsed.data);
    return reply.status(201).send(serialize(claim));
  });

  app.post<{ Params: { id: string } }>('/expertise-claims/:id/verification', async (request, reply) => {
    const parsed = verificationBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body.', details: parsed.error.issues },
      });
    }

    const claim = await verifyExpertise.execute({
      claimId: request.params.id,
      verification: parsed.data,
    });
    return reply.status(200).send(serialize(claim));
  });

  app.delete<{ Params: { id: string } }>('/expertise-claims/:id/verification', async (request, reply) => {
    const claim = await revokeExpertiseVerification.execute({ claimId: request.params.id });
    return reply.status(200).send(serialize(claim));
  });
}
