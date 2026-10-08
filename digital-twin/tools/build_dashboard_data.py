from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "dashboard-data.js"

SOURCES = {
    "microfluidic": {
        "vcd": Path(r"D:\启发\XG_Microfluidic_Ratio\waveform\ratio_ctrl.vcd"),
        "summary": Path(r"D:\启发\XG_Microfluidic_Ratio\results\verification_summary.json"),
        "signals": {
            "safety_trip": "dbg_safety_trip",
            "cusum_alarm": "dbg_cusum_alarm",
            "cusum_score": "dbg_cusum_score",
            "mi_duty": "dbg_mi_duty",
            "dci_duty": "dbg_dci_duty",
            "valve_pwm": "valve_pwm",
            "pwm_enable": "pwm_enable",
        },
    },
    "ice": {
        "vcd": Path(r"D:\启发\XG_ICE_ClosedLoop_20261008\results\xsim\ice_closed_loop.vcd"),
        "summary": Path(r"D:\启发\XG_ICE_ClosedLoop_20261008\evidence\ice_summary.json"),
        "signals": {
            "sample_valid": "sample_valid",
            "correction_valid": "correction_valid",
            "knock_alert": "knock_alert",
            "cusum_score": "cusum_score",
            "pid_trim": "pid_trim",
            "predict_valid": "predict_valid",
            "predictive_trim": "predictive_trim",
            "adaptive_scale": "adaptive_scale",
            "spark_advance_cmd": "spark_advance_cmd",
            "injection_pw_cmd": "injection_pw_cmd",
            "spark_pwm": "spark_pwm",
            "injection_pwm": "injection_pwm",
        },
    },
}

SCALAR_SIGNALS = {
    "safety_trip",
    "cusum_alarm",
    "pwm_enable",
    "sample_valid",
    "correction_valid",
    "knock_alert",
    "predict_valid",
    "spark_pwm",
    "injection_pwm",
}


def parse_vcd(path: Path, wanted_names: dict[str, str]):
    target_to_key = {v: k for k, v in wanted_names.items()}
    name_to_symbol: dict[str, str] = {}
    symbol_to_key: dict[str, str] = {}
    transitions: dict[str, list[list[int]]] = {
        key: [] for key in wanted_names
    }
    in_defs = True
    current_time = 0

    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for raw in handle:
            line = raw.strip()
            if not line:
                continue

            if in_defs:
                if line == "$enddefinitions $end":
                    in_defs = False
                    continue
                if not line.startswith("$var "):
                    continue
                parts = line.split()
                if len(parts) < 5:
                    continue
                name = parts[4]
                if name in target_to_key and name not in name_to_symbol:
                    symbol = parts[3]
                    name_to_symbol[name] = symbol
                    symbol_to_key[symbol] = target_to_key[name]
                continue

            if line.startswith("#"):
                current_time = int(line[1:])
                continue

            if line.startswith("b"):
                parts = line.split()
                if len(parts) != 2:
                    continue
                bits, symbol = parts
                key = symbol_to_key.get(symbol)
                if key is None:
                    continue
                value_bits = bits[1:]
                if set(value_bits) <= {"0", "1"}:
                    transitions[key].append(
                        [current_time, int(value_bits, 2)]
                    )
                continue

            if line[0] in {"0", "1"}:
                symbol = line[1:]
                key = symbol_to_key.get(symbol)
                if key is not None:
                    transitions[key].append(
                        [current_time, int(line[0])]
                    )

    missing = [
        key for key, values in transitions.items() if not values
    ]
    if missing:
        raise RuntimeError(
            f"{path}: missing or empty signals: {', '.join(missing)}"
        )
    return transitions


def compress_stream(key: str, stream: list[list[int]], max_points: int):
    if len(stream) <= max_points:
        return stream
    if key in SCALAR_SIGNALS:
        return stream
    step = max(1, len(stream) // max_points)
    sampled = stream[::step]
    if sampled[-1] != stream[-1]:
        sampled.append(stream[-1])
    return sampled


def build_payload():
    payload = {}
    for name, source in SOURCES.items():
        transitions = parse_vcd(source["vcd"], source["signals"])
        meta = json.loads(source["summary"].read_text(encoding="utf-8"))
        streams = {
            key: [
                [timestamp_ps / 1000.0, value]
                for timestamp_ps, value in compress_stream(key, stream, 1400)
            ]
            for key, stream in transitions.items()
        }
        duration_ns = max(ts for stream in streams.values() for ts, _ in stream)
        payload[name] = {
            "meta": meta,
            "duration_ns": duration_ns,
            "streams": streams,
        }
    return payload


def main():
    data = build_payload()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "window.XG_DASHBOARD_DATA = "
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(OUTPUT)
    for name, item in data.items():
        count = sum(len(v) for v in item["streams"].values())
        print(
            f"{name}: duration={item['duration_ns']} ns, "
            f"stream_points={count}"
        )


if __name__ == "__main__":
    main()
