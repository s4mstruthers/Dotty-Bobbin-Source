// The line under every pay / book button linking the Terms and the Refund & Cancellation Policy,
// so they're in front of people before they pay (Wix's hosted checkout can't show them itself).
export default function PolicyNote({ verb = "booking", className = "mt-3" }: { verb?: string; className?: string }) {
  const link = "underline decoration-blush decoration-2 underline-offset-4";
  return (
    <p className={`${className} text-xs text-muted-foreground`}>
      By {verb} you agree to our{" "}
      <a href="/terms" target="_blank" className={link}>Terms &amp; Conditions</a> and{" "}
      <a href="/refunds" target="_blank" className={link}>Refund &amp; Cancellation Policy</a>.
    </p>
  );
}
