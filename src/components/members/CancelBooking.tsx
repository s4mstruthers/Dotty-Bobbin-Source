// Confirm step for cancelling one of the member's bookings. States the no-refund rule from
// Saskia's Terms & Conditions (section 2) before anything happens.
import { useState } from "react";
import { changeBooking, whenLabel } from "../../wix/account/client";
import type { AccountBooking } from "../../wix/account/types";

export default function CancelBooking({ booking, onDone, onClose }: { booking: AccountBooking; onDone: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await changeBooking({ action: "cancel", bookingId: booking.id });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-md bg-blush-soft p-4 text-sm" role="group" aria-label="Cancel booking">
      <p className="font-semibold">Cancel {booking.serviceName} on {whenLabel(booking.startIso)}?</p>
      <p className="mt-1">
        Bookings are non-refundable (see the <a href="/policies" className="underline">Terms &amp; Conditions</a>). If you'd rather keep your place for
        another day, use <span className="font-semibold">Change time</span> instead.
      </p>
      {error && <p className="mt-2 font-semibold text-destructive">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={busy} onClick={() => void confirm()}>
          {busy ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button type="button" className="link-pill" disabled={busy} onClick={onClose}>
          Keep my booking
        </button>
      </div>
    </div>
  );
}
