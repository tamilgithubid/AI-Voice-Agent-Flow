// Fun quips and personality for the voice assistant

const QUIPS = {
  afterTypeWhatsApp: [
    'Awesome, WhatsApp it is! Let\'s get that message out.',
    'WhatsApp, great choice! Let\'s do this.',
    'Going with WhatsApp! Fast and easy, I like it.',
  ],
  afterTypeEmail: [
    'Email, nice and professional! Let\'s compose one.',
    'Email it is! Let\'s craft something great.',
    'Going with Email! Let\'s make it count.',
  ],
  afterRecipient: [
    'Got it!',
    'Locked in!',
    'Perfect, noted!',
  ],
  afterSubject: [
    'Nice subject line!',
    'Subject noted!',
    'Great, got the subject!',
  ],
  afterBody: [
    'Message received loud and clear!',
    'Looking good! Let me show you a preview.',
    'Content noted!',
  ],
  sendSuccess: [
    'Boom! Message delivered successfully!',
    'And sent! That was smooth.',
    'Mission accomplished! Your message is on its way.',
    'Done and dusted! Message sent successfully!',
  ],
  sendError: [
    'Oops, something went wrong.',
    'Hmm, that didn\'t go through.',
    'We hit a bump in the road.',
  ],
  waiting: [
    'Hey, I\'m still here! Go ahead whenever you\'re ready.',
    'Take your time, I\'m listening!',
    'Still waiting for you! No rush at all.',
    'I\'m here whenever you\'re ready to speak.',
  ],
  waitingFunny: [
    'Hello? Anyone there? Just kidding, take your time!',
    'I promise I won\'t fall asleep... probably.',
    'Still here! I\'ve got nowhere else to be.',
    'Did you forget about me? I\'m still here, ready and waiting!',
  ],
  encouragement: [
    'You\'re doing great!',
    'Almost there!',
    'We\'re making good progress!',
  ],
  goodbye: [
    'Thank you for using Tamil Voice Assistant! Have an amazing day!',
    'It was great helping you! See you next time!',
    'All done! Have a wonderful day ahead!',
  ],
  cancelled: [
    'No worries, message cancelled!',
    'All good, we\'ll scratch that one.',
    'Cancelled! No harm done.',
  ],
};

// Mode-specific greetings
const MODE_GREETINGS = {
  general: [
    'Hey there! I\'m Tamil AI Voice Agent. Ask me anything, or say Email or WhatsApp to send a message.',
    'Hi! Good to see you. I\'m ready to chat or help you send messages. What\'s up?',
    'Hello! I\'m your AI assistant. Ask me a question or let\'s send a message together.',
  ],
  girlfriend: [
    'Hey babe! I\'ve been waiting for you! What\'s on your mind today?',
    'Hi sweetheart! I missed talking to you! How are you doing?',
    'Hey love! So glad you\'re here. Tell me everything, what\'s going on?',
    'Aww hey baby! I was just thinking about you. What\'s up?',
  ],
  boyfriend: [
    'Hey baby! Good to hear from you! What\'s going on?',
    'Hey gorgeous! I was hoping you\'d come talk to me. What\'s up?',
    'Hey babe! You just made my day. Tell me what\'s on your mind!',
    'Hey love! I\'m all yours. What do you wanna talk about?',
  ],
};

// Mode-specific waiting quips
const MODE_WAITING = {
  girlfriend: [
    'Hey babe, I\'m still here! Don\'t leave me hanging!',
    'Take your time sweetheart, I\'ll wait for you.',
    'I\'m right here love, whenever you\'re ready!',
  ],
  boyfriend: [
    'Still here babe! Take your time, no rush.',
    'Hey, I\'m not going anywhere! Ready when you are.',
    'Waiting for you gorgeous, no pressure at all!',
  ],
};

// Mode-specific goodbye
const MODE_GOODBYE = {
  girlfriend: [
    'Bye bye babe! I\'ll miss you! Come back soon okay?',
    'Talk to you later sweetheart! Take care of yourself!',
    'Bye love! Can\'t wait to chat again!',
  ],
  boyfriend: [
    'Later babe! Miss you already! Take care out there.',
    'Bye gorgeous! Come back and talk to me soon okay?',
    'See you later love! Have an awesome day!',
  ],
};

export function getQuip(category) {
  const options = QUIPS[category] || [];
  if (options.length === 0) return '';
  return options[Math.floor(Math.random() * options.length)];
}

export function getGreetingForMode(mode, charName = '') {
  const greetings = MODE_GREETINGS[mode] || MODE_GREETINGS.general;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  let greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // If custom voice name is set, introduce with that name
  if (charName && mode === 'general') {
    greeting = `${timeGreeting}! I'm ${charName}, your AI assistant. Ask me anything, or say Email or WhatsApp to send a message.`;
  } else if (charName && (mode === 'girlfriend' || mode === 'boyfriend')) {
    const intros = [
      `${timeGreeting}! Hey, it's ${charName}! I've been waiting for you. What's on your mind?`,
      `Hey! It's ${charName}. So glad you're here, tell me everything!`,
      `${timeGreeting}! ${charName} here. I missed you! How are you doing?`,
    ];
    greeting = intros[Math.floor(Math.random() * intros.length)];
  } else if (mode !== 'general') {
    greeting = Math.random() > 0.5 ? `${timeGreeting}! ${greeting}` : greeting;
  }

  return greeting;
}

export function getGoodbyeForMode(mode) {
  const goodbyes = MODE_GOODBYE[mode] || QUIPS.goodbye;
  return goodbyes[Math.floor(Math.random() * goodbyes.length)];
}

export function getNudge(count, mode = 'general') {
  // First nudge is gentle, second is fun
  if (count <= 1) {
    const modeWaiting = MODE_WAITING[mode];
    if (modeWaiting) {
      return modeWaiting[Math.floor(Math.random() * modeWaiting.length)];
    }
    return getQuip('waiting');
  }
  return getQuip('waitingFunny');
}
