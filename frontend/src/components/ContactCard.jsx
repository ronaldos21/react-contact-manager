// src/components/ContactCard.jsx
import React, { useState } from 'react';


function highlightText(text, highlight) {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    return text.split(regex).map((part, i) =>
        regex.test(part)
            ? <span key={i} className="bg-yellow-200 rounded px-1">{part}</span>
            : part
    );
}

function getAvatarUrl(contact) {
    // Prefer name, fallback to email
    const seed = contact.name || contact.email || 'User';
    // DiceBear Initials API
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`;

}

export default function ContactCard({ contact, onDelete, onUpdate, search }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [form, setForm] = useState({ ...contact });
    const [profilePicPreview, setProfilePicPreview] = useState(form.profilePic ? `http://localhost:3001/uploads/${contact.profilePic}` : '');

    const handleEditClick = () => setIsEditing(true);
    const handleCancel = () => {
        setForm({ ...contact });
        setProfilePicPreview(form.profilePic ? `http://localhost:3001/uploads/${contact.profilePic}` : '');
        setIsEditing(false);
    };

    const handleSave = () => {
        onUpdate(contact.id, form);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            onDelete(contact.id);
        }
    };

    return (
        <div className="border p-4 rounded-2xl shadow-sm hover:shadow-md transition bg-white w-full mb-4">
            {isEditing ? (

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    {/* Image preview and file upload */}
                    <div className="flex flex-col items-center justify-center w-full sm:w-auto">
                        <label className="block mb-1 font-semibold">Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                        alert('File is too large (max 2MB)');
                                        return;
                                    }
                                    if (!file.type.startsWith('image/')) {
                                        alert('Only image files are allowed.');
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
                                    setForm({ ...form, profilePic: data.filename });
                                }
                            }}
                            className="w-full"
                        />

                        <div className="mt-2 flex flex-col items-center">
                            {profilePicPreview || form.profilePic ? (
                                <>
                                    <img
                                        src={profilePicPreview || `http://localhost:3001/uploads/${form.profilePic}`}
                                        alt="Profile Preview"
                                        className="w-20 h-20 rounded-full border shadow"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    {/* Remove photo button */}
                                    {(form.profilePic || profilePicPreview) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...form, profilePic: '' });
                                                setProfilePicPreview('');
                                            }}
                                            className="mt-1 text-xs text-red-600 underline"
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="block text-xs text-gray-400">No picture selected</span>
                            )}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-2">
                        <input
                            className="w-full border p-2 rounded"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Name"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Email"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="Phone"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            placeholder="Tags (comma separated: Family, Work)"
                            value={form.tags || ''}
                            onChange={e => setForm({ ...form, tags: e.target.value })}
                        />

                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <button
                                onClick={handleSave}
                                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition">💾 Save</button>
                            <button
                                onClick={handleCancel}
                                className="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500 transition">Cancel</button>
                        </div>
                    </div >
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    {/* Avatar and Info */}
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                        <img
                            src={
                                contact.profilePic
                                    ? `http://localhost:3001/uploads/${contact.profilePic}`
                                    : getAvatarUrl(contact)
                            }
                            alt={contact.name}
                            className="w-16 h-16 sm:w-14 sm:h-14 rounded-full border object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-base sm:text-lg break-words">
                                {highlightText(contact.name, search)}
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base break-all">
                                {highlightText(contact.email, search)} <span className="mx-1">|</span>
                                {highlightText(contact.phone, search)}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {contact.tags && contact.tags.split(',').filter(Boolean).map(tag => (
                                    <span
                                        key={tag.trim()}
                                        className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs sm:text-sm mr-1 mt-1"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-row flex-wrap gap-2 items-center mt-2 sm:mt-0 sm:flex-col min-w-0">
                        <button
                            className={contact.favorite ? "text-yellow-400 text-2xl hover:scale-125" : "text-gray-400 text-2xl hover:scale-125"}
                            onClick={() => onUpdate(contact.id, { ...contact, favorite: !contact.favorite })}
                            title={contact.favorite ? "Remove from favorites" : "Add to favorites"}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', transition: 'transform 0.1s' }}
                        >
                            {contact.favorite ? "★" : "☆"}
                        </button>
                        <button
                            onClick={handleEditClick}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                        >✏️ Edit</button>
                        <button
                            onClick={handleDelete}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >🗑️</button>
                    </div>
                </div>
            )}
        </div>

    )
};
