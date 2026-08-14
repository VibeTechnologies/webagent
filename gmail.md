# Gmail Send API (Short Technical Notes)

This document summarizes how email sending appears in Gmail, based on your HAR and the official API.

## 1) Official Gmail API (public, supported)

- **Endpoint:** `POST https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/send`
- **Auth:** OAuth 2.0 Bearer token
- **Scope:** `https://www.googleapis.com/auth/gmail.send` (or broader Gmail scopes)
- **Payload:** JSON with RFC 5322 message in base64url form:

```json
{
  "raw": "RnJvbTogbWUuLi4="
}
```

This is the supported integration path for apps/bots.

## 2) Gmail Web Client internal API (observed in HAR)

When sending from `mail.google.com` UI, the request in your capture is an **internal sync RPC**, not `gmail.googleapis.com`:

- **Send/state update call:**
  `POST https://mail.google.com/sync/u/0/i/s?hl=en&c=27&rt=r&pt=ji`
- **Follow-up fetch/details call:**
  `POST https://mail.google.com/sync/u/0/i/fd?hl=en&c=28&rt=r&pt=ji`

Observed payloads include recipient, subject, body, thread/message IDs, and Gmail label/state flags (for example sent/draft workflow flags).

## 3) Important implementation guidance

- Use **official Gmail API** for production integrations.
- Do **not** depend on `mail.google.com/sync/...` endpoints:
  - undocumented/internal
  - cookie/session bound
  - can change without notice
  - may break automation unexpectedly
