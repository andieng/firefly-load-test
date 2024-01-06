import http from "k6/http";
import { Rate } from "k6/metrics";

const accessToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxNyIsImp0aSI6IjI5ODJmMGNkNGI2MjJlMTg1YmU5YzMxOWMwNDVmNDdkYzhlNDI1MGIxYmI4NmRmY2Y2Yjc3NDE0YjkyMGE5ZDhmNjFjOGVlNWU4OWM0OThiIiwiaWF0IjoxNzA0NDQ1NjI5LjA1NDYyNywibmJmIjoxNzA0NDQ1NjI5LjA1NDYzMSwiZXhwIjoxNzM2MDY4MDI3LjAzNjcxNCwic3ViIjoiMTQiLCJzY29wZXMiOltdfQ.1YxCX5sibFbhEN1aSx2QQGejRUK-H8dd12_EN30Xa66Om3vr1Q69DiR4rgaQ1khQ51qr01qX9cUXhkCEKsgYobLBTkyfzFyCxv55PCup9OTfNbYJprSheKdrRTvj2otvbi4i0YRfyEDaPGUerjRpsuEfCU8g5raU5pUyEMX_2bnVmw9vFH7j176gqPvb5pvkqZfM4Mfxx9Z7fF_4X2ku1PkZs3mDznzgUgUmyAoVLMYyawVxndg7qoZwQXouTMF0l9qEqcMEbZmPt20-6guavN6vn1jZy8FdtxPOzIBFK7VNDw61srrFEXNK-eo8RGcrsFDtvfsLsB-lfcbtDs63_e_YPmQ59BKVraULyCNKZeI_XjN-tSwB2fEhbRODEajyiuCgumZ1lsw7kF321x9p2xnKfFdsD0AIcqbpUXsRKo2tCMpr2rGFmjM5l6dGGxSehQJD4nz9IHftcDlTKB3sNxWGeHrMEBv9wCpdKgQsRcF-OMrJAwsgH4RW1ciei0hy1IQm7ykK8RRcEUXNH9-Tyay_7ALDK9p7sxs0OFFi9hxXxwGJvUWreyXUnLI56-BmrPV6izeSeMoq3jY-yMuj1C85ZLbx4WKR4EP838nc-7-9sWzSaeq-KzFPrd4o_w4WqXShz-YIyoPKhzf5RZ_Xsia0FKwyM_KA4PyDC2JiWY0";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
};

const baseUrl = "https://firefly.buudadawg.online/api";

export const options = {
  thresholds: {
    // http errors should be less than 1%
    http_req_failed: ["rate < 0.01"],

    // 90% of requests must finish within 7s, 95% within 8s, and 99.9% within 10s
    // The longest response time should be less than 15s
    http_req_duration: [
      "p(90) < 7000",
      "p(95) < 8000",
      "p(99.9) < 10000",
      "max < 15000",
    ],

    // The rate of failed actions should be less than 10%
    failed_piggybank_list_fetches: ["rate<0.1"],
    failed_piggybank_storing: ["rate<0.1"],
    failed_piggybank_deletion: ["rate<0.1"],
  },
  scenarios: {
    piggybanks_scenario: {
      executor: "ramping-vus",
      exec: "piggybanks", // declare which function to execute
      stages: [
        { duration: "1m", target: 100 }, // traffic ramp-up from 1 to 100 users over 1 minute.
        { duration: "45s", target: 100 }, // stay at 100 users for 45 seconds
        { duration: "30s", target: 0 }, // ramp-down to 0 users
      ],
    },
  },
};

let piggybankIndex = 0;

const generatePiggybank = () => {
  piggybankIndex++;
  return {
    name: `Test piggybank ${piggybankIndex}`,
    account_id: "1",
    target_amount: "123.45",
    current_amount: "300",
    start_date: "2023-08-15T12:46:47+01:00",
    target_date: "2024-01-15T12:46:47+01:00",
    order:5,
    notes: "Some notes",
    object_group_id: "5",
    object_group_title: "Example Group"
    
  };
};

const piggybankListFailRate = new Rate("failed_piggybank_list_fetches");
const storePiggybankFailRate = new Rate("failed_piggybank_storing");
const deletePiggybankFailRate = new Rate("failed_piggybank_deletion");

export function piggybanks() {
  // Get piggybank list
  const resGetPiggybankList = http.get(`${baseUrl}/v1/piggy-banks`, {
    headers,
  });
  piggybankListFailRate.add(resGetPiggybankList.status !== 200);

  // Store new piggybank
  const newPiggybank = generatePiggybank();
  const resStorePiggybank = http.post(
    `${baseUrl}/v1/piggy-banks`,
    JSON.stringify(newPiggybank),
    {
      headers,
    }
  );
  storePiggybankFailRate.add(resStorePiggybank.status !== 200);
  storePiggybankFailRate.add(resStorePiggybank.headers["Content-Type"].includes("application/json"));
  // Delete piggybank
  const piggybankId = resStorePiggybank.json().data.id;
  const resDeletePiggybank = http.del(`${baseUrl}/v1/piggybanks/${piggybankId}`, null, {
    headers,
  });
  deletePiggybankFailRate.add(resDeletePiggybank.status !== 204);
}
