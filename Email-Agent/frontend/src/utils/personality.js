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

export function getQuip(category) {
  const options = QUIPS[category] || [];
  if (options.length === 0) return '';
  return options[Math.floor(Math.random() * options.length)];
}

export function getNudge(count) {
  // First nudge is gentle, second is fun
  if (count <= 1) {
    return getQuip('waiting');
  }
  return getQuip('waitingFunny');
}
