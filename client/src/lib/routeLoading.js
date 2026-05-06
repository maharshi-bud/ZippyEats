export const startRouteLoader = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zippy-route-loading"));
  }
};
