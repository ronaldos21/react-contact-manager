import React from "react";

export default function SearchBar({ search, setSearch }) {

    return (
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 w-full">
            <input
                className="w-full border p-2 rounded-2xl shadow-sm text-base bg-white"
                type="text"
                placeholder="🔍 Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
            />
            {search && (
                <button
                    onClick={() => setSearch("")}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-3 py-1 text-sm transition"
                >
                    Clear
                </button>
            )}
        </div>
    );
}