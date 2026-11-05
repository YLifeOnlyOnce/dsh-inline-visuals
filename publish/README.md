# publish/ · 发布与传播素材

这个目录放**发布时要用、但不该塞进 npm 包**的东西：Release notes、公告文案、社区讨论稿和上线清单。
运行时文件在仓库根目录；这里的文件只随 GitHub 仓库分发。

| 文件 | 用途 |
|---|---|
| [`release-notes/v0.2.0.md`](release-notes/v0.2.0.md) | GitHub Release 正文（发布流水线会自动读取同名 tag 的 notes 文件） |
| [`announcement.zh.md`](announcement.zh.md) | 中文公告（微博 / 即刻 / 微信群 / 公众号摘要） |
| [`announcement.en.md`](announcement.en.md) | English announcement (X / Reddit / HN) |
| [`discussion.zh.md`](discussion.zh.md) | 中文社区讨论稿（帖到 DSH Discussions / 中文社区） |
| [`discussion.en.md`](discussion.en.md) | English discussion draft for DSH Discussions |
| [`checklist.md`](checklist.md) | 上线前检查清单 |

## 约定

- **不要放密钥、token、内部地址**；这些文件会随公开仓库发布；
- 配图统一引用 [`../docs/`](../docs/)（`banner.png`、`demo.png`、`before-after.png`），不要再复制一份；
- Release notes 文件名必须是 `<tag>.md`（如 `v0.2.0.md`），工作流会优先用它；
- 文案遵循同一条规则：**只讲能验证的事实**（可重放、声明式、11 种图型、MIT、测试/CI），不承诺未实现的功能。
