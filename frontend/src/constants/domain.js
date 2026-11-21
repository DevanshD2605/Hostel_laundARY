export const STATUS_MAP = {
  WAITING_FOR_VERIFICATION: {
    label: 'Waiting for verification',
    studentLabel: 'Submitted',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    step: 0
  },
  AWAITING_TAGGING: {
    label: 'Awaiting tagging',
    studentLabel: 'Verified',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    step: 1
  },
  TAGGED: {
    label: 'Tagged',
    studentLabel: 'Tagged',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    step: 2
  },
  IN_LAUNDRY: {
    label: 'In laundry',
    studentLabel: 'In laundry',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    step: 3
  },
  RETURNED: {
    label: 'Returned',
    studentLabel: 'In laundry', // Students see "In laundry" until ready for pickup
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    step: 3
  },
  READY_FOR_PICKUP: {
    label: 'Ready for pickup',
    studentLabel: 'Ready for pickup',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    step: 4
  },
  COLLECTED: {
    label: 'Collected',
    studentLabel: 'Collected',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    step: 5
  },
  CANCELLED: {
    label: 'Rejected',
    studentLabel: 'Rejected',
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    step: 0
  }
};

export const STEPS = [
  'Submitted',
  'Verified',
  'Tagged',
  'In laundry',
  'Ready for pickup',
  'Collected'
];

export const COMPLAINT_STATUS_MAP = {
  Open: { color: 'bg-red-50 text-red-700 border-red-200' },
  'Under review': { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Investigating: { color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Closed: { color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const COMPLAINT_TYPES = [
  'Missing',
  'Damaged',
  'Wrong item',
  'Incorrect quantity',
  'Delay',
  'Other'
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Counter hours: 12:30-3:00 PM (750-900m) and 4:00-7:00 PM (960-1140m)
export function getCounterStatus(hostel) {
  if (!hostel) {
    return {
      open: false,
      tone: 'amber',
      title: 'Hostel profile needed',
      subtitle: 'Complete your profile to view counter timings.'
    };
  }

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const isTodayLaundryDay = hostel.days && hostel.days.includes(day);

  // Next scheduled day
  const nextDays = hostel.days
    ? hostel.days.map(d => ({ day: d, diff: (d - day + 7) % 7 }))
        .filter(x => x.diff > 0)
        .sort((a, b) => a.diff - b.diff)
    : [];
  const nextDay = nextDays[0] || { day: hostel.days?.[0] || 1, diff: 7 };

  if (isTodayLaundryDay) {
    if (minutes >= 750 && minutes < 900) {
      return {
        open: true,
        tone: 'emerald',
        title: 'Counter is OPEN right now',
        subtitle: `Open until 3:00 PM today for ${hostel.name}.`
      };
    }
    if (minutes >= 960 && minutes < 1140) {
      return {
        open: true,
        tone: 'emerald',
        title: 'Counter is OPEN right now',
        subtitle: `Open until 7:00 PM today for ${hostel.name}.`
      };
    }
    if (minutes < 750) {
      return {
        open: false,
        tone: 'amber',
        title: 'Opens today at 12:30 PM',
        subtitle: 'Slots: 12:30 PM – 3:00 PM and 4:00 PM – 7:00 PM.'
      };
    }
    if (minutes >= 900 && minutes < 960) {
      return {
        open: false,
        tone: 'amber',
        title: 'Lunch Break (Reopens at 4:00 PM)',
        subtitle: 'Staff is currently on afternoon break.'
      };
    }
    return {
      open: false,
      tone: 'blue',
      title: 'Counter closed for today',
      subtitle: `Next drop-off & pickup: ${DAY_NAMES[nextDay.day]} (12:30 PM - 7:00 PM).`
    };
  }

  return {
    open: false,
    tone: 'blue',
    title: `Next laundry day: ${DAY_NAMES[nextDay.day]}`,
    subtitle: `${nextDay.diff === 1 ? 'Tomorrow' : `In ${nextDay.diff} days`} · 12:30–3:00 PM and 4:00–7:00 PM`
  };
}
