const BASE_URL = "http://localhost:5000/api/soil"; // Flask backend

export const getSoilData = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const addSoilData = async (data) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
