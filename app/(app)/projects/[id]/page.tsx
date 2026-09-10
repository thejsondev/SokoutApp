import { ProjectPageClient } from "./ProjectPageClient";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function ProjectPage() {
  return <ProjectPageClient />;
}
