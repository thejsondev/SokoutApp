"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";

export function TicketRatingForm({
  ticketId,
  onSubmitted,
}: {
  ticketId: number;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) return;

    setPending(true);
    setError(null);
    try {
      await api(`/tickets/${ticketId}/ratings`, {
        method: "POST",
        body: {
          rating,
          comment: comment.trim() || null,
        },
      });
      setHiding(true);
      window.setTimeout(onSubmitted, 320);
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Bewertung konnte nicht gesendet werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`mt-4 w-full max-w-sm transition-opacity duration-300 ${hiding ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <p className="text-center text-sm font-medium text-neutral-700 dark:text-neutral-200">
        Wie war die Erledigung?
      </p>
      <div className="mt-2 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = value <= (hover || rating);
          return (
            <button
              key={value}
              type="button"
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="rounded-full p-1"
              aria-label={`${value} von 5`}
            >
              <Star
                className={`h-7 w-7 ${
                  active ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-600"
                }`}
              />
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional: kurzer Kommentar"
        rows={2}
        className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      />
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || rating < 1}
        className="mt-3 w-full rounded-full bg-[#3CB346] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Senden..." : "Bewertung senden"}
      </button>
    </form>
  );
}
