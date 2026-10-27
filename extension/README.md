# Easy Wedding Creative Companion 1.0 (preview)

Desktop Chrome or Edge 116+. This is a locally installed companion, not a Chrome Web Store listing or an official Google, OpenAI or Canva integration.

1. Extract the ZIP to a folder you will keep.
2. Visit chrome://extensions (or edge://extensions).
3. Enable Developer mode, choose Load unpacked, and select the extracted folder containing manifest.json.
4. Reload Easy Wedding. Open AI design assistant, prepare your brief and press Send to my account.
5. In the companion, allow the selected provider and open your account. Sign in directly on the provider website.
6. Open an empty prompt. For Gemini video, select the video tool first. The companion tries to fill the brief and attach photos. Review the prompt AND photo thumbnails. Press Fill brief & photos again if needed. It never clicks Generate or spends quota for you.
7. Generate in your provider account. Select the finished result with the companion or export/download it and choose Return an exported file. The result saves to your Easy Wedding account and only the provider tab created for this job closes after a successful save.

Canva uses different editor surfaces. Open its design generation prompt before filling. Canvas-based results usually require PNG/JPG export. Protected image/video URLs also require an exported file. Photos rejected by the provider remain downloadable in the toolbar for manual upload.

JPG/PNG/WebP up to 8 MB; MP4/WebM up to 20 MB. Video generation depends on the user's Gemini plan, region, quota and supported reference count. If only one input image is supported, create and upload a combined reference portrait first. The companion does not grant subscriptions or bypass limits.

Only rendered provider UI is used. No passwords, cookies, browser history, session tokens or hidden APIs are read. Optional permissions are restricted to chatgpt.com, gemini.google.com and www.canva.com. Only the provider tab created for the active job receives the brief. Selected references are resized for transfer. One temporary job is stored in browser-session memory; it expires after 45 minutes, on cancellation, or when the browser closes. Imported output is stored by the signed-in Easy Wedding workspace.

Validation: protocol and website import logic can be tested independently. Provider selectors are best-effort and may change. Signed-in end-to-end generation requires testing in the installing user's own browser; it has not been certified for every provider interface.
