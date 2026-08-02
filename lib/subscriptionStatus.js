export function getSubscriptionStatus(
  subscription,
  date = new Date(),
) {
  if (!subscription?.next_due) {
    return {
      code: "none",
      due: null,
    };
  }

  const today = date
    .toISOString()
    .slice(0, 10);

  const dueDate = new Date(
    `${subscription.next_due}T00:00:00`,
  );

  const soonDate = new Date(dueDate);
  soonDate.setDate(soonDate.getDate() - 7);

  const graceDate = new Date(dueDate);
  graceDate.setDate(graceDate.getDate() + 7);

  const soon = soonDate
    .toISOString()
    .slice(0, 10);

  const grace = graceDate
    .toISOString()
    .slice(0, 10);

  if (today <= subscription.next_due) {
    return {
      code:
        today >= soon
          ? "due_soon"
          : "current",
      due: subscription.next_due,
    };
  }

  if (today <= grace) {
    return {
      code: "overdue",
      due: subscription.next_due,
    };
  }

  return {
    code: "locked",
    due: subscription.next_due,
  };
}
