// Planifie une notification locale quotidienne qui renvoie vers la page
// "morning" (météo + 5 questions). Limites iOS : une notification
// programmée ne se déclenche qu'une fois ; il faut donc reprogrammer la
// suivante à chaque ouverture de l'app pour que ça continue de fonctionner
// au fil des jours.

const STORAGE_KEY = 'fc_morning_notif_scheduled_for'
export const DEFAULT_HOUR = 7
export const DEFAULT_MINUTE = 30

export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function getPermissionState() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  const result = await Notification.requestPermission()
  return result
}

function nextOccurrence(hour, minute) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target
}

// Reprogramme la notif du lendemain si ce n'est pas déjà fait pour cette date.
// Idempotent : peut être appelé à chaque ouverture de l'app sans dupliquer.
export async function scheduleDailyMorningNotification(hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE) {
  if (!isNotificationSupported()) return { ok: false, reason: 'unsupported' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'no-permission' }

  const target = nextOccurrence(hour, minute)
  const targetKey = target.toDateString()

  const alreadyScheduledFor = localStorage.getItem(STORAGE_KEY)
  if (alreadyScheduledFor === targetKey) {
    return { ok: true, alreadyScheduled: true, target }
  }

  const registration = await navigator.serviceWorker.ready
  const delay = target.getTime() - Date.now()

  // showTrigger (TimestampTrigger) n'est dispo que sur certains navigateurs ;
  // on fait un fallback par setTimeout tant que l'app/onglet reste en mémoire,
  // ce qui couvre le cas le plus fréquent (app ouverte ou récente en arrière-plan).
  if ('showTrigger' in Notification.prototype) {
    await registration.showNotification('Petit réveil culture G ☀️', {
      body: 'La météo du jour + 5 questions pour bien commencer.',
      icon: '/favicon.svg',
      tag: 'morning-reminder',
      // eslint-disable-next-line no-undef
      showTrigger: new TimestampTrigger(target.getTime()),
      data: { url: '/morning/' },
    })
  } else {
    setTimeout(() => {
      registration.showNotification('Petit réveil culture G ☀️', {
        body: 'La météo du jour + 5 questions pour bien commencer.',
        icon: '/favicon.svg',
        tag: 'morning-reminder',
        data: { url: '/morning/' },
      })
    }, Math.max(0, delay))
  }

  localStorage.setItem(STORAGE_KEY, targetKey)
  return { ok: true, alreadyScheduled: false, target }
}
