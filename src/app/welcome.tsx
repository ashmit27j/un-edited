import { Redirect } from 'expo-router';

/** The app's first screen is the welcome step of onboarding. */
export default function WelcomeRoute() {
  return <Redirect href="/onboarding" />;
}
