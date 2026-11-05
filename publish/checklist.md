# 上线检查清单

## 发布前

- [ ] `npm test` 通过，`npm run build` 后产物已提交（CI 会校验漂移）
- [ ] `node scripts/demo.mjs` 重新生成 `docs/demo.png`（如果图型有变化）
- [ ] `publish/release-notes/v<version>.md` 已写好，版本号与 `package.json` 一致
- [ ] `README.md` 的安装路径、图型表、路线图与实现一致
- [ ] 没有密钥、token、内部地址出现在仓库/文案里

## 发版

- [ ] `npm version patch`（或 minor / major）
- [ ] `git push --follow-tags` → 触发 Publish 工作流
- [ ] 检查 npm 页面：版本、provenance、README、keywords
- [ ] 检查 GitHub Release：正文来自 `publish/release-notes/<tag>.md`，tarball 已附
- [ ] 刷新 dsh，`show_visual` 可用（`cordis_inspect_query` listTools）

## 发布后

- [ ] 在 DSH Discussions 发 `publish/discussion.en.md`（中文社区发 `discussion.zh.md`）
- [ ] 回链到仓库与 npm
- [ ] 收集反馈，更新 v0.3 路线图
- [ ] 一周后回一条「收到什么反馈 / 下一步」的更新
