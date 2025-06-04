// src/components/ContactList.jsx
import React from 'react';
import ContactCard from './ContactCard';


export default function ContactList({ contacts, onDelete, onUpdate, search }) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full pb-6">
            {contacts.length === 0 ? (
                <div className="text-gray-400 text-center py-6 col-span-full">No contacts found.</div>
            ) : (
                contacts.map((contact) => (
                    <ContactCard
                        key={contact.id}
                        contact={contact}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                        search={search}
                    />
                ))
            )}
        </div>
    );
}
