"use client";

import { useEffect, useState } from "react";

import api from "../../../lib/api";

import {
  Search,
  Plus,
  Shield,
  Mail,
  Calendar,
} from "lucide-react";

export default function StaffPage() {

  // =====================================================
  // STATE
  // =====================================================

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  // =====================================================
  // FETCH STAFF
  // =====================================================

  useEffect(() => {

    fetchStaff();

  }, []);

  const fetchStaff = async () => {

    try {

      setLoading(true);

      // uses your configured api.ts

      const res = await api.get(
        "admin/users"
      );

      console.log(
        "USERS:",
        res.data
      );

      // handle both formats safely

      const allUsers =
        res.data?.data ||
        res.data ||
        [];

      // only admin/staff
const staff = allUsers.filter(
  (u) => !["user", "restaurant"].includes(u.role)
);

      setUsers(staff);

    } catch (err) {

      console.error(
        "FAILED TO FETCH STAFF:",
        err
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredUsers =
    users.filter((u) => {

      const q =
        search.toLowerCase();

      return (
        u.name
          ?.toLowerCase()
          .includes(q) ||

        u.email
          ?.toLowerCase()
          .includes(q)
      );
    });

  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="space-y-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="
        flex
        items-center
        justify-between
      ">

        <div>

          <h1 className="
            text-3xl
            font-bold
            text-slate-900
          ">
            Staff Management
          </h1>

          <p className="
            mt-1
            text-sm
            text-slate-500
          ">
            Admin users with dashboard access
          </p>

        </div>

        <button className="
          flex
          items-center
          gap-2
          rounded-xl
          bg-slate-900
          px-4
          py-2.5
          text-sm
          font-medium
          text-white
          transition
          hover:bg-slate-800
        ">

          <Plus size={16} />

          Add Staff

        </button>

      </div>

      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <div className="
        relative
        w-full
        max-w-sm
      ">

        <Search
          size={16}
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }

          placeholder="Search staff..."

          className="
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            py-2.5
            pl-10
            pr-4
            text-sm
            outline-none
            transition
            focus:border-slate-400
          "
        />

      </div>

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loading && (

        <div className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-10
          text-center
          text-slate-400
          shadow-sm
        ">

          Loading staff...

        </div>
      )}

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      {!loading && (

        <div className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        ">

          <table className="w-full">

            {/* ============================================= */}
            {/* HEAD */}
            {/* ============================================= */}

            <thead className="
              border-b
              bg-slate-50
            ">

              <tr className="
                text-left
                text-sm
                text-slate-500
              ">

                <th className="p-4">
                  Staff
                </th>

                <th className="p-4">
                  Email
                </th>

                <th className="p-4">
                  Role
                </th>

                <th className="p-4">
                  Joined
                </th>

                <th className="p-4">
                  Actions
                </th>

              </tr>

            </thead>

            {/* ============================================= */}
            {/* BODY */}
            {/* ============================================= */}

            <tbody>

              {filteredUsers.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      p-10
                      text-center
                      text-slate-400
                    "
                  >

                    No staff found

                  </td>

                </tr>
              )}

              {filteredUsers.map((user) => (

                <tr
                  key={user._id}
                  className="
                    border-b
                    transition
                    hover:bg-slate-50
                  "
                >

                  {/* USER */}

                  <td className="p-4">

                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <div className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-slate-200
                        font-bold
                        uppercase
                      ">

                        {
                          user.name?.[0]
                        }

                      </div>

                      <div>

                        <p className="
                          font-medium
                          text-slate-900
                        ">

                          {user.name}

                        </p>

                        <p className="
                          text-xs
                          text-slate-400
                        ">

                          ID:
                          {" "}
                          {
                            user._id?.slice(-6)
                          }

                        </p>

                      </div>

                    </div>

                  </td>

                  {/* EMAIL */}

                  <td className="
                    p-4
                    text-sm
                    text-slate-600
                  ">

                    <div className="
                      flex
                      items-center
                      gap-2
                    ">

                      <Mail size={14} />

                      {user.email}

                    </div>

                  </td>

                  {/* ROLE */}

                  <td className="p-4">

                    <span className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      bg-blue-100
                      px-3
                      py-1
                      text-xs
                      font-medium
                      text-blue-700
                    ">

                      <Shield size={12} />

                      {user.role}

                    </span>

                  </td>

                  {/* JOINED */}

                  <td className="
                    p-4
                    text-sm
                    text-slate-500
                  ">

                    <div className="
                      flex
                      items-center
                      gap-2
                    ">

                      <Calendar size={14} />

                      {
                        user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "-"
                      }

                    </div>

                  </td>

                  {/* ACTIONS */}

                  <td className="p-4">

                    <div className="
                      flex
                      items-center
                      gap-2
                    ">

                      <button className="
                        rounded-lg
                        border
                        border-slate-200
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        transition
                        hover:bg-slate-100
                      ">

                        Edit

                      </button>

                      <button className="
                        rounded-lg
                        border
                        border-red-200
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-red-600
                        transition
                        hover:bg-red-50
                      ">

                        Remove

                      </button>

                    </div>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}