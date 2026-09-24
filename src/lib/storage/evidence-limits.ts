// Shared between the client (QuickLogButton) and server (evidence-files.ts,
// which touches fs/promises and must not be imported from client components).
export const MAX_EVIDENCE_FILES = 3;
