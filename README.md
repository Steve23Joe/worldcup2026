# 2026 世界杯预测

纯静态网页，展示 AI 对 2026 世界杯比赛的深度分析和比分预测。

## 部署

上传到任意静态托管服务（EdgeOne、GitHub Pages、Vercel 等）即可。

## 数据更新

数据由本地脚本生成，每日更新：

```bash
cd /path/to/Code
python3 worldcup_predict.py --generate-web-data
```

生成的 JSON 文件在 `data/` 目录下，更新后重新上传即可。
