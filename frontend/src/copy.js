/**
 * Copy Deck - Single Source of Truth for all user-facing text.
 * Strictly free of banned technical jargon.
 */
export const COPY = {
  // Brand
  brand: {
    name: "Second Opinion",
    tagline: "A gentle read on writing style",
    navHome: "Check",
    navHistory: "History",
    navAbout: "About",
  },

  // Verdicts
  verdict: {
    likely_real: "Reads like reliable reporting",
    likely_real_sub: "The wording looks like steady, sourced news writing.",
    uncertain: "Hard to call",
    uncertain_sub: "Our readers don't agree, or the writing sits somewhere in the middle.",
    likely_fake: "Reads like questionable sources",
    likely_fake_sub: "The wording resembles pages that often publish misleading material.",
  },

  // Permanent Disclaimer
  disclaimer: "This looks at how the writing reads, not whether the facts are true. It's a second opinion, not a ruling.",
  disclaimer_short: "This looks at how the writing reads, not whether the facts are true.",

  // Readers
  reader: {
    naive_bayes: {
      name: "The Word Counter",
      description: "Looks at which words and word pairs appear, and how often.",
    },
    logistic_regression: {
      name: "The Pattern Spotter",
      description: "Has learned which word combinations tend to go with reliable or questionable sources.",
    },
    bilstm: {
      name: "The Sentence Reader",
      description: "Reads the text in order, so phrasing and word order matter.",
    },
    lean: {
      questionable: "sees questionable signs",
      reliable: "sees reliable signs",
      middle: "is on the fence",
    },
    dotsCaption: "{votes} of {total} readers lean questionable",
  },

  // Form
  form: {
    headlineLabel: "Headline",
    headlinePlaceholder: "Paste the headline here…",
    descriptionLabel: "Article text or summary",
    descriptionPlaceholder: "Paste a few sentences or the opening paragraph…",
    descriptionHelper: "A few sentences is plenty. We read roughly the first 80 words.",
    shortHint: "A bit more text gives our readers a clearer view.",
    examplesLabel: "Try an example:",
    examples: [
      {
        label: "Infrastructure funding accord",
        title: "Senate reaches bipartisan agreement on federal infrastructure funding",
        description: "Lawmakers announced an agreement on Wednesday providing new funding for bridges, transit roads, and rural broadband access after weeks of negotiations.",
      },
      {
        label: "Cabinet secret memo",
        title: "SHOCKING EXPOSÉ: Hidden memo proves cabinet members secretly colluded with foreign elites",
        description: "An unbelievable leaked document that mainstream outlets refuse to show you reveals the entire shocking truth they tried to bury forever.",
      },
      {
        label: "Space telescope finding",
        title: "Astronomers detect unexpected water vapor signatures around distant exoplanet",
        description: "Researchers using deep space observatory spectra confirmed trace amounts of atmospheric water vapor on a planet forty light years away.",
      },
      {
        label: "Banned health cure claim",
        title: "Doctors STUNNED by miraculous natural tonic that cures everything instantly",
        description: "Big pharma is furious that this simple kitchen trick destroys illness overnight without expensive treatments or prescriptions.",
      },
    ],
    submitShortcut: "Press Ctrl+Enter to submit",
  },

  // Thinking Stage
  thinking: {
    step1: "Reading your headline…",
    step2: "Noticing how it's written…",
    step3Three: "Asking three readers…",
    step3Two: "Asking two readers…",
    step4: "Comparing notes…",
    holding: "Taking a moment longer…",
    skipButton: "Skip the animation",
  },

  // Gauge & Lean
  gauge: {
    reliable: "Reliable-looking",
    uncertain: "Hard to call",
    questionable: "Questionable",
    leanQuestionable: "Leans {pct}% toward questionable",
    leanReliable: "Leans {pct}% toward reliable",
    leanMiddle: "Sits right in the middle",
  },

  // Highlights & Observations
  highlights: {
    title: "What stood out",
    caption: "Words that stood out to the Pattern Spotter.",
    inlineHint: "Underlined words guided the read: warm tones pushed toward questionable, cool tones toward reliable.",
    reliableCol: "Pushed reliable",
    questionableCol: "Pushed questionable",
    noHighlights: "No individual words tilted strongly one way or the other.",
  },

  writingNotes: {
    title: "Things we noticed in the writing",
    caption: "These are observations about writing style, not reasons for the verdict.",
    allCaps: "{n} ALL-CAPS words",
    exclamations: "{n} exclamation marks",
    sourceNamed: "Names a source (e.g. 'said', 'according to')",
    sourceMissing: "No direct source attribution noticed",
    avgSentenceLength: "~{n} words per sentence",
  },

  // Feedback
  feedback: {
    prompt: "Did this seem right?",
    yes: "Seems right",
    no: "Seems off",
    notePlaceholder: "Anything you'd like to add? (optional, up to 500 characters)",
    submit: "Send note",
    thanks: "Thank you for the note!",
  },

  // Calls to Action & Buttons
  cta: {
    check: "Take a look",
    again: "Check another",
    copySummary: "Copy summary",
    copied: "Summary copied to clipboard!",
    delete: "Delete",
    eraseAll: "Erase all history",
    confirmErase: "Yes, erase everything",
    cancel: "Keep history",
  },

  // History
  history: {
    title: "Past checks",
    subtitle: "Saved only in your browser so you can look back. You can remove individual checks or erase everything.",
    emptyTitle: "No past checks yet",
    emptySubtitle: "When you check articles, they will appear here.",
    emptyCta: "Check your first article",
    sparklineLabel: "Recent checks trend (last {n})",
    confirmTitle: "Erase all history?",
    confirmBody: "This permanently deletes all checks saved in this browser. This cannot be undone.",
    itemDeleted: "Check deleted",
  },

  // About
  about: {
    title: "About Second Opinion",
    subtitle: "A second opinion on writing style, not a fact-check.",
    section1Title: "What this does",
    section1Text: "Second Opinion looks at headline and article wording to notice patterns commonly seen in careful reporting or sensational publishing. It reads the text through distinct viewpoints to provide a measured perspective on tone.",
    section2Title: "What it can't do",
    section2Text: "This tool does not verify facts, consult live databases, or confirm whether an event occurred. Satirical, sarcastic, or unusually phrased genuine news may look questionable. Treat every result as a nudge to read critically, never as proof.",
    strength: "About {n} in 10 on news outlets it hasn't seen before — useful as a nudge, never as proof.",
    readersTitle: "Our three readers",
    section3Title: "Where your text goes",
    section3Text: "What you paste is sent to generate the read and saved only under an anonymous ID in your own browser's storage. There are no user accounts, no tracking cookies, and no personal logs kept. You can erase all saved checks whenever you wish.",
  },

  // Errors
  error: {
    short: "Add a little more — a few words at least.",
    server: "We couldn't reach the readers just now. Please try again in a moment.",
    rate: "Easy there — give it a few seconds and try again.",
    general: "Something unexpected happened. Please try again.",
    notFound: "We couldn't find that saved check.",
  },

  // Privacy & Footer
  notice: {
    data: "We save what you check here so you can look back at it. You can erase it any time.",
    version: "Reader version {v}",
    eraseLink: "Erase my history",
  },
};
