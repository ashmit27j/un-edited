import { Redirect } from 'expo-router';

/** The landing page is web-only (landing-page.web.tsx). In the app, signed-out readers go to onboarding. */
export function LandingPage() {
  return <Redirect href="/onboarding" />;
}
