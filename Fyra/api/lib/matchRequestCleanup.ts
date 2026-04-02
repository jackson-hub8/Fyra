/** Where clause to delete all directed match requests touching any of these emails. */

export function matchRequestsInvolvingEmails(emails: string[]) {
  return {
    OR: [{ fromEmail: { in: emails } }, { toEmail: { in: emails } }],
  };
}
