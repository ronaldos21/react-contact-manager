import React, { useState, useEffect, useRef } from "react";
import ContactForm from "./components/ContactForm";
import ContactList from "./components/ContactList";
import SearchBar from "./components/SearchBar";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState('');

  const fetchContacts = async () => {
    try {
      const response = await fetch("http://localhost:3001/contacts");
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  //Download Template CSV Button
  const handleDownloadTemplate = () => {
    const template = "name,email,phone,tags,favorite,profilePic\n";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "contacts_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };



  const fileInputRef = useRef();

  // --- Export CSV Handler ---
  const handleExportCSV = async () => {
    try {
      const res = await fetch('http://localhost:3001/contacts/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Contacts exported successfully!");
    } catch (err) {
      toast.error("Failed to export CSV.");
    }
  };

  // --- Import CSV Handler ---
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('csv', file);
    try {
      const res = await fetch('http://localhost:3001/contacts/import', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Imported ${result.count || 0} contacts!`);
        fetchContacts();
      } else {
        if (result.errors && result.errors.length > 0) {
          toast.error(
            <>
              <div>Some contacts could not be imported:</div>
              <ul className="pl-4 list-disc">
                {result.errors.slice(0, 3).map((err, idx) =>
                  <li key={idx}>{err.contact.name || err.contact.email}: {err.error}</li>
                )}
                {result.errors.length > 3 && <li>...and more</li>}
              </ul>
            </>,
            { autoClose: 8000 }
          );
        } else {
          toast.error(result.message || "Failed to import.");
        }
      }
    } catch (err) {
      toast.error("Failed to import CSV.");
    }
  };





  const deleteContact = async (id) => {
    try {
      await fetch(`http://localhost:3001/contacts/${id}`, {
        method: 'DELETE'
      });
      fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const updateContact = async (id, updatedData) => {
    try {
      await fetch(`http://localhost:3001/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      fetchContacts();
    } catch (err) {
      console.error('Error updating contact:', err);
    }
  };

  // Gather all unique tags for filtering
  const allTags = Array.from(
    new Set(
      contacts
        .flatMap(c => (c.tags ? c.tags.split(',').map(tag => tag.trim()) : []))
        .filter(Boolean)
    )
  );

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts by search and tag
  const filteredContacts = contacts
    .filter(
      c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )
    .filter(
      c =>
        !tagFilter ||
        (c.tags && c.tags.split(',').map(tag => tag.trim()).includes(tagFilter))
    );


  return (
    // Outermost div applies subtle background and always fills screen height
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 sm:p-8 max-w-2xl w-full mx-auto rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-blue-600 mb-4 flex items-center gap-2">
          <span role="img" aria-label="contacts">📇</span> Contact Manager
        </h1>
        <ToastContainer />
        <ContactForm onAdd={fetchContacts} />
        <SearchBar search={search} setSearch={setSearch} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label htmlFor="tagFilter" className="font-semibold">Filter by Tag:</label>
          <select
            id="tagFilter"
            className="border p-2 rounded-2xl"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
          >
            <option value="">All</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* --- CSV Import/Export Controls --- */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold transition"
          >
            ⬇️ Export CSV
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold transition"
          >
            ⬆️ Import CSV
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={handleDownloadTemplate}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-2 font-semibold transition"
          >
            📥 Download Template
          </button>
        </div>



        <ContactList
          contacts={filteredContacts}
          onDelete={deleteContact}
          onUpdate={updateContact}
          search={search}
        />
      </div>
    </div>
  );
}

