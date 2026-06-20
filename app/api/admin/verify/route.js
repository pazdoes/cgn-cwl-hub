// Checks an officer PIN without triggering a refresh. Used by the frontend
// to unlock "officer mode" (i.e. show the refresh control) without burning
// a cache revalidation just to check the PIN.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const pin = body?.pin || "";

  const valid = Boolean(process.env.OFFICER_PIN) && pin === process.env.OFFICER_PIN;

  return Response.json({ valid });
}
