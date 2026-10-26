const { Member, Notification } = require('./models');
const { sendSms } = require('./sms');
const { getMembershipBalance, indiaToday, daysUntil, normalizeDate } = require('./membership-balance');

const GYM_NAME = process.env.GYM_NAME || 'Garuda Fitness Zone';

function templateConfig(kind) {
  const names = {
    expiring: process.env.META_TEMPLATE_EXPIRING,
    expired: process.env.META_TEMPLATE_EXPIRED,
    reminder: process.env.META_TEMPLATE_REMINDER
  };
  const name = names[kind];
  if (!name) return null;
  return name;
}

async function notifyMember(member, { title, message, type, templateKind, templateParams, dedupeKey }) {
  let notification = await Notification.findOne({ memberId: member.memberCode, dedupeKey });
  if (notification && notification.smsStatus === 'sent') {
    return { duplicate: true, sms: { sent: true, reason: 'Already sent for this event' } };
  }
  if (!notification) {
    notification = await Notification.create({
      memberId: member.memberCode, title, message, type: type || 'membership',
      channel: 'whatsapp', dedupeKey, smsStatus: 'pending'
    });
  } else {
    notification.title = title;
    notification.message = message;
    notification.smsStatus = 'pending';
    notification.smsError = undefined;
    await notification.save();
  }

  try {
    const templateName = templateConfig(templateKind);
    if (!templateName) {
      notification.smsStatus = 'skipped';
      notification.smsError = `Missing META_TEMPLATE_${String(templateKind).toUpperCase()} configuration`;
      await notification.save();
      return { duplicate: false, sms: { sent: false, reason: notification.smsError } };
    }
    const result = await sendSms({
      to: member.phone,
      message,
      templateName,
      templateParams
    });
    notification.smsStatus = result.sent ? 'sent' : 'failed';
    notification.smsMessageId = result.messageId || undefined;
    notification.smsError = result.sent ? undefined : (result.reason || 'Provider did not send');
    await notification.save();
    return { duplicate: false, sms: result };
  } catch (error) {
    notification.smsStatus = 'failed';
    notification.smsError = String(error.message || error).slice(0, 500);
    await notification.save().catch(() => {});
    console.warn('[GFZ WhatsApp notification]', member.memberCode, error.message);
    return { duplicate: false, sms: { sent: false, reason: error.message } };
  }
}

async function runRenewalReminders({ dryRun = false, today = indiaToday() } = {}) {
  const members = await Member.find({ active: true, feeDueDate: { $exists: true, $ne: '' } }).lean();
  const report = { today, checked: members.length, expiring: 0, expired: 0, reminders: 0, sent: 0, skipped: 0, dryRun };

  for (const member of members) {
    const dueDate = normalizeDate(member.feeDueDate);
    const days = daysUntil(dueDate, today);
    if (days === null || days < 0 || days > 3) continue;

    let balance;
    try {
      balance = await getMembershipBalance(member, dueDate);
    } catch (error) {
      report.skipped++;
      console.warn('[GFZ WhatsApp] Could not calculate balance for', member.memberCode, error.message);
      continue;
    }

    const dueLabel = dueDate;
    const name = String(member.name || 'Member');
    const gym = GYM_NAME;

    if (days === 3) {
      report.expiring++;
      const message = `Hi ${name}, your membership in ${gym} is expiring soon on ${dueLabel}. Please renew your membership to continue your workouts without interruption. Please contact your gym owner`;
      if (dryRun) {
        report.skipped++;
      } else {
        const result = await notifyMember(member, {
          title: 'Membership expiring soon', message, type: 'membership-expiring', templateKind: 'expiring',
          templateParams: [name, gym, dueLabel],
          dedupeKey: `wa:expiring:${dueDate}`
        });
        if (result.sms.sent) report.sent++; else if (!result.duplicate) report.skipped++;
      }
    }

    if (days === 0) {
      report.expired++;
      const message = `Hi ${name}, your membership in ${gym} has expired on ${dueLabel}. Please renew your membership to continue your workouts without interruption. Please get in touch with your gym owner`;
      if (dryRun) {
        report.skipped++;
      } else {
        const result = await notifyMember(member, {
          title: 'Membership expired', message, type: 'membership-expired', templateKind: 'expired',
          templateParams: [name, gym, dueLabel],
          dedupeKey: `wa:expired:${dueDate}`
        });
        if (result.sms.sent) report.sent++; else if (!result.duplicate) report.skipped++;
      }
    }

    // Send a dues reminder on every day from D-3 through the expiry date, only while a balance remains.
    if (balance.legacyBalanceUncertain) {
      report.skipped++;
      console.warn('[GFZ WhatsApp] Dues reminder suppressed: legacy payment history needs reconciliation for', member.memberCode);
    } else if (balance.balance > 0 && days >= 0 && days <= 3) {
      report.reminders++;
      const amount = `₹${balance.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      const message = `Hi ${name}, you have a pending due amount of ${amount} in ${gym}. Please contact your gym owner to clear the due amount.`;
      if (dryRun) {
        report.skipped++;
      } else {
        const result = await notifyMember(member, {
          title: 'Membership payment due', message, type: 'membership-dues-reminder', templateKind: 'reminder',
          templateParams: [amount, gym],
          dedupeKey: `wa:reminder:${dueDate}:${today}`
        });
        if (result.sms.sent) report.sent++; else if (!result.duplicate) report.skipped++;
      }
    }
  }
  return report;
}

function startRenewalScheduler() {
  let lastRunDate = '';
  let running = false;
  const tick = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const day = `${values.year}-${values.month}-${values.day}`;
    if (values.hour === '09' && Number(values.minute) <= 4 && lastRunDate !== day && !running) {
      running = true;
      runRenewalReminders().then(result => {
        lastRunDate = day;
        console.log('[GFZ WhatsApp scheduler]', JSON.stringify(result));
      }).catch(error => {
        console.error('[GFZ WhatsApp scheduler]', error);
      }).finally(() => { running = false; });
    }
  };
  tick();
  const timer = setInterval(tick, 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}

module.exports = { notifyMember, runRenewalReminders, startRenewalScheduler };
