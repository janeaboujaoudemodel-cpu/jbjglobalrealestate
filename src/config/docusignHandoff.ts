// Centralized DocuSign handoff config — clients sign in DocuSign (the only
// e-signature platform officially recognised by UAE government authorities)
// and email the signed PDF back to JBJ. Keep all wording / links here so the
// public sign page, outbound emails and templates stay in sync.

export const DOCUSIGN_APP_STORE =
  "https://apps.apple.com/app/docusign/id474990205";
export const DOCUSIGN_PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.docusign.ink";
// Web entry — production sign-in surface. `apps.docusign.com` was loading
// to a long blank page; `account.docusign.com` resolves instantly and
// universal-links into the installed app on iOS/Android.
export const DOCUSIGN_WEB = "https://account.docusign.com/";
export const DOCUSIGN_SIGNUP = "https://account.docusign.com/signup";

// Inbox monitored by the contracts team for inbound signed PDFs.
export const SIGNED_RETURN_EMAIL = "contracts@jbj.ae";

export const DOCUSIGN_HANDOFF_NOTICE =
  "This agreement must be signed using DocuSign — the only e-signature platform officially recognised by UAE authorities. If you don't have the app, download it from the App Store or Google Play, open the attached PDF inside DocuSign, complete the signature, then email the signed copy back to " +
  SIGNED_RETURN_EMAIL +
  ".";
