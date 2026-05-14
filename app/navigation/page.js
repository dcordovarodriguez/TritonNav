import { Suspense } from "react";
import NavigationClient from "@/app/navigation/NavigationClient";

export default function NavigationPage() {
  return (
    <Suspense
      fallback={
        <main className="page-stack">
          <section className="section-block">
            <p className="eyebrow">Navigation</p>
            <h1>Loading route...</h1>
          </section>
        </main>
      }
    >
      <NavigationClient />
    </Suspense>
  );
}
