import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

// SEO guardrail: generate static pages for every locale at build time
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: true, follow: true },
    /* `alternatesFor` leidt canonical én hreflang af uit `routing.ts`, zodat ze de vertaalde
     * slug van deze taal krijgen in plaats van de taalcode vóór het Nederlandse pad. */
    alternates: alternatesFor(locale, 'privacybeleid'),
  };
}

export default async function PrivacybeleidPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-16 pb-24">

        <header className="mb-12">
          <div
            className="inline-flex items-center gap-2 mb-4"
            style={{ background: 'rgba(0,43,109,0.06)', borderRadius: '9999px', padding: '4px 12px' }}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-primary">
              {t('eyebrow')}
            </span>
          </div>
          <h1
            className="font-headline font-extrabold text-on-surface mb-3"
            style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', letterSpacing: '-0.02em' }}
          >
            {t('heading')}
          </h1>
          <p className="text-on-surface-variant text-sm">{t('last_updated')}</p>
        </header>

        <div
          className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 prose"
          style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}
        >
          {/* De Nederlandse tekst is leidend. /en en /ar tonen de Engelse vertaling: de automatische privacy-check van OpenAI leest de URL die in het app-pakket staat, /en/privacy-policy. */}
          {locale === 'nl' ? <PolicyNl /> : <PolicyEn />}
        </div>
      </main>

    </>
  );
}

function PolicyNl() {
  return (
    <>
      <p>
        Inburgering Oefenen (&quot;wij&quot;, &quot;ons&quot;) respecteert jouw privacy en verwerkt persoonsgegevens
        zorgvuldig en veilig. In dit privacybeleid leggen wij uit welke gegevens wij verzamelen, waarom
        wij dat doen en wat jouw rechten zijn. Dit beleid is van toepassing op de website{' '}
        <strong>inburgeringoefenen.nl</strong>.
      </p>

      <h2>1. Wie is verantwoordelijk?</h2>
      <p>De verwerkingsverantwoordelijke is:</p>
      <ul>
        <li><span><strong>Inburgering Oefenen</strong></span></li>
        <li><span>E-mail: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a></span></li>
      </ul>

      <h2>2. Welke gegevens verzamelen wij?</h2>
      <p>Dat hangt af van hoe je het platform gebruikt.</p>
      <p><strong>Als je zonder account oefent:</strong></p>
      <ul>
        <li><span><strong>Je e-mailadres</strong>, als je het invult om je resultaat te bekijken. Je kunt deze stap overslaan.</span></li>
        <li><span><strong>Je score</strong> op de gratis oefenvragen.</span></li>
        <li><span>
          <strong>Oefen je via ChatGPT zonder account</strong>, dan ontvangen wij van OpenAI een
          geanonimiseerd kenmerk van jouw ChatGPT-account. Wij bewaren daarvan alleen een versleutelde
          afgeleide, om bij te houden welke van de tien gratis proefvragen je al hebt gehad. Wij kunnen
          daaruit niet herleiden wie je bent.
        </span></li>
      </ul>
      <p><strong>Als je een account maakt:</strong></p>
      <ul>
        <li><span><strong>Je naam, e-mailadres en profielfoto</strong> van je Google-account. Inloggen gaat uitsluitend via Google: wij ontvangen geen wachtwoord en bewaren er ook geen.</span></li>
        <li><span><strong>Je voortgang:</strong> welke oefenexamens je hebt gemaakt, welk antwoord je per vraag gaf, je scores en je tijden.</span></li>
        <li><span><strong>Je antwoorden op open opdrachten:</strong> de teksten die je schrijft bij Schrijven.</span></li>
        <li><span><strong>Je spreekopnames.</strong> Bij Spreken neem je je antwoord op. Die opname wordt bewaard in een niet-openbare opslag, samen met de uitgeschreven tekst en de beoordeling.</span></li>
        <li><span><strong>Betaalgegevens:</strong> welke modules je hebt, tot wanneer, en de klant- en abonnementsnummers van onze betaaldienst. Je rekeningnummer en je kaartgegevens komen niet bij ons terecht: die verwerkt de betaaldienst zelf.</span></li>
        <li><span>
          <strong>Koppel je je account aan ChatGPT</strong>, dan geef je de ChatGPT-app van Inburgering
          Oefenen toestemming om namens jou oefenvragen op te halen, je antwoorden na te kijken en je
          voortgang bij te werken. Dat zijn dezelfde gegevens als hierboven; er komt geen tweede account
          bij. Je kunt de koppeling in ChatGPT weer verwijderen.
        </span></li>
      </ul>
      <p>
        Wij vragen <strong>geen</strong> bijzondere persoonsgegevens zoals nationaliteit, religie of
        gezondheidsgegevens. Houd er rekening mee dat je bij een open opdracht zelf over je situatie kunt
        schrijven of spreken: schrijf niet meer over jezelf dan je kwijt wil.
      </p>

      <h2>3. Waarvoor gebruiken wij jouw gegevens?</h2>
      <p>Wij gebruiken jouw gegevens voor de volgende doeleinden:</p>
      <ul>
        <li><span>Het toesturen van jouw persoonlijke toetsresultaten</span></li>
        <li><span>Het toesturen van gratis oefenmateriaal en studietips voor het inburgeringsexamen</span></li>
        <li><span>Incidentele communicatie over het platform</span></li>
        <li><span>Het bijhouden van jouw voortgang, zodat je ziet waar je staat en welk onderdeel aandacht nodig heeft</span></li>
        <li><span>Het nakijken van je antwoorden op Schrijven en Spreken aan de hand van de beoordelingscriteria van de docent, en het bewaren van die beoordeling zodat de docent haar kan nakijken en corrigeren</span></li>
        <li><span>Het geven van toegang tot de modules die je hebt afgenomen, en het innen van het abonnement</span></li>
      </ul>

      <h2>4. Rechtsgrond</h2>
      <p>
        De verwerking is gebaseerd op jouw <strong>toestemming</strong> (art. 6 lid 1 sub a AVG), die je
        geeft door je e-mailadres in te vullen en op de knop &quot;Bekijk mijn resultaten&quot; te klikken. Je
        kunt deze toestemming op elk moment intrekken.
      </p>

      <h2>5. Hoe lang bewaren wij jouw gegevens?</h2>
      <p>
        Wij bewaren jouw e-mailadres totdat je je afmeldt of verzoekt om verwijdering, of uiterlijk{' '}
        <strong>2 jaar</strong> na het laatste contact, tenzij een wettelijke bewaarplicht een langere
        bewaartermijn vereist.
      </p>
      <p>
        Heb je een account, dan bewaren wij je voortgang, je antwoorden, je opnames en je beoordelingen{' '}
        <strong>zolang je account bestaat</strong>. Vraag je om verwijdering van je account, dan
        verwijderen wij ook die gegevens. Voor betaalgegevens geldt de wettelijke administratieplicht van{' '}
        <strong>7 jaar</strong>.
      </p>

      <h2>6. Delen met derden</h2>
      <p>
        Wij schakelen de volgende partijen in als <strong>verwerker</strong>. Zij mogen jouw gegevens
        uitsluitend gebruiken om hun dienst aan ons te leveren.
      </p>
      <ul>
        <li><span><strong>Supabase</strong> — database, inloggen en opslag van bestanden. Onze gegevens staan in de EU (Frankfurt).</span></li>
        <li><span><strong>Vercel</strong> — hosting van de website.</span></li>
        <li><span><strong>Google</strong> — inloggen met je Google-account, en Google Analytics voor bezoekcijfers.</span></li>
        <li><span><strong>Mollie</strong> — betalingen en abonnementen.</span></li>
        <li><span><strong>Resend</strong> — het versturen van onze e-mails.</span></li>
        <li><span><strong>ElevenLabs</strong> — het uitschrijven van je spreekantwoord naar tekst, en het maken van het geluid bij de oefenexamens.</span></li>
        <li><span>
          <strong>Vercel AI Gateway</strong> — bij Schrijven en Spreken wordt je antwoord (bij Spreken:
          ook de geluidsopname) naar een taalmodel gestuurd, dat de beoordelingscriteria van de docent
          toepast. Je naam en e-mailadres gaan daarbij niet mee.
        </span></li>
        <li><span>
          <strong>OpenAI (ChatGPT)</strong> — alleen als je de ChatGPT-app van Inburgering Oefenen gebruikt.
          De oefenvragen, jouw gekozen antwoorden en de uitleg gaan dan via ChatGPT; wat je in ChatGPT
          typt valt onder het privacybeleid van OpenAI. Wij bewaren geen gespreksinhoud.
        </span></li>
        <li><span><strong>Microsoft Clarity</strong> — inzicht in hoe de website gebruikt wordt, inclusief opnames van muisbewegingen en kliks.</span></li>
        <li><span><strong>Meta</strong> — meten van het resultaat van onze advertenties.</span></li>
      </ul>
      <p>Wij verkopen jouw gegevens nooit aan derden.</p>

      <h2>7. Beveiliging</h2>
      <p>
        Wij nemen passende technische en organisatorische maatregelen om jouw persoonsgegevens te
        beveiligen tegen verlies, diefstal of ongeautoriseerde toegang. De website maakt gebruik van
        HTTPS-versleuteling.
      </p>

      <h2>8. Jouw rechten</h2>
      <p>Op grond van de AVG heb je de volgende rechten:</p>
      <ul>
        <li><span><strong>Recht op inzage</strong> — je kunt opvragen welke gegevens wij van je hebben</span></li>
        <li><span><strong>Recht op correctie</strong> — je kunt onjuiste gegevens laten corrigeren</span></li>
        <li><span><strong>Recht op verwijdering</strong> — je kunt vragen om verwijdering van jouw gegevens (&quot;recht op vergetelheid&quot;)</span></li>
        <li><span><strong>Recht op beperking</strong> — je kunt de verwerking laten beperken</span></li>
        <li><span><strong>Recht op bezwaar</strong> — je kunt bezwaar maken tegen de verwerking</span></li>
        <li><span><strong>Recht op overdraagbaarheid</strong> — je kunt jouw gegevens opvragen in een gestructureerd formaat</span></li>
      </ul>
      <p>
        Om een recht uit te oefenen, stuur een e-mail naar{' '}
        <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>. Wij reageren binnen 30 dagen.
      </p>

      <h2>9. Klacht indienen</h2>
      <p>
        Als je van mening bent dat wij jouw privacyrechten schenden, kun je een klacht indienen bij de{' '}
        <strong>Autoriteit Persoonsgegevens</strong>:{' '}
        <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener">
          autoriteitpersoonsgegevens.nl
        </a>
        .
      </p>

      <h2>10. Cookies</h2>
      <p>Deze website gebruikt twee soorten cookies en vergelijkbare technieken.</p>
      <ul>
        <li><span>
          <strong>Noodzakelijk</strong> — om je ingelogd te houden en om je voorkeuren (zoals geluid
          aan of uit) te onthouden. Zonder deze werkt het platform niet.
        </span></li>
        <li><span>
          <strong>Analyse en advertenties</strong> — Google Analytics, Microsoft Clarity en de Meta-pixel.
          Deze meten hoe de website gebruikt wordt en hoe onze advertenties presteren.
        </span></li>
      </ul>
      <p>
        Je kunt cookies altijd weigeren of verwijderen via de instellingen van je browser. Weiger je de
        noodzakelijke cookies, dan kun je niet inloggen.
      </p>

      <h2>11. Wijzigingen</h2>
      <p>
        Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De datum &quot;Laatste update&quot; bovenaan
        de pagina geeft aan wanneer de meest recente versie gepubliceerd is. Wij raden je aan dit beleid
        periodiek te raadplegen.
      </p>

      <h2>12. Contact</h2>
      <p>
        Voor vragen of verzoeken over dit privacybeleid of de verwerking van jouw gegevens, neem contact
        op via: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>.
      </p>
    </>
  );
}

function PolicyEn() {
  return (
    <div lang="en" dir="ltr">
      <p>
        <em>
          This is an English translation of our Dutch privacy policy. If the two versions differ, the{' '}
          <a href="/nl/privacybeleid">Dutch version</a> prevails.
        </em>
      </p>
      <p>
        Inburgering Oefenen (&quot;we&quot;, &quot;us&quot;) respects your privacy and processes personal data
        carefully and securely. In this privacy policy we explain which data we collect, why we collect it and
        what your rights are. This policy applies to the website <strong>inburgeringoefenen.nl</strong>,
        including the Inburgering Oefenen app in ChatGPT.
      </p>

      <h2>1. Who is responsible?</h2>
      <p>The data controller is:</p>
      <ul>
        <li><span><strong>Inburgering Oefenen</strong></span></li>
        <li><span>E-mail: <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a></span></li>
      </ul>

      <h2>2. What data do we collect?</h2>
      <p>That depends on how you use the platform.</p>
      <p><strong>If you practise without an account:</strong></p>
      <ul>
        <li><span><strong>Your e-mail address</strong>, if you enter it to see your result. You can skip this step.</span></li>
        <li><span><strong>Your score</strong> on the free practice questions.</span></li>
        <li><span>
          <strong>If you practise through ChatGPT without an account</strong>, OpenAI sends us an anonymised
          identifier of your ChatGPT account. We only store an encrypted value derived from it, to keep track
          of which of the ten free practice questions you have already had. We cannot use it to find out who
          you are.
        </span></li>
      </ul>
      <p><strong>If you create an account:</strong></p>
      <ul>
        <li><span><strong>Your name, e-mail address and profile picture</strong> from your Google account. You can only sign in with Google: we never receive or store a password.</span></li>
        <li><span><strong>Your progress:</strong> which practice exams you took, which answer you gave to each question, your scores and your times.</span></li>
        <li><span><strong>Your answers to open tasks:</strong> the texts you write for Writing (Schrijven).</span></li>
        <li><span><strong>Your speaking recordings.</strong> In Speaking (Spreken) you record your answer. The recording is stored in non-public storage, together with its transcript and its assessment.</span></li>
        <li><span><strong>Payment data:</strong> which modules you have, until when, and the customer and subscription numbers of our payment provider. Your bank account number and card details never reach us: the payment provider processes them itself.</span></li>
        <li><span>
          <strong>If you connect your account to ChatGPT</strong>, you allow the Inburgering Oefenen app in
          ChatGPT to fetch practice questions, check your answers and update your progress on your behalf. This
          is the same data as listed above; no second account is created. You can remove the connection in
          ChatGPT at any time.
        </span></li>
      </ul>
      <p>
        We do <strong>not</strong> ask for special categories of personal data such as nationality, religion or
        health data. Keep in mind that in an open task you may write or speak about your own situation: do not
        share more about yourself than you want to.
      </p>

      <h2>3. What do we use your data for?</h2>
      <p>We use your data for the following purposes:</p>
      <ul>
        <li><span>Sending you your personal test results</span></li>
        <li><span>Sending you free practice material and study tips for the inburgering exam</span></li>
        <li><span>Occasional communication about the platform</span></li>
        <li><span>Keeping track of your progress, so you can see where you stand and which part needs attention</span></li>
        <li><span>Checking your Writing and Speaking answers against the teacher&apos;s assessment criteria, and storing that assessment so the teacher can review and correct it</span></li>
        <li><span>Giving you access to the modules you have bought, and collecting the subscription fee</span></li>
      </ul>

      <h2>4. Legal basis</h2>
      <p>
        The processing is based on your <strong>consent</strong> (Article 6(1)(a) GDPR), which you give by
        entering your e-mail address to see your results. You can withdraw this
        consent at any time.
      </p>

      <h2>5. How long do we keep your data?</h2>
      <p>
        We keep your e-mail address until you unsubscribe or ask us to delete it, or at most{' '}
        <strong>2 years</strong> after our last contact, unless a legal obligation requires a longer retention
        period.
      </p>
      <p>
        If you have an account, we keep your progress, your answers, your recordings and your assessments{' '}
        <strong>for as long as your account exists</strong>. If you ask us to delete your account, we delete
        that data too. Payment data is subject to the statutory accounting retention period of{' '}
        <strong>7 years</strong>.
      </p>

      <h2>6. Sharing with third parties</h2>
      <p>
        We use the following parties as <strong>processors</strong>. They may only use your data to provide
        their service to us.
      </p>
      <ul>
        <li><span><strong>Supabase</strong> — database, sign-in and file storage. Our data is stored in the EU (Frankfurt).</span></li>
        <li><span><strong>Vercel</strong> — website hosting.</span></li>
        <li><span><strong>Google</strong> — signing in with your Google account, and Google Analytics for visitor statistics.</span></li>
        <li><span><strong>Mollie</strong> — payments and subscriptions.</span></li>
        <li><span><strong>Resend</strong> — sending our e-mails.</span></li>
        <li><span><strong>ElevenLabs</strong> — transcribing your spoken answer to text, and producing the audio in the practice exams.</span></li>
        <li><span>
          <strong>Vercel AI Gateway</strong> — for Writing and Speaking, your answer (for Speaking: also the audio
          recording) is sent to a language model that applies the teacher&apos;s assessment criteria. Your name
          and e-mail address are not sent along.
        </span></li>
        <li><span>
          <strong>OpenAI (ChatGPT)</strong> — only if you use the Inburgering Oefenen app in ChatGPT. The practice
          questions, the answers you choose and the explanations then pass through ChatGPT; whatever you type in
          ChatGPT is covered by OpenAI&apos;s privacy policy. We do not store conversation content.
        </span></li>
        <li><span><strong>Microsoft Clarity</strong> — insight into how the website is used, including recordings of mouse movements and clicks.</span></li>
        <li><span><strong>Meta</strong> — measuring the results of our advertisements.</span></li>
      </ul>
      <p>We never sell your data to third parties.</p>

      <h2>7. Security</h2>
      <p>
        We take appropriate technical and organisational measures to protect your personal data against loss,
        theft or unauthorised access. The website uses HTTPS encryption.
      </p>

      <h2>8. Your rights</h2>
      <p>Under the GDPR you have the following rights:</p>
      <ul>
        <li><span><strong>Right of access</strong> — you can ask which data we hold about you</span></li>
        <li><span><strong>Right to rectification</strong> — you can have incorrect data corrected</span></li>
        <li><span><strong>Right to erasure</strong> — you can ask us to delete your data (&quot;right to be forgotten&quot;)</span></li>
        <li><span><strong>Right to restriction</strong> — you can have the processing restricted</span></li>
        <li><span><strong>Right to object</strong> — you can object to the processing</span></li>
        <li><span><strong>Right to data portability</strong> — you can request your data in a structured format</span></li>
      </ul>
      <p>
        To exercise a right, send an e-mail to{' '}
        <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>. We respond within 30 days.
      </p>

      <h2>9. Filing a complaint</h2>
      <p>
        If you believe we are violating your privacy rights, you can file a complaint with the Dutch Data
        Protection Authority (<strong>Autoriteit Persoonsgegevens</strong>):{' '}
        <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener">
          autoriteitpersoonsgegevens.nl
        </a>
        .
      </p>

      <h2>10. Cookies</h2>
      <p>This website uses two kinds of cookies and similar technologies.</p>
      <ul>
        <li><span>
          <strong>Necessary</strong> — to keep you signed in and to remember your preferences (such as sound on
          or off). The platform does not work without them.
        </span></li>
        <li><span>
          <strong>Analytics and advertising</strong> — Google Analytics, Microsoft Clarity and the Meta pixel.
          These measure how the website is used and how our advertisements perform.
        </span></li>
      </ul>
      <p>
        You can always refuse or delete cookies in your browser settings. If you refuse the necessary cookies,
        you cannot sign in.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may change this privacy policy from time to time. The &quot;Last updated&quot; date at the top of the
        page shows when the most recent version was published. We recommend that you check this policy
        periodically.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions or requests about this privacy policy or the processing of your data, contact us at:{' '}
        <a href="mailto:contact@inburgeringoefenen.nl">contact@inburgeringoefenen.nl</a>.
      </p>
    </div>
  );
}
