export default function AuthServiceUnavailable() {
    return (
        <div role="alert" className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <h1 className="font-heading text-xl font-semibold">We couldn&apos;t verify your session</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                The authentication service is temporarily unavailable. Please try again in a moment.
            </p>
        </div>
    );
}