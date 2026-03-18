// Contact Book — stored in localStorage

const STORAGE_KEY = 'tamilAgent_contacts';

export function getContacts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveContact({ name, phone, email }) {
  const contacts = getContacts();
  const existing = contacts.findIndex(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  const entry = {
    name: name.trim(),
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    updatedAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    contacts[existing] = { ...contacts[existing], ...entry };
  } else {
    contacts.push(entry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return entry;
}

export function findContact(query) {
  const contacts = getContacts();
  const q = query.toLowerCase().trim();

  // Exact name match
  const exact = contacts.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  // Partial name match
  const partial = contacts.find((c) => c.name.toLowerCase().includes(q));
  if (partial) return partial;

  // Match by phone or email
  return contacts.find(
    (c) => c.phone.includes(q) || c.email.toLowerCase().includes(q)
  ) || null;
}

export function deleteContact(name) {
  const contacts = getContacts();
  const filtered = contacts.filter(
    (c) => c.name.toLowerCase() !== name.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
