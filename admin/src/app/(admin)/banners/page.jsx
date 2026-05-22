"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

const API_URL =
  api.defaults.baseURL || "http://localhost:5010/api";

export default function BannersPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [activeTab, setActiveTab] =
    useState("promo");

    
  const [promoBanners, setPromoBanners] =
    useState([]);

  const [rushDeals, setRushDeals] =
    useState([]);

  const [restaurants, setRestaurants] =
    useState([]);

  const [menuItems, setMenuItems] =
    useState([]);

    const [selectedItemPrice, setSelectedItemPrice] =
  useState(0);



  // ============================================================
  // PROMO FORM
  // ============================================================

  const [promoForm, setPromoForm] =
    useState({

      title: "",
      image: "",
      link: "",

      imageFile: null,
    });

  // ============================================================
  // RUSH DEAL FORM
  // ============================================================

  const [rushForm, setRushForm] =
    useState({

      restaurant_id: "",

      menuItem: "",

      discountPrice: "",

      discountPercent: "",

      endsAt: "",
    });

  // ============================================================
  // FETCH INITIAL DATA
  // ============================================================

  useEffect(() => {

    fetchPromoBanners();

    fetchRushDeals();

    fetchRestaurants();

  }, []);

  // ============================================================
  // API CALLS
  // ============================================================

  const fetchPromoBanners =
    async () => {

      try {

        const res =
          await api.get(
            "/banners"
          );

        setPromoBanners(
          res.data.data || []
        );

      } catch (err) {

        console.error(err);
      }
    };

  const fetchRushDeals =
    async () => {

      try {

        const res =
          await api.get(
            "/rush-deals"
          );

        setRushDeals(
          res.data.data || []
        );

      } catch (err) {

        console.error(err);
      }
    };

  const fetchRestaurants =
    async () => {

      try {

        const res =
          await api.get(
            "/restaurants"
          );

        setRestaurants(
          res.data.data || []
        );

      } catch (err) {

        console.error(err);
      }
    };

  const fetchRestaurantMenu =
    async (restaurantId) => {

      try {

        const res =
          await api.get(
            `/restaurant/${restaurantId}`
          );

        setMenuItems(
          res.data.data.menu || []
        );

      } catch (err) {

        console.error(err);
      }
    };

  // ============================================================
  // CREATE PROMO BANNER
  // ============================================================

  const handleCreatePromo =
    async (e) => {

      e.preventDefault();

      try {

        const formData =
          new FormData();

        formData.append(
          "title",
          promoForm.title
        );

        formData.append(
          "image",
          promoForm.image
        );

        formData.append(
          "link",
          promoForm.link
        );

        if (promoForm.imageFile) {

          formData.append(
            "imageFile",
            promoForm.imageFile
          );
        }

        await api.post(

          "/admin/banners",

          formData,

          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        setPromoForm({

          title: "",
          image: "",
          link: "",
          imageFile: null,
        });

        fetchPromoBanners();

      } catch (err) {

        console.error(err);
      }
    };

  // ============================================================
  // CREATE RUSH DEAL
  // ============================================================

  const handleCreateRushDeal =
    async (e) => {

      e.preventDefault();

      try {

        await api.post(

          "/admin/rush-deals",

          rushForm
        );

        setRushForm({

          restaurant_id: "",
          menuItem: "",
          discountPrice: "",
          discountPercent: "",
          endsAt: "",
        });

        fetchRushDeals();

      } catch (err) {

        console.error(err);
      }
    };

  // ============================================================
  // DELETE
  // ============================================================

  const deletePromoBanner =
    async (id) => {

      try {

        await api.delete(

          `/admin/banners/${id}`
        );

        fetchPromoBanners();

      } catch (err) {

        console.error(err);
      }
    };

  const deleteRushDeal =
    async (id) => {

      try {

        await api.delete(

          `/admin/rush-deals/${id}`
        );

        fetchRushDeals();

      } catch (err) {

        console.error(err);
      }
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="space-y-8 p-6">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div>

        <h1 className="text-3xl font-bold">
          Banner Management
        </h1>

        <p className="mt-1 text-slate-400">
          Manage promo banners and rush deals
        </p>
      </div>

      {/* ===================================================== */}
      {/* TABS */}
      {/* ===================================================== */}

      <div className="flex gap-3">

  <button
    onClick={() =>
      setActiveTab("promo")
    }

    className={`rounded-xl border px-5 py-2 font-medium transition-all ${
      activeTab === "promo"

        ? "border-slate-900 bg-slate-900 text-white shadow-lg"

        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
    }`}
  >
    Promo Banners
  </button>

  <button
    onClick={() =>
      setActiveTab("rush")
    }

    className={`rounded-xl border px-5 py-2 font-medium transition-all ${
      activeTab === "rush"

        ? "border-slate-900 bg-slate-900 text-white shadow-lg"

        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
    }`}
  >
    Rush Deals
  </button>

</div>

      {/* ===================================================== */}
      {/* PROMO BANNERS */}
      {/* ===================================================== */}

      {activeTab === "promo" && (

        <div className="space-y-8">

          {/* CREATE */}
<form
  onSubmit={handleCreatePromo}
  className="
    grid
    gap-6
    rounded-3xl
    border
    border-slate-800
    bg-[#081028]
    p-8
    shadow-2xl
  "
>

  <div>

    <h2 className="
      text-2xl
      font-bold
      text-white
    ">
      Add Promo Banner
    </h2>

    <p className="
      mt-1
      text-sm
      text-slate-400
    ">
      Manage homepage promotional banners
    </p>

  </div>

  {/* ====================================================== */}
  {/* TITLE */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Banner Title
    </label>

    <input

      type="text"

      value={promoForm.title}

      onChange={(e) =>
        setPromoForm({

          ...promoForm,

          title:
            e.target.value,
        })
      }

      className="
        w-full
        rounded-2xl
        border
        border-slate-700
        bg-slate-800
        p-4
        text-white
        outline-none
        transition
        focus:border-orange-900
      "
    />

  </div>

  {/* ====================================================== */}
  {/* IMAGE URL */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Image URL
    </label>

    <input

      type="text"

      value={promoForm.image}

      onChange={(e) =>
        setPromoForm({

          ...promoForm,

          image:
            e.target.value,
        })
      }

      className="
        w-full
        rounded-2xl
        border
        border-slate-700
        bg-slate-800
        p-4
        text-white
        outline-none
        transition
        focus:border-orange-900
      "
    />

  </div>

  {/* ====================================================== */}
  {/* FILE UPLOAD */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Upload Banner Image
    </label>

    <div className="
      flex
      items-center
      gap-4
      rounded-2xl
      border
      border-slate-700
      bg-slate-800
      p-4
    ">

      <input

        type="file"

        accept="image/*"

        onChange={(e) =>
          setPromoForm({

            ...promoForm,

            imageFile:
              e.target.files[0],
          })
        }

        className="
          w-full
          text-sm
          text-slate-300
          file:mr-4
          file:rounded-xl
          file:border-0
          file:bg-orange-500
          file:px-4
          file:py-2
          file:font-semibold
          file:text-white
          hover:file:bg-orange-600
        "
      />

    </div>

    {promoForm.imageFile && (

      <p className="
        mt-2
        text-sm
        text-emerald-400
      ">
        Selected:
        {" "}
        {promoForm.imageFile.name}
      </p>
    )}

  </div>

  {/* ====================================================== */}
  {/* REDIRECT LINK */}
  {/* ====================================================== */}



  {/* ====================================================== */}
  {/* PREVIEW */}
  {/* ====================================================== */}

  {(promoForm.image ||
    promoForm.imageFile) && (

    <div className="
      overflow-hidden
      rounded-3xl
      border
      border-slate-700
      bg-slate-900
    ">

      <div
        className="
          h-64
          w-full
          bg-cover
          bg-center
        "

        style={{

          backgroundImage:
            promoForm.image

              ? `url(${promoForm.image})`

              : promoForm.imageFile

              ? `url(${URL.createObjectURL(
                  promoForm.imageFile
                )})`

              : "none",
        }}
      />

      <div className="p-5">

        <h3 className="
          text-xl
          font-bold
          text-white
        ">
          {promoForm.title ||
            "Banner Preview"}
        </h3>

      <p className="
  mt-2
  text-sm
  text-slate-400
">
  Promo Banner Preview
</p>

      </div>

    </div>
  )}

  {/* ====================================================== */}
  {/* BUTTON */}
  {/* ====================================================== */}

  <button
    type="submit"
    className="
      rounded-2xl
      bg-white
      px-5
      py-4
      text-lg
      font-bold
      text-black
      transition
      hover:scale-[1.01]
      hover:bg-orange-500
      hover:text-white
    "
  >
    Create Banner
  </button>

</form>

          {/* LIST */}

          <div className="grid gap-5 md:grid-cols-2 text-white">

            {promoBanners.map((banner) => {

              const imageUrl =
                banner.image ||
                `${API_URL}/banners/image/${banner._id}`;

              return (

                <div
                  key={banner._id}
                  className="overflow-hidden rounded-2xl bg-slate-900"
                >

                  <div
                    className="h-52 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        `url(${imageUrl})`,
                    }}
                  />

                  <div className="space-y-2 p-4">

                    <h3 className="text-lg font-semibold">
                      {banner.title}
                    </h3>

                    {/* <p className="text-sm text-slate-400">
                      {banner.link}
                    </p> */}

                    <button

                      onClick={() =>
                        deletePromoBanner(
                          banner._id
                        )
                      }

                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* RUSH DEALS */}
      {/* ===================================================== */}

      {activeTab === "rush" && (

        <div className="space-y-8">

          {/* CREATE */}

         <form
  onSubmit={handleCreateRushDeal}
  className="
    grid
    gap-6
    rounded-3xl
    border
    border-slate-800
    bg-[#081028]
    p-8
    shadow-2xl
  "
>

  <div>
    <h2 className="text-2xl font-bold text-white">
      Create Rush Deal
    </h2>

    <p className="mt-1 text-sm text-slate-400">
      Configure flash discounts and limited offers
    </p>
  </div>

  {/* ====================================================== */}
  {/* RESTAURANT */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Restaurant
    </label>

    <select

      value={rushForm.restaurant_id}

      onChange={(e) => {

        setRushForm({

          ...rushForm,

          restaurant_id:
            e.target.value,

          menuItem: "",
        });

        setSelectedItemPrice(0);

        fetchRestaurantMenu(
          e.target.value
        );
      }}

      className="
        w-full
        rounded-2xl
        border
        border-slate-700
        bg-slate-800
        p-4
        text-white
        outline-none
        transition
        focus:border-orange-900
      "
    >

      <option value="">
        Select Restaurant
      </option>

      {restaurants.map((r) => (

        <option
          key={r._id}
          value={r._id}
        >
          {r.name}
        </option>
      ))}

    </select>

  </div>

  {/* ====================================================== */}
  {/* MENU ITEM */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Dish
    </label>

    <select

      value={rushForm.menuItem}

      onChange={(e) => {

        const selected =
          menuItems.find(
            (m) =>
              m._id === e.target.value
          );

        setSelectedItemPrice(
          selected?.price || 0
        );

        setRushForm({

          ...rushForm,

          menuItem:
            e.target.value,

          discountPrice:
            selected?.price || "",

          discountPercent: 0,
        });
      }}

      className="
        w-full
        rounded-2xl
        border
        border-slate-700
        bg-slate-800
        p-4
        text-white
        outline-none
        transition
        focus:border-orange-900
      "
    >

      <option value="">
        Select Dish
      </option>

      {menuItems.map((m) => (

        <option
          key={m._id}
          value={m._id}
        >
          {m.name} — ₹{m.price}
        </option>
      ))}

    </select>

  </div>

  {/* ====================================================== */}
  {/* ORIGINAL PRICE */}
  {/* ====================================================== */}

  {selectedItemPrice > 0 && (

    <div className="
      rounded-2xl
      border
      border-slate-700
      bg-slate-900/60
      p-4
    ">

      <p className="text-sm text-slate-400">
        Original Price
      </p>

      <h3 className="
        mt-1
        text-3xl
        font-bold
        text-white
      ">
        ₹{selectedItemPrice}
      </h3>

    </div>
  )}

  {/* ====================================================== */}
  {/* DISCOUNT GRID */}
  {/* ====================================================== */}

  <div className="grid gap-5 md:grid-cols-2">

    {/* FINAL PRICE */}

    <div className="relative">

      <label className="
        absolute
        -top-2.5
        left-3
        z-10
        bg-[#081028]
        px-2
        text-xs
        font-semibold
        text-orange-400
      ">
        Final Price
      </label>

      <input

        type="number"

        value={
          rushForm.discountPrice
        }

        onChange={(e) => {

          const value =
            Number(e.target.value);

          const percent =
            selectedItemPrice > 0

              ? Math.round(
                  (
                    (
                      selectedItemPrice -
                      value
                    ) /
                    selectedItemPrice
                  ) * 100
                )

              : 0;

          setRushForm({

            ...rushForm,

            discountPrice:
              value,

            discountPercent:
              percent,
          });
        }}

        className="
          w-full
          rounded-2xl
          border
          border-slate-700
          bg-slate-800
          p-4
          text-white
          outline-none
          transition
          focus:border-orange-900
        "
      />

    </div>

    {/* DISCOUNT % */}

    <div className="relative">

      <label className="
        absolute
        -top-2.5
        left-3
        z-10
        bg-[#081028]
        px-2
        text-xs
        font-semibold
        text-orange-400
      ">
        Discount %
      </label>

      <input

        type="number"

        value={
          rushForm.discountPercent
        }

        onChange={(e) => {

          const percent =
            Number(e.target.value);

          const finalPrice =
            selectedItemPrice > 0

              ? Math.round(
                  selectedItemPrice *
                  (
                    1 -
                    percent / 100
                  )
                )

              : 0;

          setRushForm({

            ...rushForm,

            discountPercent:
              percent,

            discountPrice:
              finalPrice,
          });
        }}

        className="
          w-full
          rounded-2xl
          border
          border-slate-700
          bg-slate-800
          p-4
          text-white
          outline-none
          transition
          focus:border-orange-900
        "
      />

    </div>

  </div>

  {/* ====================================================== */}
  {/* SAVINGS */}
  {/* ====================================================== */}

  {selectedItemPrice > 0 &&
    rushForm.discountPrice > 0 && (

    <div className="
      rounded-2xl
      border
      border-emerald-500/30
      bg-emerald-500/10
      p-4
    ">

      <p className="text-sm text-slate-300">
        Customer Saves
      </p>

      <h3 className="
        mt-1
        text-2xl
        font-bold
        text-emerald-400
      ">
        ₹
        {
          selectedItemPrice -
          rushForm.discountPrice
        }
      </h3>

    </div>
  )}

  {/* ====================================================== */}
  {/* ENDS AT */}
  {/* ====================================================== */}

  <div className="relative">

    <label className="
      absolute
      -top-2.5
      left-3
      z-10
      bg-[#081028]
      px-2
      text-xs
      font-semibold
      text-orange-400
    ">
      Deal Expiry
    </label>

    <input

      type="datetime-local"

      value={rushForm.endsAt}

      onChange={(e) =>
        setRushForm({

          ...rushForm,

          endsAt:
            e.target.value,
        })
      }

      className="
        w-full
        rounded-2xl
        border
        border-slate-700
        bg-slate-800
        p-4
        text-white
        outline-none
        transition
        focus:border-orange-900
        [color-scheme:dark]
      "
    />

  </div>

  {/* ====================================================== */}
  {/* BUTTON */}
  {/* ====================================================== */}

  <button
    type="submit"
    className="
      rounded-2xl
      bg-white
      px-5
      py-4
      text-lg
      font-bold
      text-black
      transition
      hover:scale-[1.01]
      hover:bg-orange-500
      hover:text-white
    "
  >
    Create Rush Deal
  </button>

</form>

          {/* LIST */}

          <div className="grid gap-5 md:grid-cols-2">

            {rushDeals.map((deal) => (

              <div
                key={deal._id}
                className="rounded-2xl bg-slate-900 p-5"
              >

                <h3 className="text-lg font-semibold text-white">
                  {deal.itemName}
                </h3>

                <p className="mt-1 text-slate-400">
                  Old Price:
                  ₹{deal.oldPrice}
                </p>

                {!!deal.discountPrice && (
                  <p className="text-green-400">
                    Deal Price:
                    ₹{deal.discountPrice}
                  </p>
                )}

                {!!deal.discountPercent && (
                  <p className="text-orange-400">
                    {deal.discountPercent}% OFF
                  </p>
                )}

                <p className="mt-2 text-sm text-slate-500">
                  Ends:
                  {" "}
                  {deal.endsAt
                    ? new Date(
                        deal.endsAt
                      ).toLocaleString()
                    : "No expiry"}
                </p>

                <button

                  onClick={() =>
                    deleteRushDeal(
                      deal._id
                    )
                  }

                  className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium"
                >
                  Delete
                </button>

              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}
