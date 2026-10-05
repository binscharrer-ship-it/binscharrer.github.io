# XG-BattSim 电池健康仿真

XG-BattSim 是一个移动端优先的电池健康仿真工具。项目由微信小程序版和单文件 HTML 版整合而来，但不保留旧版中未经实测验证的“CNN-BiGRU 准确率”和“毫秒级预警”宣传。

## 功能

- LFP、NMC、NCA 三类化学体系
- 二手手机锂电池模板
- 新能源车动力电池包模板
- 极简模式与专业模式
- 老化、SOH、内阻、温度、循环寿命和累计能量估算
- 热失控温升曲线绘制
- 本机历史记录
- 电池外观照片预览
- 报告打印和另存为 PDF
- 报告摘要复制
- PWA 离线缓存和添加到主屏幕

## 文件说明

```text
battery-h5/
├── index.html              # 页面结构
├── styles.css              # 移动端样式与打印样式
├── batteryCalc.js          # 电池模型核心计算
├── reportBuilder.js        # 评级、估值、报告编号和摘要
├── app.js                  # 页面交互、历史记录和曲线绘制
├── manifest.webmanifest    # PWA 清单
├── service-worker.js       # 离线缓存
├── icon.svg                # 应用图标
└── tests/                  # 自动化测试
```

## 本地运行

直接打开 `index.html` 可以使用主要功能。若需要安装到手机桌面，应通过 HTTPS 静态站点访问。

也可以在本目录启动一个静态服务器：

```powershell
python -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。

## 部署为手机链接

把整个 `battery-h5` 目录上传到任意支持 HTTPS 的静态托管服务即可，例如 GitHub Pages、Cloudflare Pages、Netlify 或自有对象存储。不要只上传 HTML 文件，因为离线缓存、样式和计算模块需要一起部署。

## 计算边界

应用使用集总参数老化模型、Arrhenius 温度加速、Power Law 循环损失、Bernardi 生热方程和确定性趋势修正。结果是教学、记录和初步参考，不构成安全认证、质保承诺或法律依据。

## 软件著作权材料

源码 PDF 应保持以下内容一致：

- 软件全称：XG-BattSim 电池健康仿真软件
- 软件简称：XG-BattSim
- 版本号：V1.0
- 开发完成日期：按实际首次完成日期填写
- 源程序：前 30 页和后 30 页，每页 50 行，共 60 页

仓库中的 `tools/build_soft_copyright.py` 会从当前版本源码生成标准源码 PDF、软件说明书和申请信息表。
