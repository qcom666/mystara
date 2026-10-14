"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { GlassPanel } from "@/components/ui/glass-panel";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLocale, useTranslation } from "@/lib/i18n";
import { CITIES, getCityById, localizeCity } from "@/modules/astrology/domain/cities.data";

export interface NatalChartFormValue {
  name: string;
  year: number;
  month: number;
  day: number;
  hasExactTime: boolean;
  hour: number;
  minute: number;
  placeLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface NatalChartInputFormProps {
  onSubmit: (value: NatalChartFormValue) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
// Список часовых поясов для ручного ввода: те же пояса, что у городов из справочника, плюс UTC.
// Это намеренно не полный список IANA: собственной базы часовых поясов в приложении нет
// (см. описание модуля в cities.data.ts).
const MANUAL_TIMEZONES = Array.from(new Set(["UTC", ...CITIES.map((city) => city.timezone)])).sort();

export function NatalChartInputForm({ onSubmit }: NatalChartInputFormProps) {
  const t = useTranslation();
  const { locale } = useLocale();

  const [name, setName] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [hasExactTime, setHasExactTime] = useState(true);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [cityId, setCityId] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [manualTz, setManualTz] = useState(MANUAL_TIMEZONES[0]);
  const [error, setError] = useState<string | null>(null);

  const sortedCities = useMemo(
    () =>
      [...CITIES]
        .map((city) => ({ city, label: localizeCity(city, locale) }))
        .sort((a, b) => a.label.name.localeCompare(b.label.name, locale)),
    [locale],
  );

  function submit() {
    if (!dateValue) {
      setError(t.common.invalidDateError);
      return;
    }
    const [year, month, day] = dateValue.split("-").map(Number);
    if (!year || !month || !day) {
      setError(t.common.invalidDateError);
      return;
    }

    let latitude: number;
    let longitude: number;
    let timezone: string;
    let placeLabel: string;

    if (manualEntry) {
      latitude = Number(manualLat);
      longitude = Number(manualLon);
      timezone = manualTz;
      placeLabel = "";
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !manualLat || !manualLon) {
        setError(t.natalChartPage.generateError);
        return;
      }
    } else {
      const city = getCityById(cityId);
      if (!city) {
        setError(t.natalChartPage.generateError);
        return;
      }
      latitude = city.latitude;
      longitude = city.longitude;
      timezone = city.timezone;
      placeLabel = `${localizeCity(city, locale).name}, ${localizeCity(city, locale).country}`;
    }

    setError(null);
    onSubmit({ name, year, month, day, hasExactTime, hour: hasExactTime ? hour : 12, minute: hasExactTime ? minute : 0, placeLabel, latitude, longitude, timezone });
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }


  return (
    <GlassPanel className="mx-auto w-full max-w-md">
      <h1 className="font-display text-2xl text-silver-50">{t.natalChartPage.formTitle}</h1>
      <form id="natal-chart-form" onSubmit={handleFormSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="natal-name">{t.natalChartPage.nameLabel}</Label>
          <Input id="natal-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="natal-date">{t.natalChartPage.dateLabel}</Label>
          <DatePicker id="natal-date" required max={TODAY} value={dateValue} onChange={setDateValue} />
        </div>

        <div className="flex items-start gap-2.5">
          <input
            id="natal-time-known"
            type="checkbox"
            checked={hasExactTime}
            onChange={(event) => setHasExactTime(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-gold-400"
          />
          <Label htmlFor="natal-time-known" className="cursor-pointer font-normal">
            {t.natalChartPage.timeKnownLabel}
          </Label>
        </div>

        {hasExactTime ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="natal-hour">{t.natalChartPage.hourLabel}</Label>
              <Select id="natal-hour" value={hour} onChange={(event) => setHour(Number(event.target.value))}>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="natal-minute">{t.natalChartPage.minuteLabel}</Label>
              <Select id="natal-minute" value={minute} onChange={(event) => setMinute(Number(event.target.value))}>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-xs text-silver-500">{t.natalChartPage.timeUnknownHint}</p>
        )}

        <div className="space-y-1.5">
          <Label>{t.natalChartPage.placeLabel}</Label>
          {!manualEntry && (
            <Select value={cityId} onChange={(event) => setCityId(event.target.value)}>
              <option value="" disabled>
                {t.natalChartPage.citySelectPlaceholder}
              </option>
              {sortedCities.map(({ city, label }) => (
                <option key={city.id} value={city.id}>
                  {label.name}, {label.country}
                </option>
              ))}
            </Select>
          )}
          <label className="flex items-center gap-2 text-xs text-silver-400">
            <input type="checkbox" checked={manualEntry} onChange={(event) => setManualEntry(event.target.checked)} className="h-3.5 w-3.5 accent-gold-400" />
            {t.natalChartPage.cityNotListed}
          </label>
          {manualEntry && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="natal-lat">{t.natalChartPage.manualLatitudeLabel}</Label>
                <Input id="natal-lat" type="number" step="0.01" min={-90} max={90} value={manualLat} onChange={(event) => setManualLat(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="natal-lon">{t.natalChartPage.manualLongitudeLabel}</Label>
                <Input id="natal-lon" type="number" step="0.01" min={-180} max={180} value={manualLon} onChange={(event) => setManualLon(event.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="natal-tz">{t.natalChartPage.manualTimezoneLabel}</Label>
                <Select id="natal-tz" value={manualTz} onChange={(event) => setManualTz(event.target.value)}>
                  {MANUAL_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <PrimaryActionBar>
          <Button type="submit" form="natal-chart-form" className="w-full">
            {t.natalChartPage.generateCta}
          </Button>
        </PrimaryActionBar>
      </form>
    </GlassPanel>
  );
}
