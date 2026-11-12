import { Landing } from "../components/Landing";
export function LandingPage({ onStart }: { onStart: () => void }) {
  return <Landing onStart={onStart} />;
}
