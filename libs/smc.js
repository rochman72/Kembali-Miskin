// =========================================
// OMOON SMART MONEY CONCEPT ENGINE vX FINAL
// =========================================

const SMC = {

    // ---------------------------
    // 1. SWING HIGH / SWING LOW
    // ---------------------------
    detectStructure(candles) {
        let swings = [];

        for (let i = 2; i < candles.length - 2; i++) {
            let c = candles;

            // Swing High
            if (
                c[i].high > c[i-1].high &&
                c[i].high > c[i-2].high &&
                c[i].high > c[i+1].high &&
                c[i].high > c[i+2].high
            ) {
                swings.push({ type: "SH", price: c[i].high, index: i });
            }

            // Swing Low
            if (
                c[i].low < c[i-1].low &&
                c[i].low < c[i-2].low &&
                c[i].low < c[i+1].low &&
                c[i].low < c[i+2].low
            ) {
                swings.push({ type: "SL", price: c[i].low, index: i });
            }
        }
        return swings;
    },

    // ---------------------------
    // 2. BOS / CHoCH Detection
    // ---------------------------
    detectBOS(swings) {
        if (swings.length < 3) return "Ranging";

        const last = swings[swings.length - 1];
        const prev = swings[swings.length - 2];

        if (last.type === "SH" && last.price > prev.price) return "BOS UP";
        if (last.type === "SL" && last.price < prev.price) return "BOS DOWN";

        return "Ranging";
    },

    // ---------------------------
    // 3. FAIR VALUE GAP (FVG)
    // ---------------------------
    detectFVG(candles) {
        let fvg = [];

        for (let i = 2; i < candles.length; i++) {
            let c0 = candles[i];
            let c1 = candles[i-1];
            let c2 = candles[i-2];

            // Bullish FVG
            if (c2.low > c0.high) {
                fvg.push({
                    type: "BULL",
                    gap: [c0.high, c2.low],
                    index: i
                });
            }

            // Bearish FVG
            if (c2.high < c0.low) {
                fvg.push({
                    type: "BEAR",
                    gap: [c2.high, c0.low],
                    index: i
                });
            }
        }
        return fvg;
    },

    // ---------------------------
    // 4. EQH / EQL (Equal High / Low)
    // ---------------------------
    detectEqualLevels(swings, tolerance = 0.0005) {
        let eqh = [], eql = [];

        for (let i = 1; i < swings.length; i++) {
            let s1 = swings[i];
            let s2 = swings[i - 1];

            // EQH
            if (s1.type === "SH" && s2.type === "SH") {
                if (Math.abs(s1.price - s2.price) <= tolerance) {
                    eqh.push([s1.price, s2.price]);
                }
            }

            // EQL
            if (s1.type === "SL" && s2.type === "SL") {
                if (Math.abs(s1.price - s2.price) <= tolerance) {
                    eql.push([s1.price, s2.price]);
                }
            }
        }

        return { eqh, eql };
    },

    // ---------------------------
    // 5. ORDERBLOCK DETECTION
    // ---------------------------
    detectOrderBlock(candles) {
        const last = candles[candles.length - 5]; // 5 candle back = stabil
        const second = candles[candles.length - 4];

        if (!last || !second) return null;

        // bullish OB = last bearish candle before BOS
        if (last.close < last.open && second.close > second.open) {
            return {
                type: "BULL",
                top: last.open,
                bottom: last.low
            };
        }

        // bearish OB = last bullish candle before BOS
        if (last.close > last.open && second.close < second.open) {
            return {
                type: "BEAR",
                top: last.high,
                bottom: last.close
            };
        }

        return null;
    },

    // ---------------------------
    // 6. OTE BUY/SELL ZONE
    // ---------------------------
    detectOTE(high, low) {
        const range = high - low;

        return {
            buy: {
                zone: [
                    low + range * 0.618,
                    low + range * 0.79
                ]
            },
            sell: {
                zone: [
                    high - range * 0.79,
                    high - range * 0.618
                ]
            }
        };
    },

    // ---------------------------
    // 7. BIAS ENGINE
    // ---------------------------
    detectBias(bos, fvg, orderblock) {
        if (bos === "BOS UP" || orderblock?.type === "BULL") return "BULLISH";
        if (bos === "BOS DOWN" || orderblock?.type === "BEAR") return "BEARISH";
        if (fvg.length > 0 && fvg[fvg.length - 1].type === "BULL") return "BULLISH";
        if (fvg.length > 0 && fvg[fvg.length - 1].type === "BEAR") return "BEARISH";
        return "NEUTRAL";
    },

    // ---------------------------
    // 8. RR CALCULATOR (Auto SL & TP)
    // ---------------------------
    rrCalc(entry, sl) {
        const risk = Math.abs(entry - sl);
        return {
            tp1: entry + risk * 1,
            tp2: entry + risk * 2,
            tp3: entry + risk * 3
        };
    },

    // ---------------------------
    // 9. SIGNAL ENGINE (Final Decision)
    // ---------------------------
    detectSignal(price, ote, bias) {

        if (price >= ote.buy.zone[0] && price <= ote.buy.zone[1] && bias === "BULLISH") {
            return "BUY";
        }

        if (price >= ote.sell.zone[0] && price <= ote.sell.zone[1] && bias === "BEARISH") {
            return "SELL";
        }

        return "WAIT";
    }
};
