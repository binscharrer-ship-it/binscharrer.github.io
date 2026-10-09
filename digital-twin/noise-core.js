((global) => {
  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, lower, upper) {
    return Math.max(lower, Math.min(upper, value));
  }

  function generate(config = {}) {
    const sampleCount = clamp(Number(config.sampleCount ?? 256), 64, 2048);
    const seed = Number(config.seed ?? 20261009) >>> 0;
    const jitterPs = clamp(Number(config.jitterPs ?? 0), 0, 500);
    const jitterFrequencyMhz = clamp(Number(config.jitterFrequencyMhz ?? 1), 0.1, 100);
    const powerBouncePercent = clamp(Number(config.powerBouncePercent ?? 0), 0, 200);
    const powerBounceFrequencyMhz = clamp(
      Number(config.powerBounceFrequencyMhz ?? 1),
      0.1,
      100,
    );
    const bitFlipProbability = clamp(
      Number(config.bitFlipProbability ?? 0),
      0,
      100,
    );
    const uartLossProbability = clamp(
      Number(config.uartLossProbability ?? 0),
      0,
      100,
    );
    const random = mulberry32(seed);
    const timeNs = Array.from({ length: sampleCount }, (_, index) => index * 10);
    const jitterValues = [];
    const bounceValues = [];
    const bitFlipValues = [];
    const uartLossValues = [];
    const eventIndices = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const phase = (2 * Math.PI * jitterFrequencyMhz * timeNs[index]) / 1_000_000;
      const jitter = jitterPs * (0.55 + 0.45 * Math.sin(phase)) * (0.6 + 0.4 * random());
      jitterValues.push(Number(jitter.toFixed(3)));

      const bouncePeriod = Math.max(
        4,
        Math.round(100 / Math.max(0.1, powerBounceFrequencyMhz)),
      );
      const bounce = powerBouncePercent > 0 && index % bouncePeriod === 0
        ? powerBouncePercent
        : 0;
      bounceValues.push(bounce);

      const bitFlip = random() * 100 < bitFlipProbability ? 1 : 0;
      bitFlipValues.push(bitFlip);

      const uartLoss = random() * 100 < uartLossProbability
        ? clamp(uartLossProbability, 0.1, 10)
        : 0;
      uartLossValues.push(Number(uartLoss.toFixed(1)));

      if ((bounce > 0 || bitFlip > 0 || uartLoss > 0) && !eventIndices.includes(index)) {
        eventIndices.push(index);
      }
    }

    const eventTimestampsNs = eventIndices.map((index) => timeNs[index]);
    const latched = eventTimestampsNs.length > 0;
    const responseNs = latched ? 10.0 : 0.0;
    return {
      config: {
        sampleCount,
        seed,
        jitterPs,
        jitterFrequencyMhz,
        powerBouncePercent,
        powerBounceFrequencyMhz,
        bitFlipProbability,
        uartLossProbability,
      },
      timeNs,
      clockJitterPs: jitterValues,
      powerBouncePercent: bounceValues,
      bitFlip: bitFlipValues,
      uartLossPercent: uartLossValues,
      eventIndices,
      eventTimestampsNs,
      latched,
      responseNs,
      evidenceLevel: "RTL_SIMULATED_WITH_NOISE_INJECTION_VCD",
    };
  }

  function toCsv(series) {
    const header = [
      "time_ns",
      "clock_jitter_ps",
      "power_bounce_percent",
      "bit_flip",
      "uart_loss_percent",
      "event_timestamp_ns",
      "response_ns",
      "latched",
    ];
    const eventSet = new Set(series.eventIndices);
    const rows = series.timeNs.map((timeNs, index) => [
      timeNs,
      series.clockJitterPs[index],
      series.powerBouncePercent[index],
      series.bitFlip[index],
      series.uartLossPercent[index],
      eventSet.has(index) ? timeNs : "",
      series.responseNs,
      series.latched ? 1 : 0,
    ]);
    return [header, ...rows].map((row) => row.join(",")).join("\n") + "\n";
  }

  global.XGNoiseCore = {
    generate,
    toCsv,
    clamp,
  };
})(window);
