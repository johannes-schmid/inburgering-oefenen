export const TABLE = {
  EXAM_SUBMISSIONS:        'exam_submissions',
  EMAIL_CAMPAIGN_QUEUE:    'email_campaign_queue',
  PAYMENTS:                'payments',
  USER_QUESTION_RESULTS:   'user_question_results',
  USER_WORD_CARD_PROGRESS: 'user_word_card_progress',
} as const;

export const CAMPAIGN = {
  DAY2: 'day2',
  DAY7: 'day7',
} as const;

export const PAYMENT_STATUS = {
  PAID:       'paid',
  OPEN:       'open',
  PENDING:    'pending',
  AUTHORIZED: 'authorized',
  CANCELED:   'canceled',
  FAILED:     'failed',
  EXPIRED:    'expired',
} as const;

export const PASS_THRESHOLD_PCT = 60;
export const PRICE_CENTS = 995;

export const PRODUCTS = {
  premium: {
    slug: 'premium',
    priceCents: 995,
    priceLabel: '9.95',
    description: 'Inburgering Oefenen — Professioneel Pakket',
    grantsPlan: 'premium',
  },
  premium_plus: {
    slug: 'premium_plus',
    priceCents: 1995,
    priceLabel: '19.95',
    description: 'Inburgering Oefenen — Compleet Pakket',
    grantsPlan: 'premium_plus',
  },
  upgrade_to_plus: {
    slug: 'upgrade_to_plus',
    priceCents: 995,
    priceLabel: '9.95',
    description: 'Inburgering Oefenen — Upgrade naar Compleet',
    grantsPlan: 'premium_plus',
  },
} as const;

export type ProductSlug = keyof typeof PRODUCTS;

export function jsonOk(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
