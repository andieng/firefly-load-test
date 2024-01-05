import { check } from "k6";
import http from "k6/http";

const accessToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxNyIsImp0aSI6IjI5ODJmMGNkNGI2MjJlMTg1YmU5YzMxOWMwNDVmNDdkYzhlNDI1MGIxYmI4NmRmY2Y2Yjc3NDE0YjkyMGE5ZDhmNjFjOGVlNWU4OWM0OThiIiwiaWF0IjoxNzA0NDQ1NjI5LjA1NDYyNywibmJmIjoxNzA0NDQ1NjI5LjA1NDYzMSwiZXhwIjoxNzM2MDY4MDI3LjAzNjcxNCwic3ViIjoiMTQiLCJzY29wZXMiOltdfQ.1YxCX5sibFbhEN1aSx2QQGejRUK-H8dd12_EN30Xa66Om3vr1Q69DiR4rgaQ1khQ51qr01qX9cUXhkCEKsgYobLBTkyfzFyCxv55PCup9OTfNbYJprSheKdrRTvj2otvbi4i0YRfyEDaPGUerjRpsuEfCU8g5raU5pUyEMX_2bnVmw9vFH7j176gqPvb5pvkqZfM4Mfxx9Z7fF_4X2ku1PkZs3mDznzgUgUmyAoVLMYyawVxndg7qoZwQXouTMF0l9qEqcMEbZmPt20-6guavN6vn1jZy8FdtxPOzIBFK7VNDw61srrFEXNK-eo8RGcrsFDtvfsLsB-lfcbtDs63_e_YPmQ59BKVraULyCNKZeI_XjN-tSwB2fEhbRODEajyiuCgumZ1lsw7kF321x9p2xnKfFdsD0AIcqbpUXsRKo2tCMpr2rGFmjM5l6dGGxSehQJD4nz9IHftcDlTKB3sNxWGeHrMEBv9wCpdKgQsRcF-OMrJAwsgH4RW1ciei0hy1IQm7ykK8RRcEUXNH9-Tyay_7ALDK9p7sxs0OFFi9hxXxwGJvUWreyXUnLI56-BmrPV6izeSeMoq3jY-yMuj1C85ZLbx4WKR4EP838nc-7-9sWzSaeq-KzFPrd4o_w4WqXShz-YIyoPKhzf5RZ_Xsia0FKwyM_KA4PyDC2JiWY0";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
};

const baseUrl = "https://firefly.buudadawg.online/api";

export const options = {
  thresholds: {
    checks: ["rate>0.9"], // the rate of successful checks should be higher than 90%
  },
  scenarios: {
    bills_scenario: {
      executor: "ramping-vus",
      exec: "about", // declare which function to execute
      stages: [
        { duration: "5s", target: 2 }, // traffic ramp-up from 1 to 100 users over 30 seconds.
        { duration: "5s", target: 2 }, // stay at 100 users for 30 seconds
        { duration: "5s", target: 0 }, // ramp-down to 0 users
      ],
    },
  },
};

export function about() {
  const res = http.get(`${baseUrl}/v1/about/user`, {
    headers,
  });
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
}
