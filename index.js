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

    // 90% of requests must finish within 10s, 95% within 12s, and 99.9% within 15s
    // The longest response time should be less than 20s
    http_req_duration: [
      "p(90) < 10000",
      "p(95) < 12000",
      "p(99.9) < 15000",
      "max < 20000",
    ],

    // The rate of failed actions should be less than 10%
    failed_bill_list_fetches: ["rate<0.1"],
    failed_bill_storing: ["rate<0.1"],
    failed_bill_deletion: ["rate<0.1"],
  },
  scenarios: {
    bills_scenario: {
      executor: "ramping-vus",
      exec: "bills", // declare which function to execute
      stages: [
        { duration: "1m", target: 80 }, // traffic ramp-up from 1 to 80 users over 1 minute.
        { duration: "1m", target: 80 }, // stay at 80 users for 1 minute
        { duration: "1m", target: 0 }, // ramp-down to 0 users
      ],
    },
  },
};

let billIndex = 0;

const generateBill = () => {
  billIndex++;
  return {
    name: `Test bill ${billIndex}`,
    currency_id: "1",
    amount_min: "123.45",
    amount_max: "300",
    date: "2023-08-15T12:46:47+01:00",
    end_date: "2024-01-15T12:46:47+01:00",
    extension_date: "2024-06-15T12:46:47+01:00",
    repeat_freq: "monthly",
    skip: 0,
    active: true,
    notes: "Some example notes",
  };
};

const billListFailRate = new Rate("failed_bill_list_fetches");
const storeBillFailRate = new Rate("failed_bill_storing");
const deleteBillFailRate = new Rate("failed_bill_deletion");

export function bills() {
  // Get bill list
  const resGetBillList = http.get(`${baseUrl}/v1/bills`, {
    headers,
  });
  billListFailRate.add(resGetBillList.status !== 200);

  // Store new bill
  const newBill = generateBill();
  const resStoreBill = http.post(
    `${baseUrl}/v1/bills`,
    JSON.stringify(newBill),
    {
      headers,
    }
  );
  storeBillFailRate.add(resStoreBill.status !== 200);

  // Delete bill
  const billId = resStoreBill.json().data.id;
  const resDeleteBill = http.del(`${baseUrl}/v1/bills/${billId}`, null, {
    headers,
  });
  deleteBillFailRate.add(resDeleteBill.status !== 204);
}
