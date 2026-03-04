import axios from "axios";
// used globallly to fetch data from backend we can use it everywhere
// instead of pasteing one bt we willcrearr it in store then we will use it 

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "/api",
  withCredentials: true,
});