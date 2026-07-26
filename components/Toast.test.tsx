import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { Toast } from "./Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("2.8 soniyadan keyin yopiladi", () => {
    const onDone = vi.fn();
    render(<Toast message="Saqlandi" onDone={onDone} />);

    act(() => void vi.advanceTimersByTime(2799));
    expect(onDone).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("ota komponent qayta render bo'lganda taymer QAYTA boshlanmaydi", () => {
    // Chaqiruvchilar `onDone={() => setToast(null)}` deb inline arrow uzatadi —
    // har renderda yangi havola. Agar u useEffect bog'liqligida tursa, ota
    // komponent har qayta renderda taymerni nolga qaytarardi va xabar
    // ekranda abadiy qolib ketardi (masalan hisob maydoniga yozayotganda).
    const onDone = vi.fn();
    const { rerender } = render(<Toast message="Saqlandi" onDone={() => onDone()} />);

    act(() => void vi.advanceTimersByTime(1500));
    rerender(<Toast message="Saqlandi" onDone={() => onDone()} />);
    act(() => void vi.advanceTimersByTime(1500));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
