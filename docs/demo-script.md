# Demo 录制脚本（约 90 秒）

**主场景：** Apex Bank impersonation · **速度：** Fast  
**开场页：** Overview · **主舞台：** Live Detection  
**录屏：** 浏览器全窗口（建议 1280×720+），不要录桌面杂项。  
**开录前：** `npm run dev` → 打开 http://127.0.0.1:5173 → Reset 一次 → Fast 开好 → 从 Overview 开始。

原则：**画面能自己说明的，就让它演。你只在关键处解释。** 别继续磨英文；试录计时比文案完美更重要。

镜头顺序：

**Overview → Start Demo → Call/Message → Browser/Device/Identity → RM 8,000 → Pause → Transfer Check / History → Official scenario → 结束。**

中途**不要**打开再关掉 Coordination Log。主界面 Mesh / 状态变化够用。若最后还剩 3–5 秒，再快速打开 Coordination Log 一眼看 CALL→MESSAGE / MESSAGE→BROWSER / IDENTITY→PAYMENT；没时间就跳过。

---

## 你怎么点（中文） / 你说什么（英文）

| 时间 | 你点哪里 / 镜头对着哪 | 英文台词（口播） |
| ---- | --------------------- | ---------------- |
| **0–8s** | **Overview**。停在品牌 + Demo chain +「Start demo」。先别点。 | *ScamMesh monitors six channels at once: calls, messages, browser activity, device activity, identity checks, and payments. Each agent starts with its own channel, then reacts to structured risk events from the others.* |
| **8–14s** | 点 **Start demo** → **Live Detection**。对准六通道 + 右侧 Risk。 | *I’ll run the Apex Bank impersonation scenario. The inputs are mocked so the demo is repeatable, but all six agents are running together in one Mozaik session.* |
| **14–28s** | **不要点 Pause。** 看 Call → Message。让 mesh 自己说话。 | *The call begins with someone claiming to be from Apex Bank. When the caller pressures the user not to hang up, the Call agent flags it. A suspicious message arrives, and the Message agent inspects the link more closely.* |
| **28–40s** | 继续盯 Browser / Device / Identity。口播用 screen sharing，**不要硬点 Zoom / AnyDesk**。 | *The same link opens in the browser, where the Browser agent finds an OTP request. Device and Identity add screen-sharing activity and an identity mismatch.* |
| **40–55s** | 等 **RM 8,000 · Apex Safe Holding · DuitNow**。停一下让评委看金额。**不用念 Risk 100**；用户侧是 **HIGH RISK**。 | *Now a DuitNow transfer appears: eight thousand ringgit to a new beneficiary, Apex Safe Holding. The Payment agent receives the earlier risk events, and the session moves to critical.* |
| **55–65s** | 点 **Pause transfer**。等 Paused。 | *ScamMesh recommends pausing the transfer and explains why. It does not block a real payment; this action is simulated.* |
| **65–75s** | 快速切 **04 Transfer Check**，再切 **05 History**。 | *The same session appears in Transfer Check and History.* |
| **75–90s** | 回 Live → **Official bank transfer** → **Run**。Fast 到明显 LOW 即可。定格停录。可选：剩几秒再瞥一眼 Coordination Log。 | *For comparison, the official bank transfer scenario stays low risk and never triggers the pause recommendation. The channel data is mocked, but the Mozaik concurrency and cross-agent adaptations are real.* |

---

## 口播连起来（可直接读，约 210 词）

> ScamMesh monitors six channels at once: calls, messages, browser activity, device activity, identity checks, and payments. Each agent starts with its own channel, then reacts to structured risk events from the others.
>
> I’ll run the Apex Bank impersonation scenario. The inputs are mocked so the demo is repeatable, but all six agents are running together in one Mozaik session.
>
> The call begins with someone claiming to be from Apex Bank. When the caller pressures the user not to hang up, the Call agent flags it. A suspicious message arrives, and the Message agent inspects the link more closely.
>
> The same link opens in the browser, where the Browser agent finds an OTP request. Device and Identity add screen-sharing activity and an identity mismatch.
>
> Now a DuitNow transfer appears: eight thousand ringgit to a new beneficiary, Apex Safe Holding. The Payment agent receives the earlier risk events, and the session moves to critical.
>
> ScamMesh recommends pausing the transfer and explains why. It does not block a real payment; this action is simulated.
>
> The same session appears in Transfer Check and History.
>
> For comparison, the official bank transfer scenario stays low risk and never triggers the pause recommendation.
>
> The channel data is mocked, but the Mozaik concurrency and cross-agent adaptations are real.

说完停在 Live Detection 画面上结束。不要加 *Thank you / That is ScamMesh / The future of…*

---

## 录制注意（中文）

1. **先试录一遍计时**；偏快一点说，短停顿留给画面，目标真正 ~90 秒。  
2. 顺着画面说话，像介绍自己做的东西，不要念 pitch。  
3. 只录 Apex 主线 + 最后 official 对比；ambiguous 不用进视频。  
4. 收款人必须是 **Apex Safe Holding**；不要念 Risk 100。  
5. Device 用 **screen-sharing activity**；除非 UI 明确打出软件名，否则别点 Zoom / AnyDesk。  
6. 结尾说清：**推荐暂停 ≠ 真拦截银行转账**。  
7. 录完放进 `docs/`，替换 README 里的 `docs/demo-placeholder.svg`。
