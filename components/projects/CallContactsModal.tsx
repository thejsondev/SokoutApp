"use client";

import { Phone, X } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import type { ApiUser } from "@/lib/types";

export type CallContact = {
  user: ApiUser;
  role: Role;
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function initials(user: ApiUser): string {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}

export function CallContactsModal({
  open,
  contacts,
  onClose,
}: {
  open: boolean;
  contacts: CallContact[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Anrufen</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Kontakt auswählen</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="rounded-[24px] bg-neutral-50 px-4 py-5 text-center text-sm text-neutral-500 dark:bg-neutral-950">
            Keine Telefonnummer hinterlegt.
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map(({ user, role }) => (
              <a
                key={`${role}-${user.id}`}
                href={telHref(user.phone!)}
                className="flex items-center gap-3 rounded-[24px] border border-neutral-100 bg-neutral-50 px-4 py-3.5 transition hover:border-[#3CB346]/40 hover:bg-[#3CB346]/5 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-[#3CB346]/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3CB346]/12 text-sm font-semibold text-[#2e9a38]">
                  {initials(user)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-neutral-900 dark:text-white">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">{ROLE_LABELS[role]}</span>
                  <span className="mt-1 block text-sm text-[#2e9a38]">{user.phone}</span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-white">
                  <Phone className="h-5 w-5" />
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
