// src/components/ContactForm.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function ContactForm({ onAdd }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [tags, setTags] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [profilePicPreview, setProfilePicPreview] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        //Check phone is digits only
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 9) {
            toast.info('Phone number must be at least 9 digits');
            return;
        }

        const newContact = { name, email, phone, tags, profilePic };

        try {
            const res = await fetch('http://localhost:3001/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContact)
            });

            if (res.ok) {
                setName('');
                setEmail('');
                setPhone('');
                setTags('');
                setProfilePic('');
                setProfilePicPreview('');
                onAdd(); // refresh list
                toast.success('✅ Contact added successfully!');
            } else {
                toast.error('❌ Server error while adding contact.');
            }
        } catch (err) {
            console.error('Error adding contact:', err);
            toast.error('❌ Could not connect to the server.');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 mb-8 p-4 rounded-2xl shadow bg-white">

            <h2 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">Add New Contact</h2>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Profile Pic Upload & Preview */}
                <div className="flex flex-col items-center justify-center w-full sm:w-auto">
                    <label className="block mb-1 font-semibold">Profile Picture</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                    toast.error('File is too large (max 2MB).');
                                    return;
                                }
                                if (!file.type.startsWith('image/')) {
                                    toast.error('Only image files are allowed.');
                                    return;
                                }
                                setProfilePicPreview(URL.createObjectURL(file));
                                const formData = new FormData();
                                formData.append('profilePic', file);
                                const res = await fetch('http://localhost:3001/upload', {
                                    method: 'POST',
                                    body: formData,
                                });
                                const data = await res.json();
                                setProfilePic(data.filename);
                            }
                        }}
                        className="w-full"
                    />
                    <div className="mt-2 flex flex-col items-center">
                        {profilePicPreview ? (
                            <img src={profilePicPreview}
                                alt="Profile Preview"
                                className="w-20 h-20 rounded-full border shadow object-cover" />
                        ) : (
                            <span className="block text-xs text-gray-400">No picture selected</span>
                        )}
                    </div>
                </div>
                {/* Inputs */}
                <div className="flex-1 space-y-2">
                    <input
                        className="w-full border p-2 rounded"
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        className="w-full border p-2 rounded"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="w-full border p-2 rounded"
                        type="text"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                    <input
                        className="w-full border p-2 rounded"
                        type="text"
                        placeholder="Tags (comma separated: Family, Work)"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition font-semibold mt-2 w-full sm:w-auto"
                    >
                        ➕ Add Contact
                    </button>
                </div>
            </div>
        </form>
    );
}
