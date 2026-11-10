import { Suspense } from "react";
import { currentUser } from "@riverpen/auth";

async function UserDetails() {
  const user = await currentUser();

  return user ? (
    <div
      style={{
        background: "#F3F4F6",
        padding: "16px",
        borderRadius: "8px"
      }}
    >
      <h3>Authenticated User Payload:</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  ) : (
    <p>No user session detected.</p>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Protected Dashboard Area</h1>

      <p>This route is protected by RiverPen Auth.</p>

      <Suspense fallback={<p>Loading user session...</p>}>
        <UserDetails />
      </Suspense>
    </div>
  );
}
