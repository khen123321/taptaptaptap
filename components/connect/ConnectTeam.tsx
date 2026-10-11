"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Cpu,
  Crown,
  ExternalLink,
  Globe2,
  Mail,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  taptaptapTeam,
  type TeamMember,
  type TeamRoleKey,
} from "@/data/taptaptap-team";

const roleIcons: Record<TeamRoleKey, LucideIcon> = {
  founder: Crown,
  "web-developer": Code2,
  technical: Cpu,
};

const roleDescriptions: Record<TeamRoleKey, string> = {
  founder: "Vision, direction, partnerships, and business growth.",
  "web-developer": "Website experience, smart pages, and product interfaces.",
  technical: "Technical setup, operations, support, and NFC implementation.",
};

const socialLabels: Array<{
  key: keyof Pick<
    TeamMember,
    "portfolio" | "facebook" | "linkedin" | "github" | "instagram"
  >;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "portfolio", label: "Portfolio", icon: Globe2 },
  { key: "facebook", label: "Facebook", icon: ExternalLink },
  { key: "linkedin", label: "LinkedIn", icon: ExternalLink },
  { key: "github", label: "GitHub", icon: ExternalLink },
  { key: "instagram", label: "Instagram", icon: ExternalLink },
];

export function ConnectTeam() {
  const [selectedRole, setSelectedRole] = useState<TeamRoleKey>("founder");
  const selectedMember = useMemo(
    () =>
      taptaptapTeam.find((member) => member.roleKey === selectedRole) ??
      taptaptapTeam[0],
    [selectedRole],
  );

  return (
    <main className="theme-page relative min-h-dvh overflow-hidden px-4 py-3 sm:px-6 sm:py-5">
      <div className="connect-ambient" aria-hidden>
        <span className="connect-ambient-layer connect-ambient-layer-one" />
        <span className="connect-ambient-layer connect-ambient-layer-two" />
        <span className="connect-ambient-layer connect-ambient-layer-three" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col">
        <header className="flex items-center justify-between gap-3 py-1">
          <Link
            href="/connect"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border theme-border bg-[var(--surface)] px-3 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--accent)]" aria-hidden />
            Back to TapTapTap Connect
          </Link>
        </header>

        <section className="mt-3 rounded-[1.75rem] border theme-border bg-[var(--surface)] p-4 text-center shadow-[var(--shadow-soft)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] theme-accent">
            Meet the Team
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight theme-text sm:text-4xl">
            The People Behind TapTapTap
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 theme-text-secondary sm:text-base">
            Meet the people helping build, grow, and improve TapTapTap.
          </p>
        </section>

        <section className="mt-4" aria-label="Select a team role">
          <div className="grid grid-cols-3 gap-2">
            {taptaptapTeam.map((member) => (
              <RoleButton
                key={member.id}
                member={member}
                selected={member.roleKey === selectedRole}
                onClick={() => setSelectedRole(member.roleKey)}
              />
            ))}
          </div>
        </section>

        <TeamProfile member={selectedMember} />
      </div>
    </main>
  );
}

function RoleButton({
  member,
  selected,
  onClick,
}: {
  member: TeamMember;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = roleIcons[member.roleKey];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-14 items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs font-black leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:gap-2 sm:px-4 sm:text-sm ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)] shadow-[0_16px_32px_rgba(0,168,192,0.20)]"
          : "theme-border bg-[var(--surface)] theme-text hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
      <span className="min-w-0 whitespace-normal">{member.roleLabel}</span>
    </button>
  );
}

function TeamProfile({ member }: { member: TeamMember }) {
  const Icon = roleIcons[member.roleKey];
  const initials = getInitials(member.name);
  const links = socialLabels
    .map((item) => ({ ...item, href: member[item.key] }))
    .filter((item): item is typeof item & { href: string } => Boolean(item.href));

  return (
    <section
      key={member.roleKey}
      className="mt-4 rounded-[1.75rem] border theme-border bg-[var(--surface)] p-5 text-center shadow-[var(--shadow-soft)] transition sm:p-7"
      aria-live="polite"
    >
      <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_20px_44px_rgba(0,168,192,0.16)] sm:h-44 sm:w-44">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name ? `${member.name} profile photo` : `${member.roleLabel} profile photo`}
            width={176}
            height={176}
                    className={`h-full w-full object-cover ${member.photoClassName ?? ""}`}
                    style={member.photoObjectPosition ? { objectPosition: member.photoObjectPosition } : undefined}
          />
        ) : initials ? (
          <span className="text-3xl font-black">{initials}</span>
        ) : (
          <UserRound className="h-12 w-12" aria-hidden />
        )}
      </div>

      <p className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.22em] theme-accent">
        {member.roleLabel}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight theme-text">
        {member.name ?? member.roleLabel}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 theme-text-secondary">
        {member.description ?? roleDescriptions[member.roleKey]}
      </p>

      {member.email || links.length > 0 ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {member.email ? (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Email
            </a>
          ) : null}
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label}, opens in a new tab`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border theme-border bg-[var(--surface-secondary)] px-4 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <link.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              {link.label}
            </a>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border theme-border bg-[var(--surface-secondary)] px-4 py-3 text-xs font-semibold leading-5 theme-text-muted">
          Contact links will appear here once this team profile is configured.
        </div>
      )}

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border theme-border bg-[var(--surface-secondary)] px-3 py-1 text-xs font-bold theme-text-secondary">
        <Icon className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
        {member.roleLabel}
      </div>
    </section>
  );
}

function getInitials(name?: string) {
  if (!name) return "";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
