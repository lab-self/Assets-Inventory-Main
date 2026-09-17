import { z } from "zod";
import { query } from "../database/index.js";

export const operationalSettings = {
  "app.name": z.string().trim().min(1).max(80).default("Inventory Management"),
  "app.default_page_size": z.number().int().min(5).max(100).default(25),
  "asset.warranty_warning_days": z.number().int().min(1).max(365).default(30),
  "license.expiry_warning_days": z.number().int().min(1).max(365).default(30),
  "security.max_login_attempts": z.number().int().min(3).max(20).default(5),
  "security.lockout_minutes": z.number().int().min(1).max(1440).default(15),
};

export async function readOperationalSettings() {
  const result = await query<{ setting_key: string; setting_value: unknown }>(
    "SELECT setting_key, setting_value FROM settings WHERE is_active = TRUE AND setting_key = ANY($1::text[])",
    [Object.keys(operationalSettings)],
  );
  const values = Object.fromEntries(result.rows.map(row => [row.setting_key, row.setting_value]));
  return Object.fromEntries(Object.entries(operationalSettings).map(([key, schema]) => {
    const parsed = schema.safeParse(values[key]);
    return [key, parsed.success ? parsed.data : schema.parse(undefined)];
  })) as Record<keyof typeof operationalSettings, string | number>;
}

export function validateSetting(key: string, value: unknown) {
  if (Object.hasOwn(operationalSettings, key)) {
    return operationalSettings[key as keyof typeof operationalSettings].removeDefault().parse(value);
  }
  return z.json().parse(value);
}
