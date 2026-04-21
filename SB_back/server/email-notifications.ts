import { ENV } from "./_core/env";
import * as db from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;
const MATCH_NOTIFICATION_TYPE = "match";
const INACTIVE_NOTIFICATION_TYPE = "inactive_no_candidate";

let inactivityJobInterval: NodeJS.Timeout | null = null;
let inactivityJobRunning = false;

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getAppUrl(path = ""): string {
  const base = ENV.frontendUrl?.trim() || "https://studybuddy.app";
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${normalized}${suffix}`;
}

function getDisplayName(email: string, firstName?: string | null): string {
  const first = (firstName ?? "").trim();
  if (first) return first;
  return email.split("@")[0] || "друг";
}

function isEmailDeliveryConfigured(): boolean {
  return Boolean(ENV.resendApiKey.trim() && ENV.emailFrom.trim());
}

async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  if (!isEmailDeliveryConfigured()) {
    console.warn("[EmailNotifications] RESEND_API_KEY or EMAIL_FROM is missing; email skipped");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.emailFrom,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[EmailNotifications] Failed to send email (${response.status} ${response.statusText})${
          errorText ? `: ${errorText}` : ""
        }`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[EmailNotifications] Error while sending email:", error);
    return false;
  }
}

function shouldRunEmailNotifications(): boolean {
  return parseBoolean(ENV.emailNotificationsEnabled) && isEmailDeliveryConfigured();
}

export async function notifyUsersAboutMatch(params: {
  userId: number;
  candidateId: number;
}): Promise<void> {
  if (!shouldRunEmailNotifications()) {
    return;
  }

  const firstId = Math.min(params.userId, params.candidateId);
  const secondId = Math.max(params.userId, params.candidateId);
  const pairKey = `${firstId}:${secondId}`;

  const [user, candidate, userProfile, candidateProfile] = await Promise.all([
    db.getUserById(params.userId),
    db.getUserById(params.candidateId),
    db.getProfile(params.userId),
    db.getProfile(params.candidateId),
  ]);

  if (!user || !candidate) {
    return;
  }

  const recipients = [
    {
      user,
      profile: userProfile,
      otherUser: candidate,
      otherProfile: candidateProfile,
    },
    {
      user: candidate,
      profile: candidateProfile,
      otherUser: user,
      otherProfile: userProfile,
    },
  ];

  await Promise.all(
    recipients.map(async ({ user: recipient, profile, otherUser, otherProfile }) => {
      const notificationKey = `match:${pairKey}:recipient:${recipient.id}`;
      const alreadySent = await db.hasEmailNotificationByKey(notificationKey);
      if (alreadySent) {
        return;
      }

      const recipientName = getDisplayName(recipient.email, profile?.firstName);
      const otherName = getDisplayName(otherUser.email, otherProfile?.firstName);
      const url = getAppUrl("/favorites");
      const subject = "У вас новый мэтч в StudyBuddy";
      const text = `Привет, ${recipientName}! У вас мэтч с ${otherName}. Откройте StudyBuddy: ${url}`;
      const html = `
        <p>Привет, ${recipientName}!</p>
        <p>У вас новый мэтч с <strong>${otherName}</strong> в StudyBuddy.</p>
        <p><a href="${url}">Открыть приложение</a></p>
      `;

      const sent = await sendEmail({
        to: recipient.email,
        subject,
        text,
        html,
      });

      if (!sent) {
        return;
      }

      await db.createEmailNotification(
        recipient.id,
        MATCH_NOTIFICATION_TYPE,
        notificationKey,
        { pairKey, otherUserId: otherUser.id },
      );
    }),
  );
}

export async function runInactiveUsersReminderJob(): Promise<void> {
  if (!shouldRunEmailNotifications() || inactivityJobRunning) {
    return;
  }

  inactivityJobRunning = true;
  try {
    const reminderDays = parsePositiveInt(ENV.inactivityReminderDays, 7);
    const reminderCooldownMs = reminderDays * DAY_MS;
    const nowMs = Date.now();
    const periodBucket = Math.floor(nowMs / reminderCooldownMs);
    const users = await db.getAllUsers();

    for (const user of users) {
      if (!user.isProfileComplete) {
        continue;
      }

      const lastSeenSource = user.lastSeenAt ?? user.updatedAt ?? user.createdAt;
      if (!lastSeenSource) {
        continue;
      }

      const lastSeenMs = new Date(lastSeenSource).getTime();
      if (!Number.isFinite(lastSeenMs)) {
        continue;
      }

      const inactivityMs = nowMs - lastSeenMs;
      if (inactivityMs < reminderCooldownMs) {
        continue;
      }

      const hasFavoriteActivity = await db.hasAnyFavoriteActivity(user.id);
      if (hasFavoriteActivity) {
        continue;
      }

      const recentlyNotified = await db.hasRecentEmailNotification(
        user.id,
        INACTIVE_NOTIFICATION_TYPE,
        reminderCooldownMs,
      );
      if (recentlyNotified) {
        continue;
      }

      const profile = await db.getProfile(user.id);
      const name = getDisplayName(user.email, profile?.firstName);
      const inactiveDays = Math.floor(inactivityMs / DAY_MS);
      const url = getAppUrl("/search");
      const notificationKey = `inactive-no-candidate:${user.id}:${periodBucket}`;
      const subject = "Вас ждут новые кандидаты в StudyBuddy";
      const text = `Привет, ${name}! Вы не заходили ${inactiveDays} дн. Проверьте новых кандидатов: ${url}`;
      const html = `
        <p>Привет, ${name}!</p>
        <p>Вы не заходили в StudyBuddy уже ${inactiveDays} дн.</p>
        <p>Зайдите и посмотрите новые карточки кандидатов.</p>
        <p><a href="${url}">Открыть поиск</a></p>
      `;

      const sent = await sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });

      if (!sent) {
        continue;
      }

      await db.createEmailNotification(
        user.id,
        INACTIVE_NOTIFICATION_TYPE,
        notificationKey,
        { inactiveDays, periodBucket },
      );
    }
  } catch (error) {
    console.error("[EmailNotifications] Inactivity job failed:", error);
  } finally {
    inactivityJobRunning = false;
  }
}

export function startInactiveUsersReminderJob(): void {
  if (!parseBoolean(ENV.emailNotificationsEnabled)) {
    return;
  }

  const intervalMinutes = parsePositiveInt(ENV.inactivityJobIntervalMinutes, 360);
  const intervalMs = intervalMinutes * 60 * 1000;

  if (inactivityJobInterval) {
    clearInterval(inactivityJobInterval);
  }

  void runInactiveUsersReminderJob();
  inactivityJobInterval = setInterval(() => {
    void runInactiveUsersReminderJob();
  }, intervalMs);
}
