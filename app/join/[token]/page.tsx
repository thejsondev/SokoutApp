import { JoinPageClient } from "./JoinPageClient";

export function generateStaticParams() {
  return [{ token: "__" }];
}

export default function JoinPage() {
  return <JoinPageClient />;
}
