// ==UserScript==
// @name         B站本地下载
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  将当前 B 站视频发送到本地下载服务
// @author       z
// @match        https://www.bilibili.com/video/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    const SERVER = "http://localhost:8081";

    /**
     * 使用 Tampermonkey 特权 API 发出请求。
     */
    function makeRequest(method, url, data = null) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                data,
                headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
                timeout: 10_000,
                onload(response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.responseText);
                    } else {
                        reject(new Error(`请求失败：HTTP ${response.status} ${response.statusText}`));
                    }
                },
                onerror(response) {
                    reject(new Error(`无法连接本地服务：${response.statusText || "网络错误"}`));
                },
                ontimeout() {
                    reject(new Error("请求本地服务超时"));
                }
            });
        });
    }

    const SVG = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="video-complaint-icon video-toolbar-item-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 14.25C3.41421 14.25 3.75 14.5858 3.75 15C3.75 16.4354 3.75159 17.4365 3.85315 18.1919C3.9518 18.9257 4.13225 19.3142 4.40901 19.591C4.68577 19.8678 5.07435 20.0482 5.80812 20.1469C6.56347 20.2484 7.56459 20.25 9 20.25H15C16.4354 20.25 17.4365 20.2484 18.1919 20.1469C18.9257 20.0482 19.3142 19.8678 19.591 19.591C19.8678 19.3142 20.0482 18.9257 20.1469 18.1919C20.2484 17.4365 20.25 16.4354 20.25 15C20.25 14.5858 20.5858 14.25 21 14.25C21.4142 14.25 21.75 14.5858 21.75 15V15.0549C21.75 16.4225 21.75 17.5248 21.6335 18.3918C21.5125 19.2919 21.2536 20.0497 20.6517 20.6516C20.0497 21.2536 19.2919 21.5125 18.3918 21.6335C17.5248 21.75 16.4225 21.75 15.0549 21.75H8.94513C7.57754 21.75 6.47522 21.75 5.60825 21.6335C4.70814 21.5125 3.95027 21.2536 3.34835 20.6517C2.74643 20.0497 2.48754 19.2919 2.36652 18.3918C2.24996 17.5248 2.24998 16.4225 2.25 15.0549C2.25 15.0366 2.25 15.0183 2.25 15C2.25 14.5858 2.58579 14.25 3 14.25Z" fill="#1C274C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 16.75C12.2106 16.75 12.4114 16.6615 12.5535 16.5061L16.5535 12.1311C16.833 11.8254 16.8118 11.351 16.5061 11.0715C16.2004 10.792 15.726 10.8132 15.4465 11.1189L12.75 14.0682V3C12.75 2.58579 12.4142 2.25 12 2.25C11.5858 2.25 11.25 2.58579 11.25 3V14.0682L8.55353 11.1189C8.27403 10.8132 7.79963 10.792 7.49393 11.0715C7.18823 11.351 7.16698 11.8254 7.44648 12.1311L11.4465 16.5061C11.5886 16.6615 11.7894 16.75 12 16.75Z" fill="#1C274C"/></svg>`;

    const DEFAULT_TEXT = "本地下载";

    function getAid() {
        try {
            const state = unsafeWindow.__INITIAL_STATE__;
            const aid = state?.aid ?? state?.videoData?.aid;
            return aid ? String(aid) : "";
        } catch (error) {
            console.error("[B站本地下载] 读取 aid 失败", error);
            return "";
        }
    }

    function getSessdata() {
        const element = document.querySelector("#script-cookies");
        const cookiesText = element?.dataset?.cookies;
        if (!cookiesText) return "";
        try {
            const cookies = JSON.parse(cookiesText);
            if (!Array.isArray(cookies)) return "";
            const sessdataCookie = cookies.find(cookie => cookie?.name === "SESSDATA");
            return String(sessdataCookie?.value ?? cookies[0]?.value ?? "");
        } catch (error) {
            console.warn("[B站本地下载] Cookie 数据解析失败", error);
            return "";
        }
    }

    function setButtonText(button, text) {
        const textElement = button.querySelector(".video-toolbar-item-text");
        if (textElement) textElement.textContent = text;
    }

    async function startDownload(button) {
        const aid = getAid();
        if (!aid) {
            setButtonText(button, "未找到视频");
            return;
        }

        button.style.pointerEvents = "none";
        setButtonText(button, "发送中…");

        try {
            const sessdata = getSessdata();
            if (sessdata) {
                await makeRequest("POST", `${SERVER}/download/cookie`, JSON.stringify({ cookie: `SESSDATA=${sessdata}` }));
            }

            const responseText = await makeRequest("GET", `${SERVER}/download/add/${encodeURIComponent(aid)}`);
            let success = false;
            try {
                success = Boolean(JSON.parse(responseText));
            } catch {
                success = /^(true|ok|success)$/i.test(responseText.trim());
            }

            setButtonText(button, success ? "成功" : "失败");
            setTimeout(() => setButtonText(button, DEFAULT_TEXT), 2000);
        } catch (error) {
            console.error("[B站本地下载] 下载请求失败", error);
            setButtonText(button, "连接失败");
            setTimeout(() => setButtonText(button, DEFAULT_TEXT), 3000);
        } finally {
            button.style.pointerEvents = "";
        }
    }

    /**
     * 精准限制父容器为 .video-toolbar-right，且排除 .video-tool-more 兄弟
     */
    function createDownloadButton() {
        // 如果已经加过了，直接返回 true 停止定时器
        if (document.querySelector("#local-download-button")) return true;

        // 1. 精准定位父容器 .video-toolbar-right
        const parent = document.querySelector(".video-toolbar-right");
        if (!parent) return false;

        // 2. 从这个特定的父容器内部获取所有的子按钮
        const brothers = parent.querySelectorAll(".video-toolbar-right-item");
        if (brothers.length === 0) return false;

        // 3. 寻找一个合适的兄弟节点（排除掉含有 video-tool-more 类名的节点）
        let brother = null;
        for (const el of brothers) {
            // 确保该节点确实是 parent 的直接子节点，且不包含 video-tool-more
            if (el.parentElement === parent && !el.classList.contains("video-tool-more")) {
                brother = el;
                break;
            }
        }

        // 如果没找到合适的常规子按钮，继续等待
        if (!brother) return false;

        const button = document.createElement("div");
        button.id = "local-download-button";
        button.className = "video-toolbar-right-item";
        button.style.marginRight = "18px";
        button.style.cursor = "pointer";

        button.innerHTML = `
            ${SVG}
            <span class="video-complaint-info video-toolbar-item-text">${DEFAULT_TEXT}</span>
        `;

        button.addEventListener("click", () => startDownload(button));

        // 安全地插入到精准匹配的父容器中
        parent.insertBefore(button, brother);
        console.log("[B站本地下载] 下载按钮已成功挂载");
        return true;
    }

    // 轮询添加下载按钮
    const buttonInterval = setInterval(() => {
        if (getAid() && createDownloadButton()) {
            clearInterval(buttonInterval);
        }
    }, 1000);

    /**
     * 取消播放结束后的自动跳转
     */
    function cancelAutoSkip() {
        const button = document.querySelector(".bpx-player-ending-related-item-cancel");
        if (!button) return;

        const container = button.closest('.bpx-player-ending');
        const isVisible = button.offsetWidth > 0 || button.offsetHeight > 0 || (container && window.getComputedStyle(container).display !== 'none');

        if (isVisible) {
            setTimeout(() => {
                if (typeof button.click === 'function') {
                    button.click();
                    console.log("[B站本地下载] 已成功取消自动跳转");
                }
            }, 50);
        }
    }

    setInterval(cancelAutoSkip, 3000);
    console.log("[B站本地下载] 脚本已加载");
})();