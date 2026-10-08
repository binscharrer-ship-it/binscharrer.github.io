# XG 数字样机可视化控制台

这是一个离线 HTML/JS 面板，直接读取真实 Vivado XSIM VCD 导出的数据映射。

## 打开

本地服务已经启动：

```text
http://127.0.0.1:8765/index.html
```

不需要安装 Vivado、Python 或 Node。

也可以直接双击：

```text
D:\启发\XG_DigitalTwin_Console_20261008\index.html
```

## 功能

- 微流控 40:1 双柱动态流量对比。
- CUSUM 到安全门触发时的红光和声音报警。
- 内燃机 150 MHz 数字样机的 PID、CUSUM、预测前馈、自适应权重和双 PWM 回放。
- WNS、DRC、Fmax 和资源占用安全罩。
- 真实 VCD 波形时间轴。

## 截图

- `assets/dashboard-micro-safe.png`
- `assets/dashboard-micro-alarm.png`
- `assets/dashboard-ice-150mhz.png`

## 数据重建

如果源 VCD 更新，运行：

```powershell
python .\tools\build_dashboard_data.py
```

该脚本会读取：

- `D:\启发\XG_Microfluidic_Ratio\waveform\ratio_ctrl.vcd`
- `D:\启发\XG_ICE_ClosedLoop_20261008\results\xsim\ice_closed_loop.vcd`

并重写：

```text
data\dashboard-data.js
```
