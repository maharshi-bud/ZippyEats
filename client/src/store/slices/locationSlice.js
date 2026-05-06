// store/slices/locationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const locationSlice = createSlice({
  name: "location",
  initialState: {
    address: "Ahmedabad",
    label: "Home",
  },
  reducers: {
    setLocation: (state, action) => {
      state.address = action.payload;
    },
    setLabel: (state, action) => {
      state.label = action.payload;
    },
  },
});

export const { setLocation, setLabel } = locationSlice.actions;
export const selectLocation = (state) => state.location.address;
export const selectLocationLabel = (state) => state.location.label;
export default locationSlice.reducer;